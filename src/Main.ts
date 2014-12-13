///<reference path="../typings/tsd.d.ts" />


module app {
    "use strict";

    export class Main {
        private scene: THREE.Scene;
        private camera: THREE.PerspectiveCamera;
        private renderer: THREE.WebGLRenderer;
        private stats: Stats;
        private material: THREE.MeshBasicMaterial;
        private texture: THREE.Texture;
        private container: THREE.Group;
        private lights: THREE.Mesh[];
        private content: THREE.Group;
        private front: THREE.Mesh;
        private ground: THREE.Mesh;
        private light: THREE.PointLight;
        private id: number;
        private radius: number;
        private angle: number;
        private degree: number;
        private depression: number;
        private radian: number;
        private center: THREE.Object3D;


        private resize = (event:Event):void => {
            this.camera.aspect = window.innerWidth/window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };

        private loaded = (data:THREE.Texture):void => {
            this.texture = data;
            this.initialize();
            this.render();
        };

        constructor() {
            if (!Detector.webgl) {
                Detector.addGetWebGLMessage();
            }

            this.id = 0;
            this.radius = 500;
            this.angle = 0;
            this.degree = 0;
            this.depression = 15;
            this.radian = Math.PI/180;
            this.center = new THREE.Object3D();

            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
            this.scene.add(this.camera);
            this.light = new THREE.PointLight(0xFFFFFF, 1, 200);
            this.scene.add(this.light);
            this.renderer = new THREE.WebGLRenderer({antialias: true});
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(this.renderer.domElement);

            this.setup();
            this.background();
            //initialize();
            THREE.ImageUtils.loadTexture("textures/light.png", undefined, this.loaded);

            this.stats = new Stats();
            this.stats.setMode(0);
            this.stats.domElement.style.position = "fixed";
            this.stats.domElement.style.right = "0px";
            this.stats.domElement.style.top = "0px";
            document.body.appendChild(this.stats.domElement);

            //render();
            window.addEventListener("resize", this.resize, false);
        }

        private setup():void {
            this.renderer.setClearColor(0x000000, 1);
            this.camera.position.z = -this.radius;
            this.light.position.set(0, -100, 0);
        }

        private background():void {
            var geometry = new THREE.PlaneGeometry(400, 400);
            var material = new THREE.MeshPhongMaterial({side: THREE.BackSide , color: 0xFFFFFF});
            material.emissive.set(0x333333);
            material.specular.set(0xFFFFFF);
            material.shininess = 16;
            this.ground = new THREE.Mesh(geometry, material);
            this.ground.rotation.x = 90*this.radian;
            this.ground.position.y = - 200;
            this.scene.add(this.ground);
        }

        private initialize():void {
            this.container = new THREE.Group();
            this.scene.add(this.container);

            this.material = new THREE.MeshBasicMaterial({map: this.texture, side: THREE.DoubleSide});
            this.material.transparent = true;
            this.material.depthTest = false;
            this.lights = [];
            for (var n = 0; n < 3; n++) {
                var offset = 64*n;
                var geometry = new THREE.CylinderGeometry(0, 256 - offset, offset, 60, 15, true);

                var light1 = new THREE.Mesh(geometry, this.material.clone());
                light1.rotation.y = 120*n*this.radian;
                light1.position.y = - offset/2;

                var light2 = new THREE.Mesh(geometry, this.material.clone());
                light2.rotation.y = 120*n*this.radian;
                light2.rotation.x = 180*this.radian;
                light2.position.y = offset/2;

                var light3 = new THREE.Mesh(geometry, this.material.clone());
                light3.rotation.y = 120*n*this.radian;
                light3.rotation.x = 90*this.radian;
                light3.position.z = - offset/2;

                this.container.add(light1);
                this.container.add(light2);
                this.container.add(light3);
                this.lights.push(light1);
                this.lights.push(light2);
                this.lights.push(light3);
            }
            this.overlay();
        }

        private overlay(): void {
        this.content = new THREE.Group();
            this.scene.add(this.content);

            var geometry = new THREE.CylinderGeometry(0, 256, 0, 60, 15, true);
            var _material = this.material.clone();
            _material.blending = THREE.AdditiveBlending;
            this.front = new THREE.Mesh(geometry, _material);
            this.content.add(this.front);
            this.front.rotation.x = 90*this.radian;
        }

        private render():void {
            requestAnimationFrame(()=>this.render());
            this.animate();
        }
        private animate():void {
            var alpha = Math.random()*0.4 + 0.6;
            var hue = this.id + 40;
            var rgb = this.convert(hue, 1, 1);
            var argb = this.convert(hue, 1, 0.3*alpha);

            var mat = <THREE.MeshPhongMaterial>(this.ground.material);
            mat.specular.set(rgb);
            mat.shininess = 16*alpha;
            mat.color.set(argb);

            this.container.rotation.x += 0.1*this.radian;
            this.container.rotation.y += 0.2*this.radian;
            this.container.rotation.z += 0.15*this.radian;
            for (var n = 0; n < this.lights.length; n++) {
                rgb = this.convert(this.id + 10*n, 1, 1);
                var light = this.lights[n];
                var lmat = <THREE.MeshBasicMaterial>light.material;
                light.rotation.y += 0.2*n*this.radian;
                lmat.opacity = alpha;
                lmat.color.set(rgb);
            }
            this.id = (this.id + 1)%360;

            this.angle -= 0.5;
            this.degree += 1;
            var dip = this.depression*Math.sin(this.degree*this.radian);
            this.camera.position.x = this.radius*Math.cos(this.angle*this.radian)*Math.cos(dip*this.radian);
            this.camera.position.y = this.radius*Math.sin(dip*this.radian);
            this.camera.position.z = this.radius*Math.sin(this.angle*this.radian)*Math.cos(dip*this.radian);
            this.camera.lookAt(this.center.position);

            this.front.rotation.y += 0.2*this.radian;
            this.front.material.opacity = 0.8*alpha;
            this.content.position.x = this.camera.position.x*0.08;
            this.content.position.y = this.camera.position.y*0.08;
            this.content.position.z = this.camera.position.z*0.08;
            this.content.lookAt(this.camera.position);

            this.renderer.render(this.scene, this.camera);

            this.stats.update();
        }

        private convert(h: number, s: number, v: number): number {
            var r: number, g: number, b: number, rgb: number;
            v = 0xFF*v;
            while (h < 0) {
                h += 360;
            }
            h %= 360;
            if (s === 0) {
                v = Math.round(v);
                rgb = v << 16 | v << 8 | v;

                return rgb;
            }
            var i = Math.floor(h/60)%6;
            var f = (h/60) - i;
            var p = v*(1 - s);
            var q = v*(1 - f*s);
            var t = v*(1 - (1 - f)*s);
            switch (i) {
                case 0 :
                    r = v;
                    g = t;
                    b = p;
                    break;
                case 1 :
                    r = q;
                    g = v;
                    b = p;
                    break;
                case 2 :
                    r = p;
                    g = v;
                    b = t;
                    break;
                case 3 :
                    r = p;
                    g = q;
                    b = v;
                    break;
                case 4 :
                    r = t;
                    g = p;
                    b = v;
                    break;
                case 5 :
                    r = v;
                    g = p;
                    b = q;
                    break;
            }
            rgb = r << 16 | g << 8 | b;
            return rgb;
        }
    }
}

