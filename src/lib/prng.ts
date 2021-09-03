import Alea from "alea";

export interface PseudoRandomNumberGenerator {
    random(): number
}

export class AleaPRNG {
    private prng;

    constructor(seed: string) {
        this.prng = Alea(seed)
    }

    random() {
        return this.prng()
    }
}