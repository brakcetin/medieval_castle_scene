import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SceneManager } from './scene.js';
import { PlayerControls } from './controls.js';
import { Catapult, Stone, Torch } from './objects.js';
import { LightingManager } from './lighting.js';

class MedievalCastleApp {
    constructor() {
        // Scene setup
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(5, 2, 10);
        
        // Scene manager
        this.sceneManager = new SceneManager(this.renderer, this.camera);
        
        // Lighting
        this.lightingManager = new LightingManager(this.sceneManager.scene);
        
        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Game state
        this.score = 0;
        this.scoreElement = document.getElementById('score');
        this.isNightMode = false;
        this.torchBrightness = 1.0;
        
        // Object collections
        this.interactiveObjects = [];
        this.torches = [];
        this.stones = [];
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize loading manager
        this.initLoadingManager();
        
        // Start animation loop
        this.animate();
    }
    
    initLoadingManager() {
        this.loadingManager = new THREE.LoadingManager();
        this.progressBar = document.querySelector('.progress-bar');
        this.loadingScreen = document.getElementById('loading-screen');
        
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = itemsLoaded / itemsTotal * 100;
            this.progressBar.style.width = progress + '%';
        };
        
        this.loadingManager.onLoad = () => {
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        };
        
        // Initialize assets loading
        this.loadAssets();
    }
    
    loadAssets() {
        // Load textures, models, etc.
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.gltfLoader = new GLTFLoader(this.loadingManager);
        
        // Load castle components
        this.loadCastle();
        
        // Create basic environment
        this.createEnvironment();
        
        // Create interactive objects (catapult, torches, stones)
        this.createInteractiveObjects();
    }
    
    loadCastle() {
        // For now, we'll create a simple castle with basic geometries
        // In a real project, you would load GLTF models here
        
        // Create castle walls
        const wallGeometry = new THREE.BoxGeometry(10, 5, 1);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Front wall
        const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
        frontWall.position.set(0, 2.5, -5);
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        this.sceneManager.scene.add(frontWall);
        
        // Back wall
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, 2.5, 5);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.sceneManager.scene.add(backWall);
        
        // Left wall
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 10), wallMaterial);
        leftWall.position.set(-5, 2.5, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.sceneManager.scene.add(leftWall);
        
        // Right wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 10), wallMaterial);
        rightWall.position.set(5, 2.5, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.sceneManager.scene.add(rightWall);
        
        // Create towers at each corner
        const towerGeometry = new THREE.CylinderGeometry(1, 1.2, 7, 8);
        const towerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x777777,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const createTower = (x, z) => {
            const tower = new THREE.Mesh(towerGeometry, towerMaterial);
            tower.position.set(x, 3.5, z);
            tower.castShadow = true;
            tower.receiveShadow = true;
            this.sceneManager.scene.add(tower);
        };
        
        // Create towers at the four corners
        createTower(-5, -5);
        createTower(5, -5);
        createTower(-5, 5);
        createTower(5, 5);
    }
    
    createEnvironment() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a7d44,
            roughness: 0.9,
            metalness: 0.0
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.sceneManager.scene.add(ground);
        
        // Create skybox (simple color for now)
        this.sceneManager.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    }
    
    createInteractiveObjects() {
        // Create catapult
        this.catapult = new Catapult(this.sceneManager.scene, new THREE.Vector3(0, 0.5, -3));
        this.interactiveObjects.push(this.catapult);
        
        // Create stones for the catapult
        for (let i = 0; i < 5; i++) {
            const stone = new Stone(this.sceneManager.scene, new THREE.Vector3(2 + i * 0.5, 0.5, -3));
            this.stones.push(stone);
            this.interactiveObjects.push(stone);
        }
        
        // Create torches
        const torchPositions = [
            new THREE.Vector3(-4, 3, -4.5),
            new THREE.Vector3(4, 3, -4.5),
            new THREE.Vector3(-4, 3, 4.5),
            new THREE.Vector3(4, 3, 4.5)
        ];
        
        torchPositions.forEach(position => {
            const torch = new Torch(this.sceneManager.scene, position);
            this.torches.push(torch);
            this.interactiveObjects.push(torch);
        });
    }
    
    setupEventListeners() {
        // Resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Day/Night toggle
        document.getElementById('toggle-day-night').addEventListener('click', () => {
            this.isNightMode = !this.isNightMode;
            this.lightingManager.toggleDayNight(this.isNightMode);
            
            // Update active torches
            this.torches.forEach(torch => {
                if (this.isNightMode && torch.isLit) {
                    torch.flame.visible = true;
                    torch.light.visible = true;
                } else if (!this.isNightMode) {
                    torch.flame.visible = false;
                    torch.light.visible = false;
                }
            });
        });
        
        // Torch brightness control
        document.getElementById('torch-brightness').addEventListener('input', (e) => {
            this.torchBrightness = parseFloat(e.target.value);
            this.torches.forEach(torch => {
                if (torch.light) {
                    torch.setIntensity(this.torchBrightness);
                }
            });
        });
        
        // Mouse click for interaction
        this.renderer.domElement.addEventListener('click', (event) => {
            const mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );
            
            this.handleInteraction(mouse);
        });
    }
    
    handleInteraction(mouse) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // Collect all interactive meshes
        const interactiveMeshes = this.interactiveObjects.map(obj => obj.mesh);
        const intersects = raycaster.intersectObjects(interactiveMeshes);
        
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            
            // Find the corresponding interactive object
            const clickedObject = this.interactiveObjects.find(obj => obj.mesh === clickedMesh);
            
            if (clickedObject) {
                if (clickedObject instanceof Torch) {
                    // Toggle torch
                    clickedObject.toggle();
                    
                    // Update score
                    if (clickedObject.isLit) {
                        this.updateScore(5);
                    } else {
                        this.updateScore(-2);
                    }
                } else if (clickedObject instanceof Stone) {
                    // Pick up stone if catapult is ready
                    if (!this.catapult.loadedStone && !clickedObject.isLaunched) {
                        this.catapult.loadStone(clickedObject);
                        this.updateScore(2);
                    }
                } else if (clickedObject instanceof Catapult) {
                    // Launch stone if one is loaded
                    if (this.catapult.loadedStone) {
                        this.catapult.launch();
                        this.updateScore(10);
                    }
                }
            }
        }
    }
    
    updateScore(points) {
        this.score += points;
        this.scoreElement.textContent = this.score;
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls
        this.controls.update();
        
        // Update interactive objects
        this.interactiveObjects.forEach(obj => obj.update());
        
        // Update physics for launched stones
        this.stones.forEach(stone => {
            if (stone.isLaunched) {
                stone.updatePhysics();
            }
        });
        
        // Update animated torches
        this.torches.forEach(torch => {
            if (torch.isLit) {
                torch.animateFlame();
            }
        });
        
        // Render scene
        this.renderer.render(this.sceneManager.scene, this.camera);
    }
}

// Initialize the application when the window is loaded
window.addEventListener('load', () => {
    new MedievalCastleApp();
});