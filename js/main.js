import * as THREE from 'three';

'use strict';

/* GLOBAL VARIABLES */
var scene, renderer, camera;
var cameras = [];

/* CREATE SCENE */
function createScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
}

/* CREATE CAMERAS */
function createCameras() {

    const aspectRatio = window.innerWidth / window.innerHeight; 
    const frustumSize = 1000;

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
    isometricCameraOrtho.position.set(1000, 1000, 1000);
    isometricCameraOrtho.lookAt(scene.position);

    // Camera 5: Isometric perspective, perspective projection
    const isometricCameraPersp = new THREE.PerspectiveCamera(90, aspectRatio, 1, 2000);
    isometricCameraPersp.position.set(1000, 1000, 1000);
    isometricCameraPersp.lookAt(scene.position);

    // Collect all cameras
    cameras.push(orthographicCameraFront, orthographicCameraSide, orthographicCameraTop, isometricCameraOrtho, isometricCameraPersp);
}

/* IMAGENS PARA TESTAR CAMARAS */
function teste() {
    // Create a cube
    const cubeGeometry = new THREE.BoxGeometry(100, 100, 100);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // green color
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(-150, 0, 0);
    scene.add(cube);

    // Create a sphere
    const sphereGeometry = new THREE.SphereGeometry(50, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // red color
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(150, 0, 0);
    scene.add(sphere);

    // Create a cylinder
    const cylinderGeometry = new THREE.CylinderGeometry(50, 50, 200, 32);
    const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // blue color
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(0, 0, -150);
    scene.add(cylinder);
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

    teste();

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
