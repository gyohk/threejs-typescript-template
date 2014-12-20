///<reference path="../typings/tsd.d.ts" />

module app {
    "use strict";

    export class Main3 {
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

        private scale = chroma.scale(['orange','red','white']).domain([0,255]);
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
            this.renderer.setClearColor(0x080808, 1.0);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMapEnabled = true;
            document.getElementById("container").appendChild(this.renderer.domElement);
        }

        private initScene():void {
            this.pm = new THREE.ParticleBasicMaterial();
            this.pm.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/particle.png");
            this.pm.blending= THREE.AdditiveBlending;
            this.pm.transparent = true;
            this.pm.size=1.5;
            this.pm.vertexColors = true;
            //this.pm.color = new THREE.Color(0x00ff00);

            // create the ground plane
            var planeGeometry = new THREE.PlaneGeometry(20, 12);
            var planeMaterial = new THREE.MeshBasicMaterial({color: 0x444444});
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.receiveShadow = true;

            // rotate and position the plane
            plane.rotation.x = -0.5 * Math.PI;
            plane.position.x = 0;
            plane.position.y = -0.2;
            plane.position.z = 0;

            // add the plane to the scene
            this.scene.add(plane);

            // position and point the camera to the center of the scene
            this.camera.position.x = 15;
            this.camera.position.y = 8;
            this.camera.position.z = 15;
            this.camera.lookAt(this.scene.position);

            // add spotlight for the shadows
            var spotLight = new THREE.SpotLight(0xffffff);
            spotLight.position.set(10, 20, 20);
            spotLight.shadowCameraNear = 20;
            spotLight.shadowCameraFar = 50;
            spotLight.castShadow = true;

            this.scene.add(spotLight);

            this.setupParticleSystem(25,25);

            // call the render function, after the first render, interval is determined
            // by requestAnimationFrame
            this.setupSound();
            this.render();


            this.loadSound("../assets/audio/imperial_march.ogg");
        }

        public render():void {
            requestAnimationFrame(() => this.render());

            // update the camera
            this.camera.position.x = this.camera.position.x * Math.cos(this.rotSpeed) + this.camera.position.z * Math.sin(this.rotSpeed);
            this.camera.position.z = this.camera.position.z * Math.cos(this.rotSpeed) - this.camera.position.x * Math.sin(this.rotSpeed);
            this.camera.lookAt(this.scene.position);

            this.renderer.render(this.scene, this.camera);
        }

        private setupParticleSystem(widht: number, depth: number):void {
            var targetGeometry = new THREE.Geometry();

            for (var i = 0 ; i < widht ; i ++) {
                for (var j = 0 ; j < depth ; j ++) {
                    var v = new THREE.Vector3(i/2-(widht/2)/2, 0, j/2-(depth/2)/2);
                    targetGeometry.vertices.push(v);
                    targetGeometry.colors.push(new THREE.Color(Math.random() * 0xffffff));
                }
            }

            var ps = new THREE.PointCloud(targetGeometry,this.pm);
            ps.name = 'ps';
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

            // setup a javascript node
            this.javascriptNode = this.context.createScriptProcessor(4096, 1, 1);
            // connect to destination, else it isn't called
            this.javascriptNode.connect(this.context.destination);
            this.javascriptNode.onaudioprocess = () => {
                // get the average for the first channel
                var array =  new Uint8Array(this.analyser.frequencyBinCount);
                this.analyser.getByteFrequencyData(array);

                var ps = <THREE.PointCloud>this.scene.getObjectByName('ps');
                var geom = ps.geometry;

                for (var i = 0 ; i < array.length ; i++) {
                    if (geom.vertices[i]) {
                        geom.vertices[i].y=array[i]/40;
                        geom.colors[i] = new THREE.Color(this.scale(array[i]).hex());
                    }
                }

                ps.sortParticles=true;
                geom.verticesNeedUpdate = true;
            }

            // setup a analyzer
            this.analyser = this.context.createAnalyser();
            this.analyser.smoothingTimeConstant = 0.8;
            this.analyser.fftSize = 2048;

            // create a buffer source node
            this.sourceNode = this.context.createBufferSource();
            var splitter = this.context.createChannelSplitter();

            // connect the source to the analyser and the splitter
            this.sourceNode.connect(splitter);

            // connect one of the outputs from the splitter to
            // the analyser
            splitter.connect(this.analyser, 0);

            // connect the splitter to the javascriptnode
            // we use the javascript node to draw at a
            // specific interval.
            this.analyser.connect(this.javascriptNode);

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




