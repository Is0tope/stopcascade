import { Clock, StepClock, UTCClock } from "./clock"
import { MarketMaker } from "./marketmaker"
import { OHLCTracker } from "./ohlc"
import { Execution, OrderBook, OrderType } from "./orderbook"
import { AleaPRNG, PseudoRandomNumberGenerator } from "./prng"
import { StopWorker } from "./stopworker"

export interface NewSimulationArgs {
    seed?: string
    candleWidth?: number
    markPrice?: number
    clock?: Clock
    stopActivationRate?: number
    marketMakerOrderSize?: number
    marketMakerOrderRate?: number
    marketMakerAggression?: number
}

export class Simulation {
    // Simulation parameters
    private markPrice: number
    private stopActivationRate: number
    private marketMakerOrderSize: number
    private marketMakerOrderRate: number
    private marketMakerAggression: number

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

        this.clock = args.clock === undefined ? new UTCClock() : args.clock
        this.book = new OrderBook(this.clock)
        this.prng = new AleaPRNG(args.seed || '1337')
        this.marketMaker = new MarketMaker(this.book,this.prng,this.marketMakerOrderSize,this.marketMakerAggression,this.marketMakerOrderRate,this.markPrice)
        this.ohlc = new OHLCTracker(this.clock.getTime(),args.candleWidth || 1000,this.markPrice)
        this.stops = new StopWorker(this.clock,this.book,this.stopActivationRate)

        // Subscribe to trades
        this.book.subscribeToTrades((es: Execution[]) => {
            es.forEach((e: Execution) => this.ohlc.applyTrade(e))
        })
        this.book.subscribeToTrades((es: Execution[]) => {
            es.forEach((e: Execution) => this.stops.trigger(e.lastPrice))
        })
    }

    tick() {
        this.marketMaker.tick()
        this.stops.activate()
        this.ohlc.tick(this.clock.getTime())
        // console.log('========')
        // this.book.printL2()
        // this.ohlc.print()
    }
}