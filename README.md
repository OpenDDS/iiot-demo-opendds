# iiot-demo-opendds


### Build Steps
0. Prerequisites
The V8 Javascript engine header file (v8.h) is required.  On Debian-based Linux
systems install the package libv8-dev.  On other systems see the
[V8 website](https://github.com/v8/v8/wiki) and set V8_ROOT in step 2 below.

1. Build OpenDDS
```bash
  $ git clone https://github.com/objectcomputing/OpenDDS.git
  $ cd OpenDDS
  $ ./configure --no-tests
  $ make
  $ cd ..
```

2. Build shared library and publishing application (Currently, only works on Linux)
```bash
  $ source OpenDDS/setenv.sh
  $ export V8_ROOT=/usr # assuming /usr/include/v8.h exists
  $ export NAN_ROOT=`pwd`/node_modules/nan
  $ npm install
  $ mwc.pl -type gnuace -exclude OpenDDS
  $ make
```

3. Run the node server which acts as a DDS subscriber
(Environment from step 2 must still be set)
```bash
  $ cd server
  $ npm install
  $ node main.js -DCPSConfigFile ../rtps_disc.ini
```

4. Run the publisher
(Environment from step 2 must still be set)
```bash
  $ publisher/NexmatixPublisher -DCPSConfigFile rtps_disc.ini
```

3. Run the webapp
 ```bash
  $ npm run build-css
  $ npm start
```
