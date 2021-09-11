import Alea from "alea"

export interface PseudoRandomNumberGenerator {
    random(): number
    normal(mean: number, variance: number): number
    gamma(alpha: number, rate: number): number
    beta(alpha: number, beta: number): number
    reset(): void
}

export class AleaPRNG{
    private prng: any
    private seed: string

    constructor(seed: string) {
        this.seed = seed
        this.prng = Alea(this.seed)
    }

    random(): number {
        return this.prng()
    }

    normal(mean: number, variance: number): number {
        // Adapted from http://blog.yjl.im/2010/09/simulating-normal-random-variable-using.html
        if(mean === undefined) mean = 0.0
        if(variance === undefined) variance = 1.0
        let V1, V2, S, X
        do {
            const U1 = this.random()
            const U2 = this.random()
            V1 = 2 * U1 - 1
            V2 = 2 * U2 - 1
            S = V1 * V1 + V2 * V2
        } while (S > 1)
        
        X = Math.sqrt(-2 * Math.log(S) / S) * V1
        X = mean + Math.sqrt(variance) * X
        return X
    }

    gamma(alpha: number, rate: number): number {
        // Adapted from https://github.com/Mattasher/probability-distributions
        const LOG4 = Math.log(4.0)
        const SG_MAGICCONST = 1.0 + Math.log(4.5)
        const beta = 1/rate
        let result: number

        if (alpha > 1.0) {
            const ainv = Math.sqrt(2.0 * alpha - 1.0)
            const bbb = alpha - LOG4
            const ccc = alpha + ainv

            while (true) {
                let u1 = this.random()
                if ((u1 < 1e-7) || (u1 > 0.9999999)) {
                    continue
                }
                let u2 = 1.0 - this.random()
                let v = Math.log(u1 / (1.0 - u1)) / ainv
                let x = alpha * Math.exp(v)
                let z = u1 * u1 * u2
                let r = bbb + ccc * v - x
                if ((r + SG_MAGICCONST - 4.5 * z >= 0.0) || (r >= Math.log(z))) {
                    result = x * beta
                    break
                }
            }
        } else if (alpha == 1.0) {
            let u = this.random()
            while (u <= 1e-7) {
                u = this.random()
            }
            result = - Math.log(u) * beta
        } else {
            let x: number
            while (true) {
                let u = this.random()
                let b = (Math.E + alpha) / Math.E
                let p = b * u
                if (p <= 1.0) {
                    x = Math.pow(p, 1.0 / alpha)
                } else {
                    x = - Math.log((b - p) / alpha)
                }
                let u1 = this.random()
                if (p > 1.0) {
                    if (u1 <= Math.pow(x, (alpha - 1.0))) {
                        break
                    }
                } else if (u1 <= Math.exp(-x)) {
                    break
                }
            }
            result = x * beta
        }
        return result
    }

    beta(alpha: number, beta: number): number {
        // Adapted from https://github.com/Mattasher/probability-distributions
        var g1 = this.gamma(alpha, 1)
        var g2 = this.gamma(beta, 1)
        return g1/(g1+g2)
    }

    reset() {
        this.prng = Alea(this.seed)
    }
}