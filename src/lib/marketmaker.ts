import { OrderBook, OrderType, Side } from "./orderbook";
import { PseudoRandomNumberGenerator } from "./prng";

export class MarketMaker {
    private book: OrderBook
    private prng: PseudoRandomNumberGenerator
    private markPrice = 1000 // TODO: Make this changeable?
    private minSize = 500
    private maxSize = 1000
    private maxAggress = 0.01
    private tickSize = 1

    constructor(book: OrderBook, prng: PseudoRandomNumberGenerator) {
        this.book = book;
        this.prng = prng
    }

    roundToTick(price: number){
        return this.tickSize*Math.floor(price/this.tickSize)
    }

    tick() {
        this.placeRandomOrder(Side.Buy)
        this.placeRandomOrder(Side.Sell)
    }

    placeRandomOrder(side: Side) {
        const qty = this.minSize + Math.floor(this.prng.random()*(this.maxSize-this.minSize))
        const price = this.roundToTick((this.markPrice*(1-this.maxAggress)) + (this.prng.random()*(2*this.maxAggress*this.markPrice)))
        this.book.newOrder({
            price: price,
            side: side,
            size: qty,
            ordType: OrderType.Limit
        })
    }

}