import React, {Component, PropTypes as t} from 'react';
import {
  getCenter, getCenterOfMany, getRectangle, getTransform
} from './polygons';
import mapN from './map-n';
import {valveHasAnyFault, valveHasSpecificFault} from './faults';

const VALVE_HEIGHT = 18;
const VALVE_SPACING = 2;
const VALVE_WIDTH = 3;

export const instancePropType = t.shape({
  id: t.number,
  location: t.shape({x: t.number, y: t.number}).isRequired,
  angle: t.number,
  flipX: t.bool,
  flipY: t.bool,
  text: t.string
});

class DiagramObject extends Component {

  static propTypes = {
    definition: t.shape({
      height: t.number,
      points: t.arrayOf(t.arrayOf(t.number)),
      ref: t.string,
      type: t.string.isRequired,
      width: t.number
    }),
    filter: t.string,
    height: t.number,
    instance: instancePropType,
    limits: t.object.isRequired,
    manifolds: t.object
  };

  getManifold = horizontal => {
    const {filter, height, instance, limits, manifolds} = this.props;
    const {angle, location, manifoldId, valveIds} = instance;
    const manifold = manifolds[manifoldId];

    const dx = location.x;
    const dy = location.y;

    // Get the polygons for each of the valves in this manifold.
    const valvePolygons = mapN(valveIds.length, index => {
      const delta = index * (VALVE_WIDTH + VALVE_SPACING);
      const minX = horizontal ? dx + delta : dx;
      const minY = horizontal ? height - dy : height - dy - delta;
      return horizontal ?
        getRectangle(minX, minY, VALVE_WIDTH, -VALVE_HEIGHT) :
        getRectangle(minX, minY, VALVE_HEIGHT, -VALVE_WIDTH);
    });

    // Get the transformation to be applied to this manifold.
    const [centerX, centerY] = getCenterOfMany(valvePolygons);

    return (
      <g
        className="manifold"
        key={manifold}
        transform={getTransform(angle, centerX, centerY)}
      >
        {
          mapN(valveIds.length, index => {
            const valveId = valveIds[index];
            const polygonId = `manifold${manifoldId}-valve${index}`;

            const valve = manifold && manifold[index];

            const otherClass =
              valveId === -1 ? 'open-slot' :
              valveHasSpecificFault(limits, filter, valve) ? 'selected-fault' :
              valveHasAnyFault(limits, valve) ? 'any-fault' :
              'no-fault';

            const handlers = valveId === -1 ? {} :
              {
                onClick: this.onValveClick,
                onTouchEnd: this.onValveClick
              };

            return (
              <polygon
                className={`valve ${otherClass}`}
                id={polygonId}
                key={polygonId}
                points={valvePolygons[index]}
                {...handlers}
              />
            );
          })
        }
      </g>
    );
  }

  /**
   * The location for text should be its center.
   * This makes rotation work as expected.
   */
  getText = () => {
    const {height, instance} = this.props;
    const {angle, location, text} = instance;
    const pieces = text.split('\n');
    const {x, y} = location;
    const yFlipped = height - y;
    return (
      <text
        className="diagram-text"
        dominantBaseline="central"
        textAnchor="middle"
        transform={getTransform(angle, x, yFlipped)}
        x={x}
        y={yFlipped}
      >
        {
          pieces.map((piece, index) =>
            <tspan key={index} x={location.x} dy={index * 7}>
              {piece}
            </tspan>)
        }
      </text>
    );
  };

  onValveClick = event => {
    const {id} = event.target;
    const match = /^manifold(\d+)-valve(\d+)$/.exec(id);
    const [, manifoldId, valveId] = match;

    const {manifolds} = this.props;
    const manifold = manifolds[manifoldId];
    const valve = manifold ?
      manifold[valveId] :
      {manifoldId, valveId};
    React.setState(() => ({selectedValve: valve}));
  };

  render() {
    const {definition, height, instance} = this.props;
    const {horizontal, manifoldId, text} = instance;

    if (manifoldId) return this.getManifold(horizontal);

    if (text) return this.getText();

    const {type} = definition;

    if (type === 'polygon') {
      const {angle, flipX, flipY, location} = instance;
      const dx = location.x;
      const dy = location.y;
      const points = definition.points.map(([x, y]) =>
        [x + dx, height - (y + dy)]);
      const [centerX, centerY] = getCenter(points);
      const transform =
        getTransform(angle, centerX, centerY, flipX, flipY, points);

      return (
        <g>
          <polygon
            className="polygon"
            points={points}
            transform={transform}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    } else if (type === 'image') {
      const {height, ref, width} = definition;
      const {location} = instance;
      const {x, y} = location;
      return <image href={ref} x={x} y={y} height={height} width={width}/>;
    }

    return <text>unsupported type {type}</text>;
  }
}

export default DiagramObject;
