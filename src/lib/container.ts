import { StepClock } from "./clock";
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
    }
}