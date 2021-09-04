import { NewSimulationArgs, Simulation } from "./simulation";

export interface NewStopCascadeWebContainerArgs extends NewSimulationArgs {
    target: string
    tickRate: number
}

export class StopCascadeWebContainer {
    private simulation: Simulation
    private timer: any
    private target: HTMLElement

    constructor(args: NewStopCascadeWebContainerArgs) {
        this.simulation = new Simulation(args)
        this.timer = setInterval(() => {
            this.simulation.tick()
        },args.tickRate)
        this.target = <HTMLElement>document.getElementById(args.target)
        console.log(this.target)
        this.target.textContent = 'bound to container'
    }
}