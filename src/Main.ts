///<reference path="../typings/tsd.d.ts" />

module app {
    "use strict";

    export class Main {
        private renderer:THREE.WebGLRenderer;
        private scene:THREE.Scene;
        private camera:THREE.PerspectiveCamera;

        private cube:THREE.Mesh;

        constructor() {
            this.initTHREE();
            this.initScene();
            this.render();
        }

        private initTHREE():void {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.scene.add(this.camera);
            this.renderer = new THREE.WebGLRenderer({antialias: true});
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            document.getElementById("container").appendChild(this.renderer.domElement);
        }

        private initScene():void {
            var geometry = new THREE.BoxGeometry(1, 1, 1);
            var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
            this.cube = new THREE.Mesh(geometry, material);
            this.scene.add(this.cube);

            this.camera.position.z = 5;
        }

        public render():void {
            requestAnimationFrame(() => this.render());

            this.cube.rotation.x += 0.1;
            this.cube.rotation.y += 0.1;

            this.renderer.render(this.scene, this.camera);
        }
    }
}
