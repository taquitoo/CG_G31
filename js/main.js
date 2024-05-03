import * as THREE from 'three';

'use strict';

/* GLOBAL VARIABLES */
var scene, renderer, camera;
var cameras = [];

var geometry, material, mesh;

function addBase(obj, x, y, z) {
	'use strict';
	geometry = new THREE.BoxGeometry(40, 20, 40);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y, z);
	obj.add(mesh);
}

function addTorre(obj, x, y, z) {
	'use strict';
	geometry = new THREE.BoxGeometry(20, 300, 20);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y, z);
	obj.add(mesh);
}

function addPortalanca(obj, x, y, z) {
	'use strict';
	geometry = new THREE.BoxGeometry(20, 60, 20);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y+30, z);
	obj.add(mesh);
}

function addContralanca(obj, x, y, z) {
	'use strict';
	geometry = new THREE.BoxGeometry(80, 20, 30);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x-30, y+10, z);
	obj.add(mesh);
}

function addTirantes(obj, x, y, z) {
	'use strict';
	geometry = new THREE.CylinderGeometry(2, 2, 30);
	mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.z = Math.PI / 4;
	mesh.position.set(x+20, y+30, z);
	obj.add(mesh);
	geometry = new THREE.CylinderGeometry(2, 2, 30);
	mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.z = -Math.PI / 4;
	mesh.position.set(x-20, y+30, z);
	obj.add(mesh);
}

function addCarrinho(obj, x, y, z) {
	'use strict';
	geometry = new THREE.BoxGeometry(30, 10, 30);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x+100, y-5, z);
	obj.add(mesh);
	addCabo(obj, x+100, y-10, z);
}

function addCabo(obj, x, y, z) {
	'use strict';
	var len = 100;
	geometry = new THREE.CylinderGeometry(2, 2, len); 
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y-(len/2), z);
	obj.add(mesh);
	addBloco(obj, x, y-len, z);
}

function addDedo(obj, x, y, z, angle) {
	'use strict';
	geometry = new THREE.BoxGeometry(2, 10, 2);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y-5, z);
	mesh.rotation.y = angle;
	obj.add(mesh);
	geometry = new THREE.BoxGeometry(2, 20, 2);
	mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.z = Math.PI/4; // grau de liberdade
	mesh.position.set(x, y-10, z);
	mesh.rotation.y = angle;
	obj.add(mesh);
}

function addBloco(obj, x, y, z) {
	'use strict';
	geometry = new THREE.BoxGeometry(30, 10, 30);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y-5, z);
	obj.add(mesh);
	addDedo(obj, x-10, y-10, z-10, -Math.PI/4);
	addDedo(obj, x-10, y-10, z+10, Math.PI/4);
	addDedo(obj, x+10, y-10, z-10, 5*Math.PI/4);
	addDedo(obj, x+10, y-10, z+10, 3*Math.PI/4);
}

function addGancho(obj, x, y, z) {
	'use strict';
	addCarrinho(obj, x, y, z);
}

function addLanca(obj, x, y, z) {
	'use strict';
	geometry = new THREE.BoxGeometry(200, 20, 30);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x+110, y+10, z);
	obj.add(mesh);
	addGancho(obj, x+60, y, z); // grau de liberdade
}

function addTopo(obj, x, y, z) {
	'use strict';
	addPortalanca(obj, x, y, z);
	addContralanca(obj, x, y, z);
	addTirantes(obj, x, y, z);
	addLanca(obj, x, y, z);
}

function addCrane(obj, x, y, z) {
	'use strict';
	var topo = new THREE.Object3D();
    material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });

	addBase(obj, 0, 10, 0);
	addTorre(obj, 0, 170, 0);
	addTopo(topo, 0, 320, 0);
	topo.rotation.y = 0; // grau de liberdade
	obj.add(topo);
}

function createCrane(x, y, z) {
	'use strict';

	var crane = new THREE.Object3D();
    material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });

	addCrane(crane, x, y, z);
	scene.add(crane);

    crane.position.x = x;
    crane.position.y = y;
    crane.position.z = z;
}

/* CREATE SCENE */
function createScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xA3D8FF);
}

/* CREATE CAMERAS */
function createCameras() {

    const aspectRatio = window.innerWidth / window.innerHeight; 
    const frustumSize = 400;

    // Camera 1: Front View
    const orthographicCameraFront = new THREE.OrthographicCamera(frustumSize * aspectRatio / -2, frustumSize * aspectRatio / 2, frustumSize / 2, frustumSize / -2, 1, 2000);
    orthographicCameraFront.position.set(0, 0, 1000);
    orthographicCameraFront.lookAt(scene.position);

    // Camera 2: Lateral View
    const orthographicCameraSide = new THREE.OrthographicCamera(frustumSize * aspectRatio / -2, frustumSize * aspectRatio / 2, frustumSize / 2, frustumSize / -2, 1, 2000);
    orthographicCameraSide.position.set(1000, 0, 0);
    orthographicCameraSide.lookAt(scene.position);

    // Camera 3: Top View
    const orthographicCameraTop = new THREE.OrthographicCamera(frustumSize * aspectRatio / -2, frustumSize * aspectRatio / 2, frustumSize / 2, frustumSize / -2, 1, 2000);
    orthographicCameraTop.position.set(0, 1000, 0);
    orthographicCameraTop.lookAt(scene.position);

    // Camera 4: Isometric perspective, orthogonal projection
    const isometricCameraOrtho = new THREE.OrthographicCamera(frustumSize * aspectRatio / -2, frustumSize * aspectRatio / 2, frustumSize / 2, frustumSize / -2, 1, 2000);
    isometricCameraOrtho.position.set(800, 800, 800);
    isometricCameraOrtho.lookAt(scene.position);

    // Camera 5: Isometric perspective, perspective projection
    const isometricCameraPersp = new THREE.PerspectiveCamera(90, aspectRatio, 1, 2000);
    isometricCameraPersp.position.set(800, 800, 800);;
    isometricCameraPersp.lookAt(scene.position);

    // Collect all cameras
    cameras.push(orthographicCameraFront, orthographicCameraSide, orthographicCameraTop, isometricCameraOrtho, isometricCameraPersp);
}

/* RENDER */
function render() {
    renderer.render(scene, camera);
}

/* ANIMATION CYCLE */
function animate() {
    requestAnimationFrame(animate);
    render();
}

/* INITIALIZATION */
function init() {

    createScene();
    createCameras();
    camera = cameras[0];

    createCrane(0, -200, 0);
	/* FIXME o y está a -150 pq queria ver a grua centrada, mas isto acho que devia ser resolvido na parte das camaras, não aqui */

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener("keydown", onKeyDown);

    render();
    animate();
}

/* KEYBOARD CALLBACK */
function onKeyDown(e) {
    e.preventDefault();
    console.log("Key pressed:", e.key);

    switch (e.key) {
        case '1':
            camera = cameras[0];
            break;
        case '2':
            camera = cameras[1];
            break;
        case '3':
            camera = cameras[2];
            break;
        case '4':
            camera = cameras[3];
            break;
        case '5':
            camera = cameras[4];
            break;
    }
}

init();
animate();
