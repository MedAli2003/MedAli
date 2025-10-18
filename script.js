import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Animation du background avec la souris
const bgAnimation = document.getElementById('bgAnimation');
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 20;
    targetY = (e.clientY / window.innerHeight - 0.5) * 20;
});

function updateBackground() {
    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;
    
    bgAnimation.style.background = `
        radial-gradient(
            circle at ${50 + mouseX}% ${50 + mouseY}%,
            rgba(13, 107, 196, 0.3) 0%,
            rgba(11, 18, 38, 0.8) 30%,
            rgba(26, 21, 61, 0.9) 60%,
            rgba(8, 8, 18, 1) 100%
        )
    `;
    
    requestAnimationFrame(updateBackground);
}

updateBackground();

// Animation du nom
const animatedName = document.getElementById('animatedName');
const nameParts = document.querySelectorAll('.name-part');

function animateName() {
    nameParts.forEach((part, index) => {
        setTimeout(() => {
            part.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                part.style.transform = 'translateY(0)';
            }, 200);
        }, index * 100);
    });
}

// Répéter l'animation du nom toutes les 5 secondes
setInterval(animateName, 5000);

// Initialiser l'animation au chargement
animateName();

// Three.js Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const modelContainer = document.getElementById('model-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
modelContainer.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Load 3D Model
let loadedModel = null;
const loader = new GLTFLoader();

loader.load('./models/scene.gltf', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    loadedModel = model;

    // Center and scale model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center);

    const desired = 4;
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? (desired / maxDim) : 1;
    model.scale.setScalar(scale);

    const newBox = new THREE.Box3().setFromObject(model);
    const newCenter = newBox.getCenter(new THREE.Vector3());
    const newSize = newBox.getSize(new THREE.Vector3());

    const distance = Math.max(newSize.x, newSize.y, newSize.z) * 0.7;
    camera.position.set(newCenter.x, newCenter.y, newCenter.z + distance);
    controls.target.copy(newCenter);
    controls.update();

    model.lookAt(camera.position);
    model.userData.autoRotate = true;

}, undefined, (error) => {
    console.error('Erreur lors du chargement du GLTF :', error);
    
    // Fallback cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x3498db,
        transparent: true,
        opacity: 0.8
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    loadedModel = cube;
    cube.userData.autoRotate = true;
});

camera.position.z = 10;

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (loadedModel && loadedModel.userData && loadedModel.userData.autoRotate) {
        loadedModel.rotation.y += 0.005;
    }

    renderer.render(scene, camera);
}
animate();

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = modelContainer.clientWidth / modelContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
});

// Smooth Navigation
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

// Nav Animation
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

// Form Handler
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Merci pour votre message ! Je vous répondrai dans les plus brefs délais.');
    this.reset();
});

// Intersection Observer pour les animations au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observer les cartes et le tableau
document.querySelectorAll('.card, .associative-table').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});
