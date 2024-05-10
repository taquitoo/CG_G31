import * as THREE from 'three';
import { max, varyingProperty } from 'three/examples/jsm/nodes/Nodes.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var scene, renderer, camera;
var cameras = [];
var existingLoads = [];

var keys = {};
var pressedKeys = [];

var geometry, material, mesh;

var topo;
var carrinho;
var bloco;
var cabo;
var dedoSuperior, dedoInferior, pivot;

var caboLen = 200;

var rotationSpeed = Math.PI / 180;

var minCarrinhoX = -135;
var maxCarrinhoX = 0;

var minBlocoY = -80;
var maxBlocoY = caboLen;

var maxDedoRotation = Math.PI / 2;
var minDedoRotation = 0;

var baseMesh;
var baseMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
var carrinhoMesh;
var carrinhoMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
var topoMesh;
var topoMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
var caboMesh;
var caboMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
var dedoMesh;
var dedoMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });

//////////////////
/* CREATE LOADS */
//////////////////
function generateRandomPosition(min, max) {
    return Math.random() * (max - min) + min;
}

// Verifies if two boxes intersect
function boxesIntersect(box1, box2) {
    return (box1.min.x < box2.max.x && box1.max.x > box2.min.x) &&
           (box1.min.y < box2.max.y && box1.max.y > box2.min.y) &&
           (box1.min.z < box2.max.z && box1.max.z > box2.min.z);
}

function createRandomLoad(scene, container, crane, containerWidth, containerLength) {
    // Random dimensions smaller than the container
    var loadWidth = Math.max(Math.random() * containerWidth / 2, 10);
    var loadLength = Math.max(Math.random() * containerLength / 2, 10);
    var loadHeight = Math.max(Math.random() * containerWidth / 2, 10);

    // Random position outside the container
    var loadX = generateRandomPosition(-containerWidth, containerWidth);
    var loadZ = generateRandomPosition(-containerLength, containerLength);

    // Create load
    var polyhedronTypes = ['box', 'dodecahedron', 'icosahedron', 'torus', 'torusknot'];
    var polyhedronType = polyhedronTypes[Math.floor(Math.random() * polyhedronTypes.length)];

    var loadGeometry;
    var loadMaterial = loadMaterial = new THREE.MeshBasicMaterial({ color: 0xA91D3A , wireframe: true});
    var loadMesh;

    switch (polyhedronType) {
        case 'box':
            loadGeometry = new THREE.BoxGeometry(loadWidth, loadHeight, loadLength);

            loadMesh = new THREE.Mesh(loadGeometry, loadMaterial);
            loadMesh.position.set(loadX, -200 + loadHeight/2, loadZ);
            break;

        case 'dodecahedron':
            loadGeometry = new THREE.DodecahedronGeometry(loadWidth / 2);

            loadMesh = new THREE.Mesh(loadGeometry, loadMaterial);
            loadMesh.position.set(loadX, -200 + loadWidth / 2, loadZ);
            break;

        case 'icosahedron':
            loadGeometry = new THREE.IcosahedronGeometry(loadWidth / 2);

            loadMesh = new THREE.Mesh(loadGeometry, loadMaterial);
            loadMesh.position.set(loadX, -200 + loadWidth / 2, loadZ);
            break;

        case 'torus':
            loadGeometry = new THREE.TorusGeometry(loadWidth / 2, loadHeight / 4, 16, 100);

            loadMesh = new THREE.Mesh(loadGeometry, loadMaterial);
            loadMesh.position.set(loadX, -200 + loadWidth/2 + loadHeight / 4, loadZ);
            break;

        case 'torusknot':
            loadGeometry = new THREE.TorusKnotGeometry(loadWidth / 2, loadHeight / 4, 64, 16);

            loadMesh = new THREE.Mesh(loadGeometry, loadMaterial);
            loadMesh.position.set(loadX, -200 + loadWidth/2 + loadHeight / 4, loadZ);
            break;

        default:
            loadGeometry = new THREE.BoxGeometry(loadWidth, loadHeight, loadLength);
            
            loadMesh = new THREE.Mesh(loadGeometry, loadMaterial);
            loadMesh.position.set(loadX, -200 + loadHeight/2, loadZ);
    }

    // Verifie if the load intersects with the existing loads
    var loadBox = new THREE.Box3().setFromObject(loadMesh);
    for (var i = 0; i < existingLoads.length; i++) {
        var existingLoadBox = new THREE.Box3().setFromObject(existingLoads[i]);
        if (boxesIntersect(loadBox, existingLoadBox)) {
            // Se houver interseção, descartar a nova peça e tentar novamente
            return createRandomLoad(scene, container, crane, containerWidth, containerLength);
        }
    }   

    // Verifie if the load intersects with the container
    var containerBox = new THREE.Box3().setFromObject(container);
    if (boxesIntersect(loadBox, containerBox)) {
        // Se houver interseção com o contentor, tentar novamente
        return createRandomLoad(scene, container, crane, containerWidth, containerLength);
    } 

    // Verifie if the load intersects with the crane
	var craneBox = new THREE.Box3().setFromObject(crane);
	if (boxesIntersect(loadBox, craneBox)) {
        // If there is an intersection with the crane, try again
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

//////////////////////
/* CREATE CONTAINER */
//////////////////////
function addContainerBase(obj, x, y, z) {
    // Base dimensions: width (100), height (1), depth (50)
    geometry = new THREE.BoxGeometry(100, 1, 50);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addContainerWall(obj, x, y, z, width, height, depth, rotationY = 0) {
    geometry = new THREE.BoxGeometry(width, height, depth);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y + height / 2, z);
    mesh.rotation.y = rotationY;
    obj.add(mesh);
}

function addContainer(obj, x, y, z) {
    addContainerBase(obj, x, y, z);
    addContainerWall(obj, x, y + 0.5, z + 25, 100, 60, 1); // Front wall
    addContainerWall(obj, x, y + 0.5, z - 25, 100, 60, 1); // Back wall
    addContainerWall(obj, x + 50, y + 0.5, z, 50, 60, 1, Math.PI / 2); // Right wall
    addContainerWall(obj, x - 50, y + 0.5, z, 50, 60, 1, Math.PI / 2); // Left wall
}

function createContainer(x, y, z) {
    var container = new THREE.Object3D();
    material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true});
    addContainer(container, x, y, z);
    scene.add(container);

    container.position.set(x, y, z);

    return container;
}


///////////////////
/* CREATE CRANE */
//////////////////
function addBase(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(40, 20, 40);
	baseMesh = new THREE.Mesh(geometry, baseMaterial);
	baseMesh.position.set(x, y, z);
	obj.add(baseMesh);
}

function addTorre(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(20, 300, 20);
	baseMesh = new THREE.Mesh(geometry, baseMaterial);
	baseMesh.position.set(x, y, z);
	obj.add(baseMesh);
}

function addPortalanca(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(20, 60, 20);
	topoMesh = new THREE.Mesh(geometry, topoMaterial);
	topoMesh.position.set(x, y+30, z);
	obj.add(topoMesh);
}

function addContralanca(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(80, 20, 30);
	topoMesh = new THREE.Mesh(geometry, topoMaterial);
	topoMesh.position.set(x-30, y+10, z);
	obj.add(topoMesh);
}

function addTirantes(obj, x, y, z) {
	geometry = new THREE.CylinderGeometry(2, 2, 30);
	topoMesh = new THREE.Mesh(geometry, topoMaterial);
	topoMesh.rotation.z = Math.PI / 4;
	topoMesh.position.set(x+20, y+30, z);
	obj.add(topoMesh);
	geometry = new THREE.CylinderGeometry(2, 2, 30);
	topoMesh = new THREE.Mesh(geometry, topoMaterial);
	topoMesh.rotation.z = -Math.PI / 4;
	topoMesh.position.set(x-20, y+30, z);
	obj.add(topoMesh);
}

function addCarrinho(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(30, 10, 30);
	carrinhoMesh = new THREE.Mesh(geometry, carrinhoMaterial);
	carrinhoMesh.position.set(x+100, y-5, z);
	obj.add(carrinhoMesh);
	addCabo(obj, x+100, y-10, z);
}

function addCabo(obj, x, y, z) {
    cabo = new THREE.Object3D();
	geometry = new THREE.CylinderGeometry(2, 2, caboLen); 
	caboMesh = new THREE.Mesh(geometry, caboMaterial);
	caboMesh.position.set(x, y-(caboLen/2), z);
    cabo.add(caboMesh);
	obj.add(cabo);

    bloco = new THREE.Object3D();
	addBloco(bloco, x, y-caboLen, z);
    obj.add(bloco);
}

function addDedo(obj, x, y, z, angle) {

    geometry = new THREE.BoxGeometry(2, 10, 2);
    dedoSuperior = new THREE.Mesh(geometry, caboMaterial);
    dedoSuperior.position.set(x, y - 5, z);
    dedoSuperior.rotation.y = angle;

    geometry = new THREE.BoxGeometry(2, 14, 2);
    dedoInferior = new THREE.Mesh(geometry, dedoMaterial);
    
    pivot = new THREE.Object3D();
    pivot.position.set(0, -5, 0);
    dedoInferior.position.set(0, -5, 0);

    pivot.add(dedoInferior);
    dedoSuperior.add(pivot);
    obj.add(dedoSuperior);
}


function addBloco(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(30, 10, 30);
	caboMesh = new THREE.Mesh(geometry, caboMaterial);
	caboMesh.position.set(x, y-5, z);
	obj.add(caboMesh);
	addDedo(obj, x-10, y-10, z-10, -Math.PI/4);
	addDedo(obj, x-10, y-10, z+10, Math.PI/4);
	addDedo(obj, x+10, y-10, z-10, 5*Math.PI/4);
	addDedo(obj, x+10, y-10, z+10, 3*Math.PI/4);

    // Mobile Camera
    var ganchoCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    ganchoCamera.position.set(x, y-10, z);
    ganchoCamera.lookAt(new THREE.Vector3(x, 0, z));
    cameras[5] = ganchoCamera;
}

function addGancho(obj, x, y, z) {
    carrinho = new THREE.Object3D();
    addCarrinho(carrinho, x, y, z);
    obj.add(carrinho);
}


function addLanca(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(200, 20, 30);
	topoMesh = new THREE.Mesh(geometry, topoMaterial);
	topoMesh.position.set(x+110, y+10, z);
	obj.add(topoMesh);
	addCabine(obj, x, y, z+15);
	addGancho(obj, x+60, y, z);
}

function addCabine(obj, x, y, z) {
	geometry = new THREE.BoxGeometry(30, 30, 30);
	topoMesh = new THREE.Mesh(geometry, topoMaterial);
	topoMesh.position.set(x, y, z+15);
	obj.add(topoMesh);
}

function addTopo(obj, x, y, z) {
	addPortalanca(obj, x, y, z);
	addContralanca(obj, x, y, z);
	addTirantes(obj, x, y, z);
	addLanca(obj, x, y, z);
}

function addCrane(obj, x, y, z) {
	topo = new THREE.Object3D();

	addBase(obj, 0, 10, 0);
	addTorre(obj, 0, 170, 0);
	addTopo(topo, 0, 320, 0);
	obj.add(topo);
}

function createCrane(x, y, z) {

	var crane = new THREE.Object3D();

	addCrane(crane, x, y, z);
	scene.add(crane);

    crane.position.x = x;
    crane.position.y = y;
    crane.position.z = z;

	return crane;
}

///////////////////
/* CREATE SCENE */
//////////////////
function createScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xA3D8FF);
}

/////////////////////
/* CREATE CAMERAS */
/////////////////////
function createCameras() {

    const aspectRatio = window.innerWidth / window.innerHeight; 
    const frustumSize = 400;

    // Camera 1: Front View
    const orthographicCameraFront = new THREE.OrthographicCamera(frustumSize * aspectRatio / -2, frustumSize * aspectRatio / 2, frustumSize / 2, frustumSize / -2, 1, 2000);
    orthographicCameraFront.position.set(0, -10, 1000);
    orthographicCameraFront.lookAt(new THREE.Vector3(0, -10, 0));

    // Camera 2: Lateral View
    const orthographicCameraSide = new THREE.OrthographicCamera(frustumSize * aspectRatio / -2, frustumSize * aspectRatio / 2, frustumSize / 2, frustumSize / -2, 1, 2000);
    orthographicCameraSide.position.set(1000, -10, 0);
    orthographicCameraSide.lookAt(new THREE.Vector3(0, -10, 0));

    // Camera 3: Top View
    const orthographicCameraTop = new THREE.OrthographicCamera(frustumSize * aspectRatio / -2, frustumSize * aspectRatio / 2, frustumSize / 2, frustumSize / -2, 1, 2000);
    orthographicCameraTop.position.set(0, 1000, 0);
    orthographicCameraTop.lookAt(scene.position);

    // Camera 4: Isometric perspective, orthogonal projection
    const isometricCameraOrtho = new THREE.OrthographicCamera(-frustumSize, frustumSize, frustumSize, -frustumSize, 1, 2000);
    isometricCameraOrtho.position.set(800, 800, 800);
    isometricCameraOrtho.lookAt(scene.position);

    // Camera 5: Isometric perspective, perspective projection
    const isometricCameraPersp = new THREE.PerspectiveCamera(60, aspectRatio, 1, 2000);
    isometricCameraPersp.position.set(500, 500, 500);
    isometricCameraPersp.lookAt(scene.position);

    // Collect all cameras
    cameras.push(orthographicCameraFront, orthographicCameraSide, orthographicCameraTop, isometricCameraOrtho, isometricCameraPersp);
}

/////////////
/* UPDATE */
////////////
function update() {

    if(keys['q']){
        topo.rotation.y += rotationSpeed;
    }

    if(keys['a']){
        topo.rotation.y -= rotationSpeed;
    }

    if(keys['w'] && carrinho.position.x < maxCarrinhoX){
        carrinho.position.x += 1;
    }

    if(keys['s'] && carrinho.position.x > minCarrinhoX){
        carrinho.position.x -= 1;
    }

    if(keys['e'] && bloco.position.y < maxBlocoY){
        bloco.position.y += 1;
        cameras[5].position.y += 1;
        var newLength = cabo.children[0].geometry.parameters.height - 1;
        var sizeDiff = 1;
        updateCableLength(cabo, newLength, sizeDiff);
    }
    
    if(keys['d'] && bloco.position.y > minBlocoY){
        bloco.position.y -= 1;
        cameras[5].position.y -= 1;
        var newLength = cabo.children[0].geometry.parameters.height + 1;
        var sizeDiff = -1;
        updateCableLength(cabo, newLength, sizeDiff);
    }

    bloco.children.forEach(function(dedoSuperior) {
        dedoSuperior.children.forEach(function(pivot) {
            pivot.children.forEach(function(dedoInferior) {
                if (keys['r'] && pivot.rotation.z < maxDedoRotation) {
                    pivot.rotation.z += 0.05;
                }
                if (keys['f'] && pivot.rotation.z > minDedoRotation) {
                    pivot.rotation.z -= 0.05;
                }
            });
        });
    });
}

function updateCableLength(cabo, newLength, sizeDiff) {

    var oldMesh = cabo.children[0];
    cabo.remove(oldMesh);
    oldMesh.geometry.dispose();

    var newGeometry = new THREE.CylinderGeometry(2, 2, newLength);
    var mesh = new THREE.Mesh(newGeometry, caboMaterial);

    mesh.position.set(oldMesh.position.x, oldMesh.position.y + sizeDiff/2, oldMesh.position.z);
    
    cabo.add(mesh);
}


////////////
/* RENDER */
////////////
function render() {
    renderer.render(scene, camera);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    requestAnimationFrame(animate);
    update();
    render();
}

////////////////////
/* INITIALIZATION */
////////////////////
function init() {

    createScene();
    createCameras();
    camera = cameras[0];

    var crane = createCrane(0, -200, 0);
	
	var container = createContainer(80, 0, 0);
	crane.add(container);
    createRandomLoads(scene, container, crane, 50, 100, 5);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

	var hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.position = 'absolute';
    hud.style.top = '10px';
    hud.style.right = '10px';
    hud.style.color = 'white';
    hud.style.fontFamily = 'Arial, sans-serif';
    hud.style.zIndex = '999';
    document.body.appendChild(hud);


    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    render();
    animate();
}

function updateHUD(content) {
    var hud = document.getElementById('hud');
    hud.textContent = content;
}

///////////////////////
/* KEYBOARD CALLBACK */
///////////////////////
function onKeyDown(e) {
    e.preventDefault();
    keys[e.key.toLowerCase()] = true;

    switch (e.key) {
		case 'q':
		case 'a':
			topoMesh.material.color.set(0xFDE49E);
		case 'w':
		case 's':
			carrinhoMesh.material.color.set(0xFDE49E);
		case 'e':
		case 'd':
			caboMesh.material.color.set(0xFDE49E);
		case 'r':
		case 'f':
			dedoInferior.material.color.set(0xFDE49E);
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
        
        case '6':
            camera = cameras[5];
            break;
		case '7':
			scene.traverse(function (node) {
				if (node instanceof THREE.Mesh) {
					node.material.wireframe = !node.material.wireframe;
				}
			});
			topoMesh.material.wireframe = !topoMesh.material.wireframe;
			//carrinhoMesh.material.wireframe = !carrinhoMesh.material.wireframe;
			//Não sei porque mas o carrinho está a ser mudado no traverse acima
			caboMesh.material.wireframe = !caboMesh.material.wireframe;
			dedoInferior.material.wireframe = !dedoInferior.material.wireframe;
			baseMesh.material.wireframe = !baseMesh.material.wireframe;
			break;
    }
	if (!pressedKeys.includes(event.key)) {
        pressedKeys.push(event.key);
    }
	updateHUD('Keys pressed: ' + pressedKeys.join(', '));
}

function onKeyUp(e) {
    e.preventDefault();
    keys[e.key.toLowerCase()] = false;

	topoMesh.material.color.set(0xffffff);
	carrinhoMesh.material.color.set(0xffffff);
	caboMesh.material.color.set(0xffffff);
	dedoInferior.material.color.set(0xffffff);

	const index = pressedKeys.indexOf(event.key);
    if (index > -1) {
        pressedKeys.splice(index, 1);
    }
    updateHUD('Keys pressed: ' + pressedKeys.join(', '));
}

init();
animate();
