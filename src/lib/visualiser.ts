import * as d3 from "d3";
import { Simulation } from "./simulation";

export class StopCascadeVisualiser {
    private simulation: Simulation

    private rootElement: d3.Selection<any,any,any,any>
    private svg: d3.Selection<any,any,any,any>

    constructor(sim: Simulation, rootElement: string) {
        this.simulation = sim
        this.rootElement = d3.select('#' + rootElement)
        this.svg = this.rootElement.append('svg')

        this.svg.attr('width',640).attr('height',480)
    }
}