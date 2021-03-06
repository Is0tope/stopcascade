import { Instrument } from './instrument'
import { Execution } from "./orderbook";

export interface Candle {
    timestamp: number
    open: number
    high: number
    low: number
    close: number
}

export interface OpenHighLowCloseTracker {
    applyTrade(e: Execution): any
    getCandles(): Candle[]
    tick(time: number): any
}

export interface NewOHLCTrackerArgs {
    time: number
    bucket: number
    instrument: Instrument
}

export class OHLCTracker implements OpenHighLowCloseTracker {
    private candles: Candle[] = []
    private bucket: number
    private instrument: Instrument
    private initialTime: number

    constructor(args: NewOHLCTrackerArgs){
        this.bucket = args.bucket
        this.instrument = args.instrument
        this.initialTime = args.time
        this.reset()
    }

    private roundToBucket(time: number){
        return time - (time % this.bucket)
    }

    getCurrentCandle(): Candle {
        return this.candles[this.candles.length - 1]
    }

    applyTrade(e: Execution) {
        let time = this.roundToBucket(e.timestamp)
        this.rollCandle(time)
        const c = this.getCurrentCandle()
        if(e.lastPrice > c.high){
            c.high = e.lastPrice
        }
        if(e.lastPrice < c.low){
            c.low = e.lastPrice
        }
        c.close = e.lastPrice
    }

    getCandles(): Candle[] {
        return this.candles
    }

    tick(time: number) {
        this.rollCandle(this.roundToBucket(time))
    }

    private rollCandle(time: number) {
        const c = this.getCurrentCandle()
        for(let t = c.timestamp + this.bucket; t <= time; t += this.bucket){
            this.candles.push({
                timestamp: t,
                open: c.close,
                high: c.close,
                low: c.close,
                close: c.close
            })
        }
    }

    print() {
        for(const c of this.getCandles()){
            console.log(`time: ${c.timestamp} O: ${c.open} H: ${c.high} L: ${c.low} C: ${c.close}`)
        }
    }

    reset() {
        this.candles = []
        const initialPrice = this.instrument.markPrice
        this.candles.push({
            timestamp: this.roundToBucket(this.initialTime),
            open: initialPrice,
            high: initialPrice,
            low: initialPrice,
            close: initialPrice
        })
    }

    getCandleWidth(): number {
        return this.bucket
    }
}