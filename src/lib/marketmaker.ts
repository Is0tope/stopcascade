import { OrderBook, OrderType, Side } from "./orderbook";
import { PseudoRandomNumberGenerator } from "./prng";

export class MarketMaker {
    private book: OrderBook
    private prng: PseudoRandomNumberGenerator
    private markPrice: number
    private minSize: number
    private maxSize: number
    private maxAggress: number
    private tickSize = 10
    private rate: number

    constructor(book: OrderBook, prng: PseudoRandomNumberGenerator, orderSize: number, aggression: number, rate: number, markPrice: number) {
        this.book = book
        this.prng = prng
        this.maxSize = orderSize
        this.minSize = Math.floor(orderSize/2)
        this.maxAggress = aggression
        this.rate = rate
        this.markPrice = markPrice
    }

    roundToTick(price: number){
        return this.tickSize*Math.floor(price/this.tickSize)
    }

    tick() {
        for(let i = 0; i < this.rate; i++){
            this.placeRandomOrder(this.prng.random() >= 0.5 ? Side.Buy : Side.Sell)
        }
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