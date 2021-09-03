import { UTCClock } from './lib/clock'
import { MarketMaker } from './lib/marketmaker'
import { OrderBook, OrderType, Side } from './lib/orderbook'
import * as alea from 'alea'
import { AleaPRNG } from './lib/prng'

const clock = new UTCClock()
const book = new OrderBook(clock)
const prng = new AleaPRNG('1337')
const marketMaker = new MarketMaker(book,prng)

// setInterval(() => {
//     marketMaker.tick()
//     book.printL2()
//     console.log('========')
// },100)
for(let i = 0; i < 100; i++){
    marketMaker.tick()
}
book.printL2()
console.log('Sending market Buy order for 5000')
book.newOrder({
    side: Side.Buy,
    size: 5000,
    ordType: OrderType.Market
})
book.printL2()
console.log('Sending market Sell order for 20,000')
book.newOrder({
    side: Side.Sell,
    size: 20000,
    ordType: OrderType.Market
})
book.printL2()


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