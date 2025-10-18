import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Initialisation de Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Utiliser le conteneur dédié pour le rendu
const modelContainer = document.getElementById('model-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
modelContainer.appendChild(renderer.domElement);

// Ajouter des contrôles d'orbite
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;

// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Variable pour garder le modèle accessible depuis animate()
let loadedModel = null;

// Charger le modèle GLTF
const loader = new GLTFLoader();
loader.load('./models/scene.gltf', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    loadedModel = model;

    // --- IMPORTANT : enlever position arbitraire ---
    // model.position.set(10, 10, 10); // <-- supprimé

    // Calculer bounding box et centrer le modèle à l'origine
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Recentre le modèle (déplace le modèle pour que son centre soit à 0,0,0)
    model.position.sub(center);

    // Redimensionner automatiquement pour qu'il soit plus grand à l'écran
    // "desired" est la taille cible maximale (en unités Three.js) : ajuste si nécessaire
    const desired = 4; // tu peux augmenter (ex: 6) si tu veux encore plus grand
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? (desired / maxDim) : 1;
    model.scale.setScalar(scale);

    // Recalculer la boite après mise à l'échelle / recentrage
    const newBox = new THREE.Box3().setFromObject(model);
    const newCenter = newBox.getCenter(new THREE.Vector3());
    const newSize = newBox.getSize(new THREE.Vector3());

    // Placer la caméra face au modèle (on met la caméra en z positif par rapport au centre)
    const distance = Math.max(newSize.x, newSize.y, newSize.z) * 0.7;
    camera.position.set(newCenter.x, newCenter.y, newCenter.z + distance);
    controls.target.copy(newCenter);
    controls.update();

    // Orienter le modèle pour faire face à la caméra (utile si l'on voit la "gauche" par défaut)
    // `lookAt` oriente l'axe +Z local vers la caméra : si ton modèle "avant" n'est pas +Z, ajuste ensuite.
    model.lookAt(camera.position);

    // Option : si lookAt n'est pas correct (toujours la mauvaise face), décommente l'une des lignes ci-dessous
    // model.rotation.y = Math.PI / 2;   // tourne de 90°
    // model.rotation.y = -Math.PI / 2;  // tourne de -90°
    // model.rotation.y = Math.PI;       // tourne de 180°

    // Option : démarre une rotation automatique lente pour inspecter l'objet
    model.userData.autoRotate = true; // mettre false pour désactiver
}, undefined, (error) => {
    console.error('Erreur lors du chargement du GLTF :', error);

    // Créer un cube de secours si le modèle ne charge pas
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({ color: 0x3498db });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    loadedModel = cube;
    cube.userData.autoRotate = true;
});

// Ajustement initial si modèle absent encore
camera.position.z = 10;

// Animation
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Rotation automatique lente si activée
    if (loadedModel && loadedModel.userData && loadedModel.userData.autoRotate) {
        loadedModel.rotation.y += 0.005; // vitesse : augmente si tu veux plus rapide
    }

    renderer.render(scene, camera);
}
animate();

// Redimensionnement
window.addEventListener('resize', () => {
    camera.aspect = modelContainer.clientWidth / modelContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
});

// Navigation fluide (inchangé)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Animation nav (inchangé)
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 100) {
        nav.style.padding = '0.5rem 0';
        nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        nav.style.padding = '1rem 0';
        nav.style.boxShadow = 'none';
    }
});

// Gestion du formulaire (inchangé)
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Merci pour votre message ! Je vous répondrai dans les plus brefs délais.');
    this.reset();
});
