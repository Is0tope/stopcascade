import { Execution, OrderBook, OrderType, Side } from "./orderbook";
import { PseudoRandomNumberGenerator } from "./prng";
import { floorToTick } from "./util";

export interface NewMarketMakerArgs {
    book: OrderBook
    prng: PseudoRandomNumberGenerator
    orderSize: number
    aggression: number
    rate: number
    markPrice: number
    minPrice: number
    maxPrice: number
    tickSize: number
}

export class MarketMaker {
    private book: OrderBook
    private prng: PseudoRandomNumberGenerator
    private markPrice: number
    private minSize: number
    private maxSize: number
    private maxAggress: number
    private rate: number
    private minPrice: number
    private maxPrice: number
    private tickSize: number
    private lastPrice: number

    private markPriceFavour = 0.5

    constructor(args: NewMarketMakerArgs) {
        this.book = args.book
        this.prng = args.prng
        this.maxSize = args.orderSize
        this.minSize = Math.floor(args.orderSize/2)
        this.maxAggress = args.aggression
        this.rate = args.rate
        this.markPrice = args.markPrice
        this.lastPrice = args.markPrice
        this.minPrice = args.minPrice
        this.maxPrice = args.maxPrice
        this.tickSize = args.tickSize
    }

    tick() {
        for(let i = 0; i < this.rate; i++){
            this.placeRandomOrder(this.prng.random() >= 0.5 ? Side.Buy : Side.Sell)
        }
    }

    onTrades(trades: Execution[]) {
        this.lastPrice = trades[trades.length - 1].lastPrice
    }

    private getRefPrice() {
        return floorToTick(this.tickSize,(this.markPriceFavour*this.markPrice) + ((1-this.markPriceFavour)*this.lastPrice))
    }

    placeRandomOrder(side: Side) {
        const qty = this.minSize + Math.floor(this.prng.random()*(this.maxSize-this.minSize))
        let price = floorToTick(this.tickSize,(this.markPrice*(1-this.maxAggress)) + (this.prng.random()*(2*this.maxAggress*this.markPrice)))
        price = Math.min(price,this.maxPrice)
        price = Math.max(price,this.minPrice)
        
        this.book.newOrder({
            price: price,
            side: side,
            size: qty,
            ordType: OrderType.Limit
        })
    }

}