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

export interface StopLevel {
    inactive: number
    active:number
}

export class StopWorker {
    private clock: Clock
    private book: OrderBook
    private _id = 0
    private inactiveBuys = new MaxPriorityQueue({ compare: stopOrderComparator})
    private inactiveSells = new MaxPriorityQueue({ compare: stopOrderComparator})
    private activatedOrders: StopOrder[] = []
    private _activationRate: number
    private defaultSize = 8_000
    private hitSound: HTMLAudioElement
    private lastActivationTime: number

    constructor(clock: Clock, book: OrderBook, activationRate: number, audioPath: string) {
        this.clock = clock
        this.book = book
        this._activationRate = activationRate
        this.hitSound  = new Audio(`${audioPath}/hit.mp3`)
        this.lastActivationTime = this.clock.getTime()
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
                console.log(`Triggering ${Side[top.side]} order at ${top.stopPrice.toLocaleString()}`)
                this.activatedOrders.push(<StopOrder>this.inactiveBuys.dequeue())
                if(this.inactiveBuys.isEmpty()) break
                top = <StopOrder>this.inactiveBuys.front()
            }
        }
        if(!this.inactiveSells.isEmpty()){
            let top = <StopOrder>this.inactiveSells.front()
            while(price <= top.stopPrice){
                console.log(`Triggering ${Side[top.side]} order at ${top.stopPrice.toLocaleString()}`)
                this.activatedOrders.push(<StopOrder>this.inactiveSells.dequeue())
                if(this.inactiveBuys.isEmpty()) break
                top = <StopOrder>this.inactiveSells.front()
            }
        }
    }

    activate() {
        // Only track stop activation if we have stops to active, otherwise track current time
        if(this.activatedOrders.length === 0){
            this.lastActivationTime = this.clock.getTime()
        }
        const targetActivationTimeDelta = 1000/this._activationRate
        while(this.lastActivationTime <= this.clock.getTime() && this.activatedOrders.length > 0){
            console.log(this.lastActivationTime,this.clock.getTime())
            const o = this.activatedOrders.shift()!
            console.log(`Activated ${Side[o.side]} order at ${o.stopPrice.toLocaleString()}`)
            this.book.newOrder({
                ordType: OrderType.Market,
                side: o.side,
                size: o.size
            })
            this.hitSound.play()
            this.lastActivationTime += targetActivationTimeDelta
        }
    }

    getStopLevels(): Map<number,StopLevel> {
        const dict = new Map<number,StopLevel>()
        for(const sd of [this.inactiveBuys,this.inactiveSells]){
            for(let o of sd.toArray()){
                o = <StopOrder>o
                if(dict.has(o.stopPrice)){
                    dict.get(o.stopPrice)!.inactive += o.size
                } else {
                    dict.set(o.stopPrice,{
                        inactive: o.size,
                        active: 0
                    })
                }
            }
        }
        for(let o of this.activatedOrders){
            o = <StopOrder>o
            if(dict.has(o.stopPrice)){
                dict.get(o.stopPrice)!.active += o.size
            } else {
                dict.set(o.stopPrice,{
                    inactive: 0,
                    active: o.size
                })
            }
        }
        return dict
    }
    
    reset() {
        this._id = 0
        this.lastActivationTime = this.clock.getTime()
        this.inactiveBuys.clear()
        this.inactiveSells.clear()
        this.activatedOrders = []
    }

    public get activationRate(): number {
        return this._activationRate
    }
    public set activationRate(value: number) {
        this._activationRate = value
    }
}