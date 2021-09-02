import { OrderBook, Side } from "./orderbook";

export class MarketMaker {
    private book: OrderBook;
    private markPrice = 1000; // TODO: Make this changeable?
    private minSize = 500
    private maxSize = 1000;
    private maxAggress = 0.01
    private tickSize = 1

    constructor(book: OrderBook) {
        this.book = book;
    }

    roundToTick(price: number){
        return this.tickSize*Math.floor(price/this.tickSize)
    }

    tick() {
        this.placeRandomOrder(Side.Buy)
        this.placeRandomOrder(Side.Sell)
    }

    placeRandomOrder(side: Side) {
        const qty = this.minSize + Math.floor(Math.random()*(this.maxSize-this.minSize))
        const price = this.roundToTick((this.markPrice*(1-this.maxAggress)) + (Math.random()*(2*this.maxAggress*this.markPrice)))
        this.book.newOrder({
            price: price,
            side: side,
            size: qty
        })
    }

}