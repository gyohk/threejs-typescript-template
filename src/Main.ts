///<reference path="../typings/tsd.d.ts" />

module app {
    "use strict";

    export class Main {
        private container: HTMLElement;
        private stats: Stats;
        private camera: THREE.PerspectiveCamera;
        private scene: THREE.Scene;
        private renderer: THREE.WebGLRenderer;
        private particles: THREE.PointCloud;
        private geometry: THREE.Geometry;
        private materials: THREE.PointCloudMaterial[];
        private parameters: any;
        private h: number;
        private color: number[];
        private sprite: THREE.Texture;
        private size: number;
        private mouseX: number;
        private mouseY: number;

        private windowHalfX: number;
        private windowHalfY: number;

        private sprite1: THREE.Texture;
        private sprite2: THREE.Texture;
        private sprite3: THREE.Texture;
        private sprite4: THREE.Texture;
        private sprite5: THREE.Texture;

        constructor() {
            if (!Detector.webgl) {
                Detector.addGetWebGLMessage();
            }

            this.materials = [];
            this.mouseX = 0;
            this.mouseY = 0;

            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;

            this.init();
            this.animate();

        }

        private onWindowResize = ():void => {
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;

            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(window.innerWidth, window.innerHeight);

        };

        private onDocumentMouseMove = (event: MouseEvent):void => {
            this.mouseX = event.clientX - this.windowHalfX;
            this.mouseY = event.clientY - this.windowHalfY;
        };

        private onDocumentTouchStart = (event: TouchEvent):void => {
            if (event.touches.length === 1) {

                event.preventDefault();

                this.mouseX = event.touches.item(0).pageX - this.windowHalfX;
                this.mouseY = event.touches.item(0).pageY - this.windowHalfY;
            }
        };

        private onDocumentTouchMove = (event: TouchEvent):void => {
            if (event.touches.length === 1) {
                event.preventDefault();

                this.mouseX = event.touches.item(0).pageX - this.windowHalfX;
                this.mouseY = event.touches.item(0).pageY - this.windowHalfY;
            }
        };

        private init():void {
            this.container = document.createElement('div');
            document.body.appendChild(this.container);

            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
            this.camera.position.z = 1000;

            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2(0x000000, 0.0008);
            this.geometry = new THREE.Geometry();

            this.sprite1 = THREE.ImageUtils.loadTexture("textures/sprites/snowflake1.png");
            this.sprite2 = THREE.ImageUtils.loadTexture("textures/sprites/snowflake2.png");
            this.sprite3 = THREE.ImageUtils.loadTexture("textures/sprites/snowflake3.png");
            this.sprite4 = THREE.ImageUtils.loadTexture("textures/sprites/snowflake4.png");
            this.sprite5 = THREE.ImageUtils.loadTexture("textures/sprites/snowflake5.png");

            for (var i = 0; i < 10000; i++) {
                var vertex = new THREE.Vector3();
                vertex.x = Math.random() * 2000 - 1000;
                vertex.y = Math.random() * 2000 - 1000;
                vertex.z = Math.random() * 2000 - 1000;

                this.geometry.vertices.push(vertex);
            }

            this.parameters = [
                [[1.0, 0.2, 0.5], this.sprite2, 20],
                [[0.95, 0.1, 0.5], this.sprite3, 15],
                [[0.90, 0.05, 0.5], this.sprite1, 10],
                [[0.85, 0, 0.5], this.sprite5, 8],
                [[0.80, 0, 0.5], this.sprite4, 5],
            ];

            for (i = 0; i < this.parameters.length; i++) {
                this.color = this.parameters[i][0];
                this.sprite = this.parameters[i][1];
                this.size = this.parameters[i][2];

                this.materials[i] = new THREE.PointCloudMaterial({
                    size: this.size,
                    map: this.sprite,
                    blending: THREE.AdditiveBlending,
                    depthTest: false,
                    transparent: true
                });
                this.materials[i].color.setHSL(this.color[0], this.color[1], this.color[2]);

                this.particles = new THREE.PointCloud(this.geometry, this.materials[i]);

                this.particles.rotation.x = Math.random() * 6;
                this.particles.rotation.y = Math.random() * 6;
                this.particles.rotation.z = Math.random() * 6;

                this.scene.add(this.particles);

            }

            this.renderer = new THREE.WebGLRenderer({clearAlpha: 1});
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.container.appendChild(this.renderer.domElement);

            this.stats = new Stats();
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.top = '0px';
            this.container.appendChild(this.stats.domElement);

            document.addEventListener('mousemove', this.onDocumentMouseMove, false);
            document.addEventListener('touchstart', this.onDocumentTouchStart, false);
            document.addEventListener('touchmove', this.onDocumentTouchMove, false);

            //

            window.addEventListener('resize', this.onWindowResize, false);
        }
        //

        private animate():void {
            requestAnimationFrame(() => this.animate());

            this.render();
            this.stats.update();
        }

        private render():void {
            var time = Date.now() * 0.00005;

            this.camera.position.x += ( this.mouseX - this.camera.position.x ) * 0.05;
            this.camera.position.y += ( -this.mouseY - this.camera.position.y ) * 0.05;

            this.camera.lookAt(this.scene.position);

            for (var i = 0; i < this.scene.children.length; i++) {

                var object = this.scene.children[i];

                if (object instanceof THREE.PointCloud) {

                    object.rotation.y = time * ( i < 4 ? i + 1 : -( i + 1 ) );

                }

            }

            for (i = 0; i < this.materials.length; i++) {
                this.color = this.parameters[i][0];

                this.h = ( 360 * ( this.color[0] + time ) % 360 ) / 360;
                this.materials[i].color.setHSL(this.h, this.color[1], this.color[2]);

            }

            this.renderer.render(this.scene, this.camera);
        }
    }
}

