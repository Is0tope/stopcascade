export interface Clock {
    getTime(): number
}

export class UTCClock implements Clock {
    getTime():  number {
        return (new Date()).getTime()
    }
}