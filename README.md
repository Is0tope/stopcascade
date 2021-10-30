# stopcascade

This TypeScript application creates a web based simulation of how stop cascades can cause large price movements/wicks.

The simulation contains the following components:

- A time/price priority order book supporting both limit and market orders
- A stop order manager supporting only last price triggered market orders
- A simple market maker that quotes both bid and ask according to a Beta distribution
- Visualiser written in d3.js that displays the simulation in an SVG element and allows interactivity

For more information, please read the [associated blog post](https://machow.ski/posts/scamwicks-and-stop-cascades/).
## Building / Running
To build:

    yarn install
    yarn build

To run the simulation:

  1. Build the application as above
  2. Open the below HTML file in a web browser

    ./dist/index.html
