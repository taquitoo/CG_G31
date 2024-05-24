import * as THREE from 'three'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { StereoCamera } from 'three';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';


'use strict';

const RADIAL_SEGMENTS = 64;
const ROTATION_SPEED = Math.PI / 180;

var scene, renderer, camera;
var stereoCamera; 
var directionalLight, ambientLight;

var carousel;
var pointLights = []; 

var keys = {};

var materials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0xFFD0D0 }),
    phong: new THREE.MeshPhongMaterial({ color: 0xFFD0D0, specular: 0x009900, shininess: 30 }),
    toon: new THREE.MeshToonMaterial({ color: 0xFFD0D0 }),
    normal: new THREE.MeshNormalMaterial(),
    basic: new THREE.MeshBasicMaterial({ color: 0xFFD0D0 })
};

var materialsPieces = {
    lambert: new THREE.MeshLambertMaterial({ color: 0x90E0EF }),
    phong: new THREE.MeshPhongMaterial({ color: 0x90E0EF, specular: 0x009900, shininess: 30 }),
    toon: new THREE.MeshToonMaterial({ color: 0x90E0EF }),
    normal: new THREE.MeshNormalMaterial(),
    basic: new THREE.MeshBasicMaterial({ color: 0x90E0EF })
};

var materialsGround = {
    lambert: new THREE.MeshLambertMaterial({ color: 0x000000 }),
    phong: new THREE.MeshPhongMaterial({ color: 0x000000, specular: 0x009900, shininess: 30 }),
    toon: new THREE.MeshToonMaterial({ color: 0x000000 }),
    normal: new THREE.MeshNormalMaterial(),
    basic: new THREE.MeshBasicMaterial({ color: 0x000000 })
};

var materialsMobious = {
    lambert: new THREE.MeshLambertMaterial({ 
        color: 0xADFF2F, 
        side: THREE.DoubleSide
    }),
    phong: new THREE.MeshPhongMaterial({ 
        color: 0xADFF2F, 
        side: THREE.DoubleSide
    }),
    toon: new THREE.MeshToonMaterial({ 
        color: 0xADFF2F, 
        side: THREE.DoubleSide
    }),
    normal: new THREE.MeshNormalMaterial({
        side: THREE.DoubleSide
    }),
    basic: new THREE.MeshBasicMaterial({
        color: 0xADFF2F,
        side: THREE.DoubleSide
    })
};

const map = new THREE.TextureLoader().load('js/poem.jpg');
const bmap = new THREE.TextureLoader().load('js/poem_bump.jpg');

var materialsSkydome = {
    lambert: new THREE.MeshPhongMaterial({
        bumpMap: bmap,
        bumpScale: 1.3,
        map: map,
    }),
    phong: new THREE.MeshPhongMaterial({
        bumpMap: bmap,
        bumpScale: 1.3,
        map: map,
    }),
    toon: new THREE.MeshToonMaterial({
        bumpMap: bmap,
        bumpScale: 1.3,
        map: map,
    }),
    normal: new THREE.MeshNormalMaterial({
        bumpMap: bmap,
        bumpScale: 1.3,
    }),
    basic: new THREE.MeshBasicMaterial({
        map: map,
    })
}

/*var counter = [0, Math.PI, 2*Math.PI/3, Math.PI/3];*/
var movToggle = [false, true, true, true];

const parametricGeometries = [
    new ParametricGeometry(hyperboloid, 25, 25),
    new ParametricGeometry(hyperbolicParaboloid, 25, 25),
    new ParametricGeometry(torus, 25, 25),
    new ParametricGeometry(lemniscateOfGerono, 25, 25),
    new ParametricGeometry(helicoid, 25, 25),
    new ParametricGeometry(cone, 25, 25),
    new ParametricGeometry(catenoid, 25, 25),
    new ParametricGeometry(enneper, 25, 25)
];

function createSkydome() {

    const geometry = new THREE.SphereGeometry(500, 32, 32);
    geometry.scale(-1, 1, 1);
    const skydome = new THREE.Mesh(geometry, materialsSkydome.lambert);

	skydome.name = 'skydome';
    scene.add(skydome);
}

function createMobiusStrip() {
    const radius = 45;
    const stripWidth = 5;
    const lengthSegments = 200;
    const positions = [];
    const indices = [];
	const lightPositions = [];

    for (let i = 0; i <= lengthSegments; i++) {
        const theta = (i / lengthSegments) * 2 * Math.PI;
        const halfTwist = (i / lengthSegments) * Math.PI;

        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        const sinHalfTwist = Math.sin(halfTwist);
        const cosHalfTwist = Math.cos(halfTwist);

        const xTop = (radius + stripWidth * cosHalfTwist) * cosTheta;
        const yTop = (radius + stripWidth * cosHalfTwist) * sinTheta;
        const zTop = stripWidth * sinHalfTwist;

        const xBottom = (radius - stripWidth * cosHalfTwist) * cosTheta;
        const yBottom = (radius - stripWidth * cosHalfTwist) * sinTheta;
        const zBottom = -stripWidth * sinHalfTwist;

        positions.push(xTop, yTop, zTop);
        positions.push(xBottom, yBottom, zBottom);
    }

    for (let i = 0; i < lengthSegments; i++) {
        const a = 2 * i;
        const b = 2 * i + 1;
        const c = (2 * i + 3) % (2 * (lengthSegments + 1));
        const d = (2 * i + 2) % (2 * (lengthSegments + 1));

        indices.push(a, b, d);
        indices.push(b, c, d);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = materialsMobious.lambert;
    const mobiusStrip = new THREE.Mesh(geometry, material);
    mobiusStrip.position.set(0, 100, 0);
    mobiusStrip.rotation.x = Math.PI / 2;

    mobiusStrip.name = 'mobiusStrip';
    scene.add(mobiusStrip);

	for(var i=0; i<8; i++) {
		lightPositions.push({x:Math.cos(i*Math.PI/4)*radius, y:100, z:Math.sin(i*Math.PI/4)*radius});
	}

	lightPositions.forEach(pos => {
        const pointLight = new THREE.PointLight(0x00ff00, 1000, 1000);
        pointLight.position.set(pos.x, pos.y, pos.z);
		pointLights.push(pointLight);
        scene.add(pointLight);
    });
}

function addCarouselBase(obj, x, y, z, radius, height) {
    var geometry = new THREE.CylinderGeometry(radius, radius, height, RADIAL_SEGMENTS);
    var mesh = new THREE.Mesh(geometry, materials.lambert);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addCarouselRing(obj, x, y, z, innerRadius, outerRadius) {
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
		steps: RADIAL_SEGMENTS,
		bevelEnabled: false,
		extrudePath: path
	};

	const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

	const mesh = new THREE.Mesh(geometry, materials.lambert);
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
		this.surfaces_number = new Array(Carousel.N_RINGS+1);
		for(var i = 0; i <= Carousel.N_RINGS; i++) {
			this.surfaces_number[i] = 0;
		}
	}
	setRingElevation(ring_number, percentage) {
		const ring = this.children[ring_number];
		if(ring) {
			ring.position.y = (percentage+1)/2 * Carousel.RING_HEIGHT/2;
		}
	}
	addSurface(ring_number, surface) {
		if(this.surfaces_number[ring_number] < 8) {
			let angle = Math.PI/4 * this.surfaces_number[ring_number];
			surface.position.set(
				Math.cos(angle) * Carousel.RING_WIDTH * (0.5+ring_number),
				Carousel.RING_HEIGHT/2, 
				Math.sin(angle) * Carousel.RING_WIDTH * (0.5+ring_number),
			);
            surface.name = 'piece';
			this.children[ring_number].add(surface);
			this.surfaces_number[ring_number]++;
			
			const spotlight = new THREE.SpotLight(0xff0000, 10, 50, Math.PI/2, 0.8, 0.5);
			spotlight.position.set(
				Math.cos(angle) * Carousel.RING_WIDTH * (ring_number),
				Carousel.RING_HEIGHT/2,
				Math.sin(angle) * Carousel.RING_WIDTH * (ring_number),
			);
			spotlight.target = surface;
			this.children[ring_number].add(spotlight);
		}
	}
}

// Superfícies Paramétricas
function hyperboloid(u, v, target) {
    const a = 1, b = 1, c = 1;
    u = u * Math.PI * 2;
    v = (v - 0.5) * Math.PI;
    const x = a * Math.sinh(v) * Math.cos(u);
    const y = b * Math.sinh(v) * Math.sin(u);
    const z = c * Math.cosh(v);
    target.set(x, y, z);
}

function hyperbolicParaboloid(u, v, target) {
    const a = 1, b = 1;
    u = (u - 0.5) * 4;
    v = (v - 0.5) * 4;
    const x = u;
    const y = v;
    const z = (u * u / a / a) - (v * v / b / b);
    target.set(x, y, z);
}

function torus(u, v, target) {
    const R = 3, r = 1;
    u = u * Math.PI * 2;
    v = v * Math.PI * 2;
    const x = (R + r * Math.cos(v)) * Math.cos(u);
    const y = (R + r * Math.cos(v)) * Math.sin(u);
    const z = r * Math.sin(v);
    target.set(x, y, z);
}

function lemniscateOfGerono(u, v, target) {
    u = u * Math.PI * 2;
    v = (v - 0.5) * 2;    
    const x = Math.cos(u);
    const y = Math.sin(u) * Math.cos(u);
    const z = v;
    target.set(x, y, z);
}

function helicoid(u, v, target) {
    const a = 1;
    u = u * Math.PI * 2;
    v = v * 4 - 2;
    const x = v * Math.cos(u);
    const y = v * Math.sin(u);
    const z = a * u;
    target.set(x, y, z);
}

function cone(u, v, target) {
    const r = 1;
    u = u * Math.PI * 2;
    v = v * r;
    const x = v * Math.cos(u);
    const y = v * Math.sin(u);
    const z = r - v;
    target.set(x, y, z);
}

function catenoid(u, v, target) {
    const a = 1;
    u = (u - 0.5) * 4;
    v = v * Math.PI * 2;
    const x = a * Math.cosh(u) * Math.cos(v);
    const y = a * Math.cosh(u) * Math.sin(v);
    const z = u;
    target.set(x, y, z);
}

function enneper(u, v, target) {
    u = (u - 0.5) * 2;
    v = (v - 0.5) * 2;
    const x = u - (u * u * u / 3) + u * v * v;
    const y = v - (v * v * v / 3) + v * u * u;
    const z = u * u - v * v;
    target.set(x, y, z);
}

function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = materialsGround.lambert;
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -50;
    ground.receiveShadow = true;

    ground.name = 'ground';
    scene.add(ground);
}


function createLighting() {
	directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(300, 1000, 200).normalize();
	scene.add(directionalLight);

	// orange-ish ambient light
	ambientLight = new THREE.AmbientLight(0xFF6500, 0.5);
	scene.add(ambientLight);
}

function createCamera() {
	const aspectRatio = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera(75, aspectRatio, 1, 2000);
	camera.position.set(200, 200, 400);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

    stereoCamera = new StereoCamera();
    stereoCamera.aspect = 0.5;
}

function createScene() {
	scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00000);
}

function render() {
    if (renderer.xr.isPresenting) {
        stereoCamera.update(camera);
        renderer.render(scene, stereoCamera.cameraL);
        renderer.render(scene, stereoCamera.cameraR);
    } else {
        renderer.render(scene, camera);
    }
}

function update() {
	carousel.rotation.y += ROTATION_SPEED;

	for(var i=1; i<=Carousel.N_RINGS; i++){
		if(movToggle[i]){
			var percentage = -Math.sin(new Date().getTime()/500 + i);
			/*counter[i] += 0.08; Check if this is the intended behaviour
			 * Because at first, when we did the movement with our counter,
			 * when we stopped and resumed the movement, it resumed from the 
			 * point it had stopped, but now using time, the ring may 
			 * change elevation abruptly.
			 */
			carousel.setRingElevation(i, percentage);
		}
		for(var j=0; j<carousel.surfaces_number[i]; j++) {
            if (j * 2 < carousel.children[i].children.length) {
			    carousel.children[i].children[j*2].rotation.y += ROTATION_SPEED*4;
            }
		}
	}
}

function animate() {
    update();
    render();
}

function updateMaterial(materialType) {
    scene.traverse(function (object) {
        if (object.isMesh && object.name !== 'skydome' && object.name !== 'mobiusStrip' && object.name !== 'ground' && object.name !== 'piece') {
            object.material = materials[materialType];
            object.material.needsUpdate = true;
        }
		else if (object.name === 'mobiusStrip') {
			object.material = materialsMobious[materialType];
			object.material.needsUpdate = true;
		}
        else if (object.name === 'skydome') {
            object.material = materialsSkydome[materialType];
            object.material.needsUpdate = true;
        }
        else if (object.name === 'ground') {
            object.material = materialsGround[materialType];
            object.material.needsUpdate = true;
        }
        else if(object.name === 'piece') {
            object.material = materialsPieces[materialType];
            object.material.needsUpdate = true;
        }
    });
}

function onKeyDown(e) {
    e.preventDefault();
    keys[e.key.toLowerCase()] = true;
    switch (e.key.toLowerCase()) {
        case 'd':
            directionalLight.visible = !directionalLight.visible;
            break;
        case 's':
            for(var i=1; i<=Carousel.N_RINGS; i++) {
				for(var j=0; j<carousel.surfaces_number[i]; j++) {
					carousel.children[i].children[j*2+1].visible = !carousel.children[i].children[j*2+1].visible;
				}
			}
            break;
        case 'p':
            pointLights.forEach(light => {
                light.visible = !light.visible;
            });
            break;
        case 'q':
            updateMaterial('lambert');
            break;
        case 'w':
            updateMaterial('phong');
            break;
        case 'e':
            updateMaterial('toon');
            break;
        case 'r':
            updateMaterial('normal');
            break;
		case 't':
			updateMaterial('basic');
			break;
		case '1':
			movToggle[1] = !movToggle[1];
			break;
		case '2':
			movToggle[2] = !movToggle[2];
			break;
		case '3':
			movToggle[3] = !movToggle[3];
			break;
    }
}

function onKeyUp(e) {
	e.preventDefault();
	keys[e.key.toLowerCase()] = false;
}

function onWindowResize() {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const width = 400;
    const height = width / aspectRatio;
    camera.left = -width;
    camera.right = width;
    camera.top = height;
    camera.bottom = -height;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function getRandomScale() {
    return Math.random() * 1.5 + 1;
}

function getRandomRotation() {
    return Math.random() * Math.PI * 2; 
}

function init() {
	createScene();
	createCamera();
	createLighting();

    createGround();
	createSkydome();

	carousel = new Carousel(0, 0, 0);
    scene.add(carousel);

	/* Example of how to add a surface to the carousel 
	 * Use it as you need it inside your function to add the various surfaces
	 * Take into account that the surfaces centroid is added to the floor of the ring,
	 * so you have to have the referential of each surface at its bottom,
	 * otherwise half of the surface will be inside the ring
	 * */
	parametricGeometries.forEach (geometry => {
        for (let i = 1; i <= 3; i++){
            const geometryClone = geometry.clone();
            geometryClone.scale(getRandomScale()*i, getRandomScale()*i, getRandomScale()*i);
            geometryClone.rotateX(getRandomRotation());
            geometryClone.rotateY(getRandomRotation());
            geometryClone.rotateZ(getRandomRotation());
            const piece = new THREE.Mesh(geometryClone.translate(0, 10*i, 0), materialsPieces.lambert);
            carousel.addSurface(i, piece);
        }
	}); 

	createMobiusStrip();

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));
	const controls = new OrbitControls(camera, renderer.domElement)

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
	window.addEventListener("resize", onWindowResize);

	render();
	renderer.setAnimationLoop(animate);
}

init();
animate();
