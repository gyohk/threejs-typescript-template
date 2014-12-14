///<reference path="../typings/tsd.d.ts" />

declare var CANNON: any;

module app {
    "use strict";

    export class Main {
        private world: any; // CANNON.World
        private ground: any; // CANNON.RigidBody
        private diceRigid: any;
        private timeStep: number;
        private dice: THREE.CSS3DObject;
        private camera: THREE.PerspectiveCamera;
        private scene: THREE.Scene;
        private renderer: THREE.CSS3DRenderer;
        private floorObj: THREE.CSS3DObject;
        private startDiceNum: number;
        private cubeSize: number;
        private stopped: boolean;

        constructor() {
            this.timeStep = 1 / 60;
            this.startDiceNum = 3;
            this.cubeSize = 5;

            this.stopped = false;
            this.initCannon();
            this.initThree();

            //create a dice.
            var ret = this.createDice();
            this.dice = ret.dice;
            this.diceRigid = ret.rigid;

            this.world.allowSleep = true;
            this.diceRigid.allowSleep = true;

            this.diceRigid.sleepSpeedLimit = 0.1;
            this.diceRigid.sleepTimeLimit = 1;

            this.diceRigid.addEventListener('sleepy', (e: any) => {
                var px = new THREE.Vector4( 1,  0,  0, 0),
                    nx = new THREE.Vector4(-1,  0,  0, 0),
                    py = new THREE.Vector4( 0,  1,  0, 0),
                    ny = new THREE.Vector4( 0, -1,  0, 0),
                    pz = new THREE.Vector4( 0,  0,  1, 0),
                    nz = new THREE.Vector4( 0,  0, -1, 0),
                    UP = 0.99;

                if (px.applyMatrix4(this.dice.matrixWorld).y > UP) {
                    this.showNum(5);
                } else if (nx.applyMatrix4(this.dice.matrixWorld).y > UP) {
                    this.showNum(2);
                } else if (py.applyMatrix4(this.dice.matrixWorld).y > UP) {
                    this.showNum(1);
                } else if (ny.applyMatrix4(this.dice.matrixWorld).y > UP) {
                    this.showNum(6);
                } else if (pz.applyMatrix4(this.dice.matrixWorld).y > UP) {
                    this.showNum(3);
                } else if (nz.applyMatrix4(this.dice.matrixWorld).y > UP) {
                    this.showNum(4);
                }

                this.stopped = true;
            });
            this.diceRigid.addEventListener('sleep', (e: any) => {
                //alert('sleep');
            });
            this.scene.add(this.dice);
            this.world.add(this.diceRigid);

            this.render();

            //

            document.addEventListener('click', (e: any) => {
                this.stopped = false;
                this.initAnimation();
                this.animate();
            }, false);
        }

        private showNum(num: number): void {
            document.getElementById('num').innerHTML = num.toString();
        }

        private createDice():any {
            var boxInfo = [
                {
                    url: 'textures/gNzsx.png',
                    position: [ -this.cubeSize, 0, 0 ],
                  rotation: [ 0, Math.PI / 2, 0 ]
                },
                {
                    url: 'textures/bX8TN.png',
                    position: [ this.cubeSize, 0, 0 ],
                    rotation: [ 0, -Math.PI / 2, 0 ]
                },
                {
                    url: 'textures/uG6BH.png',
                    position: [ 0,  this.cubeSize, 0 ],
                    rotation: [ Math.PI / 2, 0, Math.PI ]
                },
                {
                    url: 'textures/eszwi.png',
                    position: [ 0, -this.cubeSize, 0 ],
                    rotation: [ - Math.PI / 2, 0, Math.PI ]
                },
                {
                    url: 'textures/9t39J.png',
                    position: [ 0, 0,  this.cubeSize ],
                    rotation: [ 0, Math.PI, 0 ]
                },
                {
                    url: 'textures/heo9V.png',
                    position: [ 0, 0, -this.cubeSize ],
                    rotation: [ 0, 0, 0 ]
                }
            ];

            var el: HTMLElement, dice: THREE.CSS3DObject, info: any, img: HTMLImageElement, face: THREE.CSS3DObject;

            el = document.createElement('div');
            el.style.width = this.cubeSize * 2 + 'px';
            el.style.height = this.cubeSize * 2 + 'px';
            dice = new THREE.CSS3DObject(el);

            for (var j = 0; j < boxInfo.length; j++) {
                info = boxInfo[j];
                img = document.createElement('img');
                img.width = this.cubeSize * 2;
                img.src = info.url;
                face = new THREE.CSS3DObject(img);

                face.position.fromArray(info.position);
                face.rotation.fromArray(info.rotation);
                dice.add(face);
            }

            //Create physics.
            var mass  = 1;
            var box = new CANNON.Box(new CANNON.Vec3(this.cubeSize, this.cubeSize, this.cubeSize));
            var body = new CANNON.RigidBody(mass, box);

            //body.position.set(x, y, z);
            //body.velocity.set(0, 0, Math.random() * -50 - 30);

            //body.angularVelocity.set(10, 10, 10);
            //body.angularDamping = 0.001;

            return {
                dice: dice,
                rigid: body
            };
        }

        //
        private initCannon():void {
            //Cannonの世界を生成
            this.world = new CANNON.World();

            //重力を設定
            this.world.gravity.set(0, -90.82, 0);
            this.world.broadphase = new CANNON.NaiveBroadphase();
            this.world.solver.iterations = 10;
            this.world.solver.tolerance = 0.001;

            //地面用にPlaneを生成
            var plane = new CANNON.Plane();

            //Planeの剛体を質量0で生成する
            this.ground= new CANNON.RigidBody(0, plane);

            //X軸に90度（つまり地面）に回転
            this.ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            this.world.add(this.ground);
        }

        private initThree() {
            var w = window.innerWidth;
            var h = window.innerHeight;
            this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
            this.camera.position.set(10, 40, 50);
            this.camera.lookAt(new THREE.Vector3(0, 0, 0));

            this.scene = new THREE.Scene();
            this.renderer = new THREE.CSS3DRenderer();
            this.renderer.setSize(w, h);

            var textureSize = 800;
            var floorEle = document.createElement('div');
            floorEle.style.width  = textureSize + 'px';
            floorEle.style.height = textureSize + 'px';
            floorEle.style.background = 'url(http://jsrun.it/assets/d/x/0/w/dx0wl.png) left top repeat';
            floorEle.style.backgroundSize = textureSize / 20 + 'px ' + textureSize / 20 + 'px';

            this.floorObj = new THREE.CSS3DObject(floorEle);
            this.floorObj.position.fromArray([0, 0, 0]);
            this.floorObj.rotation.fromArray([Math.PI / 2, 0, 0]);
            this.scene.add(this.floorObj);

            this.scene.add(this.camera);

            var container = document.getElementById('d0');
            container.appendChild(this.renderer.domElement);

            this.renderer.render(this.scene, this.camera);
        }

        private animate() {
            if (this.stopped) {
                return;
            }
            requestAnimationFrame(() => this.animate());
            this.updatePhysics();
            this.render();
        }

        private updatePhysics() {
            //物理エンジンの時間を進める
            this.world.step(this.timeStep);

            //物理エンジンで計算されたbody(RigidBody)の位置をThree.jsのMeshにコピー
            if (this.diceRigid) {
                this.diceRigid.position.copy(this.dice.position);
                this.diceRigid.quaternion.copy(this.dice.quaternion);
                this.diceRigid.position.copy(this.camera.position);
                this.camera.position.y += 50;
                this.camera.position.x += 50;
                this.camera.lookAt(this.diceRigid.position.copy(new THREE.Vector3(0, 0, 0)));
            }

            this.ground.position.copy(this.floorObj.position);
            this.ground.quaternion.copy(this.floorObj.quaternion);
        }

        private render(): void {
            this.renderer.render(this.scene, this.camera);
        }

        private initAnimation(): void {
            this.diceRigid.position.set(0, 50, 30);
            this.diceRigid.velocity.set(
                Math.random() * 20  + 0,
                Math.random() * 100 + 20,
                Math.random() * -50 - 30);
            this.diceRigid.angularVelocity.set(10, 10, 10);
            this.diceRigid.angularDamping = 0.001;
        }
    }
}
