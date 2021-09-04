import { StepClock } from "./clock";
import { Side } from "./orderbook";
import { NewSimulationArgs, Simulation } from "./simulation";
import { StopCascadeVisualiser } from "./visualiser";

export interface NewStopCascadeWebContainerArgs extends NewSimulationArgs {
    target: string
    tickRate: number
}

export class StopCascadeWebContainer {
    private clock: StepClock
    private simulation: Simulation
    private visualiser: StopCascadeVisualiser
    private timer: any

    constructor(args: NewStopCascadeWebContainerArgs) {
        this.clock = new StepClock(0,args.tickRate)
        args.clock = this.clock
        this.simulation = new Simulation(args)
        this.timer = setInterval(() => {
            this.clock.tick()
            this.simulation.tick()
            this.visualiser.update()
        },args.tickRate)
        this.visualiser = new StopCascadeVisualiser(this.simulation,args.target)

        // TODO: Remove this
        for(let i = 0;i < 10;i++){
            this.simulation.addStopOrder({
                side: i % 2 === 0 ? Side.Buy : Side.Sell,
                stopPrice: 10*Math.floor(Math.random()*200)
            })
        }
    }
}