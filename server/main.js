
var NexmatixReader = require('./nexmatix_reader')
var PORT = 3001;
var io = require('socket.io').listen(PORT);

io.on('connection', function(socket) {
  var address = socket.handshake.address;
  console.log('New connection from ' + address.address + ':' + address.port);
});

var dataReader = new NexmatixReader();
// Split out DDS args
var ddsArgs = process.argv.slice(process.argv.indexOf(__filename) + 1);
dataReader.initializeDds(ddsArgs);

dataReader.subscribe(function (sample) {
  console.log("sample received");
  io.emit('valve', sample);
});