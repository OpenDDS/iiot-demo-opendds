import React, {Component} from 'react';

import Tabs from './tabs';
import './App.css';
import io from 'socket.io-client';

const config = require('../public/config.json');
//const config = {ip: '192.168.3.10', port: 9001};
console.log('App.js: config =', config);
/* global Paho */

const MAX_PRESSURES = 25;
const manifolds = {};
let dirty = false;


class App extends Component {
  constructor() {
    super();

    React.setState = this.setState.bind(this);

    this.state = {
      alerts: [{id: 1, x: 428, y: 395}],
      limits: {cycles: 1000000},
      filter: 'leak-fault',
      manifolds,
      selectedTab: 'department',
      selectedValve: null
    };
  }

  ddsSetup() {
    const socket = io.connect(config.url);
    const that = this;

    // Add a connect listener
    socket.on('connect',function() {
      console.log('Client has connected to the server!');
    });

    socket.on('valve', (sample) => {
      sample.pressureFault = (sample.pressureFault !== 'NO_FAULT');
      that.updateValve(sample.manifoldId, sample.stationId, sample);
    });
  }

  componentDidMount() {
    console.log("componentDidMount");
    this.ddsSetup();

    setInterval(() => {
      if (dirty) {
        dirty = false;
        this.setState({manifolds});
      }
    }, 500);
  }

  updateValve(manifoldId, stationNumber, changes) {
    // Get current data for the valve being updated.
    let valves = manifolds[manifoldId];
    if (!valves) valves = manifolds[manifoldId] = [];
    const valve = valves[stationNumber] || {manifoldId, stationNumber};

    // If the pressure changed ...
    const {pressure} = changes;
    if (pressure !== undefined) {
      let {pressures} = valve;
      if (!pressures) {
        // Create any array of zero pressures.
        const initial = [];
        initial.length = MAX_PRESSURES;
        initial.fill(0, 0, MAX_PRESSURES);
        pressures = valve.pressures = initial;
      }
      // Add the new pressure value to the end of the array.
      pressures.push(pressure);
      // Remove the oldest pressure value from the beginning of the array.
      pressures.shift();
    }

    // Update the data for the valve.
    valves[stationNumber] = Object.assign(valve, changes);
    //console.log('App.js updateValve: valves[stationNumber] =', valves[stationNumber]);

    dirty = true;
  }

  render() {
    const {alerts, filter, limits, manifolds, selectedTab, selectedValve} = this.state;
    return (
      <div className="app">
        <Tabs
          alerts={alerts}
          filter={filter}
          limits={limits}
          manifolds={manifolds}
          selectedTab={selectedTab}
          selectedValve={selectedValve}
        />
        <img alt="OCI logo" className="oci-logo" src="../images/oci-logo.png" />
      </div>
    );
  }
}

export default App;
