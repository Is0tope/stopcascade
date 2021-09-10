import { Clock, StepClock, UTCClock } from "./clock"
import { Instrument } from "./instrument"
import { MarketMaker } from "./marketmaker"
import { Candle, OHLCTracker } from "./ohlc"
import { Execution, OrderBook, OrderType } from "./orderbook"
import { AleaPRNG, PseudoRandomNumberGenerator } from "./prng"
import { NewStopOrderArgs, StopLevel, StopOrder, StopWorker } from "./stopworker"

export interface NewSimulationArgs {
    seed?: string
    candleWidth?: number
    clock?: Clock
    stopActivationRate?: number
    marketMakerOrderSize?: number
    marketMakerOrderRate?: number
    marketMakerAggression?: number
    markPrice: number
    tickSize?: number
    maxPrice?: number
    minPrice?: number
    audioPath?: string
}

export class Simulation {
    private clock: Clock
    private instrument: Instrument
    private book: OrderBook
    private prng: PseudoRandomNumberGenerator
    private marketMaker: MarketMaker
    private ohlc: OHLCTracker
    private stops: StopWorker

    constructor(args: NewSimulationArgs) {
        this.clock = args.clock === undefined ? new UTCClock() : args.clock
        this.instrument = new Instrument({
            markPrice: args.markPrice || 1000,
            maxPrice:  args.maxPrice || 2000,
            minPrice:  args.minPrice || 0,
            tickSize:  args.tickSize || 10
        })
        this.book = new OrderBook(this.clock)
        this.prng = new AleaPRNG(args.seed || '1337')
        this.marketMaker = new MarketMaker({
            clock: this.clock,
            book: this.book,
            prng: this.prng,
            orderSize: args.marketMakerOrderSize || 1000,
            rate: args.marketMakerOrderRate || 10,
            instrument: this.instrument
        })
        this.ohlc = new OHLCTracker({ 
            time:this.clock.getTime(),
            bucket: args.candleWidth || 1000,
            instrument: this.instrument
        })
        this.stops = new StopWorker(this.clock,this.book,args.stopActivationRate || 5,args.audioPath || 'audio')

        // Subscribe to trades
        this.book.subscribeToTrades((es: Execution[]) => {
            es.forEach((e: Execution) => this.ohlc.applyTrade(e))
        })
        this.book.subscribeToTrades((es: Execution[]) => {
            es.forEach((e: Execution) => this.stops.trigger(e.lastPrice))
        })
        this.book.subscribeToTrades((es: Execution[]) => {
            this.instrument.onTrades(es)
        })
    }

    tick() {
        this.marketMaker.tick()
        this.stops.activate()
        this.ohlc.tick(this.clock.getTime())
    }

    getOHLC(): Candle[] {
        return this.ohlc.getCandles()
    }

    getBidL2(): Map<number,number> {
        return this.book.getBidL2()
    }

    getAskL2(): Map<number,number> {
        return this.book.getAskL2()
    }

    getStopLevels(): Map<number,StopLevel> {
        return this.stops.getStopLevels()
    }

    addStopOrder(order: NewStopOrderArgs){
        this.stops.newStopOrder(order)
    }

    getMarkPrice(): number {
        return this.instrument.markPrice
    }

    getMinPrice(): number {
        return this.instrument.minPrice
    }

    getMaxPrice(): number {
        return this.instrument.maxPrice
    }

    getLastPrice(): number {
        return this.instrument.lastPrice
    }

    getCurrentCandle(): Candle {
        return this.ohlc.getCurrentCandle()
    }

    getLimitOrderRate(): number {
        return this.marketMaker.rate
    }
    
    setLimitOrderRate(rate: number) {
        this.marketMaker.rate = rate
    }

    getStopOrderRate(): number {
        return this.stops.activationRate
    }
    
    setStopOrderRate(rate: number) {
        this.stops.activationRate = rate
    }
}