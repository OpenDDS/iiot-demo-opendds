import React, {Component, PropTypes as t} from 'react';
import DiagramObject, {instancePropType} from './diagram-object';
import mapN from './map-n';
const svgPanZoom = require('svg-pan-zoom');
import ValveDialog from './valve-dialog';

const PADDING = 10;

class Diagram extends Component {

  static propTypes = {
    filter: t.string,
    limits: t.object.isRequired,
    manifolds: t.object,
    selectedValve: t.object,
    shapes: t.shape({
      definitions: t.object,
      height: t.number,
      instances: t.arrayOf(instancePropType),
      width: t.number
    })
  };

  componentDidMount() {
    const svg = document.querySelector('.diagram-svg');
    if (svg) svgPanZoom(svg, {controlIconsEnabled: true});

    const manifoldsCreated = Object.keys(this.props.manifolds).length > 0;
    if (!manifoldsCreated) {
      // Update state with manifold details.
      const {instances} = this.props.shapes;
      const manifoldInstances =
        instances.filter(instance => Boolean(instance.manifoldId));
      const manifolds = manifoldInstances.reduce(
        (manifoldMap, instance) => {
          const {manifoldId, stationId, valveIds} = instance;
          const valves = mapN(valveIds.length, index => ({
            cycles: 0,
            fault: false,
            leak: false,
            manifoldId,
            pressure: 0,
            stationId,
            valveId: valveIds[index]
          }));

          manifoldMap[instance.manifoldId] = valves;
          return manifoldMap;
        },
        {});

      React.setState({manifolds});
    }
  }

  render() {
    const {filter, limits, manifolds, selectedValve, shapes} = this.props;
    const {definitions, height, instances, width} = shapes;
    const viewBox =
      `${-PADDING} 0 ${width + PADDING} ${height + PADDING}`;

    return (
      <div className="diagram">
        <ValveDialog limits={limits} valve={selectedValve}/>
        <svg className="diagram-svg" viewBox={viewBox}>
          {
            instances.map(instance => {
              const {defId} = instance;
              const definition = defId ? definitions[defId] : null;
              return (
                <DiagramObject
                  definition={definition}
                  filter={filter}
                  height={height}
                  instance={instance}
                  key={instance.id || instance.manifoldId}
                  limits={limits}
                  manifolds={manifolds}
                  selectedValve={selectedValve}
                />
              );
            })
          }
        </svg>
      </div>
    );
  }
}

export default Diagram;
