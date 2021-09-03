import { Simulation } from './lib/simulation'

const simulation = new Simulation({})

setInterval(() => {
    simulation.tick()
},100)
