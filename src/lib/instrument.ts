import { Execution } from "./orderbook"

export interface NewInstrumentArgs {
    markPrice: number
    minPrice: number
    maxPrice: number
    tickSize: number
}

export class Instrument {
    private _markPrice: number
    private _lastPrice: number
    private _maxPrice: number
    private _minPrice: number
    private _tickSize: number

    constructor(args: NewInstrumentArgs) {
        this._markPrice = args.markPrice
        this._minPrice = args.minPrice
        this._maxPrice = args.maxPrice
        this._tickSize = args.tickSize
        // Last price initially set to last price for simplicity
        this._lastPrice = args.markPrice
    }

    public get markPrice(): number {
        return this._markPrice
    }
    public set markPrice(value: number) {
        this._markPrice = value
    }
    public get lastPrice(): number {
        return this._lastPrice
    }
    public get maxPrice(): number {
        return this._maxPrice
    }
    public get minPrice(): number {
        return this._minPrice
    }
    public get tickSize(): number {
        return this._tickSize
    }

    onTrades(es: Execution[]): void{
        if(es.length > 0){
            this._lastPrice = es[es.length - 1].lastPrice
        }
    }

    reset(){
        this._lastPrice = this.markPrice
    }
}