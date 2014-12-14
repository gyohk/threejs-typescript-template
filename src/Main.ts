///<reference path="../typings/tsd.d.ts" />

declare module THREE {
    var FocusShader: any;
    var FilmPass: any;
    var TriangleBlurShader: any;
    var HorizontalBlurShader: any;
    var VerticalBlurShader: any;
}
declare var SPARKS: any;

module app {
    "use strict";

    export class Main {
        private container: HTMLElement;
        private stats: Stats;
        private camera: THREE.PerspectiveCamera;
        private scene: THREE.Scene;
        private renderer: THREE.WebGLRenderer;
        private group: THREE.Group;
        private text: THREE.Mesh;
        private speed: number;
        private pointLight: THREE.PointLight;
        private targetRotation: number;
        private targetRotationOnMouseDown: number;
        private mouseX: number;
        private mouseXOnMouseDown: number;
        private windowHalfX: number;
        private windowHalfY: number;
        private delta: number;
        private clock: THREE.Clock;
        private heartShape: THREE.Shape;
        private particleCloud: THREE.PointCloud;
        private sparksEmitter: any;
        private emitterpos: THREE.Vector3;
        private _rotation: number;
        private timeOnShapePath: number;
        private composer: THREE.EffectComposer;
        private effectBlurX: THREE.ShaderPass;
        private effectBlurY: THREE.ShaderPass;
        private hblur: THREE.ShaderPass;
        private vblur: THREE.ShaderPass;

        private particlesLength: number;
        private particles: THREE.Geometry;
        private Pool: any;
        private attributes: any;
        private uniforms: any;
        private texture: THREE.Texture;
        private values_size: any;
        private values_color: any;
        private hue: number;

        constructor() {
            this.speed = 50;
            this.targetRotation = 0;
            this.targetRotationOnMouseDown = 0;
            this.mouseX = 0;
            this.mouseXOnMouseDown = 0;
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;
            this.delta = 1;
            this.clock = new THREE.Clock();
            this._rotation = 0;
            this.timeOnShapePath = 0;

            this.init();
            this.animate();

        }

        private onParticleCreated = ( p: any ):void => {
            // var position = p;
            //p.target.position = position;
            var target = p.target;
            if ( target ) {
                // console.log(target,particles.vertices[target]);
                // values_size[target]
                // values_color[target]

                this.hue += 0.0003 * this.delta;
                if ( this.hue > 1 ) {
                    this.hue -= 1;
                }

                // TODO Create a PointOnShape Action/Zone in the particle engine

                this.timeOnShapePath += 0.00035 * this.delta;
                if ( this.timeOnShapePath > 1 ) {
                    this.timeOnShapePath -= 1;
                }

                var pointOnShape = <THREE.Vector3>this.heartShape.getPointAt( this.timeOnShapePath );

                this.emitterpos.x = pointOnShape.x * 5 - 100;
                this.emitterpos.y = -pointOnShape.y * 5 + 400;

                // pointLight.position.copy( emitterpos );
                this.pointLight.position.x = this.emitterpos.x;
                this.pointLight.position.y = this.emitterpos.y;
                this.pointLight.position.z = 100;

                this.particles.vertices[ target ] = p.position;

                this.values_color[ target ].setHSL( this.hue, 0.6, 0.1 );

                this.pointLight.color.setHSL( this.hue, 0.8, 0.5 );
            }
        };

        private onParticleDead = ( particle: any ): void => {
            var target = particle.target;
            if ( target ) {
                // Hide the particle
                this.values_color[ target ].setRGB( 0, 0, 0 );
                this.particles.vertices[ target ].set( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );
                // Mark particle system as available by returning to pool

                this.Pool.add( particle.target );
            }
        };

        private onWindowResize = ():void => {
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;

            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize( window.innerWidth, window.innerHeight );
            //

            this.hblur.uniforms[ 'h' ].value =  1 / window.innerWidth;
            this.vblur.uniforms[ 'v' ].value =  1 / window.innerHeight;

            var radius = 15;
            var blurAmountX = radius / window.innerWidth;
            var blurAmountY = radius / window.innerHeight;

            this.effectBlurX.uniforms[ 'delta' ].value = new THREE.Vector2( blurAmountX, 0 );
            this.effectBlurY.uniforms[ 'delta' ].value = new THREE.Vector2( 0, blurAmountY );

            this.composer.reset();
        };
        //

        private onDocumentMouseDown = ( event: MouseEvent ):void => {
            event.preventDefault();

            this.mouseXOnMouseDown = event.clientX - this.windowHalfX;
            this.targetRotationOnMouseDown = this.targetRotation;

            if ( this.sparksEmitter.isRunning() ) {
                this.sparksEmitter.stop();
            } else {
                this.sparksEmitter.start();
            }
        };

        private onDocumentMouseMove = ( event: MouseEvent ):void => {
            this.mouseX = event.clientX - this.windowHalfX;

            this.targetRotation = this.targetRotationOnMouseDown + ( this.mouseX - this.mouseXOnMouseDown ) * 0.02;
        };

        private onDocumentTouchStart = ( event: TouchEvent ):void => {
            if ( event.touches.length === 1 ) {
                event.preventDefault();

                this.mouseXOnMouseDown = event.touches.item(0).pageX - this.windowHalfX;
                this.targetRotationOnMouseDown = this.targetRotation;
            }
        };

        private onDocumentTouchMove = ( event: TouchEvent ):void => {
            if ( event.touches.length === 1 ) {
                event.preventDefault();

                this.mouseX = event.touches.item(0).pageX - this.windowHalfX;
                this.targetRotation = this.targetRotationOnMouseDown + ( this.mouseX - this.mouseXOnMouseDown ) * 0.05;
            }
        };

        private init():void {
            this.container = document.createElement( 'div' );
            document.body.appendChild( this.container );

            var info = document.createElement( 'div' );
            info.style.position = 'absolute';
            info.style.top = '10px';
            info.style.width = '100%';
            info.style.textAlign = 'center';
            info.innerHTML = 'Three.js - simple particle systems with shapes by <a href="http://www.lab4games.net/zz85/blog">zz85</a><br>Move your mouse. Click to pause/resume.';
            this.container.appendChild( info );

            // CAMERA
            this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 2000 );
            this.camera.position.set( 0, 150, 400 );

            // SCENE
            this.scene = new THREE.Scene();

            // LIGHTS
            var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
            directionalLight.position.set( 0, -1, 1 );
            directionalLight.position.normalize();
            this.scene.add( directionalLight );

            this.pointLight = new THREE.PointLight( 0xffffff, 2, 300 );
            this.pointLight.position.set( 0, 0, 0 );
            this.scene.add( this.pointLight );

            // TEXT
            var theText = "THREE.JS";

            // Get text from hash
            var hash = document.location.hash.substr( 1 );

            if ( hash.length !== 0 ) {
                theText = hash;
            }

            var material = new THREE.MeshFaceMaterial( [
                new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, opacity: 0.95 } ),
                new THREE.MeshLambertMaterial( { color: 0xffffff } )
            ] );

            var text3d = new THREE.TextGeometry( theText, {
                size: 70,
                height: 25,
                curveSegments: 4,
                font: "helvetiker",
                bevelEnabled: true,
                bevelThickness: 2,
                bevelSize: 2,
                material: 0,
                extrudeMaterial: 1
            });

            text3d.computeVertexNormals();
            text3d.computeBoundingBox();

            var centerOffset = -0.5 * ( text3d.boundingBox.max.x - text3d.boundingBox.min.x );

            this.group = new THREE.Group();
            this.scene.add( this.group );

            this.text = new THREE.Mesh( text3d, material );

            // Potentially, we can extract the vertices or faces of the text to generate particles too.
            // Geo > Vertices > Position

            this.text.position.x = centerOffset;
            this.text.position.y = 130;
            this.text.position.z = -50;

            this.text.rotation.x = 0;
            this.text.rotation.y = Math.PI * 2;

            this.group.add( this.text );

            // Create particle objects for Three.js
            this.particlesLength = 70000;
            this.particles = new THREE.Geometry();

            this.Pool = {
                __pools: [],
                // Get a new Vector
                get: function() {
                    if ( this.__pools.length > 0 ) {
                        return this.__pools.pop();
                    }

                    console.log( "pool ran out!" );
                    return null;
                },

                // Release a vector back into the pool
                add: function( v: THREE.Vector3 ) {
                    this.__pools.push( v );
                }
            };

            for (var i = 0; i < this.particlesLength; i ++ ) {
                this.particles.vertices.push( this.newpos( Math.random() * 200 - 100, Math.random() * 100 + 150, Math.random() * 50 ) );
                this.Pool.add( i );
            }

            // Create pools of vectors
            this.attributes = {
                size:  { type: 'f', value: [] },
                pcolor: { type: 'c', value: [] }
            };

            var sprite = this.generateSprite();

            this.texture = new THREE.Texture( sprite );
            this.texture.needsUpdate = true;

            this.uniforms = {
                texture:   { type: "t", value: this.texture }
            };
            // PARAMETERS


            var shaderMaterial = new THREE.ShaderMaterial( {
                uniforms: this.uniforms,
                attributes: this.attributes,

                vertexShader: document.getElementById( 'vertexshader' ).textContent,
                fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

                blending: THREE.AdditiveBlending,
                depthWrite: false,
                transparent: true
            });

            this.particleCloud = new THREE.PointCloud( this.particles, shaderMaterial );

            //this.particleCloud.dynamic = true;
            // particleCloud.sortParticles = true;

            var vertices = this.particleCloud.geometry.vertices;
            this.values_size = this.attributes.size.value;
            this.values_color = this.attributes.pcolor.value;

            for( var v = 0; v < vertices.length; v ++ ) {
                this.values_size[ v ] = 50;
                this.values_color[ v ] = new THREE.Color( 0x000000 );
                this.particles.vertices[ v ].set( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );
            }

            this.group.add( this.particleCloud );
            //this.particleCloud.y = 800;

            // Create Particle Systems
            // EMITTER STUFF
            // Heart

            var x = 0, y = 0;

            this.heartShape = new THREE.Shape();

            this.heartShape.moveTo( x + 25, y + 25 );
            this.heartShape.bezierCurveTo( x + 25, y + 25, x + 20, y, x, y );
            this.heartShape.bezierCurveTo( x - 30, y, x - 30, y + 35,x - 30,y + 35 );
            this.heartShape.bezierCurveTo( x - 30, y + 55, x - 10, y + 77, x + 25, y + 95 );
            this.heartShape.bezierCurveTo( x + 60, y + 77, x + 80, y + 55, x + 80, y + 35 );
            this.heartShape.bezierCurveTo( x + 80, y + 35, x + 80, y, x + 50, y );
            this.heartShape.bezierCurveTo( x + 35, y, x + 25, y + 25, x + 25, y + 25 );

            this.hue = 0;

            this.sparksEmitter = new SPARKS.Emitter( new SPARKS.SteadyCounter( 500 ) );
            this.emitterpos = new THREE.Vector3( 0, 0, 0 );

            this.sparksEmitter.addInitializer( new SPARKS.Position( new SPARKS.PointZone( this.emitterpos ) ) );
            this.sparksEmitter.addInitializer( new SPARKS.Lifetime( 1, 15 ));
            this.sparksEmitter.addInitializer( new SPARKS.Target( null, () => this.setTargetParticle() ) );

            this.sparksEmitter.addInitializer( new SPARKS.Velocity( new SPARKS.PointZone( new THREE.Vector3( 0, -5, 1 ) ) ) );

            this.sparksEmitter.addAction( new SPARKS.Age() );
            this.sparksEmitter.addAction( new SPARKS.Accelerate( 0, 0, -50 ) );
            this.sparksEmitter.addAction( new SPARKS.Move() );
            this.sparksEmitter.addAction( new SPARKS.RandomDrift( 90, 100, 2000 ) );

            this.sparksEmitter.addCallback( "created", this.onParticleCreated );
            this.sparksEmitter.addCallback( "dead", this.onParticleDead );
            this.sparksEmitter.start();

            // End Particles
            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setSize( window.innerWidth, window.innerHeight );

            this.container.appendChild( this.renderer.domElement );

            this.stats = new Stats();
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.top = '0px';
            this.container.appendChild( this.stats.domElement );

            // POST PROCESSING

            var effectFocus = new THREE.ShaderPass( THREE.FocusShader );
            var effectCopy = new THREE.ShaderPass( THREE.CopyShader );
            var effectFilm = new THREE.FilmPass( 0.5, 0.25, 2048, false );

            var shaderBlur = THREE.TriangleBlurShader;
            this.effectBlurX = new THREE.ShaderPass( shaderBlur, 'texture' );
            this.effectBlurY = new THREE.ShaderPass( shaderBlur, 'texture' );

            var radius = 15;
            var blurAmountX = radius / window.innerWidth;
            var blurAmountY = radius / window.innerHeight;

            this.hblur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
            this.vblur = new THREE.ShaderPass( THREE.VerticalBlurShader);

            this.hblur.uniforms[ 'h' ].value =  1 / window.innerWidth;
            this.vblur.uniforms[ 'v' ].value =  1 / window.innerHeight;

            this.effectBlurX.uniforms[ 'delta' ].value = new THREE.Vector2( blurAmountX, 0 );
            this.effectBlurY.uniforms[ 'delta' ].value = new THREE.Vector2( 0, blurAmountY );

            effectFocus.uniforms[ 'sampleDistance' ].value = 0.99; //0.94
            effectFocus.uniforms[ 'waveFactor' ].value = 0.003;  //0.00125

            var renderScene = new THREE.RenderPass( this.scene, this.camera );

            this.composer = new THREE.EffectComposer( this.renderer );
            this.composer.addPass( renderScene );
            this.composer.addPass( this.hblur );
            this.composer.addPass( this.vblur );
            // composer.addPass( effectBlurX );
            // composer.addPass( effectBlurY );
            // composer.addPass( effectCopy );
            // composer.addPass( effectFocus );
            // composer.addPass( effectFilm );

            this.vblur.renderToScreen = true;
            this.effectBlurY.renderToScreen = true;
            effectFocus.renderToScreen = true;
            effectCopy.renderToScreen = true;
            effectFilm.renderToScreen = true;

            document.addEventListener( 'mousedown', this.onDocumentMouseDown, false );
            document.addEventListener( 'touchstart', this.onDocumentTouchStart, false );
            document.addEventListener( 'touchmove', this.onDocumentTouchMove, false );
            //

            window.addEventListener( 'resize', this.onWindowResize, false );
            document.addEventListener( 'mousemove', this.onDocumentMouseMove, false );
        }

        private newpos( x: number, y: number, z: number ): THREE.Vector3 {
            return new THREE.Vector3( x, y, z );
        }

        private generateSprite(): HTMLCanvasElement {
            var canvas = document.createElement( 'canvas' );
            canvas.width = 128;
            canvas.height = 128;

            var context = canvas.getContext( '2d' );

            // Just a square, doesnt work too bad with blur pp.
            // context.fillStyle = "white";
            // context.strokeStyle = "white";
            // context.fillRect(0, 0, 63, 63) ;

            // Heart Shapes are not too pretty here
            // var x = 4, y = 0;
            // context.save();
            // context.scale(8, 8); // Scale so canvas render can redraw within bounds
            // context.beginPath();
            // context.bezierCurveTo( x + 2.5, y + 2.5, x + 2.0, y, x, y );
            // context.bezierCurveTo( x - 3.0, y, x - 3.0, y + 3.5,x - 3.0,y + 3.5 );
            // context.bezierCurveTo( x - 3.0, y + 5.5, x - 1.0, y + 7.7, x + 2.5, y + 9.5 );
            // context.bezierCurveTo( x + 6.0, y + 7.7, x + 8.0, y + 5.5, x + 8.0, y + 3.5 );
            // context.bezierCurveTo( x + 8.0, y + 3.5, x + 8.0, y, x + 5.0, y );
            // context.bezierCurveTo( x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5 );

            context.beginPath();
            context.arc( 64, 64, 60, 0, Math.PI * 2, false) ;

            context.lineWidth = 0.5; //0.05
            context.stroke();
            context.restore();

            var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );

            gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
            gradient.addColorStop( 0.2, 'rgba(255,255,255,1)' );
            gradient.addColorStop( 0.4, 'rgba(200,200,200,1)' );
            gradient.addColorStop( 1, 'rgba(0,0,0,1)' );

            context.fillStyle = gradient;
            context.fill();

            return canvas;
        }

        private setTargetParticle():void {
            var target = this.Pool.get();
            this.values_size[ target ] = Math.random() * 200 + 100;

            return target;
        }

        //
        private animate():void {
            requestAnimationFrame( () => this.animate() );

            this.render();
            this.stats.update();
        }

        private render():void {
            this.delta = this.speed * this.clock.getDelta();

            this.particleCloud.geometry.verticesNeedUpdate = true;

            this.attributes.size.needsUpdate = true;
            this.attributes.pcolor.needsUpdate = true;

            // Pretty cool effect if you enable this
            // particleCloud.rotation.y += 0.05;

            this.group.rotation.y += ( this.targetRotation - this.group.rotation.y ) * 0.05;

            this.renderer.clear();

            // renderer.render( scene, camera );
            this.composer.render( 0.1 );
        }
    }
}
