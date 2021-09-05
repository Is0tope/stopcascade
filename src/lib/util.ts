
export function floorToTick(tickSize: number, price: number): number {
    return Math.floor(tickSize*Math.floor(price/tickSize))
}