# iiot-demo-opendds


### Build Steps
1. Build OpenDDS
```bash
  $ git clone https://github.com/objectcomputing/OpenDDS.git
  $ cd OpenDDS
  $ ./configure --no-tests
  $ make
  $ cd ..
```
2. Build nexmatix module (Currently, only works on Linux)
```bash
  $ source OpenDDS/setenv.sh
  $ npm install
  $ $ACE_ROOT/bin/mwc.pl -type gnuace .
  $ make
```
3. Run the node server which acts as a DDS subscriber
```bash
  $ cd server
  $ npm install
  $ node main.js -DCPSConfigFile ../rtps_disc.ini
```
4. Run the publisher
```bash
  $ publisher/NexmatixPublisher -DCPSConfigFile rtps_disc.ini
```

3. Run
 ```bash
  $ npm run build-css
  $ npm start
```