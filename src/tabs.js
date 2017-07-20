import React, {Component, PropTypes as t} from 'react';
import Diagram from './diagram';
import Facility, {alertType} from './facility';
import Filters from './filters';

import boothShapes from './booth.json';

class Tabs extends Component {
  static propTypes = {
    alerts: alertType.isRequired,
    filter: t.string,
    limits: t.object.isRequired,
    manifolds: t.object.isRequired,
    selectedTab: t.string.isRequired,
    selectedValve: t.object
  };

  getBtnClass = id => {
    const selected = this.props.selectedTab === id;
    return `toggle-btn ${selected ? 'down' : 'up'}`;
  };

  getContent = () => {
    const {
      alerts, filter, limits, manifolds, selectedTab, selectedValve
    } = this.props;

    return selectedTab === 'facility' ?
      <Facility
        alerts={alerts}
        onAlertClick={this.onAlertClick}
      /> :
      selectedTab === 'department' ?
      [
        <Diagram
          filter={filter}
          key="diagram"
          limits={limits}
          manifolds={manifolds}
          selectedValve={selectedValve}
          shapes={boothShapes}
        />,
        <Filters
          key="filters"
          filter={filter}
          limits={limits}
          manifolds={manifolds}
        />
      ] :
      <div>invalid tab</div>;
  };

  onAlertClick = alertId => {
    console.log('tabs.js onAlertClick: alertId =', alertId);
    React.setState({selectedTab: 'department'});
  };

  onClick = event =>
    React.setState({selectedTab: event.target.id});

  render() {
    return (
      <div className="tabs">
        <div className="tab-buttons">
          <button
            className={this.getBtnClass('facility')}
            id="facility"
            onClick={this.onClick}
          >
            Facility
          </button>
          <button
            className={this.getBtnClass('department')}
            id="department"
            onClick={this.onClick}
          >
            Department
          </button>
        </div>
        <div className="tab-content">
          {this.getContent()}
        </div>
      </div>
    );
  }
}

export default Tabs;
