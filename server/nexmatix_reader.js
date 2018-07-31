var opendds = require('opendds'),
    parseArgs = require('minimist'),
    path = require('path');

function ValveDataReader() {
  this.valveReader = null;
  this.factory = null;
  this.library = null;
}

// Topics is "Valve"
// Symbols uses transient-local durability, otherwise QoS is default
ValveDataReader.prototype.subscribe = function(sample_received) {
  var qos = {
    DataReaderQos: { durability: "TRANSIENT_LOCAL_DURABILITY_QOS" }
  };
  try {
    this.valveReader =
        this.participant.subscribe(
            'Valve',
            'Nexmatix::ValveData',
            qos,
          function(dr, sInfo, sample) {
            if (sInfo.valid_data) {
              sample.source_timestamp = sInfo.source_timestamp;
              sample_received(sample);
            }
          }
      );

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
  this.library = opendds.load(path.join('..', 'lib', 'Nexmatix'));
  if (!this.library) {
    throw new Error("Could not open type support library");
  }
  var args = parseArgs(argsArray, {
    default: {g: "../security/governance_signed.p7s"},
    unknown: function(p) { return !/^-DCPS/.test(p); }
  });

  var ddsCerts = process.env.DDS_ROOT + "/tests/security/certs";
  this.participant = this.factory.create_participant(DOMAIN_ID, {
    property: { value: [

      {name: "dds.sec.auth.identity_ca", value: "file:" +
        ddsCerts + "/identity/identity_ca_cert.pem"},

      {name: "dds.sec.access.permissions_ca", value: "file:" +
        ddsCerts + "/permissions/permissions_ca_cert.pem"},

      {name: "dds.sec.access.governance", value: "file:" + args['g']},

      {name: "dds.sec.auth.identity_certificate", value: "file:" +
        ddsCerts + "/identity/test_participant_02_cert.pem"},

      {name: "dds.sec.auth.private_key", value: "file:" +
        ddsCerts + "/identity/test_participant_02_private_key.pem"},

      {name: "dds.sec.access.permissions", value: "file:" +
        "../security/permissions_2_signed.p7s"},

    ]}
  });
  // Handle exit gracefully
  var self = this;
  process.on('SIGINT', function() {
    console.log("OnSIGINT");
    self.finalizeDds();
    process.exit(0);
  });
  process.on('SIGTERM', function() {
    console.log("OnSIGTERM");
    self.finalizeDds();
    process.exit(0);
  });
  process.on('exit', function() {
    console.log("OnExit");
    self.finalizeDds();
  });
};


module.exports = ValveDataReader;
