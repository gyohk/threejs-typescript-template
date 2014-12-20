///<reference path="../typings/tsd.d.ts" />


module app {
    "use strict";

    export class TextureModelMain {
        private renderer:THREE.WebGLRenderer;
        private scene:THREE.Scene;
        private camera:THREE.PerspectiveCamera;

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
            var planeGeometry = new THREE.PlaneGeometry(20, 20);
            var planeMaterial = new THREE.MeshLambertMaterial({color: 0xcccccc});
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.receiveShadow = true;

            // rotate and position the plane
            plane.rotation.x = -0.5 * Math.PI;
            plane.position.x = 0;
            plane.position.y = -2;
            plane.position.z = 0;

            // add the plane to the scene
            this.scene.add(plane);

            // position and point the camera to the center of the scene
            this.camera.position.x = 3;
            this.camera.position.y = 3;
            this.camera.position.z = 3;
            this.camera.lookAt(this.scene.position);

            // add spotlight for the shadows
            var spotLight = new THREE.DirectionalLight(0xffffff);
            spotLight.position.set(50, 50, 50);
            spotLight.castShadow = true;
            spotLight.intensity = 2;
            this.scene.add(spotLight);

            var ambiLight = new THREE.AmbientLight(0x333333);
            this.scene.add(ambiLight);
            this.loadModel();
        }

        public render():void {
            // update the camera
            var rotSpeed: number = 0.01;
            this.camera.position.x = this.camera.position.x * Math.cos(rotSpeed) + this.camera.position.z * Math.sin(rotSpeed);
            this.camera.position.z = this.camera.position.z * Math.cos(rotSpeed) - this.camera.position.x * Math.sin(rotSpeed);
            this.camera.lookAt(this.scene.position);

            // and render the scene
            this.renderer.render(this.scene, this.camera);

            requestAnimationFrame(() => this.render());
        }

        private loadModel():void {
            var loader = new THREE.JSONLoader();
            loader.load("./assets/models/exported/monkey-mat.js",
                (model, material) => {
                    var mesh = new THREE.Mesh(model, material[0]);
                    //mesh.scale = new THREE.Vector3(3,3,3);
                    this.scene.add(mesh);
                },
                "./assets/textures/"
            );
        }

        /**
         * Function handles the resize event. This make sure the camera and the renderer
         * are updated at the correct moment.
         */
        public handleResize():void {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }

    }
}


