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

    // Group Elements
    private rootElement: d3.Selection<any,any,any,any>
    private svg: d3.Selection<any,any,any,any>
    private gAxes: d3.Selection<any,any,any,any>
    private gZoom: any
    private gClip: any
    private gOHLC: any
    private gBook: any

    // Chart
    private gXAxis: any
    private gYAxis: any
    private xAxis: d3.Axis<d3.NumberValue>
    private yAxis: d3.Axis<d3.NumberValue>

    constructor(sim: Simulation, rootElement: string) {
        this.simulation = sim
        this.rootElement = d3.select('#' + rootElement)

        // Root SVG
        this.svg = this.rootElement.append('svg')
        this.svg.attr('width',this.containerWidth).attr('height',this.containerHeight).attr('viewbox',`0 0 ${this.containerWidth} ${this.containerHeight}`)

        // Chart axes
        this.gAxes = this.svg.append('g')
        this.gAxes.attr('transform', `translate(${this.chartMargin},${this.chartMargin})`)
        this.xAxis = d3.axisBottom(this.xScale)
        this.gXAxis = this.gAxes.append('g')
            .attr('transform', `translate(0,${this.innerChartHeight})`)
            .call(this.xAxis);
        this.yAxis = d3.axisLeft(this.yScale)
        this.gYAxis = this.gAxes.append('g')
            .attr('transform', `translate(0,0)`)
            .call(this.yAxis);

        // Axes Clip Path
        this.svg.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', this.innerChartWidth)
            .attr('height', this.innerChartHeight)
            .attr('x', 0)
            .attr('y', 0)

        // Zoom
        this.gClip = this.gAxes.append('g').attr('clip-path', 'url(#clip)')
        this.gZoom = this.gClip.append('g')
        var zoom = d3.zoom()
            .scaleExtent([1, 1])
            .extent([[0, 0], [this.containerWidth, this.containerHeight]])
            .translateExtent([[0, 0], [Infinity, this.containerHeight]])
            .on('zoom', (e: any) => {
                // Only deal with x axis
                this.gZoom.attr('transform', `translate(${e.transform.x},0)`);
                this.gXAxis.call(this.xAxis.scale(e.transform.rescaleX(this.xScale)));
            });
        this.svg.call(zoom)
        
        // OHLC
        this.gOHLC = this.gZoom.append('g')

        // L2 Book
        this.gBook = this.svg.append('g')
        this.gBook.attr('transform', `translate(${this.chartWidth + this.bookMargin},${this.chartMargin})`)
        this.gBook.append('rect')
            .attr('stroke','black')
            .attr('stroke-width',1)
            .attr('x',0)
            .attr('y',0)
            .attr('width',this.innerBookWidth)
            .attr('height',this.innerBookHeight)
            .attr('fill','none')

    }

    private updateOHLC() {
        let lines = this.gOHLC
            .selectAll('line')
            .data(this.simulation.getOHLC())

        lines.enter()
            .append('line')
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5)
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
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5)
            .merge(bars)
            .attr('x',(c: Candle) => this.xScale(c.timestamp - this.candleWidth/2))
            .attr('y',(c: Candle) => this.yScale(Math.max(c.open,c.close)))
            .attr('width',this.xScale(this.candleWidth))
            // Hacky, but need a minimum width to be there to show line for empty candles
            .attr('height',(c: Candle) => Math.max(1,Math.abs(this.yScale(c.open)-this.yScale(c.close))))
            .attr('fill',(c: Candle) => c.close-c.open > 0 ? '#4aa163' : '#d16547')
    }

    private updateBook() {
        const bidDict = this.simulation.getBidL2()
        const askDict = this.simulation.getAskL2()

        // Figure out the maximum volume to scale
        let maxVolume = 1
        for(const v of [...Array.from(bidDict.values()),...Array.from(askDict.values())]){
            maxVolume = Math.max(maxVolume,v)
        }
        let bookScale = d3.scaleLinear([0,this.innerBookWidth * 0.95]).domain([0,maxVolume])

        let bids = this.gBook
            .selectAll('.bid')
            .data(Array.from(bidDict.keys()))
        bids.exit().remove()
        bids.enter()
            .append('rect')
            .attr('class','bid')
            .attr('fill','#6ba27b')
            .merge(bids)
            .attr('x',0)
            .attr('y',(x: number) => this.yScale(x))
            .attr('height',(x: number) => this.yScale(0)-this.yScale(10))
            .attr('width',(x: number) => bookScale(bidDict.get(x)!))

        let asks = this.gBook
            .selectAll('.ask')
            .data(Array.from(askDict.keys()))
        asks.exit().remove()
        asks.enter()
            .append('rect')
            .attr('class','ask')
            .attr('fill','#d6846d')
            .merge(asks)
            .attr('x',0)
            .attr('y',(x: number) => this.yScale(x))
            .attr('height',(x: number) => this.yScale(0)-this.yScale(10))
            .attr('width',(x: number) => bookScale(askDict.get(x)!))
    }

    update() {
        this.updateOHLC()
        this.updateBook()
    }
}