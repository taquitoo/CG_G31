import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js';
import { max, varyingProperty } from 'three/examples/jsm/nodes/Nodes.js';
/*
import {
  OrbitControls
} from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';
*/

const ROTATION_SPEED = Math.PI/1440;

var scene, renderer; 
var camera;

var carousel;

var keys = {};
var pressedKeys = [];

var materialDefault = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true});
//var materialDefault = new THREE.MeshPhongMaterial();

var counter = [0, 0, 0, 0];

function addCarouselBase(obj, x, y, z, radius, height) {
    var geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    var mesh = new THREE.Mesh(geometry, materialDefault);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addCarouselRing(obj, x, y, z, innerRadius, outerRadius) {
	/*
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
	hemiLight.position.set(0, 150, 0);
	scene.add(hemiLight);

	const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
	dirLight.position.set(-130, 150, 150);
	scene.add(dirLight);
*/

	const width = 100;
	const height = outerRadius - innerRadius;
	const radius = innerRadius + (outerRadius - innerRadius)/2

	const path = new THREE.Curve();
	path.getPoint = (t) => {
	  const radians = 2 * Math.PI * t;
	  return new THREE.Vector3(radius * Math.cos(radians), 0,
	    radius * Math.sin(radians));
	};

	const shape = new THREE.Shape();
	shape.moveTo(-width / 2, -height / 2);
	shape.lineTo(width / 2, -height / 2);
	shape.lineTo(width / 2, height / 2);
	shape.lineTo(-width / 2, height / 2);
	shape.lineTo(-width / 2, -height / 2);

	const extrudeSettings = {
		depth: 10,
		steps: 32,
		bevelEnabled: false,
		extrudePath: path
	};

	const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

	const mesh = new THREE.Mesh(geometry, materialDefault);
	obj.add(mesh);

}

class Carousel extends THREE.Object3D {
	static RING_WIDTH = 50;
	static RING_HEIGHT = 100;
	static N_RINGS = 3;
	constructor(x, y, z) {
		super();
		addCarouselBase(this, x, y, z, Carousel.RING_WIDTH, Carousel.RING_HEIGHT);
		for (var i=0; i<Carousel.N_RINGS; i++) {
			addCarouselRing(this, x, y, z,
								Carousel.RING_WIDTH*(1+i),
								Carousel.RING_WIDTH*(2+i));
		}
	}
	setRingElevation(ring_number, percentage) {
		const ring = this.children[ring_number];
		if(ring) {
			/* TODO check if the rings can get lower than the base*/
			ring.position.y = (percentage+1)/2 * Carousel.RING_HEIGHT/2;
		}
	}
}

function createCamera() {
	/* TODO initial camera to be able to see what I'm doing, not the one asked */
    const aspectRatio = window.innerWidth / window.innerHeight; 
    const frustumSize = 400;
    camera = new THREE.OrthographicCamera(-frustumSize, frustumSize, frustumSize, -frustumSize, 1, 2000);
    camera.position.set(800, 800, 800);
    camera.lookAt(new THREE.Vector3(0, 190, 0));
	/*
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
	camera.position.z = 50;
	*/
}

function createScene() {
	scene = new THREE.Scene();
    scene.background = new THREE.Color(0xA3D8FF);
}

function render() {
	renderer.render(scene, camera);
}

function update() {
	carousel.rotation.y += ROTATION_SPEED;

	for(var i=1; i<=Carousel.N_RINGS; i++){
		if(keys[i]) {
			var percentage = Math.sin(counter[i]);
			counter[i] += 3.1;
			carousel.setRingElevation(i, percentage);
		}
	}
}

function animate() {
    requestAnimationFrame(animate);
    update();
    render();
}

function onKeyDown(e) {
	e.preventDefault();
	keys[e.key.toLowerCase()] = true;
}

function onKeyUp(e) {
	e.preventDefault();
	keys[e.key.toLowerCase()] = false;
}

function init() {
	createScene();
	createCamera();

	carousel = new Carousel(0, 0, 0);
    scene.add(carousel);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
	//const controls = new OrbitControls(camera, renderer.domElement)

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

	render();
	animate();
}

init();
animate();
