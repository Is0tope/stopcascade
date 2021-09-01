import { MaxPriorityQueue } from '@datastructures-js/priority-queue';

export enum Side {
    Buy,
    Sell
}

export interface Order {
    id: number
    price: number
    size: number
    side: Side
    timestamp: number
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
    private bids = new MaxPriorityQueue({ compare: orderComparator});
    private asks = new MaxPriorityQueue({ compare: orderComparator});

    constructor(){

    }

    newOrder(order: Order){
        if(order.side === Side.Buy){
            this.bids.enqueue(order)
        }else{
            this.asks.enqueue(order)
        }
    }

    print() {
        for(const o of this.asks.toArray().reverse()){
            console.log(o)
        }
        for(const o of this.bids.toArray()){
            console.log(o)
        }
    }
}