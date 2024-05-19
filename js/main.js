import * as THREE from 'three'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';


const ROTATION_SPEED = Math.PI/1440;
const RADIAL_SEGMENTS = 64;

var scene, renderer, camera; 
var directionalLight, ambientLight;

var carousel;
var pointLights = []; 

var keys = {};
var pressedKeys = [];

var materials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0xFFD0D0 }),
    phong: new THREE.MeshPhongMaterial({ color: 0xFFD0D0, specular: 0x009900, shininess: 30 }),
    toon: new THREE.MeshToonMaterial({ color: 0xFFD0D0 }),
    normal: new THREE.MeshNormalMaterial()
};

var materialDefault = new THREE.MeshPhongMaterial({color: 0xFFD0D0, wireframe: false});

var counter = [0, Math.PI/2, Math.PI/2, Math.PI/2];

function createSkydome() {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('js/1.png');
    const geometry = new THREE.SphereGeometry(500, 32, 32);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const skydome = new THREE.Mesh(geometry, material);
    scene.add(skydome);
}

function createMobiusStrip() {
    const radius = 45;
    const width = 5;
    const lengthSegments = 200;
    const widthSegments = 1;

    const positions = [];
    const indices = [];

    for (let j = 0; j <= widthSegments; j++) {
        for (let i = 0; i <= lengthSegments; i++) {
            const theta = (i / lengthSegments) * 2 * Math.PI;
            const phi = (j / widthSegments) * Math.PI - Math.PI / 2;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = radius * cosTheta + width * cosTheta * cosPhi;
            const y = radius * sinTheta + width * sinTheta * cosPhi;
            const z = width * sinPhi;

            positions.push(x, y, z);
        }
    }

    for (let j = 0; j < widthSegments; j++) {
        for (let i = 0; i < lengthSegments; i++) {
            const a = j * (lengthSegments + 1) + i;
            const b = j * (lengthSegments + 1) + i + 1;
            const c = (j + 1) * (lengthSegments + 1) + i + 1;
            const d = (j + 1) * (lengthSegments + 1) + i;

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.MeshBasicMaterial({ color: 0x00000, side: THREE.DoubleSide, wireframe: true });
    const mobiusStrip = new THREE.Mesh(geometry, material);

    mobiusStrip.position.set(0, 60, 0);
    mobiusStrip.rotation.x = Math.PI / 2;

    scene.add(mobiusStrip);
}

function createPointLightsOnMobius() {

}

function addCarouselBase(obj, x, y, z, radius, height) {
    var geometry = new THREE.CylinderGeometry(radius, radius, height, RADIAL_SEGMENTS);
    var mesh = new THREE.Mesh(geometry, materialDefault);
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
		this.surfaces_number = new Array(Carousel.N_RINGS+1);
		for(var i = 0; i <= Carousel.N_RINGS; i++) {
			this.surfaces_number[i] = 0;
		}
	}
	setRingElevation(ring_number, percentage) {
		const ring = this.children[ring_number];
		if(ring) {
			/* TODO check if the rings can get lower than the base*/
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
			this.children[ring_number].add(surface);
			this.surfaces_number[ring_number]++;
			
			//Add spotligth in the ring pointing to the surface
			const spotlight = new THREE.SpotLight(0xffffff, 1, 50, Math.PI/2, 0.8, 0.5);
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

function updateMaterial(materialType) {
    scene.traverse(function (object) {
        if (object.isMesh) {
            object.material = materials[materialType];
            object.material.needsUpdate = true;
        }
    });
}

function toggleLighting() {
    scene.traverse(function (object) {
        if (object.isLight) {
            object.visible = !object.visible;
        }
    });
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
	/* TODO initial camera to be able to see what I'm doing, not the one asked */
	const aspectRatio = window.innerWidth / window.innerHeight;
	const width = 400;
	const height = width / aspectRatio;
	camera = new THREE.OrthographicCamera(-width, width, height, -height, 1, 1000);
	camera.position.set(200, 200, 200);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
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
		for(var j=0; j<carousel.surfaces_number[i]; j++) {
			carousel.children[i].children[j*2].rotation.y += ROTATION_SPEED*4;
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
			toggleLighting();
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

function init() {
	createScene();
	createCamera();
	createLighting();

	createSkydome();

	carousel = new Carousel(0, 0, 0);
    scene.add(carousel);

	/* Example of how to add a surface to the carousel 
	 * Use it as you need it inside your function to add the various surfaces
	 * Take into account that the surfaces centroid is added to the floor of the ring,
	 * so you have to have the referential of each surface at its bottom,
	 * otherwise half of the surface will be inside the ring
	 * */
	for (var i=1; i<=8; i++) {
		carousel.addSurface(1, new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20).translate(0, 10, 0), materialDefault));
		carousel.addSurface(2, new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20).translate(0, 10, 0), materialDefault));
		carousel.addSurface(3, new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20).translate(0, 10, 0), materialDefault));
	}

	createMobiusStrip();
	createPointLightsOnMobius();

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
	const controls = new OrbitControls(camera, renderer.domElement)

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
	window.addEventListener("resize", onWindowResize);

	render();
	animate();
}

init();
animate();
