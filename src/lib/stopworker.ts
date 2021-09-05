import { MaxPriorityQueue } from "@datastructures-js/priority-queue";
import { Clock } from "./clock";
import { OrderBook, OrderType, Side } from "./orderbook";

function stopOrderComparator(a: StopOrder, b: StopOrder): number {
    // Assume that we only ever compare orders on same side
    const priceDiff = b.stopPrice - a.stopPrice
    if(priceDiff !== 0){
        return a.side === Side.Buy ? -priceDiff : priceDiff
    }
    return a.timestamp - b.timestamp
}

export interface NewStopOrderArgs {
    stopPrice: number
    side: Side
}

export interface StopOrder {
    id: number
    side: Side
    stopPrice: number
    size: number
    timestamp: number
}


export class StopWorker {
    private clock: Clock
    private book: OrderBook
    private _id = 0
    private inactiveBuys = new MaxPriorityQueue({ compare: stopOrderComparator})
    private inactiveSells = new MaxPriorityQueue({ compare: stopOrderComparator})
    private activatedOrders: StopOrder[] = []
    private activationRate: number
    private defaultSize = 8000
    private hitSound: HTMLAudioElement

    constructor(clock: Clock, book: OrderBook, activationRate: number, audioPath: string) {
        this.clock = clock
        this.book = book
        this.activationRate = activationRate
        this.hitSound  = new Audio(`${audioPath}/hit.mp3`)
    }

    newStopOrder(args: NewStopOrderArgs) {
        const order: StopOrder = {
            id: this._id++,
            side: args.side,
            stopPrice: args.stopPrice,
            size: this.defaultSize,
            timestamp: this.clock.getTime()
        }
        order.side === Side.Buy ? this.inactiveBuys.enqueue(order) : this.inactiveSells.enqueue(order)
        console.log(`Added stop: ${Side[args.side]} ${args.stopPrice}`)
    }

    trigger(price: number) {
        if(!this.inactiveBuys.isEmpty()){
            let top = <StopOrder>this.inactiveBuys.front()
            while(price >= top.stopPrice){
                this.activatedOrders.push(<StopOrder>this.inactiveBuys.dequeue())
                if(this.inactiveBuys.isEmpty()) break
                top = <StopOrder>this.inactiveBuys.front()
            }
        }
        if(!this.inactiveSells.isEmpty()){
            let top = <StopOrder>this.inactiveSells.front()
            while(price <= top.stopPrice){
                this.activatedOrders.push(<StopOrder>this.inactiveSells.dequeue())
                if(this.inactiveBuys.isEmpty()) break
                top = <StopOrder>this.inactiveSells.front()
            }
        }
    }

    activate() {
        let toActivate = Math.min(this.activationRate,this.activatedOrders.length)
        for(let i = 0; i < toActivate; i++){
            const o = this.activatedOrders.shift()!
            console.log(`Activated ${Side[o.side]} order at ${o.stopPrice.toLocaleString()}`)
            this.book.newOrder({
                ordType: OrderType.Market,
                side: o.side,
                size: o.size
            })
            this.hitSound.play()
        }
    }

    getInactiveStops(): StopOrder[] {
        return <StopOrder[]>[...this.inactiveBuys.toArray(),...this.inactiveSells.toArray()]
    }

    getActivatedStops(): StopOrder[] {
        return this.activatedOrders
    }
}