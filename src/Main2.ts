///<reference path="../typings/tsd.d.ts" />

module app {
    "use strict";

    export class Main2 {
        private renderer:THREE.WebGLRenderer;
        private scene:THREE.Scene;
        private camera:THREE.PerspectiveCamera;
        private systems: THREE.PointCloud[];

        private context: AudioContext;
        private sourceNode: AudioBufferSourceNode;
        private analyser: AnalyserNode;
        private analyser2: AnalyserNode;
        private c = 0;

        private rotSpeed = 0.005;

        constructor() {
            this.initTHREE();
            this.initScene();
            this.render();
        }

        private initTHREE():void {
            this.systems = [];

            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.scene.add(this.camera);
            this.renderer = new THREE.WebGLRenderer({antialias: true});
            this.renderer.setClearColor(0x000000, 1.0);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMapEnabled = true;
            document.getElementById("container").appendChild(this.renderer.domElement);
        }

        private initScene():void {
            // position and point the camera to the center of the scene
            this.camera.position.x = 20;
            this.camera.position.y = 34;
            this.camera.position.z = 40;
            this.camera.lookAt(new THREE.Vector3(-50,0,10));

            // call the render function, after the first render, interval is determined
            // by requestAnimationFrame
            this.setupSound();

            this.loadSound("../assets/audio/imperial_march.ogg");
        }

        public render():void {
            requestAnimationFrame(() => this.render());

            this.c++;
            if (this.c % 2 == 0 ) this.updateWaves();

            this.renderer.render(this.scene, this.camera);
        }

        private updateWaves(): void {
            // get the average for the first channel
            var array = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteTimeDomainData(array);

            // setup the material
            var pm = new THREE.PointCloudMaterial();
            pm.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/particle.png");
            pm.blending= THREE.AdditiveBlending;
            pm.transparent = true;
            pm.opacity = 0.2;
            pm.size=1.5;

            // create an empty geometry
            var geom = new THREE.Geometry();

            // add the vertices to the geometry based on the wavefrom
            for (var i = 0; i < array.length ; i++) {
                var v = new THREE.Vector3(1,array[i]/8,(i/15));
                geom.vertices.push(v);
            }

            // create a new particle system
            var ps = new THREE.PointCloud(geom, pm);
            ps.sortParticles = true;

            // move the existing particle systems back
            this.systems.forEach(function(e) {e.position.x-=1.5});

            // and remove the oldest particle system
            if (this.systems.length === 40) {
                var oldPs = this.systems.shift();
                if (oldPs) {
                    this.scene.remove(oldPs);
                }
            }

            // add the new to the systems array and the scene
            this.systems.push(ps);
            this.scene.add(ps);
        }

        private setupSound():void {
            if (! AudioContext) {
                if (! webkitAudioContext) {
                    alert("no audiocontext found");
                }
               AudioContext = webkitAudioContext;
            }
            this.context = new AudioContext();

            // setup a analyzer
            this.analyser = this.context.createAnalyser();
            this.analyser.smoothingTimeConstant = 0.4;
            this.analyser.fftSize = 1024;

            this.analyser2 = this.context.createAnalyser();
            this.analyser2.smoothingTimeConstant = 0.4;
            this.analyser2.fftSize = 1024;

            // create a buffer source node
            this.sourceNode = this.context.createBufferSource();

            var splitter = this.context.createChannelSplitter();

            // connect the source to the analyser and the splitter
            this.sourceNode.connect(splitter);

            // connect one of the outputs from the splitter to
            // the analyser
            splitter.connect(this.analyser, 0);
            splitter.connect(this.analyser2, 1);

            // and connect to destination
            this.sourceNode.connect(this.context.destination);

            this.context = new AudioContext();
        }

        private getAverageVolume(array: Uint8Array):number {
            var values = 0;
            var average: number;

            var length = array.length;

            // get all the frequency amplitudes
            for (var i = 0; i < length; i++) {
                values += array[i];
            }

            average = values / length;
            return average;
        }

        private playSound(buffer: any):void {
            this.sourceNode.buffer = buffer;
            this.sourceNode.start(0);
        }

        // load the specified sound
        private loadSound(url: string):void {
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";

            // When loaded decode the data
            request.onload = () => {
                // decode the data
                this.context.decodeAudioData(request.response, (buffer: any) => {
                    // when the audio is decoded play the sound
                    this.playSound(buffer);
                }, this.onError);
            };
            request.send();
        }

        private onError(e: Event):void {
            console.log(e);
        }

    }
}
