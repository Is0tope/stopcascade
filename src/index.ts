import { UTCClock } from './lib/clock'
import { MarketMaker } from './lib/marketmaker'
import { OrderBook } from './lib/orderbook'


let clock = new UTCClock()
let book = new OrderBook(clock)
let marketMaker = new MarketMaker(book)

setInterval(() => {
    marketMaker.tick()
    book.printL2()
    console.log('========')
},100)
// book.newOrder({
//     side: Side.Buy,
//     price: 100,
//     size: 1000
// })

// book.newOrder({
//     side: Side.Buy,
//     price: 99,
//     size: 1000
// })

// book.newOrder({
//     side: Side.Sell,
//     price: 101,
//     size: 1000
// })

// book.newOrder({
//     side: Side.Sell,
//     price: 102,
//     size: 1000
// })

// book.newOrder({
//     side: Side.Sell,
//     price: 101,
//     size: 1000
// })

// book.print()
// console.log(`bestBid: ${book.bestBid()}, bestAsk: ${book.bestAsk()}`)

// console.log(book.newOrder({
//     side: Side.Buy,
//     price: 103,
//     size: 1500
// }))

// book.print()

// console.log(book.newOrder({
//     side: Side.Buy,
//     price: 101,
//     size: 1500
// }))

// book.print()