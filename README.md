# iiot-demo-opendds


### Install and Run Steps
0. Prerequisites

- Node.js version 6.x (LTS version at this time) is required.

- The V8 Javascript Engine header file (v8.h) is required.  On Debian-based
Linux systems install the package libv8-dev.  Other Linux distros may use
different package names.  On Windows, Node.js's node-gyp module includes v8.h
so a separate install is not needed.

1. Build OpenDDS

Linux:
```bash
  $ git clone -b latest-release https://github.com/objectcomputing/OpenDDS.git
  $ cd OpenDDS
  $ ./configure --no-tests --macros=CCFLAGS+=-std=c++11
  $ make
  $ cd ..
```
Windows:
```batch
  > git clone -b latest-release https://github.com/objectcomputing/OpenDDS.git
  > cd OpenDDS
  > configure --no-tests
  > msbuild DDS_TAOv2.sln /p:Platform=x64;Configuration=Release
  > :: Use Platform=Win32 if Node.js is 32-bit and Platform=x64 if Node.js is 64-bit
  > cd ..
```

2. Build shared library and publishing application

Linux:
```bash
  $ source OpenDDS/setenv.sh
  $ export V8_ROOT=/usr # assuming /usr/include/v8.h exists
  $ export NAN_ROOT=`pwd`/node_modules/nan
  $ npm install
  $ mwc.pl -type gnuace -exclude OpenDDS
  $ make
```
Windows: (adjust versions of Node.js and Visual Studio as necessary)
```batch
  > set V8_ROOT=%USERPROFILE%\.node-gyp\6.12.3
  > set NAN_ROOT=%CD%\node_modules\nan
  > npm install
  > mwc.pl -type vc14 -exclude OpenDDS
  > msbuild iiot_demo_opendds.sln /p:Platform=x64;Configuration=Release
```

3. Run the node server which acts as a DDS subscriber
(Environment from step 2 must still be set)

Linux:
```bash
  $ cd server
  $ npm install
  $ node main.js -DCPSConfigFile ../rtps_disc.ini
```
Windows:
```batch
  > cd server

 if the Release configuration was built:
  > npm install opendds --lib_suffix=

 if the Debug configuration was built:
  > npm install opendds --debug --lib_suffix=d

  > npm install
  > node main.js -DCPSConfigFile ../rtps_disc.ini
```

4. Run the publisher
(Environment from step 2 must still be set)

Linux:
```bash
  $ bin/NexmatixMockPublisher -DCPSConfigFile rtps_disc.ini
```
Windows:
```batch
  > bin\NexmatixMockPublisher -DCPSConfigFile rtps_disc.ini
```

5. Run the webapp

Edit public/config.json to have the correct URL for your server
 ```bash
  $ npm run build-css
  $ npm start
```
The web server is running on port 3000
