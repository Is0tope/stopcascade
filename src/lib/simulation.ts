import { Clock, StepClock, UTCClock } from "./clock"
import { MarketMaker } from "./marketmaker"
import { Candle, OHLCTracker } from "./ohlc"
import { Execution, OrderBook, OrderType } from "./orderbook"
import { AleaPRNG, PseudoRandomNumberGenerator } from "./prng"
import { NewStopOrderArgs, StopOrder, StopWorker } from "./stopworker"

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
    // Simulation parameters
    private markPrice: number
    private stopActivationRate: number
    private marketMakerOrderSize: number
    private marketMakerOrderRate: number
    private marketMakerAggression: number
    private tickSize: number
    private maxPrice: number
    private minPrice: number
    private candleWidth: number

    private clock: Clock
    private book: OrderBook
    private prng: PseudoRandomNumberGenerator
    private marketMaker: MarketMaker
    private ohlc: OHLCTracker
    private stops: StopWorker

    constructor(args: NewSimulationArgs) {
        this.markPrice = args.markPrice || 1000
        this.stopActivationRate = args.stopActivationRate || 1
        this.marketMakerOrderSize = args.marketMakerOrderSize || 1000
        this.marketMakerOrderRate = args.marketMakerOrderRate || 2
        this.marketMakerAggression = args.marketMakerAggression || 0.01
        this.tickSize = args.tickSize || 10
        this.maxPrice = args.maxPrice || 2000
        this.minPrice = args.minPrice || 0
        this.candleWidth = args.candleWidth || 1000

        this.clock = args.clock === undefined ? new UTCClock() : args.clock
        this.book = new OrderBook(this.clock)
        this.prng = new AleaPRNG(args.seed || '1337')
        this.marketMaker = new MarketMaker({
            book: this.book,
            prng: this.prng,
            orderSize: this.marketMakerOrderSize,
            aggression: this.marketMakerAggression,
            rate: this.marketMakerOrderRate,
            markPrice:this.markPrice,
            maxPrice: this.maxPrice,
            minPrice: this.minPrice,
            tickSize: this.tickSize
        })
        this.ohlc = new OHLCTracker(this.clock.getTime(),this.candleWidth,this.markPrice)
        this.stops = new StopWorker(this.clock,this.book,this.stopActivationRate,args.audioPath || 'audio')

        // Subscribe to trades
        this.book.subscribeToTrades((es: Execution[]) => {
            es.forEach((e: Execution) => this.ohlc.applyTrade(e))
        })
        this.book.subscribeToTrades((es: Execution[]) => {
            es.forEach((e: Execution) => this.stops.trigger(e.lastPrice))
        })
        this.book.subscribeToTrades((es: Execution[]) => {
            this.marketMaker.onTrades(es)
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

    getInactiveStops(): StopOrder[] {
        return this.stops.getInactiveStops()
    }

    getActivatedStops(): StopOrder[] {
        return this.stops.getActivatedStops()
    }

    addStopOrder(order: NewStopOrderArgs){
        this.stops.newStopOrder(order)
    }

    getMarkPrice(): number {
        return this.markPrice
    }

    getMinPrice(): number {
        return this.minPrice
    }

    getMaxPrice(): number {
        return this.maxPrice
    }

    getLastPrice(): number {
        return this.ohlc.getLastPrice()
    }

    getCurrentCandle(): Candle {
        return this.ohlc.getCurrentCandle()
    }
}