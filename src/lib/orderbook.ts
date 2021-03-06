import { MaxPriorityQueue } from '@datastructures-js/priority-queue';
import { Clock } from './clock';

export enum Side {
    Buy,
    Sell
}

export enum OrderType {
    Limit,
    Market
}

export interface Order {
    id: number
    ordType: OrderType
    price: number
    size: number
    side: Side
    timestamp: number
}

export interface Execution {
    timestamp: number
    side: Side
    lastPrice: number
    lastSize: number
}

export interface NewOrderArgs {
    price?: number
    size: number
    side: Side
    ordType: OrderType
}

function orderComparator(a: Order, b: Order): number {
    // Assume that we only ever compare orders on same side
    const priceDiff = b.price - a.price
    if(priceDiff !== 0){
        return a.side === Side.Buy ? priceDiff : -priceDiff
    }
    return a.timestamp - b.timestamp
}

export class OrderBook {
    private bids = new MaxPriorityQueue({ compare: orderComparator})
    private asks = new MaxPriorityQueue({ compare: orderComparator})
    private clock: Clock;
    private _id = 0
    private tradeSubscribers: ((es: Execution[]) => void)[] = []

    constructor(clock: Clock){
        this.clock = clock
    }

    bestBid(): number {
        if(this.bids.isEmpty()) return -Infinity
        return (<Order>this.bids.front()).price
    }

    bestAsk(): number {
        if(this.asks.isEmpty()) return Infinity
        return (<Order>this.asks.front()).price
    }

    newOrder(args: NewOrderArgs): Execution[] {
        // Create the order
        const order: Order = {
            id: this._id++,
            price: args.price || (args.side === Side.Buy ? Infinity : -Infinity),
            size: args.size,
            side: args.side,
            ordType: args.ordType,
            timestamp: this.clock.getTime()
        }
        const isBuy = order.side === Side.Buy
        const aggressive = isBuy ? order.price >= this.bestAsk() : order.price <= this.bestBid()
        const executions: Execution[] = []

        // If we are aggressive, match against opposite side
        const oppositeSide = isBuy ? this.asks : this.bids
        if(aggressive && !oppositeSide.isEmpty()){
            let oppositeOrder = <Order>oppositeSide.front()
            while(  order.size > 0 && 
                    (isBuy ? oppositeOrder.price <= order.price : oppositeOrder.price >= order.price) && 
                    !oppositeSide.isEmpty()
            ){
                executions.push(...this.trade(order,oppositeOrder,this.clock.getTime()))
                if(oppositeOrder.size === 0){
                    oppositeSide.dequeue()
                    if(oppositeSide.isEmpty()) break
                    oppositeOrder = <Order>oppositeSide.front()
                }
            }
        }

        // If this is a market order, cancel any remaining quanity (if any)
        if(order.ordType === OrderType.Market && order.size > 0) {
            order.size = 0
        }

        // If any quantity remaining, put the remainder in passively
        if(order.size > 0){
            isBuy ? this.bids.enqueue(order) : this.asks.enqueue(order)
        }
        
        // Publish trades (buy only) to subscribers
        const trades = executions.filter((e: Execution) => e.side === Side.Buy)
        if(trades.length > 0){
            this.tradeSubscribers.forEach((fn: (es: Execution[]) => void) => {
                fn(trades)
            })
        }

        return executions
    }

    private trade(agg: Order, pass: Order, timestamp: number): Execution[] {
        const execs: Execution[] = []
        const qty = Math.min(agg.size,pass.size)
        execs.push({
            timestamp: timestamp,
            lastPrice: pass.price,
            lastSize: qty,
            side: agg.side
        })
        execs.push({
            timestamp: timestamp,
            lastPrice: pass.price,
            lastSize: qty,
            side: pass.side
        })
        agg.size -= qty
        pass.size -= qty
        return execs
    }

    print() {
        for(const o of this.asks.toArray().reverse()){
            console.log(o)
        }
        for(const o of this.bids.toArray()){
            console.log(o)
        }
    }

    getBidL2(): Map<number,number> {
        const bidDict = new Map<number,number>()
        for(let o of this.bids.toArray()){
            o = <Order>o
            let size = bidDict.has(o.price) ? bidDict.get(o.price)! + o.size : o.size
            bidDict.set(o.price,size)
        }
        return bidDict
    }

    getAskL2(): Map<number,number> {
        const askDict = new Map<number,number>()
        for(let o of this.asks.toArray()){
            o = <Order>o
            let size = askDict.has(o.price) ? askDict.get(o.price)! + o.size : o.size
            askDict.set(o.price,size)
        }
        return askDict
    }

    printL2() {
        const bidDict = this.getBidL2()
        const askDict = this.getAskL2()
        for(const a of Array.from(askDict.keys()).sort().reverse()) {
            console.log(`${a}\t${askDict.get(a)?.toLocaleString()}`)
        }
        console.log('------------------------')
        for(const b of Array.from(bidDict.keys()).sort().reverse()) {
            console.log(`${b}\t${bidDict.get(b)?.toLocaleString()}`)
        }
    }

    subscribeToTrades(fn: (es: Execution[]) => void) {
        this.tradeSubscribers.push(fn)
    }

    reset() {
        this._id = 0
        this.bids.clear()
        this.asks.clear()
    }
}