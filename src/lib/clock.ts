export interface Clock {
    getTime(): number
    set(time: number): void
    tick(): void
    reset(): void
}

export class UTCClock implements Clock {
    getTime():  number {
        return (new Date()).getTime()
    }
    set(time: number) {
        return
    }
    tick() {
        return
    }
    reset() {
        return
    }
}

export class StepClock implements Clock {
    private initial: number
    private current: number
    private step: number

    constructor(initial: number, step: number){
        this.step = step
        this.initial = initial
        this.current = initial
    }

    tick(): void {
        this.current += this.step
    }

    getTime():  number {
        return this.current
    }

    set(time: number) {
        this.current = time
    }

    reset() {
        this.current = this.initial
    }
}