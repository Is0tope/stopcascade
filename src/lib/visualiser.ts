import * as d3 from "d3";
import { Candle } from "./ohlc";
import { Simulation } from "./simulation";

export class StopCascadeVisualiser {
    // Simulation object
    private simulation: Simulation

    // General Dimensions
    private containerWidth = 800
    private containerHeight = 600

    // Chart Dimensions
    private chartMargin = 40
    private chartWidth = 600
    private chartHeight = 600
    private innerChartWidth = this.chartWidth - 2 * this.chartMargin
    private innerChartHeight = this.chartHeight - 2 * this.chartMargin
    private candleWidth = 800

    // Book Dimensions
    private bookMargin = 10
    private bookWidth = 100
    private bookHeight = 600
    private innerBookWidth = this.bookWidth - 2 * this.bookMargin
    private innerBookHeight = this.bookHeight - 2 * this.chartMargin

    // Scales
    private xScale = d3.scaleLinear().range([0, this.innerChartWidth]).domain([0, 30_000]);
    private yScale = d3.scaleLinear().range([this.innerChartHeight, 0]).domain([0, 2000]);

    // Elements
    private rootElement: d3.Selection<any,any,any,any>
    private svg: d3.Selection<any,any,any,any>
    private gAxes: d3.Selection<any,any,any,any>
    private gOHLC: any
    private gBook: any

    constructor(sim: Simulation, rootElement: string) {
        this.simulation = sim
        this.rootElement = d3.select('#' + rootElement)
        this.svg = this.rootElement.append('svg')

        this.svg.attr('width',this.containerWidth).attr('height',this.containerHeight).attr('viewbox',`0 0 ${this.containerWidth} ${this.containerHeight}`)

        this.gAxes = this.svg.append('g')
        this.gAxes.attr('transform', `translate(${this.chartMargin},${this.chartMargin})`)
        this.gAxes.append('g')
            .attr('transform', `translate(0,${this.innerChartHeight})`)
            .call(d3.axisBottom(this.xScale));
        this.gAxes.append('g')
            .attr('transform', `translate(0,0)`)
            .call(d3.axisLeft(this.yScale));

        this.gOHLC = this.gAxes.append('g')

        this.gBook = this.svg.append('g')
        this.gBook.attr('transform', `translate(${this.chartWidth + this.bookMargin},${this.chartMargin})`)

    }

    private updateOHLC() {
        let lines = this.gOHLC
            .selectAll('line')
            .data(this.simulation.getOHLC())

        lines.enter()
            .append('line')
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .merge(lines)
            .attr('x1',(c: Candle) => this.xScale(c.timestamp))
            .attr('x2',(c: Candle) => this.xScale(c.timestamp))
            .attr('y1',(c: Candle) => this.yScale(c.high))
            .attr('y2',(c: Candle) => this.yScale(c.low))


        let bars = this.gOHLC
            .selectAll('rect')
            .data(this.simulation.getOHLC())

        bars.enter()
            .append('rect')
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .merge(bars)
            .attr('x',(c: Candle) => this.xScale(c.timestamp - this.candleWidth/2))
            .attr('y',(c: Candle) => this.yScale(Math.max(c.open,c.close)))
            .attr('width',this.xScale(this.candleWidth))
            // Hacky, but need a minimum width to be there to show line for empty candles
            .attr('height',(c: Candle) => Math.max(1,Math.abs(this.yScale(c.open)-this.yScale(c.close))))
            .attr('fill',(c: Candle) => c.close-c.open > 0 ? '#4aa163' : '#d16547')
    }

    update() {
        this.updateOHLC()
    }
}