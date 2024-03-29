import { GameBoy } from "./gameboy";
import { SchedulerEvent, SchedulerId, Scheduler } from "./scheduler";
import { bitTest, bitSet } from "./util/bits";
import { InterruptId } from "./interrupts";
import { hex } from "./util/misc";

const timerBits = Uint16Array.from([9, 3, 5, 7]);
const timerMasks = Uint16Array.from([1 << 9, 1 << 3, 1 << 5, 1 << 7]);
const timerIntervals = Uint16Array.from([1024, 16, 64, 256]);

const rescheduleMasks = Uint16Array.from([0b1111111111, 0b1111, 0b111111, 0b11111111]);

export class Timer {

    gb: GameBoy;
    scheduler: Scheduler;

    constructor(gb: GameBoy, scheduler: Scheduler) {
        this.gb = gb;
        this.scheduler = scheduler;

        // -4 offsets are needed, as timer starts ticking even before instruction fetch 
        this.scheduler.addEventRelative(SchedulerId.TimerAPUFrameSequencer, 8192, this.gb.apu.frameSequencerTimer);
        this.scheduler.addEventRelative(SchedulerId.TimerIncrement, (timerIntervals[this.bitSel] * 2), this.scheduledTimaIncrement);
    }

    enabled = false;
    bitSel = 0;

    private div = 0;
    lastDivResetTicks = 0; // In scheduler ticks
    lastDivLazyResetTicks = 0;

    counter = 0;
    modulo = 0;

    reloadPending = false;
    reloading = false;
    reloadCancel = false;

    interruptAndReloadTima = (cyclesLate: number) => {
        this.reloadPending = false;
        if (!this.reloadCancel) {
            this.counter = this.modulo;
            this.gb.cpu.flagInterrupt(InterruptId.Timer);
            this.reloadCancel = false;
        }
        this.reloading = true;

        this.scheduler.addEventRelative(SchedulerId.TimerReload, 4 - cyclesLate, this.finishReloading);
    };

    finishReloading = (cyclesLate: number) => {
        this.reloading = false;
    };

    scheduledTimaIncrement = (cyclesLate: number) => {
        this.timaIncrement(cyclesLate, true);
        this.scheduler.addEventRelative(SchedulerId.TimerIncrement, timerIntervals[this.bitSel] - cyclesLate, this.scheduledTimaIncrement);
    };

    timaIncrement(cyclesLate: number, delay: boolean) {
        if (this.enabled) {
            this.counter++;
            if (this.counter > 255) {
                this.counter = 0;
                this.reloadPending = true;

                if (delay) {
                    this.scheduler.addEventRelative(SchedulerId.TimerReload, 4 - cyclesLate, this.interruptAndReloadTima);
                } else {
                    this.scheduler.addEventRelative(SchedulerId.TimerReload, 0 - cyclesLate, this.interruptAndReloadTima);
                }
            }
        }
    }

    changeBitSel(newBitSel: number) {
        let internal = (this.scheduler.currentTicks - this.lastDivResetTicks) & 0xFFFF;
        if (newBitSel != this.bitSel) {
            if (bitTest(internal, timerBits[this.bitSel]) &&
                !bitTest(internal, timerBits[newBitSel]) &&
                this.enabled) {
                // console.log("Unexpected timer increment from bit select change");
                this.timaIncrement(0, false);
            }

            let ticksUntilIncrement = (rescheduleMasks[newBitSel] + 1) - (internal & rescheduleMasks[newBitSel]);
            this.scheduler.cancelEventsById(SchedulerId.TimerIncrement);
            this.scheduler.addEventRelative(SchedulerId.TimerIncrement, ticksUntilIncrement, this.scheduledTimaIncrement);
        }
        this.bitSel = newBitSel;
    }

    onDisable() {
        let internal = (this.scheduler.currentTicks - this.lastDivResetTicks) & 0xFFFF;
        if (bitTest(internal, timerBits[this.bitSel])) {
            // console.log("Unexpected timer increment from disable");
            this.timaIncrement(0, false);
        }
    }

    resetDiv() {
        console.log("div reset");
        this.div = 0;

        let internal = (this.scheduler.currentTicks - this.lastDivResetTicks) & 0xFFFF;
        if (bitTest(internal, timerBits[this.bitSel]) && this.enabled) {
            // console.log("Unexpected timer increment from DIV reset");
            this.timaIncrement(0, false);
        }

        this.lastDivResetTicks = this.scheduler.currentTicks;
        this.lastDivLazyResetTicks = this.scheduler.currentTicks;
        if (bitTest(this.div, 5 << this.gb.doubleSpeed)) this.gb.apu.advanceFrameSequencer(); // Frame sequencer clock uses falling edge detector

        this.scheduler.cancelEventsById(SchedulerId.TimerAPUFrameSequencer);
        this.scheduler.addEventRelative(SchedulerId.TimerAPUFrameSequencer, 8192, this.gb.apu.frameSequencerTimer);

        this.scheduler.cancelEventsById(SchedulerId.TimerIncrement);
        this.scheduler.addEventRelative(SchedulerId.TimerIncrement, timerIntervals[this.bitSel], this.scheduledTimaIncrement);
    }

    getDiv() {
        this.div = ((this.scheduler.currentTicks - this.lastDivResetTicks) & 0xFFFF) >> 8;
        return this.div;
    }

    readHwio8(addr: number): number {
        switch (addr) {
            case 0xFF04: // DIV
                return this.getDiv();
            case 0xFF05: // TIMA
                return this.counter;
            case 0xFF06: // TMA
                return this.modulo;
            case 0xFF07: // TAC
                let val = 0;

                val |= this.bitSel & 0b11;
                if (this.enabled) val = bitSet(val, 2);

                return val;
        }
        return 0xFF;
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF04: // DIV
                this.resetDiv();
                break;
            case 0xFF05: // TIMA
                if (!this.reloading) {
                    // console.log(`TIMA write success! ${hex(val, 2)}`);
                    this.counter = val;
                } else {
                    // console.log("TIMA write failed, reload overlapping!");
                    this.counter = this.modulo;
                }
                if (this.reloadPending) this.reloadCancel = true;
                break;
            case 0xFF06: // TMA
                this.modulo = val;
                if (this.reloading) {
                    // console.log("TMA write while reloading, counter set to written value!");
                    this.counter = val;
                }
                break;
            case 0xFF07: // TAC
                this.changeBitSel(val & 0b11);
                if (this.enabled && !bitTest(val, 2)) this.onDisable();
                this.enabled = bitTest(val, 2);
                break;
        }
    }
}