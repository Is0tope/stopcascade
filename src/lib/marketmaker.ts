import { Clock } from './clock'
import { Instrument } from './instrument'
import { Execution, OrderBook, OrderType, Side } from "./orderbook";
import { PseudoRandomNumberGenerator } from "./prng";
import { floorToTick } from "./util";

export interface NewMarketMakerArgs {
    book: OrderBook
    prng: PseudoRandomNumberGenerator
    instrument: Instrument
    orderSize: number
    rate: number
    clock: Clock
}

export class MarketMaker {
    private clock: Clock
    private book: OrderBook
    private prng: PseudoRandomNumberGenerator
    private instrument: Instrument
    private minSize: number
    private maxSize: number
    private _rate: number
    private nextPlaceTime: number

    private markPriceFavour = 0.7
    private distributionAlpha = 5
    private distributionBeta = 1.5

    constructor(args: NewMarketMakerArgs) {
        this.clock = args.clock
        this.book = args.book
        this.prng = args.prng
        this.maxSize = args.orderSize
        this.minSize = Math.floor(args.orderSize/2)
        this._rate = args.rate
        this.instrument = args.instrument
        this.nextPlaceTime = this.clock.getTime()
    }

    tick() {
        const targetPlaceTimeDelta = 1000 / this._rate
        // Bit dangerous, and probably should be limited
        while(this.nextPlaceTime <= this.clock.getTime()) {
            this.placeRandomOrder(this.prng.random() >= 0.5 ? Side.Buy : Side.Sell)
            this.nextPlaceTime += targetPlaceTimeDelta
        }
    }

    private getRefPrice() {
        return floorToTick(this.instrument.tickSize,(this.markPriceFavour*this.instrument.markPrice) + ((1-this.markPriceFavour)*this.instrument.lastPrice))
    }

    private getOrderPrice(side: Side): number{
        const rng = this.prng.beta(this.distributionAlpha,this.distributionBeta)
        const mode = (this.distributionAlpha - 1)/(this.distributionAlpha + this.distributionBeta - 2)
        const aggression = rng - mode
        const refPrice = this.getRefPrice()
        let price = side === Side.Buy ? refPrice*(1+aggression) : refPrice*(1-aggression)
        price = floorToTick(this.instrument.tickSize,price)
        price = Math.min(price,this.instrument.maxPrice)
        price = Math.max(price,this.instrument.minPrice)
        return price
    }

    placeRandomOrder(side: Side) {
        const qty = this.minSize + Math.floor(this.prng.random()*(this.maxSize-this.minSize))
        let price = this.getOrderPrice(side)
        
        this.book.newOrder({
            price: price,
            side: side,
            size: qty,
            ordType: OrderType.Limit
        })
    }

    public get rate(): number {
        return this._rate
    }
    public set rate(value: number) {
        this._rate = value
    }
}