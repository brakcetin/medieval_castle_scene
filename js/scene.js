import * as THREE from 'three';

export class SceneManager {
    constructor(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.02);
        
        // Physics settings
        this.gravity = new THREE.Vector3(0, -9.81, 0);
        this.timeStep = 1/60;
        
        // Collision objects
        this.colliders = [];
        
        // Initialize scene
        this.initialize();
    }
    
    initialize() {
        // Set initial camera position
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 0, 0);
        
        // Setup renderer
        this.renderer.setClearColor(0x000000);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Add event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    addObject(object) {
        this.scene.add(object);
    }
    
    removeObject(object) {
        this.scene.remove(object);
    }
    
    addCollider(collider) {
        this.colliders.push(collider);
    }
    
    removeCollider(collider) {
        const index = this.colliders.indexOf(collider);
        if (index !== -1) {
            this.colliders.splice(index, 1);
        }
    }
    
    checkCollisions(object) {
        for (const collider of this.colliders) {
            if (object !== collider && this.isColliding(object, collider)) {
                return collider;
            }
        }
        return null;
    }
    
    isColliding(obj1, obj2) {
        // Simple sphere collision detection
        const distance = obj1.position.distanceTo(obj2.position);
        const radiusSum = obj1.radius + obj2.radius;
        return distance < radiusSum;
    }
    
    update() {
        // Update scene elements if needed
    }
}