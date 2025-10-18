import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Initialisation de Three.js pour la planète
const planetScene = new THREE.Scene();
const planetCamera = new THREE.PerspectiveCamera(400, window.innerWidth / window.innerHeight, 0.1, 100);

// Utiliser le conteneur dédié pour la planète
const planetContainer = document.getElementById('planet-container');
const planetRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
planetRenderer.setPixelRatio(window.devicePixelRatio);
planetRenderer.setSize(planetContainer.clientWidth, planetContainer.clientHeight);
planetRenderer.setClearColor(0x000000, 0); // Fond transparent
planetContainer.appendChild(planetRenderer.domElement);

// Ajouter des contrôles d'orbite
const planetControls = new OrbitControls(planetCamera, planetRenderer.domElement);
planetControls.enableDamping = true;
planetControls.dampingFactor = 0.05;
planetControls.enableZoom = true;
planetControls.autoRotate = true;
planetControls.autoRotateSpeed = 0.5;

// Lumières pour la planète
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
planetScene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
planetScene.add(directionalLight);

const pointLight = new THREE.PointLight(0x4488ff, 0.5, 100);
pointLight.position.set(100, 100, 100);
planetScene.add(pointLight);

// Variable pour garder le modèle accessible
let planetModel = null;

// Charger le modèle GLTF de la planète
const loader = new GLTFLoader();
loader.load('./planet/scene.gltf', (gltf) => {
    const model = gltf.scene;
    planetScene.add(model);
    planetModel = model;

    // Calculer bounding box et centrer le modèle
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Recentrer le modèle
    model.position.sub(center);

    // Ajuster l'échelle pour qu'il soit bien visible
    const desired = 3; // Ajustez cette valeur selon la taille de votre modèle
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? (desired / maxDim) : 1;
    model.scale.setScalar(scale);

    // Recalculer après mise à l'échelle
    const newBox = new THREE.Box3().setFromObject(model);
    const newCenter = newBox.getCenter(new THREE.Vector3());
    const newSize = newBox.getSize(new THREE.Vector3());

    // Positionner la caméra
    const distance = Math.max(newSize.x, newSize.y, newSize.z) * 1.5;
    planetCamera.position.set(newCenter.x, newCenter.y, newCenter.z + distance);
    planetControls.target.copy(newCenter);
    planetControls.update();

    // Rotation automatique
    model.userData.autoRotate = true;

    console.log('Modèle planète chargé avec succès');

}, undefined, (error) => {
    console.error('Erreur lors du chargement du modèle planète :', error);

    // Créer une sphère de secours si le modèle ne charge pas
    const geometry = new THREE.SphereGeometry(2, 32, 32);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x3498db,
        transparent: true,
        opacity: 0.5
    });
    const sphere = new THREE.Mesh(geometry, material);
    planetScene.add(sphere);
    planetModel = sphere;
    sphere.userData.autoRotate = true;
});

// Position initiale de la caméra
planetCamera.position.z = 8;

// Animation
function animatePlanet() {
    requestAnimationFrame(animatePlanet);
    
    // Rotation automatique du modèle
    if (planetModel && planetModel.userData && planetModel.userData.autoRotate) {
        planetModel.rotation.y += 0.005;
    }
    
    planetControls.update();
    planetRenderer.render(planetScene, planetCamera);
}
animatePlanet();

// Redimensionnement
window.addEventListener('resize', () => {
    planetCamera.aspect = planetContainer.clientWidth / planetContainer.clientHeight;
    planetCamera.updateProjectionMatrix();
    planetRenderer.setSize(planetContainer.clientWidth, planetContainer.clientHeight);
});

// Gestion des erreurs WebGL
planetRenderer.domElement.addEventListener('webglcontextlost', (event) => {
    console.warn('WebGL context lost in planet renderer');
    event.preventDefault();
}, false);

planetRenderer.domElement.addEventListener('webglcontextrestored', () => {
    console.log('WebGL context restored in planet renderer');
    animatePlanet();
}, false);