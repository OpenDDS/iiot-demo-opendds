import React, {Component, PropTypes as t} from 'react';
import Dialog from './dialog';
import {valveHasSpecificFault} from './faults';
import {LineChart, Themes} from 'formidable-charts';

function getChartSeries(pressures) {
  const data = pressures ?
    pressures.map((pressure, index) => ({x: index, y: pressure})) :
    [];
  return [{data}];
}

function getCssClass(bool) {
  return bool ? 'fault' : '';
}

class ValveDialog extends Component {
  static propTypes = {
    limits: t.object.isRequired,
    valve: t.object,
  };

  closeDialog = () => React.setState({selectedValve: null});

  render() {
    const {limits, valve} = this.props;
    if (!valve) return null;

    valve.lifecycleFault =
      valveHasSpecificFault(limits, 'lifecycle', valve);

    const pairs = [
      {label: 'Manifold Serial #', property: 'manifoldId'},
      {label: 'Station #', property: 'stationNumber'},
      {label: 'Valve Serial #', property: 'valveSerialId'},
      {label: 'Part #', property: 'partNumber'},
      {
        label: 'Valve Fault',
        property: 'fault',
        className: getCssClass(valve.fault)
      },
      {
        label: 'Leak Fault',
        property: 'leakFault',
        className: getCssClass(valve.leakFault)
      },
      {
        label: 'Pressure Fault',
        property: 'pressureFault',
        className: getCssClass(valve.pressureFault)
      },
      {
        label: 'Lifecycle Count',
        property: 'cycles',
        className: getCssClass(valve.lifecycleFault)
      },
      {label: 'Supply Pressure', property: 'pressure'},
      /*
      {label: 'Duration Last 1-4', property: 'durationLast14'},
      {label: 'Duration Last 1-2', property: 'durationLast12'},
      {label: 'Equalization Avg. Pressure', property: 'eqAvgPressure'},
      {label: 'Equalization Pressure Rate', property: 'eqPressureRate'},
      {label: 'Residual Dynamic Analysis', property: 'resDynAnalysis'}
      */
    ];
    const dialogButtons = [
      {label: 'OK', onClick: this.closeDialog}
    ];

    function getValue(property) {
      const value = valve[property];
      return typeof value === 'boolean' ?
        value ? 'Yes' : 'No' :
        value;
    }

    return (
      <Dialog
        buttons={dialogButtons}
        className="valve-dialog"
        onClose={this.closeDialog}
        show={valve !== null}
        size="small"
        title={`Manifold ${valve.manifoldId} Valve ${valve.stationNumber}`}
      >
        {
          pairs.map((pair, index) =>
            <div key={index}>
              <label className={pair.className}>
                {pair.label}:
              </label>
              <div className={`dialog-value ${pair.className}`}>
                {getValue(pair.property)}
              </div>
            </div>)
        }
        {
          valve.pressures ?
            <LineChart
              series={getChartSeries(valve.pressures)}
              theme={Themes.dark}
              x="x"
              y="y"
            /> :
            null
        }
      </Dialog>
    );
  }
}

export default ValveDialog;
