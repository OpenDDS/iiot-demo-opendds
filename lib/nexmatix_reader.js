var opendds = require('opendds');


function ValveDataReader() {
  this.valveReader = null;
  this.factory = null;
  this.library = null;
}

// Topics is "Valve"
// Symbols uses transient-local durability, otherwise QoS is default
ValveDataReader.prototype.subscribe = function(data_handler) {
  var qos = {
    DataReaderQos: { durability: "TRANSIENT_LOCAL_DURABILITY_QOS" }
  };
  try {
    this.valveReader =
        this.participant.subscribe(
            'Valve',
            'Nexmatix::ValveData',
            qos,
            reader_handler);

  } catch (e) {
    console.log(e);
  }
};


ValveDataReader.prototype.finalizeDds = function(argsArray) {
  if (this.factory) {
    console.log("finalizing DDS connection");
    if (this.participant) {
      this.factory.delete_participant(this.participant);
      delete this.participant
    }
    opendds.finalize(this.factory);
    delete this.factory;
  }
};

ValveDataReader.prototype.initializeDds = function(argsArray) {
  var DOMAIN_ID = 23;
  this.factory = opendds.initialize.apply(null, argsArray);
  this.library = opendds.load('lib/Nexmatix');
  if (!this.library) {
    throw new Error("Could not open type support library");
  }
  this.participant = this.factory.create_participant(DOMAIN_ID);
  // Handle exit gracefully
  var self = this;
  process.on('SIGINT', function() {
    self.finalizeDds();
    process.exit(0);
  });
  process.on('SIGTERM', function() {
    self.finalizeDds();
    process.exit(0);
  });
  process.on('exit', function() {
    self.finalizeDds();
  });
};


module.exports = ValveDataReader;
