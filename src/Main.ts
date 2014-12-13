///<reference path="../typings/tsd.d.ts" />

declare module THREE {
    var FXAAShader:any;
    var BloomPass:any;
}

module app {
    "use strict";

    export class Main {
        private effectFXAA: any;

        private mouseX: number;
        private mouseY: number;
        private windowHalfX: number;
        private windowHalfY: number;
        private camera:THREE.PerspectiveCamera;
        private scene:THREE.Scene;
        private renderer:THREE.WebGLRenderer;
        private material:THREE.LineBasicMaterial;
        private composer:THREE.EffectComposer;

        private POINTS: number;
        private SPREAD: number;
        private SUBDIVISIONS: number;
        private VISIBLE_POINTS: number;
        private SPEED: number;
        private BRUSHES: number;
        private DIZZY: boolean;

        private curve:THREE.QuadraticBezierCurve3;
        private chain:Chain;
        private geometry:THREE.Geometry;
        private points:THREE.Vector3[];
        private midpoint:THREE.Vector3;
        private midpoints:THREE.Vector3[];
        private chains:Chain[];
        private brushes:Brush[];
        private colors:THREE.Color[];
        // private hueOffset:number;
        private stats:Stats;

        private t: number;
        private u: number;
        private v:THREE.Vector3[];
        private tmp: THREE.Vector3;
        private lookAt: THREE.Vector3;

        constructor() {
            if (!Detector.webgl) {
                Detector.addGetWebGLMessage();
            }

            this.mouseX = 0;
            this.mouseY = 0;
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;

            this.POINTS = 100;
            this.SPREAD = 400;
            this.SUBDIVISIONS = 20;
            this.VISIBLE_POINTS = 7 * this.SUBDIVISIONS;
            this.SPEED = 1.4;
            this.BRUSHES = 5;
            this.DIZZY = false;

            this.points = [];
            this.midpoints = [];
            this.chains = [];
            this.brushes = [];
            this.colors = [];

            this.t = 0;
            this.v = [];
            this.tmp = new THREE.Vector3();
            this.lookAt = new THREE.Vector3();
            this.dizzy;

            this.init();
            this.animate();

        }

        private addWayPoint(x:number, y:number, z:number, randomRadius:number) {
            var p = new THREE.Vector3(x, y, z);

            // add new points to chains
            for (var j = this.BRUSHES; j--;) {
                this.chain = this.chains[j];
                p = p.clone();

                p.y += (Math.random() - 0.5) * randomRadius;

                if (this.DIZZY) {
                    p.x += (Math.random() - 0.5) * randomRadius;
                    p.z += (Math.random() - 0.5) * randomRadius;
                }
                this.chain.points.push(p);

                // chain.widths.push(randomRadius / 10);

                this.points = this.chain.points;
                this.midpoint = p.clone();

                var l = this.points.length;

                if (l === 1) {
                    this.midpoint.add(p);
                } else {
                    this.midpoint.add(this.points[l - 2]);
                }

                this.midpoint.multiplyScalar(0.5);

                this.chain.midpoints.push(this.midpoint);

            }
        }

        private restart() {
            // setup
            this.chains = [];
            for (var j = this.BRUSHES; j--;) {
                this.chains.push(new Chain());
            }

            for (var i = 0; i < this.POINTS; i++) {
                var randomRadius = 10.20 + Math.random() * 40;
                this.addWayPoint(this.SPREAD * (Math.random() - 0.5),
                    this.SPREAD * (Math.random() - 0.5),
                    this.SPREAD * (Math.random() - 0.5),
                    randomRadius);

            }

            if (this.brushes.length) {
                for (var b = this.BRUSHES; b--;) {
                    var brush = this.brushes[b];

                    var lpoints:THREE.Vector3[] = [];

                    for (i = 0; i < this.POINTS - 1; i++) {
                        this.chain = this.chains[b];
                        this.curve = this.chain.curve;
                        this.midpoints = this.chain.midpoints;
                        this.points = this.chain.points;

                        this.curve.v0 = this.midpoints[i];
                        this.curve.v1 = this.points[i];
                        this.curve.v2 = this.midpoints[i + 1];

                        for (j = 0; j < this.SUBDIVISIONS; j++) {
                            lpoints.push(this.curve.getPoint(j / this.SUBDIVISIONS));
                        }
                    }
                    brush.points = lpoints;
                }
            }
            this.t = 0;
        }

        private dizzy() {
            this.DIZZY = true;
            this.camera.setLens(16);
            this.SPEED = 0.5;

            this.restart();

            return false;
        }

        private init() {
            this.restart();

            var i:number, container:HTMLElement;

            container = document.createElement('div');
            document.body.appendChild(container);

            this.camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 1, 10000);
            this.camera.position.z = 700;

            this.scene = new THREE.Scene();

            this.renderer = new THREE.WebGLRenderer({antialias: false, alpha: false});
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.autoClear = false;

            container.appendChild(this.renderer.domElement);

            this.material = new THREE.LineBasicMaterial({
                color: 0xffffff,
                opacity: 1,
                linewidth: 5,
                vertexColors: THREE.VertexColors
            });
            var line:THREE.Line;

            // line.type = THREE.LinePieces;
            // line.scale.x = line.scale.y = line.scale.z = 1;

            for (var b = this.BRUSHES; b--;) {
                var brush = new Brush();
                this.brushes.push(brush);

                var lpoints = brush.points;

                for (i = 0; i < this.POINTS - 1; i++) {
                    this.chain = this.chains[b];
                    this.curve = this.chain.curve;
                    this.midpoints = this.chain.midpoints;
                    this.points = this.chain.points;

                    this.curve.v0 = this.midpoints[i];
                    this.curve.v1 = this.points[i];
                    this.curve.v2 = this.midpoints[i + 1];

                    for (var j = 0; j < this.SUBDIVISIONS; j++) {
                        lpoints.push(this.curve.getPoint(j / this.SUBDIVISIONS));
                    }
                }
            }

            for (b = this.BRUSHES; b--;) {
                brush = this.brushes[b];

                this.geometry = brush.geometry;
                line = new THREE.Line(this.geometry, this.material);
                this.scene.add(line);

                this.colors = this.geometry.colors;

                for (i = 0; i < this.VISIBLE_POINTS; i++) {
                    this.geometry.vertices.push(new THREE.Vector3());
                    this.colors[i] = new THREE.Color(0xffffff);
                }
            }

            this.stats = new Stats();
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.top = '0px';
            container.appendChild(this.stats.domElement);
            //
            document.addEventListener('mousedown', () => this.restart, false);
            document.addEventListener('mousemove', () => this.onDocumentMouseMove, false);
            document.addEventListener('touchstart', () => this.onDocumentTouchStart, false);
            document.addEventListener('touchmove', () => this.onDocumentTouchMove, false);
            //
            var renderModel = new THREE.RenderPass(this.scene, this.camera);
            var effectBloom = new THREE.BloomPass(1.3 + 1);
            var effectCopy = new THREE.ShaderPass(THREE.CopyShader);

            this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);

            var width = window.innerWidth || 2;
            var height = window.innerHeight || 2;

            this.effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);

            effectCopy.renderToScreen = true;

            this.composer = new THREE.EffectComposer(this.renderer);

            this.composer.addPass(renderModel);
            this.composer.addPass(this.effectFXAA);
            this.composer.addPass(effectBloom);
            this.composer.addPass(effectCopy);
            //

            window.addEventListener('resize', this.onWindowResize, false);
        }

        private onWindowResize() {
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;

            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(window.innerWidth, window.innerHeight);

            this.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);

            this.composer.reset();

        }

        //
        private onDocumentMouseMove(event:MouseEvent) {
            this.mouseX = event.clientX - this.windowHalfX;
            this.mouseY = event.clientY - this.windowHalfY;
        }

        private onDocumentTouchStart(event:TouchEvent) {
            if (event.touches.length > 1) {
                event.preventDefault();

                this.mouseX = event.touches.item(0).pageX - this.windowHalfX;
                this.mouseY = event.touches.item(0).pageY - this.windowHalfY;

            }

        }

        private onDocumentTouchMove(event:TouchEvent) {
            if (event.touches.length === 1) {
                event.preventDefault();

                this.mouseX = event.touches.item(0).pageX - this.windowHalfX;
                this.mouseY = event.touches.item(0).pageY - this.windowHalfY;
            }
        }

        //

        private animate() {
            requestAnimationFrame(() => this.animate());
            this.render();

            this.stats.update();

        }

        private render() {
            this.t += this.SPEED;
            this.u = this.t | 0;

            for (var j = this.BRUSHES; j--;) {
                var brush = this.brushes[j];

                this.geometry = brush.geometry;
                var lpoints = brush.points;

                for (var i = 0; i < this.VISIBLE_POINTS; i++) {
                    var v = (i + this.u) % lpoints.length;
                    this.geometry.vertices[i].copy(lpoints[v]);

                    var d = i / this.VISIBLE_POINTS;
                    d = 1 - (1 - d) * (1 - d);
                    this.geometry.colors[i].setHSL(brush.hueOffset + (v / lpoints.length * 4) % 1, 0.7, 0.2 + d * 0.4);
                }

                this.geometry.verticesNeedUpdate = true;
                this.geometry.colorsNeedUpdate = true;
            }

            if (!this.DIZZY) {
                var targetAngle = this.mouseX / this.windowHalfX * Math.PI;
                var targetX = Math.cos(targetAngle) * 500;
                var targetZ = Math.sin(targetAngle) * 300;

                this.camera.position.x += ( targetX - this.camera.position.x ) * .04;
                this.camera.position.y += ( -this.mouseY + 200 - this.camera.position.y ) * .05;
                this.camera.position.z += ( targetZ - this.camera.position.z ) * .04;
                this.camera.lookAt(this.scene.position);

            } else {
                this.v = this.geometry.vertices;
                this.tmp.copy(this.v[this.v.length * 0.4 | 0]);
                this.tmp.y += 50;
                // camera.position.copy(tmp);
                this.camera.position.x += ( this.tmp.x - this.camera.position.x ) * .04;
                this.camera.position.y += ( this.tmp.y - this.camera.position.y ) * .05;
                this.camera.position.z += ( this.tmp.z - this.camera.position.z ) * .04;

                this.tmp.copy(this.lookAt);
                this.lookAt.subVectors(this.v[this.v.length - 2], this.lookAt).multiplyScalar(0.5);
                this.lookAt.add(this.tmp);

                this.camera.lookAt(this.lookAt);
            }

            // var time = Date.now() * 0.0005;

            this.renderer.clear();
            this.composer.render();
        }
    }

    export class Chain {
        public points:THREE.Vector3[];
        public midpoints:THREE.Vector3[];
        public curve: THREE.QuadraticBezierCurve3;

        constructor() {
            this.points = [];
            this.midpoints = [];
            this.curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
        }

    }

    export class Brush {
        public geometry: THREE.Geometry;
        public points:THREE.Vector3[];
        public colors:THREE.Color[];
        public hueOffset: number;

        constructor() {
            this.geometry = new THREE.Geometry();
            this.points = [];
            this.colors = [];
            this.hueOffset = (Math.random() - 0.5) * 0.1;
        }
    }
}
