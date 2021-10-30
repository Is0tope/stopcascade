import * as d3 from "d3";
import { Candle } from "./ohlc";
import { Side } from "./orderbook";
import { Simulation } from "./simulation";
import { StopLevel, StopOrder } from "./stopworker";

interface BookAndStopsProperties{
    bidDict: Map<number,number>
    askDict: Map<number,number>
    stopDict: Map<number,StopLevel>
    maxVolume: number
    scale: any
}

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
    private numCandlesOnChart = 30
    private candleScaling = 0.8
    private candleWidth = 800

    // Book Dimensions
    private bookMargin = 10
    private bookOffset = this.chartWidth
    private bookWidth = 100
    private bookHeight = 600
    private innerBookWidth = this.bookWidth - 2 * this.bookMargin
    private innerBookHeight = this.bookHeight - 2 * this.chartMargin

    // Stops Dimensions
    private stopsMargin = 10
    private stopsOffset = this.bookOffset + this.bookWidth
    private stopsWidth = 100
    private stopsHeight = 600
    private innerStopsWidth = this.stopsWidth - 2 * this.stopsMargin
    private innerStopsHeight = this.stopsHeight - 2 * this.chartMargin

    // Scales
    private maxMsWidth = 30_000
    private xScale: any
    private yScale: any

    // Group Elements
    private rootElement: d3.Selection<any,any,any,any>
    private svg: d3.Selection<any,any,any,any>
    private gAxes: d3.Selection<any,any,any,any>
    private gZoom: any
    private gClip: any
    private gOHLC: any
    private gBook: any
    private gStops: any

    // Chart
    private gXAxis: any
    private gYAxis: any
    private xAxis: any
    private yAxis: any
    private chartZoom: any
    private onZoom: Function
    private moveTolerance = 4 // candle count
    private currentZoom: d3.ZoomTransform = d3.zoomIdentity
    private followChart = true
    private starterText: any

    // Controls
    private controlBar: any
    private startButton: any
    private resetButton: any
    private seedStopsButton: any
    private limitOrderRateInput: any
    private stopOrderRateInput: any
    private followChartCheckbox: any
    private marketOrderBuyButton: any
    private marketOrderSellButton: any

    // Misc
    private marketOrderSize = 10_000

    constructor(sim: Simulation, rootElement: string) {
        this.simulation = sim
        this.rootElement = d3.select('#' + rootElement)

        // Calculate chart width
        this.maxMsWidth = this.simulation.getCandleWidth() * this.numCandlesOnChart
        this.candleWidth = this.simulation.getCandleWidth() * this.candleScaling
    
        // Controls
        this.controlBar = this.rootElement.append('div').attr('style','font-family: Verdana, Geneva, Tahoma, sans-serif; width:100%')
        this.startButton = this.controlBar.append('button').text('Start')
            // .attr('class','btn btn-primary')
        this.resetButton = this.controlBar.append('button').text("Reset")
            .attr('style','margin-left:0.4rem')
            // .attr('class','btn btn-secondary')
        this.seedStopsButton = this.controlBar.append('button').text("Seed Stop Orders")
            .attr('style','margin-left:0.4rem')
            // .attr('class','btn btn-secondary')
        this.controlBar.append('span').attr('style','color:#cccccc').text(' | ')
        this.controlBar.append('label').text('Market Order')
        this.marketOrderBuyButton = this.controlBar.append('button').text('Buy')
            .attr('style','margin-left:0.4rem;background-color:#4aa163')
            // .attr('class','btn btn-success')
        this.marketOrderSellButton = this.controlBar.append('button').text('Sell')
            .attr('style','margin-left:0.4rem;background-color:#d16547')
            // .attr('class','btn btn-danger')
        this.controlBar.append('span').attr('style','color:#cccccc').text(' | ')
        this.controlBar.append('label').text('Limit Order Rate ')
        this.limitOrderRateInput = this.controlBar.append('input')
            .attr('type','number')
            .attr('style','text-align: right;margin-left:0.4rem')
            .attr('min',0)
            .attr('max',1000)
            .attr('value',this.simulation.getLimitOrderRate())
        this.controlBar.append('span').attr('style','color:#cccccc').text(' | ')
        this.controlBar.append('label').text('Stop Order Rate ')
        this.stopOrderRateInput = this.controlBar.append('input')
            .attr('type','number')
            .attr('style','text-align: right;margin-left:0.4rem')
            .attr('min',0)
            .attr('max',1000)
            .attr('value',this.simulation.getStopOrderRate())
        this.controlBar.append('span').attr('style','color:#cccccc').text(' | ')
        this.followChartCheckbox = this.controlBar.append('input')
            .attr('type','checkbox')
        this.controlBar.append('label').text(' Follow Chart')
            .attr('style','margin-left:0.4rem')

        this.limitOrderRateInput.on('input',(e: any) => {
            const val = e.target.valueAsNumber
            if(val >= 0) {
                this.simulation.setLimitOrderRate(val)
            }
        })
        this.stopOrderRateInput.on('input',(e: any) => {
            const val = e.target.valueAsNumber
            if(val >= 0) {
                this.simulation.setStopOrderRate(val)
            }
        })
        this.followChartCheckbox.on('input',(e: any) => {
            this.followChart = !this.followChart
        })
        this.startButton.on('click',(e: any) => {
            this.simulation.isPlaying() ? this.simulation.stop() : this.simulation.start()
        })
        this.resetButton.on('click',(e: any) => {
            this.simulation.reset()
            this.onZoom(d3.zoomIdentity)
        })
        this.seedStopsButton.on('click',(e: any) => {
            this.simulation.seedStopOrders(5)
        })
        this.marketOrderBuyButton.on('click',(e: any) => {
            this.simulation.newMarketOrder(Side.Buy,this.marketOrderSize)
        })
        this.marketOrderSellButton.on('click',(e: any) => {
            this.simulation.newMarketOrder(Side.Sell,this.marketOrderSize)
        })

        // Scales
        this.xScale = d3.scaleLinear().range([0, this.innerChartWidth]).domain([0, this.maxMsWidth])
        this.yScale = d3.scaleLinear().range([this.innerChartHeight, 0]).domain([this.simulation.getMinPrice(), this.simulation.getMaxPrice()]);

        // Root SVG
        this.svg = this.rootElement.append('svg')
        this.svg
            .attr('width',this.containerWidth)
            .attr('height',this.containerHeight)
            .attr('viewbox',`0 0 ${this.containerWidth} ${this.containerHeight}`)
            .style('display','block')
            .style('margin','0 auto')

        // Chart axes
        this.gAxes = this.svg.append('g')
        this.gAxes.attr('transform', `translate(${this.chartMargin},${this.chartMargin})`)
        this.xAxis = d3.axisBottom(this.xScale)
            .tickFormat((domainValue: d3.AxisDomain, index: number) => Math.floor(<number>domainValue/1000).toString())
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

        // Start message
        this.starterText = this.gAxes
            .append('text')
            .text('Click the start button to start the simulation')
            .style('font-size',20)
            .style('text-anchor','middle')
            .style('dominant-baseline','middle')
            .style('fill','#cccccc')
            .attr('x',this.innerChartWidth/2)
            .attr('y',this.innerChartHeight/2)
            .attr('visibility','visible')

        // Zoom
        this.onZoom = (transform: any) => {
            // Only deal with x axis for now
            this.currentZoom = transform
            this.gZoom.attr('transform', `translate(${transform.x},0)`);
            this.gXAxis.call(this.xAxis.scale(transform.rescaleX(this.xScale)));
        }
        this.gClip = this.gAxes.append('g').attr('clip-path', 'url(#clip)')
        this.gZoom = this.gClip.append('g')
        this.chartZoom = d3.zoom()
            .scaleExtent([1, 1])
            .extent([[0, 0], [this.containerWidth, this.containerHeight]])
            .translateExtent([[0, 0], [Infinity, this.containerHeight]])
            .on('zoom', (e: any) => {
                this.onZoom(e.transform)
            })
            .on('start',() => {
                this.followChart = false
            });
        this.gAxes.append('rect')
            .attr('x',0)
            .attr('y',0)
            .attr('width',this.innerChartWidth)
            .attr('height',this.innerChartHeight)
            .attr('fill','transparent')
            .attr('stroke','transparent')
            .call(this.chartZoom)
        
        // OHLC
        this.gOHLC = this.gZoom.append('g')

        // L2 Book
        this.gBook = this.svg.append('g')
        this.gBook.attr('transform', `translate(${this.bookOffset},${this.chartMargin})`)
        this.gBook.append('rect')
            .attr('stroke','black')
            .attr('stroke-width',1)
            .attr('x',0)
            .attr('y',0)
            .attr('width',this.innerBookWidth)
            .attr('height',this.innerBookHeight)
            .attr('fill','none')
        this.gBook.append('text')
            .attr('x',0)
            .attr('y',-5)
            .style('font-family','Verdana')
            .style('font-size',14)
            .text('Book')

        // Stops
        this.gStops = this.svg.append('g')
        this.gStops.attr('transform', `translate(${this.stopsOffset},${this.chartMargin})`)
        this.gStops.append('rect')
            .attr('stroke','black')
            .attr('stroke-width',1)
            .attr('x',0)
            .attr('y',0)
            .attr('width',this.innerStopsWidth)
            .attr('height',this.innerStopsHeight)
            .attr('fill','white')
            .on('click',(e: any) => {
                const rect = e.target.getBoundingClientRect()
                const y = e.pageY - (rect.y + window.scrollY)
                const price = 10*Math.floor(this.yScale.invert(y)/10)
                this.simulation.addStopOrder({
                    side: price < this.simulation.getMarkPrice() ? Side.Sell : Side.Buy,
                    stopPrice: price
                })
            })
        this.gStops.append('text')
            .attr('x',0)
            .attr('y',-5)
            .style('font-family','Verdana')
            .style('font-size',14)
            .text('Stops')
    }

    // Hacky, but don't want to deal with updating these data structures dynamically for demo
    private getBookProperties(): BookAndStopsProperties {
        const bidDict = this.simulation.getBidL2()
        const askDict = this.simulation.getAskL2()
        const stopDict = this.simulation.getStopLevels()
        // Figure out the maximum volume to scale
        const maxVolume = Math.max(...[
            ...Array.from(bidDict.values()),
            ...Array.from(askDict.values()),
            ...Array.from(stopDict.values()).map((sl: StopLevel) => sl.inactive + sl.active)
        ])
        const scale = d3.scaleLinear([0,this.innerBookWidth * 0.95]).domain([0,maxVolume])

        return {
            bidDict,
            askDict,
            stopDict,
            maxVolume,
            scale
        }
    }

    private updateOHLC() {
        const lines = this.gOHLC
            .selectAll('line')
            .data(this.simulation.getOHLC())
        lines.exit().remove()
        lines.enter()
            .append('line')
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5)
            .merge(lines)
            .attr('x1',(c: Candle) => this.xScale(c.timestamp))
            .attr('x2',(c: Candle) => this.xScale(c.timestamp))
            .attr('y1',(c: Candle) => this.yScale(c.high))
            .attr('y2',(c: Candle) => this.yScale(c.low))

        const bars = this.gOHLC
            .selectAll('rect')
            .data(this.simulation.getOHLC())
        bars.exit().remove()
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

        // Check to see if we need to move the chart
        const lastCandleTimestamp = this.simulation.getCurrentCandle().timestamp
        const rightmostTimestamp = <number>this.xAxis.scale().domain()[1]
        const tol = this.moveTolerance * this.simulation.getCandleWidth()
        if(this.followChart && lastCandleTimestamp > rightmostTimestamp - tol) {
            const position = Math.max(0,lastCandleTimestamp + tol - this.maxMsWidth)
            const transform = new d3.ZoomTransform(1,-this.xScale(position),0)
            this.onZoom(transform)
        }

    }

    private updateBook(props: BookAndStopsProperties) {
        const bids = this.gBook
            .selectAll('.bid')
            .data(Array.from(props.bidDict.keys()))
        bids.exit().remove()
        bids.enter()
            .append('rect')
            .attr('class','bid')
            .attr('fill','#6ba27b')
            .merge(bids)
            .attr('x',0)
            .attr('y',(x: number) => this.yScale(x))
            .attr('height',(x: number) => this.yScale(0)-this.yScale(10))
            .attr('width',(x: number) => props.scale(props.bidDict.get(x)!))

        const asks = this.gBook
            .selectAll('.ask')
            .data(Array.from(props.askDict.keys()))
        asks.exit().remove()
        asks.enter()
            .append('rect')
            .attr('class','ask')
            .attr('fill','#d6846d')
            .merge(asks)
            .attr('x',0)
            .attr('y',(x: number) => this.yScale(x))
            .attr('height',(x: number) => this.yScale(0)-this.yScale(10))
            .attr('width',(x: number) => props.scale(props.askDict.get(x)!))
    }

    updateStops(props: BookAndStopsProperties) {
        const stopLevels = this.simulation.getStopLevels()
        const prices = Array.from(stopLevels.keys())

        const inactive = this.gStops
            .selectAll('.inactive')
            .data(prices)
        inactive.exit().remove()
        inactive.enter()
            .append('rect')
            .attr('class','inactive')
            .attr('fill','black')
            .merge(inactive)
            .attr('x',props.scale(0))
            .attr('y',(x: number) => this.yScale(x))
            .attr('height',this.yScale(0)-this.yScale(10))
            .attr('width',(x: number) => props.scale(stopLevels.get(x)!.inactive))
            .attr("pointer-events", "none")

        const active = this.gStops
            .selectAll('.active')
            .data(prices)
        active.exit().remove()
        active.enter()
            .append('rect')
            .attr('class','active')
            .attr('fill','red')
            .merge(active)
            .attr('x',(x: number) => props.scale(stopLevels.get(x)!.inactive))
            .attr('y',(x: number) => this.yScale(x))
            .attr('height',this.yScale(0)-this.yScale(10))
            .attr('width',(x: number) => props.scale(stopLevels.get(x)!.active))
            .attr("pointer-events", "none")
        
        const lastPrice = this.simulation.getLastPrice()
        const last = this.gStops
            .selectAll('.last')
            .data([lastPrice])
        last.exit().remove()
        last.enter()
            .append('line')
            .attr('class','last')
            .attr('stroke','steelblue')
            .attr('stroke-width',1)
            .merge(last)
            .attr('x1',0)
            .attr('x2',this.innerStopsWidth)
            .attr('y1',(x: number) => this.yScale(x))
            .attr('y2',(x: number) => this.yScale(x))

        const markPrice = this.simulation.getMarkPrice()
        const mark = this.gStops
            .selectAll('.mark')
            .data([markPrice])
        mark.exit().remove()
        mark.enter()
            .append('line')
            .attr('class','last')
            .attr('stroke','#8b008b')
            .attr('stroke-width',2)
            .merge(mark)
            .attr('x1',0)
            .attr('x2',this.innerStopsWidth)
            .attr('y1',(x: number) => this.yScale(x))
            .attr('y2',(x: number) => this.yScale(x))
    }

    updateUI() {
        this.followChartCheckbox.property('checked',this.followChart)
        this.startButton.text(this.simulation.isPlaying() ? 'Stop' : 'Start')
    }

    updateStartMessage() {
        this.starterText.attr('visibility',() => !this.simulation.isPlaying() && this.simulation.getTime() === 0 ? 'visible' : 'hidden')
    }

    update() {
        this.updateStartMessage()
        this.updateOHLC()
        const bookProps = this.getBookProperties()
        this.updateBook(bookProps)
        this.updateStops(bookProps)
        this.updateUI()
    }
}