import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class PlayerControls {
    constructor(camera, domElement, scene) {
        this.camera = camera;
        this.domElement = domElement;
        this.scene = scene;
        
        // Setup pointer lock controls
        this.pointerControls = new PointerLockControls(this.camera, this.domElement);
        
        // Movement parameters
        this.moveSpeed = 0.1;
        this.jumpStrength = 5;
        this.gravity = 9.8;
        
        // Movement state
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true;
        
        // Player state
        this.height = 1.8;
        this.position = new THREE.Vector3(0, this.height, 0);
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Setup key event listeners
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Enable controls on click
        this.domElement.addEventListener('click', () => {
            this.pointerControls.lock();
        });
        
        // Listen for pointer lock changes
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    }
    
    onPointerLockChange() {
        if (document.pointerLockElement === this.domElement) {
            this.pointerControls.enabled = true;
        } else {
            this.pointerControls.enabled = false;
        }
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump) {
                    this.velocity.y = this.jumpStrength;
                    this.canJump = false;
                }
                break;
            case 'KeyE':
                // Interact with the closest object
                this.interact();
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }
    
    interact() {
        // Create a raycaster to detect objects in front of the player
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(), this.camera);
        
        // Get interactive objects from the scene
        const interactiveObjects = this.scene.children.filter(child => 
            child.userData && child.userData.interactive);
        
        // Check for intersections
        const intersects = raycaster.intersectObjects(interactiveObjects);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData.onInteract) {
                object.userData.onInteract();
            }
        }
    }
    
    update(deltaTime) {
        if (!this.pointerControls.enabled) return;
        
        // Apply gravity
        this.velocity.y -= this.gravity * deltaTime;
        
        // Apply ground collision
        if (this.position.y <= this.height) {
            this.velocity.y = Math.max(0, this.velocity.y);
            this.position.y = this.height;
            this.canJump = true;
        }
        
        // Update direction based on camera orientation
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        // Move the player
        if (this.moveForward || this.moveBackward) {
            this.velocity.z = this.direction.z * this.moveSpeed;
        } else {
            this.velocity.z = 0;
        }
        
        if (this.moveLeft || this.moveRight) {
            this.velocity.x = this.direction.x * this.moveSpeed;
        } else {
            this.velocity.x = 0;
        }
        
        // Move forward/backward
        this.pointerControls.moveForward(-this.velocity.z);
        
        // Move left/right
        this.pointerControls.moveRight(this.velocity.x);
        
        // Apply vertical movement
        this.position.y += this.velocity.y * deltaTime;
        this.camera.position.y = this.position.y;
        
        // Check for collisions with objects (simple implementation)
        this.checkCollisions();
    }
    
    checkCollisions() {
        // A simple implementation of collision detection could go here
        // For a more robust solution, consider using a physics library
    }
    
    getPosition() {
        return this.camera.position;
    }
    
    getDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }
}