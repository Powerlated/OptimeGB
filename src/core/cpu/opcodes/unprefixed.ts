import { CPU } from "../cpu";
import { unTwo8b } from "../../util/misc";
import { SchedulerId } from "../../scheduler";

/** LD R16, U16 */
export function LD_BC_U16(cpu: CPU) {
    cpu.c = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.b = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
}
export function LD_DE_U16(cpu: CPU) {
    cpu.e = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.d = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
}
export function LD_HL_U16(cpu: CPU) {
    cpu.l = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.h = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
}
export function LD_SP_U16(cpu: CPU) {
    let lower = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    let upper = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    cpu.sp = (upper << 8) | lower;
}


// LD A, [U16]
export function LD_A_iU16(cpu: CPU): void {
    const u16 = cpu.read16PcInc();

    cpu.a = cpu.read8(u16);
};

// LD [U16], A
export function LD_iU16_A(cpu: CPU): void {
    const u16 = cpu.read16PcInc();

    cpu.write8(u16, cpu.a);
};

export function LD_iU16_SP(cpu: CPU): void {
    const u16 = cpu.read16PcInc();

    const spUpperByte = cpu.sp >> 8;
    const spLowerByte = cpu.sp & 0b11111111;

    cpu.write8(u16 + 0, spLowerByte);
    cpu.write8(u16 + 1, (spUpperByte) & 0xFFFF);

};

export function JP(cpu: CPU): void {
    const u16 = cpu.read16PcInc();
    cpu.pc = u16;

    cpu.tickPending(4); // Branching takes 4 cycles
};

export function JP_NZ(cpu: CPU) {
    if (!cpu.zero) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}
export function JP_Z(cpu: CPU) {
    if (cpu.zero) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}

export function JP_NC(cpu: CPU) {
    if (!cpu.carry) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}

export function JP_C(cpu: CPU) {
    if (cpu.carry) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}

export function CALL(cpu: CPU) {
    let target = cpu.read16PcInc();
    cpu.tickPending(4);
    // <inline_push cpu.pc>
    let pushVal = cpu.pc;
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
    cpu.pc = target;
}

export function CALL_NZ(cpu: CPU) {
    if (!cpu.zero) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        // <inline_push cpu.pc>
        let pushVal = cpu.pc;
        let upper = (pushVal >> 8) & 0xFF;
        let lower = (pushVal >> 0) & 0xFF;
        cpu.sp = (cpu.sp - 1) & 0xFFFF;
        cpu.write8(cpu.sp, upper);
        cpu.sp = (cpu.sp - 1) & 0xFFFF;
        cpu.write8(cpu.sp, lower);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}
export function CALL_Z(cpu: CPU) {
    if (cpu.zero) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        // <inline_push cpu.pc>
        let pushVal = cpu.pc;
        let upper = (pushVal >> 8) & 0xFF;
        let lower = (pushVal >> 0) & 0xFF;
        cpu.sp = (cpu.sp - 1) & 0xFFFF;
        cpu.write8(cpu.sp, upper);
        cpu.sp = (cpu.sp - 1) & 0xFFFF;
        cpu.write8(cpu.sp, lower);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}
export function CALL_NC(cpu: CPU) {
    if (!cpu.carry) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        // <inline_push cpu.pc>
        let pushVal = cpu.pc;
        let upper = (pushVal >> 8) & 0xFF;
        let lower = (pushVal >> 0) & 0xFF;
        cpu.sp = (cpu.sp - 1) & 0xFFFF;
        cpu.write8(cpu.sp, upper);
        cpu.sp = (cpu.sp - 1) & 0xFFFF;
        cpu.write8(cpu.sp, lower);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}
export function CALL_C(cpu: CPU) {
    if (cpu.carry) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        // <inline_push cpu.pc>
        let pushVal = cpu.pc;
        let upper = (pushVal >> 8) & 0xFF;
        let lower = (pushVal >> 0) & 0xFF;
        cpu.sp = (cpu.sp - 1) & 0xFFFF;
        cpu.write8(cpu.sp, upper);
        cpu.sp = (cpu.sp - 1) & 0xFFFF;
        cpu.write8(cpu.sp, lower);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}

/** LD between A and High RAM */
export function LD_A_iFF00plusU8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    cpu.a = cpu.read8((0xFF00 | imm) & 0xFFFF);

};

export function LD_iFF00plusU8_A(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    cpu.write8((0xFF00 | imm) & 0xFFFF, cpu.a);

};

export function LD_iHL_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    cpu.write8(cpu.getHl(), imm);
};

export function LD_HL_SPplusE8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    const signedVal = unTwo8b(imm);

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = (signedVal & 0xF) + (cpu.sp & 0xF) > 0xF;
    cpu.carry = (signedVal & 0xFF) + (cpu.sp & 0xFF) > 0xFF;

    cpu.setHl((unTwo8b(imm) + cpu.sp) & 0xFFFF);

    // Register read timing
    cpu.tickPending(4);
};

export function ADD_SP_E8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    const value = unTwo8b(imm);

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = ((value & 0xF) + (cpu.sp & 0xF)) > 0xF;
    cpu.carry = ((value & 0xFF) + (cpu.sp & 0xFF)) > 0xFF;

    cpu.sp = (cpu.sp + value) & 0xFFFF;

    // Extra time
    cpu.tickPending(8);

};

export function AND_A_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    const final = imm & cpu.a;
    cpu.a = final;

    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function OR_A_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    const final = imm | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
};

export function XOR_A_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    const final = imm ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function CP_A_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    const newValue = (cpu.a - imm) & 0xFF;

    // Set flags
    cpu.carry = imm > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (imm & 0xF) < 0;

};

/** JR */

export function JR(cpu: CPU) {
    let val = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    let offset = unTwo8b(val);
    cpu.tickPending(4);
    cpu.pc = (cpu.pc + offset) & 0xFFFF;
}
export function JR_NZ(cpu: CPU) {
    if (!cpu.zero) {
        let val = cpu.read8(cpu.pc);
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        let offset = unTwo8b(val);
        cpu.tickPending(4);
        cpu.pc = (cpu.pc + offset) & 0xFFFF;
    } else {
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        cpu.tickPending(4);
    }
}

export function JR_Z(cpu: CPU) {
    if (cpu.zero) {
        let val = cpu.read8(cpu.pc);
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        let offset = unTwo8b(val);
        cpu.tickPending(4);
        cpu.pc = (cpu.pc + offset) & 0xFFFF;
    } else {
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        cpu.tickPending(4);
    }
}

export function JR_NC(cpu: CPU) {
    if (!cpu.carry) {
        let val = cpu.read8(cpu.pc);
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        let offset = unTwo8b(val);
        cpu.tickPending(4);
        cpu.pc = (cpu.pc + offset) & 0xFFFF;
    } else {
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        cpu.tickPending(4);
    }
}
export function JR_C(cpu: CPU) {
    if (cpu.carry) {
        let val = cpu.read8(cpu.pc);
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        let offset = unTwo8b(val);
        cpu.tickPending(4);
        cpu.pc = (cpu.pc + offset) & 0xFFFF;
    } else {
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        cpu.tickPending(4);
    }
}



/** Arithmetic */
export function ADD_A_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    const newValue = (imm + cpu.a) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (imm & 0xF) > 0xF;
    cpu.carry = (imm + cpu.a) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function ADC_A_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    const newValue = (imm + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (imm & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (imm + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function SUB_A_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    const newValue = (cpu.a - imm) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (imm & 0xF) > (cpu.a & 0xF);
    cpu.carry = imm > cpu.a;

    // Set register values
    cpu.a = newValue;

};

export function SBC_A_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    const newValue = (cpu.a - imm - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (imm & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = imm > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};



export function LD_SP_HL(cpu: CPU): void {
    cpu.sp = cpu.getHl();
    // Register read timing
    cpu.tickPending(4);

};

export function PUSH_BC(cpu: CPU) {
    cpu.tickPending(4);
    // <inline_push cpu.getBc()>
    let pushVal = cpu.getBc();
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
}
export function PUSH_DE(cpu: CPU) {
    cpu.tickPending(4);
    // <inline_push cpu.getDe()>
    let pushVal = cpu.getDe();
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
}
export function PUSH_HL(cpu: CPU) {
    cpu.tickPending(4);
    // <inline_push cpu.getHl()>
    let pushVal = cpu.getHl();
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
}
export function PUSH_AF(cpu: CPU) {
    cpu.tickPending(4);
    // <inline_push cpu.getAf()>
    let pushVal = cpu.getAf();
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
}

export function POP_BC(cpu: CPU) {
    let lower = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;
    let upper = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;

    let val = (upper << 8) | lower;
    cpu.setBc(val);
}
export function POP_DE(cpu: CPU) {
    let lower = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;
    let upper = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;

    let val = (upper << 8) | lower;
    cpu.setDe(val);
}
export function POP_HL(cpu: CPU) {
    let lower = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;
    let upper = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;

    let val = (upper << 8) | lower;
    cpu.setHl(val);
}
export function POP_AF(cpu: CPU) {
    let lower = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;
    let upper = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;

    let val = (upper << 8) | lower;
    cpu.setAf(val);
}


export function INC_BC(cpu: CPU) { cpu.setBc((cpu.getBc() + 1) & 0xFFFF); cpu.tickPending(4); }
export function DEC_BC(cpu: CPU) { cpu.setBc((cpu.getBc() - 1) & 0xFFFF); cpu.tickPending(4); }
export function INC_DE(cpu: CPU) { cpu.setDe((cpu.getDe() + 1) & 0xFFFF); cpu.tickPending(4); }
export function DEC_DE(cpu: CPU) { cpu.setDe((cpu.getDe() - 1) & 0xFFFF); cpu.tickPending(4); }
export function INC_HL(cpu: CPU) { cpu.setHl((cpu.getHl() + 1) & 0xFFFF); cpu.tickPending(4); }
export function DEC_HL(cpu: CPU) { cpu.setHl((cpu.getHl() - 1) & 0xFFFF); cpu.tickPending(4); }
export function INC_SP(cpu: CPU) { cpu.sp = (cpu.sp + 1) & 0xFFFF; cpu.tickPending(4); }
export function DEC_SP(cpu: CPU) { cpu.sp = (cpu.sp - 1) & 0xFFFF; cpu.tickPending(4); }




export function CPL(cpu: CPU): void {
    cpu.a = cpu.a ^ 0b11111111;

    cpu.negative = true;
    cpu.halfCarry = true;
};

export function RETI(cpu: CPU): void {
    let lower = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;
    let upper = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;

    cpu.pc = (upper << 8) | lower;

    cpu.tickPending(4); // Branching takes 4 cycles
    cpu.setIme(true);
};

export function DAA(cpu: CPU): void {
    if (!cpu.negative) {
        if (cpu.carry || cpu.a > 0x99) {
            cpu.a = (cpu.a + 0x60) & 0xFF;
            cpu.carry = true;
        }
        if (cpu.halfCarry || (cpu.a & 0x0f) > 0x09) {
            cpu.a = (cpu.a + 0x6) & 0xFF;
        }
    }
    else {
        if (cpu.carry) {
            cpu.a = (cpu.a - 0x60) & 0xFF;
            cpu.carry = true;
        }
        if (cpu.halfCarry) {
            cpu.a = (cpu.a - 0x6) & 0xFF;
        }
    }

    cpu.zero = cpu.a === 0;
    cpu.halfCarry = false;
};

export function NOP(): void {
};

/** LD between A and R16 */
export function LD_iBC_A(cpu: CPU): void { // LD [BC], A
    cpu.write8(cpu.getBc(), cpu.a);
};

export function LD_iDE_A(cpu: CPU): void {// LD [DE], A
    cpu.write8(cpu.getDe(), cpu.a);
};
export function LD_iHLinc_A(cpu: CPU): void {// LD [HL+], A
    cpu.write8(cpu.getHl(), cpu.a);
    cpu.setHl((cpu.getHl() + 1) & 0xFFFF);
};
export function LD_iHLdec_A(cpu: CPU): void {  // LD [HL-], A
    cpu.write8(cpu.getHl(), cpu.a);
    cpu.setHl((cpu.getHl() - 1) & 0xFFFF);
};
export function LD_A_iBC(cpu: CPU): void { // LD A, [BC]
    cpu.a = cpu.read8(cpu.getBc());
};
export function LD_A_iDE(cpu: CPU): void { // LD A, [DE]
    cpu.a = cpu.read8(cpu.getDe());
};
export function LD_A_iHLinc(cpu: CPU): void { // LD A, [HL+]
    cpu.a = cpu.read8(cpu.getHl());
    cpu.setHl((cpu.getHl() + 1) & 0xFFFF);
};
export function LD_A_iHLdec(cpu: CPU): void { // LD A, [HL-]
    cpu.a = cpu.read8(cpu.getHl());
    cpu.setHl((cpu.getHl() - 1) & 0xFFFF);
};

export function LD_A_iFF00plusC(cpu: CPU): void { // LD A, [$FF00+C]
    cpu.a = cpu.read8((0xFF00 | cpu.c) & 0xFFFF);
};
export function LD_iFF00plusC_A(cpu: CPU): void {  // LD [$FF00+C], A
    cpu.write8((0xFF00 | cpu.c) & 0xFFFF, cpu.a);
};

export function DI(cpu: CPU): void {  // DI - Disable interrupts master flag
    cpu.setIme(false);
};
export function EI(cpu: CPU): void {  // EI - Enable interrupts master flag
    cpu.gb.scheduler.addEventRelative(SchedulerId.EnableInterrupts, 4, cpu.enableInterrupts);
};

/** JP */
export function JP_HL(cpu: CPU): void {  // JP HL
    cpu.pc = cpu.getHl();
};

/** A rotate */
export function RLCA(cpu: CPU): void {    // RLC A
    const value = cpu.a;

    const leftmostBit = (value & 0b10000000) >> 7;

    const newValue = ((value << 1) | leftmostBit) & 0xFF;

    cpu.a = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = (value >> 7) === 1;

};

export function RRCA(cpu: CPU): void {  // RRC A

    const value = cpu.a;

    const rightmostBit = (value & 1) << 7;
    const newValue = ((value >> 1) | rightmostBit) & 0xFF;

    cpu.a = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = (value & 1) === 1;

};

export function RRA(cpu: CPU): void {  // RR A
    const value = cpu.a;

    const newValue = ((value >> 1) | (cpu.carry ? 128 : 0)) & 0xFF;

    cpu.a = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = !!(value & 1);

};
export function RLA(cpu: CPU): void {  // RL A
    const value = cpu.a;

    const newValue = ((value << 1) | (cpu.carry ? 1 : 0)) & 0xFF;

    cpu.a = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = (value >> 7) === 1;

};

export function HALT(cpu: CPU): void {
    if (cpu.ime) {
        cpu.gb.haltSkip();
    } else {
        if ((cpu.ie & cpu.if & 0x1F) == 0) {
            cpu.gb.haltSkip();
        } else {
            cpu.executeHaltBug();
        }
    }
};

/** Carry flag */
export function SCF(cpu: CPU): void { // SCF
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = true;
};

export function CCF(cpu: CPU): void {  // CCF
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = !cpu.carry;
};

/** RET */
export function RET(cpu: CPU): void {
    let lower = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;
    let upper = cpu.read8(cpu.sp);
    cpu.sp = (cpu.sp + 1) & 0xFFFF;

    cpu.pc = (upper << 8) | lower;

    cpu.tickPending(4); // Branching takes 4 cycles

};

/** RET */
export function RET_NZ(cpu: CPU) {
    cpu.tickPending(4);
    if (!cpu.zero) {
        let lower = cpu.read8(cpu.sp);
        cpu.sp = (cpu.sp + 1) & 0xFFFF;
        let upper = cpu.read8(cpu.sp);
        cpu.sp = (cpu.sp + 1) & 0xFFFF;

        cpu.pc = (upper << 8) | lower;
        cpu.tickPending(4);
    }
}
export function RET_Z(cpu: CPU) {
    cpu.tickPending(4);
    if (cpu.zero) {
        let lower = cpu.read8(cpu.sp);
        cpu.sp = (cpu.sp + 1) & 0xFFFF;
        let upper = cpu.read8(cpu.sp);
        cpu.sp = (cpu.sp + 1) & 0xFFFF;

        cpu.pc = (upper << 8) | lower;
        cpu.tickPending(4);
    }
} export function RET_NC(cpu: CPU) {
    cpu.tickPending(4);
    if (!cpu.carry) {
        let lower = cpu.read8(cpu.sp);
        cpu.sp = (cpu.sp + 1) & 0xFFFF;
        let upper = cpu.read8(cpu.sp);
        cpu.sp = (cpu.sp + 1) & 0xFFFF;

        cpu.pc = (upper << 8) | lower;
        cpu.tickPending(4);
    }
} export function RET_C(cpu: CPU) {
    cpu.tickPending(4);
    if (cpu.carry) {
        let lower = cpu.read8(cpu.sp);
        cpu.sp = (cpu.sp + 1) & 0xFFFF;
        let upper = cpu.read8(cpu.sp);
        cpu.sp = (cpu.sp + 1) & 0xFFFF;

        cpu.pc = (upper << 8) | lower;
        cpu.tickPending(4);
    }
}


export function ADD_HL_BC(cpu: CPU) {
    let r16Val = cpu.getBc();
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tickPending(4);
}
export function ADD_HL_DE(cpu: CPU) {
    let r16Val = cpu.getDe();
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tickPending(4);
}
export function ADD_HL_HL(cpu: CPU) {
    let r16Val = cpu.getHl();
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tickPending(4);
}
export function ADD_HL_SP(cpu: CPU) {
    let r16Val = cpu.sp;
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tickPending(4);
}

export function STOP(cpu: CPU) {
    let byte = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;

    if (cpu.gb.queueSpeedSwitch) {
        cpu.gb.queueSpeedSwitch = false;

        console.log("STOP: Speed switch!");
        cpu.gb.speedSwitch(0);
    }
}