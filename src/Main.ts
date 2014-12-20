///<reference path="../typings/tsd.d.ts" />

module app {
    "use strict";

    export class Main {
        private renderer:THREE.WebGLRenderer;
        private scene:THREE.Scene;
        private camera:THREE.PerspectiveCamera;

        private context: AudioContext;
        private sourceNode: AudioBufferSourceNode;
        private analyser: AnalyserNode;
        private analyser2: AnalyserNode;

        private rotSpeed = 0.005;

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
            // create the ground plane
            var planeGeometry = new THREE.PlaneGeometry(80, 80);
            var planeMaterial = new THREE.MeshPhongMaterial({color: 0x3333ff});
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.receiveShadow = true;

            // rotate and position the plane
            plane.rotation.x = -0.5 * Math.PI;
            plane.position.x = 0;
            plane.position.y = -2;
            plane.position.z = 0;

            // add the plane to the scene
            this.scene.add(plane);

            // create a cube
            var cubeGeometry = new THREE.BoxGeometry(3, 6, 3, 15, 25, 15);

            var pm = new THREE.ParticleBasicMaterial();
            pm.map = THREE.ImageUtils.loadTexture("./assets/textures/particles/particle.png");
            pm.blending= THREE.AdditiveBlending;
            pm.transparent = true;
            pm.size=1.0;
            var ps = new THREE.PointCloud(cubeGeometry, pm);
            ps.sortParticles = true;
            ps.name="cube";
            ps.position.x=1.75;
            this.scene.add(ps);

            var pm2 = pm.clone();
            pm2.map = THREE.ImageUtils.loadTexture("./assets/textures/particles/particle2.png");
            var ps2 = new THREE.PointCloud(cubeGeometry, pm2);
            ps2.name = "cube2";
            ps2.position.x=-1.75;
            this.scene.add(ps2);

            // position and point the camera to the center of the scene
            this.camera.position.x = 10;
            this.camera.position.y = 14;
            this.camera.position.z = 10;
            this.camera.lookAt(this.scene.position);

            // add spotlight for the shadows
            var spotLight = new THREE.SpotLight(0xffffff);
            spotLight.position.set(10, 20, 20);
            spotLight.shadowCameraNear = 20;
            spotLight.shadowCameraFar = 50;
            spotLight.castShadow = true;

            this.scene.add(spotLight);

            // call the render function, after the first render, interval is determined
            // by requestAnimationFrame
            this.setupSound();
            this.render();


            this.loadSound("./assets/audio/wagner-short.ogg");
        }

        public render():void {
            requestAnimationFrame(() => this.render());

            // update the camera
            this.camera.position.x = this.camera.position.x * Math.cos(this.rotSpeed) + this.camera.position.z * Math.sin(this.rotSpeed);
            this.camera.position.z = this.camera.position.z * Math.cos(this.rotSpeed) - this.camera.position.x * Math.sin(this.rotSpeed);
            this.camera.lookAt(this.scene.position);

            this.renderer.render(this.scene, this.camera);

            this.updateCubes();
        }


        private updateCubes():void {
            // get the average for the first channel
            var array =  new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(array);
            var average = this.getAverageVolume(array);

            // get the average for the second channel
            var array2 =  new Uint8Array(this.analyser2.frequencyBinCount);
            this.analyser2.getByteFrequencyData(array2);
            var average2 = this.getAverageVolume(array2);

            // clear the current state
            if (this.scene.getObjectByName("cube")) {
                var cube = <THREE.PointCloud>this.scene.getObjectByName("cube");
                var cube2 = <THREE.PointCloud>this.scene.getObjectByName("cube2");
                cube.scale.y=average/20;
                cube2.scale.y=average2/20;
            }
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
