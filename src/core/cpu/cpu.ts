import { InterruptId } from './../interrupts';
import { Bus } from "../bus";
import { GameBoy } from "../gameboy";
import { bitTest as bitTest, bitSet, bitSetValue, bitReset } from "../util/bits";
import { hexN, hex, bin } from "../util/misc";
import { LD_BC_U16, LD_DE_U16, LD_HL_U16, LD_SP_U16, LD_A_iU16, LD_iU16_A, LD_iU16_SP, JP, JP_NZ, JP_Z, JP_NC, JP_C, CALL, CALL_C, CALL_NC, CALL_Z, CALL_NZ, LD_A_iFF00plusU8, LD_iFF00plusU8_A, LD_iHL_U8, LD_HL_SPplusE8, ADD_SP_E8, AND_A_U8, OR_A_U8, XOR_A_U8, CP_A_U8, JR, JR_NZ, JR_Z, JR_NC, JR_C, ADD_A_U8, ADC_A_U8, SUB_A_U8, SBC_A_U8, LD_SP_HL, PUSH_BC, PUSH_DE, PUSH_HL, PUSH_AF, POP_BC, POP_DE, POP_HL, POP_AF, INC_BC, INC_DE, INC_HL, INC_SP, DEC_BC, DEC_DE, DEC_HL, DEC_SP, CPL, RETI, DAA, NOP, LD_iBC_A, LD_iDE_A, LD_iHLinc_A, LD_iHLdec_A, LD_A_iBC, LD_A_iDE, LD_A_iHLinc, LD_A_iHLdec, LD_A_iFF00plusC, LD_iFF00plusC_A, DI, EI, RLCA, RRCA, RRA, RLA, HALT, SCF, CCF, RET, RET_C, RET_NC, RET_Z, RET_NZ, ADD_HL_BC, ADD_HL_DE, ADD_HL_HL, ADD_HL_SP, JP_HL, STOP } from './opcodes/unprefixed';
import { LD_B_U8, LD_C_U8, LD_D_U8, LD_E_U8, LD_H_U8, LD_L_U8, LD_A_U8, INC_B, INC_C, INC_D, INC_E, INC_H, INC_L, INC_iHL, INC_A, DEC_B, DEC_C, DEC_D, DEC_E, DEC_H, DEC_L, DEC_iHL, DEC_A, LD_B_B, LD_B_C, LD_B_D, LD_B_E, LD_B_H, LD_B_L, LD_B_iHL, LD_B_A, LD_C_B, LD_C_C, LD_C_D, LD_C_E, LD_C_H, LD_C_L, LD_C_iHL, LD_C_A, LD_D_B, LD_D_C, LD_D_D, LD_D_E, LD_D_H, LD_D_L, LD_D_iHL, LD_D_A, LD_E_B, LD_E_C, LD_E_D, LD_E_E, LD_E_H, LD_E_L, LD_E_iHL, LD_E_A, LD_H_B, LD_H_C, LD_H_D, LD_H_E, LD_H_H, LD_H_L, LD_H_iHL, LD_H_A, LD_L_B, LD_L_C, LD_L_D, LD_L_E, LD_L_H, LD_L_L, LD_L_iHL, LD_L_A, LD_iHL_B, LD_iHL_C, LD_iHL_D, LD_iHL_E, LD_iHL_H, LD_iHL_L, LD_iHL_iHL, LD_iHL_A, LD_A_B, LD_A_C, LD_A_D, LD_A_E, LD_A_H, LD_A_L, LD_A_iHL, LD_A_A, ADD_A_B, ADD_A_C, ADD_A_D, ADD_A_E, ADD_A_H, ADD_A_L, ADD_A_iHL, ADD_A_A, ADC_A_B, ADC_A_C, ADC_A_D, ADC_A_E, ADC_A_H, ADC_A_L, ADC_A_iHL, ADC_A_A, SUB_A_B, SUB_A_C, SUB_A_D, SUB_A_E, SUB_A_H, SUB_A_L, SUB_A_iHL, SUB_A_A, SBC_A_B, SBC_A_C, SBC_A_D, SBC_A_E, SBC_A_H, SBC_A_L, SBC_A_iHL, SBC_A_A, AND_A_B, AND_A_C, AND_A_D, AND_A_E, AND_A_H, AND_A_L, AND_A_iHL, AND_A_A, XOR_A_B, XOR_A_C, XOR_A_D, XOR_A_E, XOR_A_H, XOR_A_L, XOR_A_iHL, XOR_A_A, OR_A_B, OR_A_C, OR_A_D, OR_A_E, OR_A_H, OR_A_L, OR_A_iHL, OR_A_A, CP_A_B, CP_A_C, CP_A_D, CP_A_E, CP_A_H, CP_A_L, CP_A_iHL, CP_A_A, RST_0, RST_8, RST_16, RST_24, RST_32, RST_40, RST_48, RST_56, RLC_B, RLC_C, RLC_D, RLC_E, RLC_H, RLC_L, RLC_iHL, RLC_A, RRC_B, RRC_C, RRC_D, RRC_E, RRC_H, RRC_L, RRC_iHL, RRC_A, RL_B, RL_C, RL_D, RL_E, RL_H, RL_L, RL_iHL, RL_A, RR_B, RR_C, RR_D, RR_E, RR_H, RR_L, RR_iHL, RR_A, SLA_B, SLA_C, SLA_D, SLA_E, SLA_H, SLA_L, SLA_iHL, SLA_A, SRA_B, SRA_C, SRA_D, SRA_E, SRA_H, SRA_L, SRA_iHL, SRA_A, SWAP_B, SWAP_C, SWAP_D, SWAP_E, SWAP_H, SWAP_L, SWAP_iHL, SWAP_A, SRL_B, SRL_C, SRL_D, SRL_E, SRL_H, SRL_L, SRL_iHL, SRL_A, BIT_B_0, BIT_C_0, BIT_D_0, BIT_E_0, BIT_H_0, BIT_L_0, BIT_iHL_0, BIT_A_0, BIT_B_1, BIT_C_1, BIT_D_1, BIT_E_1, BIT_H_1, BIT_L_1, BIT_iHL_1, BIT_A_1, BIT_B_2, BIT_C_2, BIT_D_2, BIT_E_2, BIT_H_2, BIT_L_2, BIT_iHL_2, BIT_A_2, BIT_B_3, BIT_C_3, BIT_D_3, BIT_E_3, BIT_H_3, BIT_L_3, BIT_iHL_3, BIT_A_3, BIT_B_4, BIT_C_4, BIT_D_4, BIT_E_4, BIT_H_4, BIT_L_4, BIT_iHL_4, BIT_A_4, BIT_B_5, BIT_C_5, BIT_D_5, BIT_E_5, BIT_H_5, BIT_L_5, BIT_iHL_5, BIT_A_5, BIT_B_6, BIT_C_6, BIT_D_6, BIT_E_6, BIT_H_6, BIT_L_6, BIT_iHL_6, BIT_A_6, BIT_B_7, BIT_C_7, BIT_D_7, BIT_E_7, BIT_H_7, BIT_L_7, BIT_iHL_7, BIT_A_7, RES_B_0, RES_C_0, RES_D_0, RES_E_0, RES_H_0, RES_L_0, RES_iHL_0, RES_A_0, RES_B_1, RES_C_1, RES_D_1, RES_E_1, RES_H_1, RES_L_1, RES_iHL_1, RES_A_1, RES_B_2, RES_C_2, RES_D_2, RES_E_2, RES_H_2, RES_L_2, RES_iHL_2, RES_A_2, RES_B_3, RES_C_3, RES_D_3, RES_E_3, RES_H_3, RES_L_3, RES_iHL_3, RES_A_3, RES_B_4, RES_C_4, RES_D_4, RES_E_4, RES_H_4, RES_L_4, RES_iHL_4, RES_A_4, RES_B_5, RES_C_5, RES_D_5, RES_E_5, RES_H_5, RES_L_5, RES_iHL_5, RES_A_5, RES_B_6, RES_C_6, RES_D_6, RES_E_6, RES_H_6, RES_L_6, RES_iHL_6, RES_A_6, RES_B_7, RES_C_7, RES_D_7, RES_E_7, RES_H_7, RES_L_7, RES_iHL_7, RES_A_7, SET_B_0, SET_C_0, SET_D_0, SET_E_0, SET_H_0, SET_L_0, SET_iHL_0, SET_A_0, SET_B_1, SET_C_1, SET_D_1, SET_E_1, SET_H_1, SET_L_1, SET_iHL_1, SET_A_1, SET_B_2, SET_C_2, SET_D_2, SET_E_2, SET_H_2, SET_L_2, SET_iHL_2, SET_A_2, SET_B_3, SET_C_3, SET_D_3, SET_E_3, SET_H_3, SET_L_3, SET_iHL_3, SET_A_3, SET_B_4, SET_C_4, SET_D_4, SET_E_4, SET_H_4, SET_L_4, SET_iHL_4, SET_A_4, SET_B_5, SET_C_5, SET_D_5, SET_E_5, SET_H_5, SET_L_5, SET_iHL_5, SET_A_5, SET_B_6, SET_C_6, SET_D_6, SET_E_6, SET_H_6, SET_L_6, SET_iHL_6, SET_A_6, SET_B_7, SET_C_7, SET_D_7, SET_E_7, SET_H_7, SET_L_7, SET_iHL_7, SET_A_7 } from './opcodes/generated_code';
import { disassemble } from '../disassembler';

// function boundsCheck8(i: number): void {
//     if ((i & ~0xFF) != 0) throw "Bounds error 8-bit";
// }

// function boundsCheck16(i: number): void {
//     if ((i & ~0xFFFF) != 0) throw "Bounds error 16-bit";
// }

const VBLANK_VECTOR = 0x40;
const STAT_VECTOR = 0x48;
const TIMER_VECTOR = 0x50;
const SERIAL_VECTOR = 0x58;
const JOYPAD_VECTOR = 0x60;

export class CPU {
    gb: GameBoy;
    bus: Bus;

    constructor(gb: GameBoy, bus: Bus) {
        this.gb = gb;
        this.bus = bus;
    }

    read8(addr: number): number {
        this.cycles += 4;
        this.gb.tick(4);
        return this.bus.read8(addr);
    }
    write8(addr: number, val: number) {
        this.cycles += 4;
        this.gb.tick(4);
        this.bus.write8(addr, val);
    }

    tick(cycles: number) {
        this.cycles += cycles;
        this.gb.tick(cycles);
    }

    tickPending(cycles: number) {
        this.cycles += cycles;
        this.cyclesPending += cycles;
    }

    zero = false;
    negative = false;
    halfCarry = false;
    carry = false;

    getF(): number {
        let val = 0;
        val = bitSetValue(val, 7, this.zero);
        val = bitSetValue(val, 6, this.negative);
        val = bitSetValue(val, 5, this.halfCarry);
        val = bitSetValue(val, 4, this.carry);
        return val;
    }
    setF(val: number) {
        this.zero = bitTest(val, 7);
        this.negative = bitTest(val, 6);
        this.halfCarry = bitTest(val, 5);
        this.carry = bitTest(val, 4);
    }

    sp: number = 0;

    pc: number = 0;
    b: number = 0;
    c: number = 0;
    d: number = 0;
    e: number = 0;
    h: number = 0;
    l: number = 0;
    // [hl]
    a: number = 0;

    setAf(val: number) {
        // boundsCheck16(val);
        this.a = (val >> 8) & 0xFF;
        this.setF((val >> 0) & 0xFF);
    }
    setBc(val: number) {
        // boundsCheck16(val);
        this.b = (val >> 8) & 0xFF;
        this.c = (val >> 0) & 0xFF;
    }
    setDe(val: number) {
        // boundsCheck16(val);
        this.d = (val >> 8) & 0xFF;
        this.e = (val >> 0) & 0xFF;
    }
    setHl(val: number) {
        // boundsCheck16(val);
        this.h = (val >> 8) & 0xFF;
        this.l = (val >> 0) & 0xFF;
    }

    getAf() {
        let val = 0;
        val |= ((this.a & 0xFF) << 8);
        val |= ((this.getF() & 0xFF) << 0);
        // boundsCheck16(val);
        return val;
    }
    getBc() {
        let val = 0;
        val |= (this.b << 8);
        val |= (this.c << 0);
        // boundsCheck16(val);
        return val;
    }
    getDe() {
        let val = 0;
        val |= (this.d << 8);
        val |= (this.e << 0);
        // boundsCheck16(val);
        return val;
    }
    getHl() {
        let val = 0;
        val |= (this.h << 8);
        val |= (this.l << 0);
        // boundsCheck16(val);
        return val;
    }

    breakpoints = new Uint8Array(65536);
    breakpointList = new Set();

    addBreakpoint(addr: number) {
        this.breakpoints[addr] = 1;
        this.breakpointList.add(addr);
    }
    removeBreakpoint(addr: number) {
        this.breakpoints[addr] = 0;
        this.breakpointList.delete(addr);
    }

    cycles = 0;
    cyclesPending = 0;

    instructionsExecuted = 0;

    enableLogging = false;
    log = "";

    execute(): number {
        if (this.enableLogging) {
            this.log +=
                `AF:${hexN(this.getAf(), 4)} BC:${hexN(this.getBc(), 4)} DE:${hexN(this.getDe(), 4)} HL:${hexN(this.getHl(), 4)} PC:${hexN(this.pc, 4)} LY:${hexN(this.gb.ppu.ly, 2)} IE:${bin(this.ie, 8)} IF:${bin(this.if, 8)} ${disassemble(this, this.pc, 1)[0].disasm}\n`;
        }

        this.instructionsExecuted++;
        // boundsCheck16(this.pc);
        // boundsCheck8(this.b);
        // boundsCheck8(this.c);
        // boundsCheck8(this.d);
        // boundsCheck8(this.e);
        // boundsCheck8(this.h);
        // boundsCheck8(this.l);
        // boundsCheck8(this.a);

        // this.gb.resetInfo();
        // if (this.pc == 0xC000) this.gb.error("sadfdfsd");

        // let origPc = this.pc;
        this.cycles = 0;
        let val = this.read8(this.pc);
        this.pc = (this.pc + 1) & 0xFFFF;

        UNPREFIXED_TABLE[val](this);

        if (this.cyclesPending > 0) {
            this.gb.tick(this.cyclesPending);
            this.cyclesPending = 0;
        }

        if (this.interruptReady) {
            this.dispatchInterrupt(false);
        }

        // this.gb.info(`Addr:${hexN(origPc, 4)} Opcode:${hexN(val, 2)}`);

        if (this.breakpoints[this.pc]) {
            this.gb.break("breakpoint");
        }

        return this.cycles;
    }

    executeHaltBug(): void {
        this.instructionsExecuted++;

        let val = this.read8(this.pc);

        UNPREFIXED_TABLE[val](this);

        if (this.cyclesPending > 0) {
            this.gb.tick(this.cyclesPending);
            this.cyclesPending = 0;
        }

        if (this.interruptReady) {
            this.dispatchInterrupt(false);
        }
    }

    dispatchInterrupt(fromHalt: boolean) {
        let vector = 0;

        this.tick(4);

        let upperPc = (this.pc >> 8) & 0xFF;
        let lowerPc = (this.pc >> 0) & 0xFF;
        this.sp = (this.sp - 1) & 0xFFFF;
        this.write8(this.sp, upperPc);

        if (!fromHalt) this.tick(2);
        if (this.ie & this.if & InterruptId.Vblank) {
            if (this.enableLogging) this.log += "-- DISPATCH Vblank INTERRUPT --\n";
            this.clearInterrupt(InterruptId.Vblank);
            vector = VBLANK_VECTOR;
        } else if (this.ie & this.if & InterruptId.Stat) {
            if (this.enableLogging) this.log += "-- DISPATCH Stat INTERRUPT --\n";
            this.clearInterrupt(InterruptId.Stat);
            vector = STAT_VECTOR;
        } else if (this.ie & this.if & InterruptId.Timer) {
            if (this.enableLogging) this.log += "-- DISPATCH Timer INTERRUPT --\n";
            this.clearInterrupt(InterruptId.Timer);
            vector = TIMER_VECTOR;
        } else if (this.ie & this.if & InterruptId.Serial) {
            if (this.enableLogging) this.log += "-- DISPATCH Serial INTERRUPT --\n";
            this.clearInterrupt(InterruptId.Serial);
            vector = SERIAL_VECTOR;
        } else if (this.ie & this.if & InterruptId.Joypad) {
            if (this.enableLogging) this.log += "-- DISPATCH Joypad INTERRUPT --\n";
            this.clearInterrupt(InterruptId.Joypad);
            vector = JOYPAD_VECTOR;
        }
        if (!fromHalt) this.tick(2);

        if (fromHalt) this.tick(4);

        this.setIme(false);

        this.sp = (this.sp - 1) & 0xFFFF;
        this.write8(this.sp, lowerPc);

        // 1 M-cycle for setting PC
        this.tick(4);

        this.pc = vector;
    }

    setReg(reg: number, val: number) {
        // boundsCheck8(val);

        switch (reg) {
            case 0b000: // B
                this.b = val;
                break;
            case 0b001: // C
                this.c = val;
                break;
            case 0b010: // D
                this.d = val;
                break;
            case 0b011: // E
                this.e = val;
                break;
            case 0b100: // H
                this.h = val;
                break;
            case 0b101: // L 
                this.l = val;
                break;
            case 0b110: // [HL] 
                this.writeIndirectHl(val);
                break;
            case 0b111: // A 
                this.a = val;
                break;

            default:
                this.gb.error("setReg <reg> error");
        }
    }

    getReg(reg: number): number {
        switch (reg) {
            case 0b000: // B
                return this.b;
            case 0b001: // C
                return this.c;
            case 0b010: // D
                return this.d;
            case 0b011: // E
                return this.e;
            case 0b100: // H
                return this.h;
            case 0b101: // L 
                return this.l;
            case 0b110: // [HL] 
                return this.readIndirectHl();
            case 0b111: // A 
                return this.a;

            default:
                this.gb.error("getReg <reg> error");
                return 0xFF;
        }
    }

    readIndirectHl(): number {
        return this.read8(this.getHl());
    }

    writeIndirectHl(val: number): void {
        this.write8(this.getHl(), val);
    }

    read16PcInc(): number {
        let lower = this.read8(this.pc);
        this.pc = (this.pc + 1) & 0xFFFF;
        let upper = this.read8(this.pc);
        this.pc = (this.pc + 1) & 0xFFFF;
        return (upper << 8) | lower;
    }

    enableInterrupts = () => {
        this.setIme(true);
    };

    ie = 0;
    if = 0b11100000;
    ime = false; // Never manually set! Always go through CPU.setIme()
    interruptReady = false;
    interruptAvailable = false;

    setIme(ime: boolean) {
        this.ime = ime;
        this.checkInterruptAvailable();
    }
    flagInterrupt(id: InterruptId) {
        this.if |= id;
        this.checkInterruptAvailable();
    }
    clearInterrupt(id: InterruptId) {
        this.if &= ~id;
        this.checkInterruptAvailable();
    }

    checkInterruptAvailable() {
        this.interruptAvailable = (this.if & this.ie & 0x1F) != 0;
        this.interruptReady = this.ime && this.interruptAvailable;
    }

    readHwio8(addr: number): number {
        switch (addr) {
            case 0xFF0F: // IF
                return this.if;
            case 0xFFFF: // IE
                return this.ie;
            default:
                return 0xFF;
        }
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF0F: // IF
                this.if = (val & 0b11111) | 0b11100000;
                this.checkInterruptAvailable();
                break;
            case 0xFFFF: // IE
                this.ie = val;
                this.checkInterruptAvailable();
                break;
        }
    }
}

export type Instruction = (cpu: CPU) => void;

export const UNPREFIXED_TABLE: Instruction[] = genUnprefixedTable();
export const CB_PREFIX_TABLE: Instruction[] = genCbPrefixTable();

function genUnprefixedTable(): Instruction[] {
    const t: Instruction[] = new Array(256);
    for (let i = 0; i < 256; i++) {
        t[i] = (cpu) => {
            cpu.gb.error(`Unimplemented unprefixed: ${hex(i, 2)}`);
        };
    }

    t[0x01] = LD_BC_U16; // LD BC, U16
    t[0x11] = LD_DE_U16; // LD DE, U16
    t[0x21] = LD_HL_U16; // LD HL, U16
    t[0x31] = LD_SP_U16; // LD SP, U16
    t[0xFA] = LD_A_iU16;
    t[0xEA] = LD_iU16_A;
    t[0x08] = LD_iU16_SP;
    t[0xC3] = JP; // JP U16
    t[0xC2] = JP_NZ; // JP NZ, U16
    t[0xCA] = JP_Z; // JP Z, U16
    t[0xD2] = JP_NC; // JP NC, U16
    t[0xDA] = JP_C; // JP C, U16
    t[0xCD] = CALL; // CALL U16
    t[0xDC] = CALL_C; // CALL C, U16
    t[0xD4] = CALL_NC; // CALL NC, U16
    t[0xCC] = CALL_Z; // CALL Z, U16
    t[0xC4] = CALL_NZ; // CALL NZ, U16
    t[0xF0] = LD_A_iFF00plusU8;
    t[0xE0] = LD_iFF00plusU8_A;
    t[0x36] = LD_iHL_U8;
    t[0xF8] = LD_HL_SPplusE8;
    t[0xE8] = ADD_SP_E8;
    t[0xE6] = AND_A_U8;
    t[0xF6] = OR_A_U8;  // OR A, U8
    t[0xEE] = XOR_A_U8;  // XOR A, U8
    t[0xFE] = CP_A_U8;  // CP A, U8
    t[0x18] = JR;  // JR E8
    t[0x20] = JR_NZ;  // JR NZ, E8
    t[0x28] = JR_Z;  // JR Z, E8
    t[0x30] = JR_NC;  // JR NC, E8
    t[0x38] = JR_C;  // JR C, E8
    t[0xC6] = ADD_A_U8;  // ADD A, U8
    t[0xCE] = ADC_A_U8;  // ADC A, U8
    t[0xD6] = SUB_A_U8;  // SUB A, U8
    t[0xDE] = SBC_A_U8;  // SBC A, U8
    t[0x06] = LD_B_U8; // LD B, U8
    t[0x0E] = LD_C_U8; // LD C, U8
    t[0x16] = LD_D_U8; // LD D, U8
    t[0x1E] = LD_E_U8; // LD E, U8
    t[0x26] = LD_H_U8; // LD H, U8
    t[0x2E] = LD_L_U8; // LD L, U8
    t[0x36] = LD_iHL_U8; // LD (HL), U8
    t[0x3E] = LD_A_U8; // LD A, U8
    t[0xF9] = LD_SP_HL; // LD SP, HL
    t[0xC5] = PUSH_BC;  // PUSH BC
    t[0xD5] = PUSH_DE;  // PUSH DE
    t[0xE5] = PUSH_HL;  // PUSH HL
    t[0xF5] = PUSH_AF;  // PUSH AF 
    t[0xC1] = POP_BC;  // POP BC
    t[0xD1] = POP_DE;  // POP DE
    t[0xE1] = POP_HL;  // POP HL
    t[0xF1] = POP_AF;  // POP AF 
    t[0x04] = INC_B;  // INC B
    t[0x0C] = INC_C;  // INC C
    t[0x14] = INC_D;  // INC D
    t[0x1C] = INC_E;  // INC E
    t[0x24] = INC_H;  // INC H
    t[0x2C] = INC_L;  // INC L
    t[0x34] = INC_iHL;  // INC [HL]
    t[0x3C] = INC_A;  // INC A
    t[0x05] = DEC_B;  // DEC B
    t[0x0D] = DEC_C;  // DEC C
    t[0x15] = DEC_D;  // DEC D
    t[0x1D] = DEC_E;  // DEC E
    t[0x25] = DEC_H;  // DEC H
    t[0x2D] = DEC_L;  // DEC L
    t[0x35] = DEC_iHL;  // DEC [HL]
    t[0x3D] = DEC_A;  // DEC A
    t[0x03] = INC_BC;  // INC BC
    t[0x13] = INC_DE;  // INC DE 
    t[0x23] = INC_HL;  // INC HL
    t[0x33] = INC_SP;  // INC SP
    t[0x0B] = DEC_BC;  // DEC BC
    t[0x1B] = DEC_DE;  // DEC DE 
    t[0x2B] = DEC_HL;  // DEC HL
    t[0x3B] = DEC_SP;  // DEC SP
    t[0x40] = LD_B_B;
    t[0x41] = LD_B_C;
    t[0x42] = LD_B_D;
    t[0x43] = LD_B_E;
    t[0x44] = LD_B_H;
    t[0x45] = LD_B_L;
    t[0x46] = LD_B_iHL;
    t[0x47] = LD_B_A;
    t[0x48] = LD_C_B;
    t[0x49] = LD_C_C;
    t[0x4A] = LD_C_D;
    t[0x4B] = LD_C_E;
    t[0x4C] = LD_C_H;
    t[0x4D] = LD_C_L;
    t[0x4E] = LD_C_iHL;
    t[0x4F] = LD_C_A;
    t[0x50] = LD_D_B;
    t[0x51] = LD_D_C;
    t[0x52] = LD_D_D;
    t[0x53] = LD_D_E;
    t[0x54] = LD_D_H;
    t[0x55] = LD_D_L;
    t[0x56] = LD_D_iHL;
    t[0x57] = LD_D_A;
    t[0x58] = LD_E_B;
    t[0x59] = LD_E_C;
    t[0x5A] = LD_E_D;
    t[0x5B] = LD_E_E;
    t[0x5C] = LD_E_H;
    t[0x5D] = LD_E_L;
    t[0x5E] = LD_E_iHL;
    t[0x5F] = LD_E_A;
    t[0x60] = LD_H_B;
    t[0x61] = LD_H_C;
    t[0x62] = LD_H_D;
    t[0x63] = LD_H_E;
    t[0x64] = LD_H_H;
    t[0x65] = LD_H_L;
    t[0x66] = LD_H_iHL;
    t[0x67] = LD_H_A;
    t[0x68] = LD_L_B;
    t[0x69] = LD_L_C;
    t[0x6A] = LD_L_D;
    t[0x6B] = LD_L_E;
    t[0x6C] = LD_L_H;
    t[0x6D] = LD_L_L;
    t[0x6E] = LD_L_iHL;
    t[0x6F] = LD_L_A;
    t[0x70] = LD_iHL_B;
    t[0x71] = LD_iHL_C;
    t[0x72] = LD_iHL_D;
    t[0x73] = LD_iHL_E;
    t[0x74] = LD_iHL_H;
    t[0x75] = LD_iHL_L;
    t[0x76] = LD_iHL_iHL;
    t[0x77] = LD_iHL_A;
    t[0x78] = LD_A_B;
    t[0x79] = LD_A_C;
    t[0x7A] = LD_A_D;
    t[0x7B] = LD_A_E;
    t[0x7C] = LD_A_H;
    t[0x7D] = LD_A_L;
    t[0x7E] = LD_A_iHL;
    t[0x7F] = LD_A_A;
    t[0x80] = ADD_A_B; // ADD A, B
    t[0x81] = ADD_A_C; // ADD A, C
    t[0x82] = ADD_A_D; // ADD A, D
    t[0x83] = ADD_A_E; // ADD A, E
    t[0x84] = ADD_A_H; // ADD A, H
    t[0x85] = ADD_A_L; // ADD A, L
    t[0x86] = ADD_A_iHL; // ADD A, (HL)
    t[0x87] = ADD_A_A;  // ADD A, A
    t[0x88] = ADC_A_B;  // ADC A, B
    t[0x89] = ADC_A_C;  // ADC A, C
    t[0x8A] = ADC_A_D;  // ADC A, D
    t[0x8B] = ADC_A_E;  // ADC A, E
    t[0x8C] = ADC_A_H;  // ADC A, H
    t[0x8D] = ADC_A_L;  // ADC A, L
    t[0x8E] = ADC_A_iHL;  // ADC A, (HL)
    t[0x8F] = ADC_A_A;  // ADC A, A
    t[0x90] = SUB_A_B; // SUB A, B
    t[0x91] = SUB_A_C;  // SUB A, C
    t[0x92] = SUB_A_D;  // SUB A, D
    t[0x93] = SUB_A_E;  // SUB A, E
    t[0x94] = SUB_A_H;  // SUB A, H
    t[0x95] = SUB_A_L;  // SUB A, L
    t[0x96] = SUB_A_iHL;  // SUB A, (HL)
    t[0x97] = SUB_A_A;  // SUB A, A
    t[0x98] = SBC_A_B;  // SBC A, B
    t[0x99] = SBC_A_C;  // SBC A, C
    t[0x9A] = SBC_A_D;  // SBC A, D
    t[0x9B] = SBC_A_E;  // SBC A, E
    t[0x9C] = SBC_A_H;  // SBC A, H
    t[0x9D] = SBC_A_L;  // SBC A, L
    t[0x9E] = SBC_A_iHL;  // SBC A, (HL)
    t[0x9F] = SBC_A_A;  // SBC A, A
    t[0xA0] = AND_A_B;  // AND A, B
    t[0xA1] = AND_A_C;  // AND A, C
    t[0xA2] = AND_A_D;  // AND A, D
    t[0xA3] = AND_A_E;  // AND A, E
    t[0xA4] = AND_A_H;  // AND A, H
    t[0xA5] = AND_A_L;  // AND A, L
    t[0xA6] = AND_A_iHL;  // AND A, (HL)
    t[0xA7] = AND_A_A;  // AND A, A
    t[0xA8] = XOR_A_B; // XOR A, B
    t[0xA9] = XOR_A_C; // XOR A, C
    t[0xAA] = XOR_A_D; // XOR A, D
    t[0xAB] = XOR_A_E; // XOR A, E
    t[0xAC] = XOR_A_H; // XOR A, H
    t[0xAD] = XOR_A_L; // XOR A, L
    t[0xAE] = XOR_A_iHL; // XOR A, (HL)
    t[0xAF] = XOR_A_A;  // XOR A, A
    t[0xB0] = OR_A_B;  // OR A, B
    t[0xB1] = OR_A_C;  // OR A, C
    t[0xB2] = OR_A_D;  // OR A, D
    t[0xB3] = OR_A_E;  // OR A, E
    t[0xB4] = OR_A_H;  // OR A, H
    t[0xB5] = OR_A_L;  // OR A, L
    t[0xB6] = OR_A_iHL;  // OR A, (HL)
    t[0xB7] = OR_A_A;  // OR A, A
    t[0xB8] = CP_A_B;  // CP A, B
    t[0xB9] = CP_A_C;  // CP A, C
    t[0xBA] = CP_A_D;  // CP A, D
    t[0xBB] = CP_A_E;  // CP A, E
    t[0xBC] = CP_A_H;  // CP A, H
    t[0xBD] = CP_A_L;  // CP A, L
    t[0xBE] = CP_A_iHL;  // CP A, (HL)
    t[0xBF] = CP_A_A;  // CP A, A
    t[0x2F] = CPL;  // CPL
    t[0xD9] = RETI;  // RETI
    t[0x27] = DAA;  // DAA
    t[0x00] = NOP;  // NOP
    t[0x02] = LD_iBC_A;
    t[0x12] = LD_iDE_A;
    t[0x22] = LD_iHLinc_A;
    t[0x32] = LD_iHLdec_A;
    t[0x0A] = LD_A_iBC;
    t[0x1A] = LD_A_iDE;
    t[0x2A] = LD_A_iHLinc;
    t[0x3A] = LD_A_iHLdec;
    t[0xF2] = LD_A_iFF00plusC;
    t[0xE2] = LD_iFF00plusC_A;
    t[0xF3] = DI;
    t[0xFB] = EI;
    t[0xE9] = JP_HL;
    t[0x07] = RLCA;
    t[0x0F] = RRCA;
    t[0x1F] = RRA;
    t[0x17] = RLA;
    t[0x76] = HALT;
    t[0x37] = SCF;
    t[0x3F] = CCF;
    t[0xC9] = RET;  // RET
    t[0xD8] = RET_C;  // RET C
    t[0xD0] = RET_NC;  // RET NC
    t[0xC8] = RET_Z;  // RET Z
    t[0xC0] = RET_NZ;  // RET NZ
    t[0xC7] = RST_0;  // RST 00h 
    t[0xCF] = RST_8;  // RST 08h
    t[0xD7] = RST_16;  // RST 10h
    t[0xDF] = RST_24;  // RST 18h
    t[0xE7] = RST_32;  // RST 20h
    t[0xEF] = RST_40;  // RST 28h
    t[0xF7] = RST_48;  // RST 30h
    t[0xFF] = RST_56;  // RST 38h
    t[0x09] = ADD_HL_BC; // ADD HL, BC
    t[0x19] = ADD_HL_DE; // ADD HL, DE
    t[0x29] = ADD_HL_HL; // ADD HL, HL
    t[0x39] = ADD_HL_SP; // ADD HL, SP
    t[0xCB] = CB_FORWARD;

    t[0x10] = STOP;

    return t;
}

function CB_FORWARD(cpu: CPU) {
    let cb = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    CB_PREFIX_TABLE[cb](cpu);
}

function genCbPrefixTable(): Instruction[] {
    const t: Instruction[] = new Array(256);

    t[0x00] = RLC_B;
    t[0x01] = RLC_C;
    t[0x02] = RLC_D;
    t[0x03] = RLC_E;
    t[0x04] = RLC_H;
    t[0x05] = RLC_L;
    t[0x06] = RLC_iHL;
    t[0x07] = RLC_A;
    t[0x08] = RRC_B;
    t[0x09] = RRC_C;
    t[0x0A] = RRC_D;
    t[0x0B] = RRC_E;
    t[0x0C] = RRC_H;
    t[0x0D] = RRC_L;
    t[0x0E] = RRC_iHL;
    t[0x0F] = RRC_A;
    t[0x10] = RL_B;
    t[0x11] = RL_C;
    t[0x12] = RL_D;
    t[0x13] = RL_E;
    t[0x14] = RL_H;
    t[0x15] = RL_L;
    t[0x16] = RL_iHL;
    t[0x17] = RL_A;
    t[0x18] = RR_B;
    t[0x19] = RR_C;
    t[0x1A] = RR_D;
    t[0x1B] = RR_E;
    t[0x1C] = RR_H;
    t[0x1D] = RR_L;
    t[0x1E] = RR_iHL;
    t[0x1F] = RR_A;
    t[0x20] = SLA_B;
    t[0x21] = SLA_C;
    t[0x22] = SLA_D;
    t[0x23] = SLA_E;
    t[0x24] = SLA_H;
    t[0x25] = SLA_L;
    t[0x26] = SLA_iHL;
    t[0x27] = SLA_A;
    t[0x28] = SRA_B;
    t[0x29] = SRA_C;
    t[0x2A] = SRA_D;
    t[0x2B] = SRA_E;
    t[0x2C] = SRA_H;
    t[0x2D] = SRA_L;
    t[0x2E] = SRA_iHL;
    t[0x2F] = SRA_A;
    t[0x30] = SWAP_B;
    t[0x31] = SWAP_C;
    t[0x32] = SWAP_D;
    t[0x33] = SWAP_E;
    t[0x34] = SWAP_H;
    t[0x35] = SWAP_L;
    t[0x36] = SWAP_iHL;
    t[0x37] = SWAP_A;
    t[0x38] = SRL_B;
    t[0x39] = SRL_C;
    t[0x3A] = SRL_D;
    t[0x3B] = SRL_E;
    t[0x3C] = SRL_H;
    t[0x3D] = SRL_L;
    t[0x3E] = SRL_iHL;
    t[0x3F] = SRL_A;
    t[0x40] = BIT_B_0;
    t[0x41] = BIT_C_0;
    t[0x42] = BIT_D_0;
    t[0x43] = BIT_E_0;
    t[0x44] = BIT_H_0;
    t[0x45] = BIT_L_0;
    t[0x46] = BIT_iHL_0;
    t[0x47] = BIT_A_0;
    t[0x48] = BIT_B_1;
    t[0x49] = BIT_C_1;
    t[0x4A] = BIT_D_1;
    t[0x4B] = BIT_E_1;
    t[0x4C] = BIT_H_1;
    t[0x4D] = BIT_L_1;
    t[0x4E] = BIT_iHL_1;
    t[0x4F] = BIT_A_1;
    t[0x50] = BIT_B_2;
    t[0x51] = BIT_C_2;
    t[0x52] = BIT_D_2;
    t[0x53] = BIT_E_2;
    t[0x54] = BIT_H_2;
    t[0x55] = BIT_L_2;
    t[0x56] = BIT_iHL_2;
    t[0x57] = BIT_A_2;
    t[0x58] = BIT_B_3;
    t[0x59] = BIT_C_3;
    t[0x5A] = BIT_D_3;
    t[0x5B] = BIT_E_3;
    t[0x5C] = BIT_H_3;
    t[0x5D] = BIT_L_3;
    t[0x5E] = BIT_iHL_3;
    t[0x5F] = BIT_A_3;
    t[0x60] = BIT_B_4;
    t[0x61] = BIT_C_4;
    t[0x62] = BIT_D_4;
    t[0x63] = BIT_E_4;
    t[0x64] = BIT_H_4;
    t[0x65] = BIT_L_4;
    t[0x66] = BIT_iHL_4;
    t[0x67] = BIT_A_4;
    t[0x68] = BIT_B_5;
    t[0x69] = BIT_C_5;
    t[0x6A] = BIT_D_5;
    t[0x6B] = BIT_E_5;
    t[0x6C] = BIT_H_5;
    t[0x6D] = BIT_L_5;
    t[0x6E] = BIT_iHL_5;
    t[0x6F] = BIT_A_5;
    t[0x70] = BIT_B_6;
    t[0x71] = BIT_C_6;
    t[0x72] = BIT_D_6;
    t[0x73] = BIT_E_6;
    t[0x74] = BIT_H_6;
    t[0x75] = BIT_L_6;
    t[0x76] = BIT_iHL_6;
    t[0x77] = BIT_A_6;
    t[0x78] = BIT_B_7;
    t[0x79] = BIT_C_7;
    t[0x7A] = BIT_D_7;
    t[0x7B] = BIT_E_7;
    t[0x7C] = BIT_H_7;
    t[0x7D] = BIT_L_7;
    t[0x7E] = BIT_iHL_7;
    t[0x7F] = BIT_A_7;
    t[0x80] = RES_B_0;
    t[0x81] = RES_C_0;
    t[0x82] = RES_D_0;
    t[0x83] = RES_E_0;
    t[0x84] = RES_H_0;
    t[0x85] = RES_L_0;
    t[0x86] = RES_iHL_0;
    t[0x87] = RES_A_0;
    t[0x88] = RES_B_1;
    t[0x89] = RES_C_1;
    t[0x8A] = RES_D_1;
    t[0x8B] = RES_E_1;
    t[0x8C] = RES_H_1;
    t[0x8D] = RES_L_1;
    t[0x8E] = RES_iHL_1;
    t[0x8F] = RES_A_1;
    t[0x90] = RES_B_2;
    t[0x91] = RES_C_2;
    t[0x92] = RES_D_2;
    t[0x93] = RES_E_2;
    t[0x94] = RES_H_2;
    t[0x95] = RES_L_2;
    t[0x96] = RES_iHL_2;
    t[0x97] = RES_A_2;
    t[0x98] = RES_B_3;
    t[0x99] = RES_C_3;
    t[0x9A] = RES_D_3;
    t[0x9B] = RES_E_3;
    t[0x9C] = RES_H_3;
    t[0x9D] = RES_L_3;
    t[0x9E] = RES_iHL_3;
    t[0x9F] = RES_A_3;
    t[0xA0] = RES_B_4;
    t[0xA1] = RES_C_4;
    t[0xA2] = RES_D_4;
    t[0xA3] = RES_E_4;
    t[0xA4] = RES_H_4;
    t[0xA5] = RES_L_4;
    t[0xA6] = RES_iHL_4;
    t[0xA7] = RES_A_4;
    t[0xA8] = RES_B_5;
    t[0xA9] = RES_C_5;
    t[0xAA] = RES_D_5;
    t[0xAB] = RES_E_5;
    t[0xAC] = RES_H_5;
    t[0xAD] = RES_L_5;
    t[0xAE] = RES_iHL_5;
    t[0xAF] = RES_A_5;
    t[0xB0] = RES_B_6;
    t[0xB1] = RES_C_6;
    t[0xB2] = RES_D_6;
    t[0xB3] = RES_E_6;
    t[0xB4] = RES_H_6;
    t[0xB5] = RES_L_6;
    t[0xB6] = RES_iHL_6;
    t[0xB7] = RES_A_6;
    t[0xB8] = RES_B_7;
    t[0xB9] = RES_C_7;
    t[0xBA] = RES_D_7;
    t[0xBB] = RES_E_7;
    t[0xBC] = RES_H_7;
    t[0xBD] = RES_L_7;
    t[0xBE] = RES_iHL_7;
    t[0xBF] = RES_A_7;
    t[0xC0] = SET_B_0;
    t[0xC1] = SET_C_0;
    t[0xC2] = SET_D_0;
    t[0xC3] = SET_E_0;
    t[0xC4] = SET_H_0;
    t[0xC5] = SET_L_0;
    t[0xC6] = SET_iHL_0;
    t[0xC7] = SET_A_0;
    t[0xC8] = SET_B_1;
    t[0xC9] = SET_C_1;
    t[0xCA] = SET_D_1;
    t[0xCB] = SET_E_1;
    t[0xCC] = SET_H_1;
    t[0xCD] = SET_L_1;
    t[0xCE] = SET_iHL_1;
    t[0xCF] = SET_A_1;
    t[0xD0] = SET_B_2;
    t[0xD1] = SET_C_2;
    t[0xD2] = SET_D_2;
    t[0xD3] = SET_E_2;
    t[0xD4] = SET_H_2;
    t[0xD5] = SET_L_2;
    t[0xD6] = SET_iHL_2;
    t[0xD7] = SET_A_2;
    t[0xD8] = SET_B_3;
    t[0xD9] = SET_C_3;
    t[0xDA] = SET_D_3;
    t[0xDB] = SET_E_3;
    t[0xDC] = SET_H_3;
    t[0xDD] = SET_L_3;
    t[0xDE] = SET_iHL_3;
    t[0xDF] = SET_A_3;
    t[0xE0] = SET_B_4;
    t[0xE1] = SET_C_4;
    t[0xE2] = SET_D_4;
    t[0xE3] = SET_E_4;
    t[0xE4] = SET_H_4;
    t[0xE5] = SET_L_4;
    t[0xE6] = SET_iHL_4;
    t[0xE7] = SET_A_4;
    t[0xE8] = SET_B_5;
    t[0xE9] = SET_C_5;
    t[0xEA] = SET_D_5;
    t[0xEB] = SET_E_5;
    t[0xEC] = SET_H_5;
    t[0xED] = SET_L_5;
    t[0xEE] = SET_iHL_5;
    t[0xEF] = SET_A_5;
    t[0xF0] = SET_B_6;
    t[0xF1] = SET_C_6;
    t[0xF2] = SET_D_6;
    t[0xF3] = SET_E_6;
    t[0xF4] = SET_H_6;
    t[0xF5] = SET_L_6;
    t[0xF6] = SET_iHL_6;
    t[0xF7] = SET_A_6;
    t[0xF8] = SET_B_7;
    t[0xF9] = SET_C_7;
    t[0xFA] = SET_D_7;
    t[0xFB] = SET_E_7;
    t[0xFC] = SET_H_7;
    t[0xFD] = SET_L_7;
    t[0xFE] = SET_iHL_7;
    t[0xFF] = SET_A_7;


    return t;
}
