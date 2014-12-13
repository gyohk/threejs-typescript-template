///<reference path="../typings/tsd.d.ts" />

declare module THREE {
    var BloomPass: any;
}

module app {
    "use strict";

    export class Main {
        private container:HTMLElement;
        private camera:THREE.PerspectiveCamera;
        private scene:THREE.Scene;
        private renderer:THREE.WebGLRenderer;
        private video:HTMLVideoElement;
        private texture:THREE.Texture;
        private material:THREE.MeshLambertMaterial;
        private material_settings: {
            hue: number;
            saturation: number;
        }[];
        private mesh:THREE.Mesh;
        private mesh_settings: {
            dx: number;
            dy: number;
        }[];
        private composer:THREE.EffectComposer;
        private mouseX:number;
        private mouseY:number;
        private windowHalfX:number;
        private windowHalfY:number;
        private cube_count:number;
        private meshes: THREE.Mesh[];
        private materials: THREE.MeshLambertMaterial[];
        private xgrid:number;
        private ygrid:number;
        private counter: number;

        constructor() {
            if (!Detector.webgl) {
                Detector.addGetWebGLMessage();
            }

            this.mouseX = 0;
            this.mouseY = 0;
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;
            this.meshes = [];
            this.mesh_settings = [];
            this.materials = [];
            this.material_settings = [];
            this.xgrid = 20;
            this.ygrid = 10;

            this.counter = 1;

            this.init();
            this.animate();
        }


        private onWindowResize = ():void => {
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;

            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize( window.innerWidth, window.innerHeight );
            this.composer.reset();
        };

        private onDocumentMouseMove = (event: MouseEvent):void => {
            this.mouseX = ( event.clientX - this.windowHalfX );
            this.mouseY = ( event.clientY - this.windowHalfY ) * 0.3;
        };

        private init():void {
            this.container = document.createElement('div');
            document.body.appendChild(this.container);

            this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
            this.camera.position.z = 500;
            this.scene = new THREE.Scene();

            var light = new THREE.DirectionalLight(0xffffff);
            light.position.set(0.5, 1, 1).normalize();
            this.scene.add(light);

            this.renderer = new THREE.WebGLRenderer({antialias: false});
            this.renderer.setSize(window.innerWidth, window.innerHeight);

            this.container.appendChild(this.renderer.domElement);

            this.video = <HTMLVideoElement>document.getElementById('video');

            this.texture = new THREE.VideoTexture(this.video);
            this.texture.minFilter = THREE.LinearFilter;
            this.texture.magFilter = THREE.LinearFilter;
            this.texture.format = THREE.RGBFormat;
            //
            var i:number, j:number, ux:number, uy:number, ox:number, oy:number,
                geometry:THREE.Geometry,
                xsize:number, ysize:number;

            ux = 1 / this.xgrid;
            uy = 1 / this.ygrid;

            xsize = 480 / this.xgrid;
            ysize = 204 / this.ygrid;

            var parameters = {color: 0xffffff, map: this.texture};
            this.cube_count = 0;

            for (i = 0; i < this.xgrid; i++) {
                for (j = 0; j < this.ygrid; j++) {
                    ox = i;
                    oy = j;

                    geometry = new THREE.BoxGeometry(xsize, ysize, xsize);

                    this.change_uvs(geometry, ux, uy, ox, oy);
                    this.materials[this.cube_count] = new THREE.MeshLambertMaterial(parameters);
                    this.material = this.materials[this.cube_count];

                    this.material_settings[this.cube_count] = {
                        "hue": i / this.xgrid,
                        "saturation": 1 - j / this.ygrid
                    };
                    this.material.color.setHSL(
                        this.material_settings[this.cube_count].hue,
                        this.material_settings[this.cube_count].saturation,
                        0.5
                    );

                    this.mesh = new THREE.Mesh(geometry, this.material);

                    this.mesh.position.x = ( i - this.xgrid / 2 ) * xsize;
                    this.mesh.position.y = ( j - this.ygrid / 2 ) * ysize;
                    this.mesh.position.z = 0;

                    this.mesh.scale.x = this.mesh.scale.y = this.mesh.scale.z = 1;

                    this.scene.add(this.mesh);

                    this.mesh_settings[this.cube_count] = {
                        'dx': 0.001 * ( 0.5 - Math.random() ),
                        'dy': 0.001 * ( 0.5 - Math.random() )
                    };
                    this.meshes[this.cube_count] = this.mesh;

                    this.cube_count += 1;
                }
            }
            this.renderer.autoClear = false;

            document.addEventListener('mousemove', this.onDocumentMouseMove, false);

            // postprocessing

            var renderModel = new THREE.RenderPass(this.scene, this.camera);
            var effectBloom = new THREE.BloomPass(1.3);
            var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
            effectCopy.renderToScreen = true;

            this.composer = new THREE.EffectComposer(this.renderer);

            this.composer.addPass(renderModel);
            this.composer.addPass(effectBloom);
            this.composer.addPass(effectCopy);
            //

            window.addEventListener('resize', this.onWindowResize, false);
        }

        private change_uvs( geometry: THREE.Geometry, unitx: number, unity: number, offsetx: number, offsety: number ) {
            var faceVertexUvs = geometry.faceVertexUvs[ 0 ];
            for ( var i = 0; i < faceVertexUvs.length; i ++ ) {
                var uvs = faceVertexUvs[ i ];
                for ( var j = 0; j < uvs.length; j ++ ) {
                    var uv = uvs[ j ];
                    uv.x = ( uv.x + offsetx ) * unitx;
                    uv.y = ( uv.y + offsety ) * unity;
                }
            }
        }

        private animate():void {
            requestAnimationFrame( () => this.animate() );
            this.render();
        }

        private render() {
            var time = Date.now() * 0.00005;

            this.camera.position.x += ( this.mouseX - this.camera.position.x ) * 0.05;
            this.camera.position.y += ( - this.mouseY - this.camera.position.y ) * 0.05;

            this.camera.lookAt( this.scene.position );

            for (var i = 0; i < this.cube_count; i ++ ) {
                this.material = this.materials[ i ];
                var mat_settings = this.material_settings[i];

                var h = ( 360 * ( mat_settings.hue + time ) % 360 ) / 360;
                this.material.color.setHSL( h, mat_settings.saturation, 0.5 );
            }

            if ( this.counter % 1000 > 200 ) {
                for ( i = 0; i < this.cube_count; i ++ ) {
                    this.mesh = this.meshes[ i ];
                    var mesh_settings = this.mesh_settings[i];

                    this.mesh.rotation.x += 10 * mesh_settings.dx;
                    this.mesh.rotation.y += 10 * mesh_settings.dy;

                    this.mesh.position.x += 200 * mesh_settings.dx;
                    this.mesh.position.y += 200 * mesh_settings.dy;
                    this.mesh.position.z += 400 * mesh_settings.dx;
                }
            }

            if ( this.counter % 1000 === 0 ) {
                for ( i = 0; i < this.cube_count; i ++ ) {
                    this.mesh = this.meshes[ i ];

                    this.mesh_settings[i].dx *= -1;
                    this.mesh_settings[i].dy *= -1;
                }
            }
            this.counter ++;

            this.renderer.clear();
            this.composer.render();
        }
    }
}
