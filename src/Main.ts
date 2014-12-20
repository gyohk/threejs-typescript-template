///<reference path="../typings/tsd.d.ts" />

module app {
    "use strict";

    export class Main {
        private renderer:THREE.WebGLRenderer;
        private scene:THREE.Scene;
        private camera:THREE.PerspectiveCamera;

        private material:THREE.ShaderMaterial;
        private geometry:THREE.Geometry;

        private vs_source: string;
        private fs_source: string;

        private baseTime: number;

        constructor() {
            this.baseTime = +new Date;
            this.loadShader();
        }

        private loadShader():void {
            // シェーダーの読み込み
            $.ajax({
                ddd: "abc",
                async: false,
                url: "./shader.vs",
                dataType: "text"
            }).done((data: string) => {
                this.vs_source = data;

                $.ajax({
                    async: false,
                    url: './shader.fs',
                    dataType: "text"
                }).done((data: string) => {
                     this.fs_source = data;
                     this.init();
                });
            });
        }

        private init():void {
            this.initTHREE();
            this.initScene();
            this.render();
        }

        private initTHREE():void {
            // レンダラの初期化
            this.renderer = new THREE.WebGLRenderer({antialias: true});
            this.renderer.setSize(500, 500);
            this.renderer.setClearColor(0x000000, 1);
            document.getElementById("container").appendChild(this.renderer.domElement);

            this.scene = new THREE.Scene();

            // カメラの作成
            this.camera = new THREE.PerspectiveCamera(70, 500 / 500);
            this.camera.position.set(0, 8, 12);
            this.camera.lookAt(new THREE.Vector3(-1, 0, 4));
            this.scene.add(this.camera);
        }

        private initScene():void {
            // (2) マテリアルの作成
            var texture = THREE.ImageUtils.loadTexture("images/particle.png");
            this.material = new THREE.ShaderMaterial({
                vertexShader: this.vs_source,
                fragmentShader: this.fs_source,
                uniforms: {
                    time: {type: "f", value: 0},
                    size: {type: "f", value: 0.13},
                    color: {type: "c", value: new THREE.Color(0xffcc88)},
                    texture: {type: "t", value: texture}
                },
                attributes: {
                    lifetime: {type: "f", value: []},
                    shift: {type: "f", value: []}
                },

                // 通常マテリアルのパラメータ
                blending: THREE.AdditiveBlending, transparent: true, depthTest: false
            });

            // (3) 形状データを作成（同時に追加の頂点情報を初期化）
            this.geometry = new THREE.Geometry();
            var attributes = this.material.attributes;
            var numParticles = 100000;
            for (var i = 0; i < numParticles; i++) {
                var a = Math.PI * 2 * Math.random();
                var d = 8 + Math.random() * 8;
                this.geometry.vertices.push(new THREE.Vector3(
                    Math.sin(a) * d, 3 + Math.random() * 2, Math.cos(a) * d));

                // 追加の頂点情報を初期化
                attributes.lifetime.value.push(3 + Math.random());
                attributes.shift.value.push(Math.random());
            }

            // 物体を作成
            var mesh = new THREE.PointCloud(this.geometry, this.material);
            mesh.position.set(0, 0, 0);
            mesh.sortParticles = false;
            this.scene.add(mesh);
        }

        public render():void {
            requestAnimationFrame(() => this.render());

            this.material.uniforms.time.value = (+new Date - this.baseTime) / 1000;
            this.renderer.render(this.scene, this.camera);
        }
    }
}
