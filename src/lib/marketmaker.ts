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
}

export class MarketMaker {
    private book: OrderBook
    private prng: PseudoRandomNumberGenerator
    private instrument: Instrument
    private minSize: number
    private maxSize: number
    private rate: number

    private markPriceFavour = 0.9
    private distributionAlpha = 5
    private distributionBeta = 1.005

    constructor(args: NewMarketMakerArgs) {
        this.book = args.book
        this.prng = args.prng
        this.maxSize = args.orderSize
        this.minSize = Math.floor(args.orderSize/2)
        this.rate = args.rate
        this.instrument = args.instrument
    }

    tick() {
        for(let i = 0; i < this.rate; i++){
            this.placeRandomOrder(this.prng.random() >= 0.5 ? Side.Buy : Side.Sell)
        }
    }

    private getRefPrice() {
        return floorToTick(this.instrument.tickSize,(this.markPriceFavour*this.instrument.markPrice) + ((1-this.markPriceFavour)*this.instrument.lastPrice))
    }

    private getOrderPrice(side: Side): number{
        const rng = this.prng.beta(this.distributionAlpha,this.distributionBeta)
        const expectation = this.distributionAlpha/(this.distributionAlpha+this.distributionBeta)
        const aggression = rng - expectation
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

}