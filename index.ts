import { OrderBook, Side, Order } from './lib/orderbook'


let book = new OrderBook()

book.newOrder({
    id: 0,
    side: Side.Buy,
    price: 100,
    size: 1000,
    timestamp: 1
})

book.newOrder({
    id: 0,
    side: Side.Buy,
    price: 99,
    size: 1000,
    timestamp: 1
})

book.newOrder({
    id: 0,
    side: Side.Sell,
    price: 101,
    size: 1000,
    timestamp: 2
})

book.newOrder({
    id: 0,
    side: Side.Sell,
    price: 102,
    size: 1000,
    timestamp: 2
})

book.print()