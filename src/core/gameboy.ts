import { Scheduler, SchedulerId, SchedulerSpeedSwitchAffected } from './scheduler';
import { GameBoyProvider } from './provider';
import { Bus } from "./bus";
import { CPU } from "./cpu/cpu";
import { PPU } from './ppu';
import { Joypad } from './joypad';
import { Timer } from './timer';
import { APU } from './apu';
import { bitSetValue, bitTest } from './util/bits';
import { GetTextLineHeightWithSpacing, GetFontTexUvWhitePixel } from '../lib/imgui-js/imgui';
import { disassemble } from './disassembler';
import { hexN } from './util/misc';
import { Serial } from './serial';

export class GameBoy {
    bus: Bus;
    ppu: PPU;
    cpu: CPU;
    joypad: Joypad;
    timer: Timer;
    apu: APU;
    serial: Serial;

    provider: GameBoyProvider;
    scheduler: Scheduler;

    turboMode = false;

    skipBootrom = false;

    doubleSpeed = 0;
    queueSpeedSwitch = false;

    constructor(skipBootrom: boolean, provider: GameBoyProvider) {
        this.scheduler = new Scheduler();
        this.ppu = new PPU(this, this.scheduler);
        this.joypad = new Joypad();
        this.apu = new APU(this, this.scheduler);
        this.timer = new Timer(this, this.scheduler);
        this.serial = new Serial(this, this.scheduler);
        this.bus = new Bus(this, this.ppu, this.joypad, this.timer, this.apu, this.serial, provider);
        this.cpu = new CPU(this, this.bus);

        this.provider = provider;
        this.cgb = (this.provider.rom[0x143] & 0x80) == 0x80;

        if (skipBootrom) {
            if (!this.cgb) {
                this.dmgBootrom();
            } else {
                this.cgbBootrom();
            }
        }

        this.skipBootrom = skipBootrom;
    }

    speedSwitch() {
        if (this.doubleSpeed) {
            this.doubleSpeed = 0;
        } else {
            this.doubleSpeed = 1;
        }

        for (let i = 0; i < this.scheduler.heap.length; i++) {
            let event = this.scheduler.heap[i];
            let affected = false;
            for (let j = 0; j < SchedulerSpeedSwitchAffected.length; j++) {
                if (event.id = SchedulerSpeedSwitchAffected[i]) {
                    affected = true;
                }
            }

            let callback = event.callback;
            let id = event.id;
            let ticks = event.ticks;

            if (affected) {
                this.scheduler.deleteEvent(i);
                // console.log(`Canceling: ${id}, ${ticks}`);
                if (this.doubleSpeed) {
                    // Switching to double speed
                    // console.log(`Re-adding: ${id}, ${ticks >> 1}`);
                    this.scheduler.addEventRelative(id, ticks >> 1, callback);
                } else {
                    // Switching to normal speed
                    // console.log(`Re-adding: ${id}, ${ticks << 1}`);
                    this.scheduler.addEventRelative(id, ticks << 1, callback);
                }
            }
        }
    }

    dmgBootrom() {
        this.cpu.pc = 0x100;

        this.cpu.setAf(0x01B0);
        this.cpu.setBc(0x0013);
        this.cpu.setDe(0x00D8);
        this.cpu.setHl(0x014D);
        this.cpu.sp = 0xFFFE;

        this.timer.counter = 0x00;
        this.bus.write8(0xFF06, 0x00);
        this.bus.write8(0xFF07, 0x00);
        // Sound register writes
        // this.bus.write8(0xFF10, 0x80); 
        // this.bus.write8(0xFF11, 0xBF);
        // this.bus.write8(0xFF12, 0xF3);
        // this.bus.write8(0xFF14, 0xBF);
        // this.bus.write8(0xFF16, 0x3F);
        // this.bus.write8(0xFF17, 0x00);
        // this.bus.write8(0xFF19, 0xBF);
        // this.bus.write8(0xFF1A, 0x7F);
        // this.bus.write8(0xFF1B, 0xFF);
        // this.bus.write8(0xFF1C, 0x9F);
        // this.bus.write8(0xFF1E, 0xBF);
        // this.bus.write8(0xFF20, 0xFF);
        // this.bus.write8(0xFF21, 0x00);
        // this.bus.write8(0xFF22, 0x00);
        // this.bus.write8(0xFF23, 0xBF);
        // this.bus.write8(0xFF24, 0x77);
        // this.bus.write8(0xFF25, 0xF3);
        this.bus.write8(0xFF26, 0xF1);
        this.bus.write8(0xFF40, 0x91);
        this.bus.write8(0xFF42, 0x00);
        this.bus.write8(0xFF43, 0x00);
        this.bus.write8(0xFF45, 0x00);
        this.bus.write8(0xFF47, 0xFC);
        this.bus.write8(0xFF48, 0xFF);
        this.bus.write8(0xFF49, 0xFF);
        this.bus.write8(0xFF4A, 0x00);
        this.bus.write8(0xFF4B, 0x00);
        this.bus.write8(0xFFFF, 0x00);

        // Unmap boot ROM
        this.bus.write8(0xFF50, 0x01);

        // Clear VRAM
        const vramPointer = 0x8000;
        for (let i = 0; i < 0x2000; i++) {
            this.bus.write8(vramPointer + i, 0);
        }

        // Set palette
        this.bus.write8(0xFF47, 0xFC);

        // Reset scroll registers
        this.ppu.scx = 0;
        this.ppu.scy = 0;

        // Copy Nintendo logo from cartridge
        let logoData = new Uint8Array(48);
        const base = 0x104;
        for (let i = 0; i < 48; i++) {
            let byte = this.bus.rom[base + i];
            logoData[i] = byte;
        }

        // Put copyright symbol into tile data
        let copyrightSymbol = Uint8Array.of(0x3C, 0x42, 0xB9, 0xA5, 0xB9, 0xA5, 0x42, 0x3C);
        const copyrightPointer = 0x8190;
        for (let i = 0; i < 8; i++) {
            this.bus.write8(copyrightPointer + (i * 2) + 0, copyrightSymbol[i]);
            this.bus.write8(copyrightPointer + (i * 2) + 1, 0);
        }

        // Write Nintendo logo tile map
        const row1Pointer = 0x9904;
        const row2Pointer = 0x9924;
        for (let i = 0; i < 12; i++) {
            this.bus.write8(row1Pointer + i, i + 0x1);
            this.bus.write8(row2Pointer + i, i + 0xD);
        }

        // Expand Nintendo logo tile data
        let logoTilesPointer = 0x8010;
        for (let i = 0; i < 48; i++) {
            let dataByte = logoData[i];
            let upper = dataByte >> 4;
            let lower = dataByte & 0xF;

            let lowerFull = 0;
            let upperFull = 0;
            for (let j = 0; j < 8; j++) {
                lowerFull = bitSetValue(lowerFull, j, bitTest(lower, j >> 1));
                upperFull = bitSetValue(upperFull, j, bitTest(upper, j >> 1));
            }

            this.bus.write8(logoTilesPointer + (i * 8) + 0, upperFull);
            this.bus.write8(logoTilesPointer + (i * 8) + 1, 0);
            this.bus.write8(logoTilesPointer + (i * 8) + 2, upperFull);
            this.bus.write8(logoTilesPointer + (i * 8) + 3, 0);
            this.bus.write8(logoTilesPointer + (i * 8) + 4, lowerFull);
            this.bus.write8(logoTilesPointer + (i * 8) + 5, 0);
            this.bus.write8(logoTilesPointer + (i * 8) + 6, lowerFull);
            this.bus.write8(logoTilesPointer + (i * 8) + 7, 0);
        }

        // Tile for copyright symbol
        this.bus.write8(0x9910, 0x19);

        // Turn on the LCD, enable Background, use Tileset 0x8000, 
        this.bus.write8(0xFF40, 0x91);
        this.bus.write8(0xFF0F, 0xE1);
    }

    cgbBootrom() {
        this.cpu.pc = 0x100;

        this.cpu.setAf(0x1180);
        this.cpu.setBc(0x0000);
        this.cpu.setDe(0x0008);
        this.cpu.setHl(0x007C);
        this.cpu.sp = 0xFFFE;

        // Unmap boot ROM
        this.bus.write8(0xFF50, 0x01);

        // Turn on the LCD, enable Background, use Tileset 0x8000
        this.bus.write8(0xFF40, 0x91);
        this.bus.write8(0xFF0F, 0xE1);

        this.ppu.cgbBgPaletteIndexInc = true;
    }

    traceLog = "";
    trace(count: number) {
        for (let i = 0; i < count; i++) {
            this.traceLog += `AF:${hexN(this.cpu.getAf(), 4)} BC:${hexN(this.cpu.getBc(), 4)} DE:${hexN(this.cpu.getDe(), 4)} HL:${hexN(this.cpu.getHl(), 4)} ${disassemble(this.cpu, 1, 0)}`;
            this.cpu.execute();
        }
    }

    cgb = false;

    breaked = false;
    breakedInfo = "";
    infoText: string[] = [];
    error(text: string) {
        this.breaked = true;
        this.infoText.unshift("ERROR:");
        this.infoText.unshift(text);
        this.infoText = this.infoText.slice(0, 10);
    }

    break(info: string) {
        this.breaked = true;
        this.breakedInfo = info;
    }
    unbreak() {
        this.breaked = false;
        this.breakedInfo = "";
    }

    // info(text: string) {
    //     return;
    //     this.infoText.unshift(text);
    //     this.infoText = this.infoText.slice(0, 10);
    // }
    resetInfo() {
        this.infoText = [];
    }

    public doubleFrame(): number {
        let i = 0;
        let cpu = this.cpu;
        // Can I haz loop unroll?
        while (i < 70224 * 2) {
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
            i += cpu.execute();
        }
        return i;
    }

    public frame(): number {
        let i = 0;
        let cpu = this.cpu;
        while (i < 70224) {
            i += cpu.execute();
        }
        return i;
    }

    public scanline(): number {
        let i = 0;
        let cpu = this.cpu;
        while (i < 456) {
            i += cpu.execute();
        }
        return i;
    }

    public halfFrame(): number {
        let i = 0;
        let cpu = this.cpu;
        while (i < 35112) {
            i += cpu.execute();
        }
        return i;
    }

    public quarterFrame(): number {
        let i = 0;
        let cpu = this.cpu;
        while (i < 17556) {
            i += cpu.execute();
        }
        return i;
    }

    public tick(ticks: number): void {
        this.scheduler.currTicks += ticks;
        while (this.scheduler.currTicks >= this.scheduler.nextEventTicks) {
            let current = this.scheduler.currTicks;
            let next = this.scheduler.nextEventTicks;
            this.scheduler.popFirstEvent().callback(current - next);
        }
    }

    haltSkippedCycles = 0;
    haltSkip(): void {
        const terminateAt = 100000;
        for (let i = 0; i < terminateAt; i++) {
            let ticksPassed = this.scheduler.nextEventTicks - this.scheduler.currTicks;
            this.scheduler.currTicks = this.scheduler.nextEventTicks;
            this.scheduler.popFirstEvent().callback(0);

            this.cpu.cycles += ticksPassed;
            this.haltSkippedCycles += ticksPassed;

            if (this.cpu.interruptAvailable) {
                if (this.cpu.ime) {
                    this.cpu.dispatchInterrupt(true);
                }
                return;
            }
        }
        // alert(`Processed ${terminateAt} events and couldn't exit HALT! Assuming crashed.`);
        this.breaked = true;
    }
}