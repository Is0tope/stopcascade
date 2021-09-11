import { StepClock } from "./clock";
import { NewSimulationArgs, Simulation } from "./simulation";
import { StopCascadeVisualiser } from "./visualiser";

export interface NewStopCascadeWebContainerArgs extends NewSimulationArgs {
    target: string
    tickRate: number
}

export class StopCascadeWebContainer {
    private simulation: Simulation
    private visualiser: StopCascadeVisualiser
    private timer: any

    constructor(args: NewStopCascadeWebContainerArgs) {
        this.simulation = new Simulation(args)
        this.timer = setInterval(() => {
            this.simulation.tick()
            this.visualiser.update()
        },args.tickRate)
        this.visualiser = new StopCascadeVisualiser(this.simulation,args.target)
    }
}