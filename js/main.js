import * as THREE from 'three';
import { varyingProperty } from 'three/examples/jsm/nodes/Nodes.js';

/* GLOBAL VARIABLES */
var scene, renderer, camera;
var cameras = [];
var existingLoads = [];

var keys = {};

var geometry, material, mesh;

var topo;
var carrinho;
var bloco;

var rotationSpeed = Math.PI / 180;

function generateRandomPosition(min, max) {
    return Math.random() * (max - min) + min;
}

// Função para verificar se duas caixas estão intercetadas
function boxesIntersect(box1, box2) {
    return (box1.min.x < box2.max.x && box1.max.x > box2.min.x) &&
           (box1.min.y < box2.max.y && box1.max.y > box2.min.y) &&
           (box1.min.z < box2.max.z && box1.max.z > box2.min.z);
}

function createRandomLoad(scene, container, crane, containerWidth, containerLength) {
    // Dimensões aleatórias da carga (inferiores às do contentor)
    var loadWidth = Math.max(Math.random() * containerWidth / 2, 10);
    var loadLength = Math.max(Math.random() * containerLength / 2, 10);
    var loadHeight = Math.max(Math.random() * containerWidth / 2, 10);

    // Posição aleatória fora do contentor
    var loadX = generateRandomPosition(-containerWidth, containerWidth);
    var loadZ = generateRandomPosition(-containerLength, containerLength);

    // Criar carga
    var polyhedronTypes = ['box', 'dodecahedron', 'icosahedron', 'torus', 'torusknot'];
    var polyhedronType = polyhedronTypes[Math.floor(Math.random() * polyhedronTypes.length)];

    var loadGeometry;
    switch (polyhedronType) {
        case 'box':
            loadGeometry = new THREE.BoxGeometry(loadWidth, loadHeight, loadLength);
            break;
        case 'dodecahedron':
            loadGeometry = new THREE.DodecahedronGeometry(loadWidth / 2);
            break;
        case 'icosahedron':
            loadGeometry = new THREE.IcosahedronGeometry(loadWidth / 2);
            break;
        case 'torus':
            loadGeometry = new THREE.TorusGeometry(loadWidth / 2, loadHeight / 4, 16, 100);
            break;
        case 'torusknot':
            loadGeometry = new THREE.TorusKnotGeometry(loadWidth / 2, loadHeight / 4, 64, 16);
            break;
        default:
            loadGeometry = new THREE.BoxGeometry(loadWidth, loadHeight, loadLength);
    }

    var loadMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 , wireframe: true});
    var loadMesh = new THREE.Mesh(loadGeometry, loadMaterial);
    loadMesh.position.set(loadX, -200, loadZ);

    // Verificar se a carga intersecta com as peças existentes
    var loadBox = new THREE.Box3().setFromObject(loadMesh);
    for (var i = 0; i < existingLoads.length; i++) {
        var existingLoadBox = new THREE.Box3().setFromObject(existingLoads[i]);
        if (boxesIntersect(loadBox, existingLoadBox)) {
            // Se houver interseção, descartar a nova peça e tentar novamente
            return createRandomLoad(scene, container, crane, containerWidth, containerLength);
        }
    }   

    // Verificar se a carga intersecta com o contentor
    var containerBox = new THREE.Box3().setFromObject(container);
    if (boxesIntersect(loadBox, containerBox)) {
        // Se houver interseção com o contentor, tentar novamente
        return createRandomLoad(scene, container, crane, containerWidth, containerLength);
    } 

	// Verificar se a carga intersecta com a grua
	var craneBox = new THREE.Box3().setFromObject(crane);
	if (boxesIntersect(loadBox, craneBox)) {
        // Se houver interseção com a grua, tentar novamente
        return createRandomLoad(scene, container, crane, containerWidth, containerLength);
    }
	existingLoads.push(loadMesh);
    scene.add(loadMesh);
}

function createRandomLoads(scene, container, crane, containerWidth, containerLength, numLoads) {
    for (var i = 0; i < numLoads; i++) {
        createRandomLoad(scene, container, crane, containerWidth, containerLength);
    }
}

function addContainerBase(obj, x, y, z) {
    geometry = new THREE.BoxGeometry(100, 1, 50);
    mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y, z);
	obj.add(mesh);
}

function addContainerWall1(obj, x, y, z) {
    geometry = new THREE.BoxGeometry(100, 30, 1);
    mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y, z);
	obj.add(mesh);
}

function addContainerWall2(obj, x, y, z) {
    geometry = new THREE.BoxGeometry(50, 30, 1);
    mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y, z);
	mesh.rotation.y = Math.PI / 2;
    obj.add(mesh);
}

function addContainer(obj, x, y, z) {
    addContainerBase(obj, x, y, z);
    addContainerWall1(obj, x, y + 2.5 , z + 25);
    addContainerWall1(obj, x, y + 2.5 , z - 25);
    addContainerWall2(obj, x+50, y + 2.5 , z);
    addContainerWall2(obj, x-50, y + 2.5 , z);
}

function createContainer(x, y, z) {

    var container = new THREE.Object3D();
    material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true});
    addContainer(container, x, y, z);
    scene.add(container);

    container.position.x = x;
    container.position.y = y;
    container.position.z = z;

    return container;
}

function addBase(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(40, 20, 40);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y, z);
	obj.add(mesh);
}

function addTorre(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(20, 300, 20);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y, z);
	obj.add(mesh);
}

function addPortalanca(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(20, 60, 20);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y+30, z);
	obj.add(mesh);
}

function addContralanca(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(80, 20, 30);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x-30, y+10, z);
	obj.add(mesh);
}

function addTirantes(obj, x, y, z) {
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
	geometry = new THREE.BoxGeometry(30, 10, 30);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x+100, y-5, z);
	obj.add(mesh);
	addCabo(obj, x+100, y-10, z);
}

function addCabo(obj, x, y, z) {
	var len = 100;
	geometry = new THREE.CylinderGeometry(2, 2, len); 
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y-(len/2), z);
	obj.add(mesh);

    bloco = new THREE.Object3D();
	addBloco(bloco, x, y-len, z);
    obj.add(bloco);
}

function addDedo(obj, x, y, z, angle) {
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
    carrinho = new THREE.Object3D();
	addCarrinho(carrinho, x, y, z);
    obj.add(carrinho);
}

function addLanca(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(200, 20, 30);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x+110, y+10, z);
	obj.add(mesh);
	addGancho(obj, x+60, y, z);
}

function addTopo(obj, x, y, z) {
	addPortalanca(obj, x, y, z);
	addContralanca(obj, x, y, z);
	addTirantes(obj, x, y, z);
	addLanca(obj, x, y, z);
}

function addCrane(obj, x, y, z) {
	topo = new THREE.Object3D();
    material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });

	addBase(obj, 0, 10, 0);
	addTorre(obj, 0, 170, 0);
	addTopo(topo, 0, 320, 0);
	topo.rotation.y = 0;
	obj.add(topo);
}

function createCrane(x, y, z) {

	var crane = new THREE.Object3D();
    material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });

	addCrane(crane, x, y, z);
	scene.add(crane);

    crane.position.x = x;
    crane.position.y = y;
    crane.position.z = z;

	return crane;
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

/* UPDATE */
function update() {
    if (keys['a'] || keys['q']) {
        topo.rotation.y += (keys['a'] ? rotationSpeed : 0) - (keys['q'] ? rotationSpeed : 0);
    }

    if (keys['w'] || keys['s']) {
        carrinho.position.x += (keys['w'] ? 1 : 0) - (keys['s'] ? 1 : 0);
    }

    if(keys['e'] || keys['d']) {
        bloco.position.y += (keys['e'] ? 1 : 0) - (keys['d'] ? 1 : 0);
    }
}

/* RENDER */
function render() {
    renderer.render(scene, camera);
}

/* ANIMATION CYCLE */
function animate() {
    requestAnimationFrame(animate);
    update();
    render();
}

/* INITIALIZATION */
function init() {

    createScene();
    createCameras();
    camera = cameras[0];

    var crane = createCrane(0, -200, 0);
	/* FIXME o y está a -150 pq queria ver a grua centrada, mas isto acho que devia ser resolvido na parte das camaras, não aqui */
	var container = createContainer(50, 0, 0);
	crane.add(container);
    createRandomLoads(scene, container, crane, 50, 100, 5);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    render();
    animate();
}

/* KEYBOARD CALLBACK */
function onKeyDown(e) {
    e.preventDefault();
    keys[e.key.toLowerCase()] = true;

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

function onKeyUp(e) {
    e.preventDefault();
    keys[e.key.toLowerCase()] = false;
}

init();
animate();