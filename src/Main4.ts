///<reference path="../typings/tsd.d.ts" />

module app {
    "use strict";

    export class Main4 {
        private renderer:THREE.WebGLRenderer;
        private scene:THREE.Scene;
        private camera:THREE.PerspectiveCamera;
        private systems: THREE.PointCloud[];

        private context: AudioContext;
        private sourceNode: AudioBufferSourceNode;
        private analyser: AnalyserNode;
        private analyser2: AnalyserNode;
        private javascriptNode: ScriptProcessorNode;

        private rotSpeed = 0.005;
        private particleWidth = 100;
        private spacing = 0.26;
        private centerParticle: number;

        private scale = chroma.scale(['white','blue','red']).domain([0,255]);
        private pm: THREE.ParticleBasicMaterial;

        constructor() {
            this.initTHREE();
            this.initScene();
            this.render();
        }

        private initTHREE():void {
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
            this.pm = new THREE.PointCloudMaterial();
            this.pm.map = THREE.ImageUtils.loadTexture("./assets/textures/particles/ball.png");
            this.pm.transparent = true;
            this.pm.opacity = 0.4;
            this.pm.size=0.9;
            this.pm.vertexColors = true;

            // position and point the camera to the center of the scene
            this.camera.position.x = 24;
            this.camera.position.y = 18;
            this.camera.position.z = 16;
            this.camera.lookAt(this.scene.position);

            this.setupParticleSystem(this.particleWidth, this.particleWidth);

            // call the render function, after the first render, interval is determined
            // by requestAnimationFrame
            this.setupSound();
            this.render();

            this.loadSound("./assets/audio/imperial_march.ogg");
        }

        public render():void {
            requestAnimationFrame(() => this.render());

            // update the camera
            this.camera.position.x = this.camera.position.x * Math.cos(this.rotSpeed) + this.camera.position.z * Math.sin(this.rotSpeed);
            this.camera.position.z = this.camera.position.z * Math.cos(this.rotSpeed) - this.camera.position.x * Math.sin(this.rotSpeed);
            this.camera.lookAt(this.scene.position);

            this.renderer.render(this.scene, this.camera);
        }

        private setupSound():void {
            if (! AudioContext) {
                if (! webkitAudioContext) {
                    alert('no audiocontext found');
                }
                AudioContext = webkitAudioContext;
            }
            this.context = new AudioContext();

            // setup a javascript node
            this.javascriptNode = this.context.createScriptProcessor(1024, 1, 1);
            // connect to destination, else it isn't called
            this.javascriptNode.connect(this.context.destination);
            this.javascriptNode.onaudioprocess = () => {
                // get the average for the first channel
                var array =  new Uint8Array(this.analyser.frequencyBinCount);
                this.analyser.getByteFrequencyData(array);

                var lowValue = this.getAverageVolume(array,0,300);
                var midValue = this.getAverageVolume(array,301,600);
                var highValue = this.getAverageVolume(array,601,1000);

                var ps = <THREE.PointCloud>this.scene.getObjectByName('ps');
                var geom = ps.geometry;


                var lowOffsets: number[] = []; var midOffsets: number[] = []; var highOffsets: number[] = [];
                var lowRings = 10; var midRings = 10; var highRings = 10;
                var midFrom = 12; var highFrom = 24;
                var lowVolumeDownScale = 35; var midVolumeDownScale = 35; var highVolumeDownScale = 35;

                // calculate the rings and offsets for the low sounds, rannge from
                // 0.5 to 0 pi
                for (var i = lowRings ; i > 0 ; i--) {
                    lowOffsets.push(Math.sin(Math.PI*(0.5*(i/lowRings))));
                }
                var lowParticles: number[][] = [];
                for (var i = 0 ; i < lowRings ; i++) {
                    lowParticles.push(this.getFallOffParticles(this.centerParticle,(i+1)*this.spacing,i*this.spacing));
                }

                // calculate the rings and offsets for the mid sounds
                // range from 0 to 0.5PI to 0
                for (var i = 0 ; i < midRings/2 ; i++) {
                    midOffsets.push( Math.sin(Math.PI*(0.5*(i/(midRings/2)))));
                }

                for (var i = midRings/2 ; i < midRings ; i++) {
                    midOffsets.push( Math.sin(Math.PI*(0.5*(i/(midRings/2)))));
                }

                var midParticles: number[][] = [];
                for (var i = 0 ; i < midRings ; i++) {
                    midParticles.push(this.getFallOffParticles(this.centerParticle,(i+1+midFrom)*this.spacing,(i+midFrom)*this.spacing));
                }

                // calculate the rings and offsets for the high sounds
                // range from 0 to 0.5PI to 0
                for (var i = 0 ; i < midRings/2 ; i++) {
                    highOffsets.push( Math.sin(Math.PI*(0.5*(i/(highRings/2)))));
                }

                for (var i = highRings/2 ; i < highRings ; i++) {
                    highOffsets.push( Math.sin(Math.PI*(0.5*(i/(highRings/2)))));
                }

                var highParticles: number[][] = [];
                for (var i = 0 ; i < highRings ; i++) {
                    highParticles.push(this.getFallOffParticles(this.centerParticle,(i+1+highFrom)*this.spacing,(i+highFrom)*this.spacing));
                }

                // render the center ring
                this.renderRing(geom,[this.centerParticle],lowValue,1,lowVolumeDownScale);
                // render the other rings for the lowvalue
                for (var i = 0 ; i < lowRings ; i++) {
                    this.renderRing(geom,lowParticles[i],lowValue,lowOffsets[i],lowVolumeDownScale);
                }

                // render the mid ring
                for (var i = 0 ; i < midRings ; i++) {
                    this.renderRing(geom,midParticles[i],midValue,midOffsets[i],midVolumeDownScale);
                }

                // render the high ring
                for (var i = 0 ; i < highRings ; i++) {
                    this.renderRing(geom,highParticles[i],highValue,highOffsets[i],highVolumeDownScale);
                }



                ps.sortParticles=true;
                geom.verticesNeedUpdate = true;

            }

            // setup a analyzer
            this.analyser = this.context.createAnalyser();
            this.analyser.smoothingTimeConstant = 0.1;
            this.analyser.fftSize = 2048;

            // create a buffer source node
            this.sourceNode = this.context.createBufferSource();
            var splitter = this.context.createChannelSplitter();

            // connect the source to the analyser and the splitter
            this.sourceNode.connect(splitter);

            // connect one of the outputs from the splitter to
            // the analyser
            splitter.connect(this.analyser,0,0);

            // connect the splitter to the javascriptnode
            // we use the javascript node to draw at a
            // specific interval.
            this.analyser.connect(this.javascriptNode);

            // and connect to destination
            this.sourceNode.connect(this.context.destination);

            this.context = new AudioContext();
        }

        private renderRing(geom: THREE.Geometry, particles: number[], value: number, distanceOffset: number, volumeDownScale: number): void {
            for (var i = 0; i < particles.length; i++) {
                if (geom.vertices[i]) {
                    geom.vertices[particles[i]].y=distanceOffset*value/volumeDownScale;
                    geom.colors[particles[i]] = new THREE.Color(this.scale(distanceOffset*value).hex());
                }
            }
        }

        private setupParticleSystem(widht: number, depth: number): void {
            var targetGeometry = new THREE.Geometry();

            for (var i = 0 ; i < widht ; i ++) {
                for (var j = 0 ; j < depth ; j ++) {
                    // position. First part determines spacing, second is offset
                    var v = new THREE.Vector3(this.spacing*(i)-this.spacing*(widht/2), 0, this.spacing*(j)-this.spacing*(depth/2));
                    targetGeometry.vertices.push(v);
                    targetGeometry.colors.push(new THREE.Color(0xffffff));
                }
            }

            var ps = new THREE.PointCloud(targetGeometry,this.pm);
            ps.name = 'ps';
            this.scene.add(ps);

            this.centerParticle = this.getCenterParticle();
        }


        private getCenterParticle() {
            var center = Math.ceil(this.particleWidth /2);
            var centerParticle = center+(center*this.particleWidth);

            return centerParticle;
        }

        private getFallOffParticles(center: number, radiusStart: number, radiusEnd: number): number[] {
            var result: number[] = [];
            var ps = <THREE.PointCloud>this.scene.getObjectByName('ps');
            var geom = ps.geometry;
            var centerParticle = geom.vertices[center];

            var dStart = Math.sqrt(radiusStart*radiusStart + radiusStart*radiusStart);
            var dEnd = Math.sqrt(radiusEnd*radiusEnd + radiusEnd*radiusEnd);

            for (var i = 0 ; i < geom.vertices.length ; i++) {
                var point = geom.vertices[i];

                var xDistance = Math.abs(centerParticle.x - point.x);
                var zDistance = Math.abs(centerParticle.z - point.z);

                var dParticle = Math.sqrt(xDistance*xDistance + zDistance*zDistance);
                if (dParticle < dStart && dParticle >= dEnd && i!=center) result.push(i);
            }

            return result;
        }

        private getAverageVolume(array: Uint8Array, start: number, end: number): number {
            var values = 0;
            var average: number;

            var length = end-start;
            for (var i = start; i < end; i++) {
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

