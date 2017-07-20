import React, {PropTypes as t} from 'react';

const ALERT_RADIUS = 10;

export const alertType = t.arrayOf(t.shape({
  id: t.number,
  x: t.number,
  y: t.number
}));

const Facility = ({alerts, onAlertClick}) =>
  <div className="facility">
    <img alt="facility floor plan" src="../images/floorplan.png"/>
    <svg className="facility-alert" viewBox="0 0 720 600">
      {
        alerts.map(({id, x, y}, index) =>
          <circle
            cx={x}
            cy={y}
            key={index}
            onClick={() => onAlertClick(id)}
            r={ALERT_RADIUS}
          />)
      }
    </svg>
  </div>;

Facility.propTypes = {
  alerts: alertType.isRequired,
  onAlertClick: t.func.isRequired
};

export default Facility;
