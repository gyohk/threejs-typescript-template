///<reference path="../typings/tsd.d.ts" />

declare module THREE {
    var FirstPersonControls: any;
}

module app {
    "use strict";

    export class Main {
        private container: HTMLElement;
        private stats: Stats;
        private camera: THREE.PerspectiveCamera;
        private controls: any;
        private scene: THREE.Scene;
        private renderer: THREE.WebGLRenderer;
        private mesh: THREE.Mesh;
        private geometry: THREE.Geometry;
        private material: THREE.Material;

        private worldWidth: number;
        private worldDepth: number;
        private worldHalfWidth: number;
        private worldHalfDepth: number;
        private clock: THREE.Clock;

        constructor() {
            if ( ! Detector.webgl ) {
                Detector.addGetWebGLMessage();
                document.getElementById( 'container' ).innerHTML = "";
            }

            this.worldWidth = 128;
            this.worldDepth = 128;
            this.worldHalfWidth = this.worldWidth / 2;
            this.worldHalfDepth = this.worldDepth / 2;
            this.clock = new THREE.Clock();

            this.init();
            this.animate();
        }

        private onWindowResize = ():void => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize( window.innerWidth, window.innerHeight );

            this.controls.handleResize();
        };

        private init():void {
            this.container = document.getElementById( 'container' );

            this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
            this.camera.position.y = 200;

            this.controls = new THREE.FirstPersonControls( this.camera );

            this.controls.movementSpeed = 500;
            this.controls.lookSpeed = 0.1;

            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2( 0xaaccff, 0.0007 );

            this.geometry = new THREE.PlaneGeometry( 20000, 20000, this.worldWidth - 1, this.worldDepth - 1 );
            this.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

            var i: number, il: number;

            for ( i = 0, il = this.geometry.vertices.length; i < il; i ++ ) {

                this.geometry.vertices[ i ].y = 35 * Math.sin( i/2 );

            }

            //console.log( "triangles: " + geometry.faces.length * 2 + " faces: " + geometry.faces.length + " vertices: " + geometry.vertices.length );

            this.geometry.computeFaceNormals();
            this.geometry.computeVertexNormals();

            var texture = THREE.ImageUtils.loadTexture( "textures/water.jpg" );
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 5, 5 );

            this.material = new THREE.MeshBasicMaterial( { color: 0x0044ff, map: texture } );

            this.mesh = new THREE.Mesh( this.geometry, this.material );
            this.scene.add( this.mesh );

            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setClearColor( 0xaaccff, 1 );
            this.renderer.setSize( window.innerWidth, window.innerHeight );

            this.container.innerHTML = "";

            this.container.appendChild( this.renderer.domElement );

            this.stats = new Stats();
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.top = '0px';
            this.container.appendChild( this.stats.domElement );

            //

            window.addEventListener( 'resize', this.onWindowResize, false );
        }
        //

        private animate():void {
            requestAnimationFrame( ()=>this.animate() );

            this.render();
            this.stats.update();
        }

        private render():void {
            var delta = this.clock.getDelta();
            var time = this.clock.getElapsedTime() * 10;

            var i: number, l: number;

            for ( i = 0, l = this.geometry.vertices.length; i < l; i ++ ) {
                this.geometry.vertices[ i ].y = 35 * Math.sin( i / 5 + ( time + i ) / 7 );
            }

            //geometry.computeFaceNormals();
            //geometry.computeVertexNormals();

            this.mesh.geometry.verticesNeedUpdate = true;
            //mesh.geometry.normalsNeedUpdate = true;

            this.controls.update( delta );
            this.renderer.render( this.scene, this.camera );
        }
    }
}

