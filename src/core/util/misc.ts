import { BIT_3, BIT_4, BIT_7, BIT_8, BIT_15, BIT_16 } from "./bits";

export function unTwo4b(n: number): number {
    if ((n & BIT_3) !== 0)
        n -= BIT_4;

    return n;
}

export function unTwo8b(n: number): number {
    if ((n & BIT_7) !== 0)
        n -= BIT_8;

    return n;
}

export function unTwo16b(n: number): number {
    if ((n & BIT_15) !== 0)
        n -= BIT_16;

    return n;
}

export function do4b(i: number): boolean {
    return (i ^ 0xF) !== 0;
}

export function do8b(i: number): boolean {
    return (i ^ 0xFF) !== 0;
}

export function do16b(i: number): boolean {
    return (i ^ 0xFFFF) !== 0;
}

export function hex(i: any, digits: number) {
    return `0x${pad(i.toString(16), digits, '0').toUpperCase()}`;
}

export function hexN(i: any, digits: number) {
    return pad(i.toString(16), digits, '0').toUpperCase();
}

export function hexN_LC(i: any, digits: number) {
    return pad(i.toString(16), digits, '0');
}

export function pad(n: string, width: number, z: string) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

export function r_pad(n: string, width: number, z: string) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
}

export function assert(n1: any, n2: any, reason: string) {
    if (n1 != n2) {
        console.error(`Assertion failed:
            ${reason}
            ${n1} != ${n2}
        `);
        return false;
    }
    return true;
}