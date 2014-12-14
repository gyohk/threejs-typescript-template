///<reference path="../typings/tsd.d.ts" />

declare var CANNON: any;

module app {
    "use strict";

    export class Main {
        private world: any;
        private ground: any;
        private timeStep: number;
        private diceRigid: any;
        private dice: THREE.CSS3DObject;
        private camera: THREE.PerspectiveCamera;
        private scene: THREE.Scene;
        private renderer: THREE.CSS3DRenderer;
        private floorObj: THREE.CSS3DObject;
        private startDiceNum: number;
        private cubeSize: number;

        constructor() {
            var world, ground, timeStep = 1 / 60,
                diceRigid, dice,
                camera, scene, renderer, floorObj,
                startDiceNum = 3,
                cubeSize = 5;

            var stopped = false;
            initCannon();
            initThree();

            //create a dice.
            var ret = createDice();
            dice = ret.dice;
            diceRigid = ret.rigid;

            world.allowSleep = true;
            diceRigid.allowSleep = true;

            diceRigid.sleepSpeedLimit = 0.1;
            diceRigid.sleepTimeLimit = 1;



            diceRigid.addEventListener('sleepy', function (e) {
                var px = new THREE.Vector4( 1,  0,  0, 0),
                    nx = new THREE.Vector4(-1,  0,  0, 0),
                    py = new THREE.Vector4( 0,  1,  0, 0),
                    ny = new THREE.Vector4( 0, -1,  0, 0),
                    pz = new THREE.Vector4( 0,  0,  1, 0),
                    nz = new THREE.Vector4( 0,  0, -1, 0),
                    UP = 0.99,
                    tmp;

                function showNum(num) {
                    doc.getElementById('num').innerHTML = num;
                }

                if (px.applyMatrix4(dice.matrixWorld).y > UP) {
                    showNum(5);
                }
                else if (nx.applyMatrix4(dice.matrixWorld).y > UP) {
                    showNum(2);
                }
                else if (py.applyMatrix4(dice.matrixWorld).y > UP) {
                    showNum(1);
                }
                else if (ny.applyMatrix4(dice.matrixWorld).y > UP) {
                    showNum(6);
                }
                else if (pz.applyMatrix4(dice.matrixWorld).y > UP) {
                    showNum(3);
                }
                else if (nz.applyMatrix4(dice.matrixWorld).y > UP) {
                    showNum(4);
                }

                stopped = true;
            });
            diceRigid.addEventListener('sleep', function (e) {
                //alert('sleep');
            });
            scene.add(dice);
            world.add(diceRigid);

            render();

            //

            doc.addEventListener('click', function (e) {
                stopped = false;
                initAnimation();
                animate();
            }, false);
        }

        private createDice():void {
            var boxInfo = [
                {
                    url: 'textures/gNzsx.png',
                    position: [ -cubeSize, 0, 0 ],
                  rotation: [ 0, Math.PI / 2, 0 ]
                },
                {
                    url: 'textures/bX8TN.png',
                    position: [ cubeSize, 0, 0 ],
                    rotation: [ 0, -Math.PI / 2, 0 ]
                },
                {
                    url: 'textures/uG6BH.png',
                    position: [ 0,  cubeSize, 0 ],
                    rotation: [ Math.PI / 2, 0, Math.PI ]
                },
                {
                    url: 'textures/eszwi.png',
                    position: [ 0, -cubeSize, 0 ],
                    rotation: [ - Math.PI / 2, 0, Math.PI ]
                },
                {
                    url: 'textures/9t39J.png',
                    position: [ 0, 0,  cubeSize ],
                    rotation: [ 0, Math.PI, 0 ]
                },
                {
                    url: 'textures/heo9V.png',
                    position: [ 0, 0, -cubeSize ],
                    rotation: [ 0, 0, 0 ]
                }
            ];

            //for three.js
            {
                var el, dice,
                    info, img, face;

                el = doc.createElement('div');
                el.style.width = cubeSize * 2 + 'px';
                el.style.height = cubeSize * 2 + 'px';
                dice = new THREE.CSS3DObject(el);

                for (var j = 0; j < boxInfo.length; j++) {
                    info = boxInfo[j];
                    img = document.createElement('img');
                    img.width = cubeSize * 2;
                    img.src = info.url;
                    face = new THREE.CSS3DObject(img);

                    face.position.fromArray(info.position);
                    face.rotation.fromArray(info.rotation);
                    dice.add(face);
                }
            }

            //Create physics.
            {
                var mass  = 1;
                var box = new CANNON.Box(new CANNON.Vec3(cubeSize, cubeSize, cubeSize));
                var body = new CANNON.RigidBody(mass, box);

                //body.position.set(x, y, z);
                //body.velocity.set(0, 0, Math.random() * -50 - 30);

                //body.angularVelocity.set(10, 10, 10);
                //body.angularDamping = 0.001;
            }

            return {
                dice: dice,
                rigid: body
            };
        }

        //
        private initCannon():void {
            //Cannonの世界を生成
            world = new CANNON.World();

            //重力を設定
            world.gravity.set(0, -90.82, 0);
            world.broadphase = new CANNON.NaiveBroadphase();
            world.solver.iterations = 10;
            world.solver.tolerance = 0.001;

            //地面用にPlaneを生成
            var plane = new CANNON.Plane();

            //Planeの剛体を質量0で生成する
            ground= new CANNON.RigidBody(0, plane);

            //X軸に90度（つまり地面）に回転
            ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            world.add(ground);
        }

        private initThree() {
            var w = win.innerWidth;
            var h = win.innerHeight;
            camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
            camera.position.set(10, 40, 50);
            camera.lookAt(new THREE.Vector3(0, 0, 0));

            scene = new THREE.Scene();
            renderer = new THREE.CSS3DRenderer();
            renderer.setSize(w, h);

            var textureSize = 800;
            var floorEle = doc.createElement('div');
            floorEle.style.width  = textureSize + 'px';
            floorEle.style.height = textureSize + 'px';
            floorEle.style.background = 'url(http://jsrun.it/assets/d/x/0/w/dx0wl.png) left top repeat';
            floorEle.style.backgroundSize = textureSize / 20 + 'px ' + textureSize / 20 + 'px';

            floorObj = new THREE.CSS3DObject(floorEle);
            floorObj.position.fromArray([0, 0, 0]);
            floorObj.rotation.fromArray([Math.PI / 2, 0, 0]);
            scene.add(floorObj);

            scene.add(camera);

            var container = doc.getElementById('d0');
            container.appendChild(renderer.domElement);

            renderer.render(scene, camera);
        }

        private animate() {
            if (stopped) {
                return;
            }
            requestAnimationFrame(animate);
            updatePhysics();
            render();
        }

        private updatePhysics() {
            //物理エンジンの時間を進める
            world.step(timeStep);

            //物理エンジンで計算されたbody(RigidBody)の位置をThree.jsのMeshにコピー
            if (diceRigid) {
                diceRigid.position.copy(dice.position);
                diceRigid.quaternion.copy(dice.quaternion);
                diceRigid.position.copy(camera.position);
                camera.position.y += 50;
                camera.position.x += 50;
                camera.lookAt(diceRigid.position.copy(new THREE.Vector3(0, 0, 0)));
            }

            ground.position.copy(floorObj.position);
            ground.quaternion.copy(floorObj.quaternion);
        }

        private render() {
            renderer.render(scene, camera);
        }

        private initAnimation() {
            diceRigid.position.set(0, 50, 30);
            diceRigid.velocity.set(
                Math.random() * 20  + 0,
                Math.random() * 100 + 20,
                Math.random() * -50 - 30);
            diceRigid.angularVelocity.set(10, 10, 10);
            diceRigid.angularDamping = 0.001;
        }
    }
}
