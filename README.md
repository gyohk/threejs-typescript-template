threejs-typescript-template
===========================
[![Build Status](https://travis-ci.org/gyohk/threejs-typescript-template.png?branch=master)](https://travis-ci.org/gyohk/threejs-typescript-template)

Project template for coding your program with three.js in TypeScript.

## prerequisite
* [node.js](http://nodejs.org/)
* [grunt-cli](https://github.com/gruntjs/grunt-cli)

## usage
### STEP 1
execute the following command.
```
npm install
grunt setup
grunt
```
### STEP 2
Open dest/index.html In your browser that supports WebGL.

(You must use a local server.)

If you have installed Chrome on your PC, you can also use the following command.
```
grunt connect
```

#### tsd usage
```
tsd query <module name> --action install --resolve --save --config conf/tsd.json
```
