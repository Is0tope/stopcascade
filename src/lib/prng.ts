import Alea from "alea";

export interface PseudoRandomNumberGenerator {
    random(): number
    normal(mean: number, variance: number): number
}

export class AleaPRNG implements PseudoRandomNumberGenerator{
    private prng;

    constructor(seed: string) {
        this.prng = Alea(seed)
    }

    random(): number {
        return this.prng()
    }

    normal(mean: number, variance: number): number {
        // Adapted from http://blog.yjl.im/2010/09/simulating-normal-random-variable-using.html
        if(mean === undefined) mean = 0.0
        if(variance === undefined) variance = 1.0
        let V1, V2, S, X;
        do {
            const U1 = this.random();
            const U2 = this.random();
            V1 = 2 * U1 - 1;
            V2 = 2 * U2 - 1;
            S = V1 * V1 + V2 * V2;
        } while (S > 1);
        
        X = Math.sqrt(-2 * Math.log(S) / S) * V1;
        X = mean + Math.sqrt(variance) * X;
        return X;
    }
}