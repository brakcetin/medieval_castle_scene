import * as THREE from 'three';

// Base class for interactive objects
class InteractiveObject {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.mesh = null;
        this.isInteractive = true;
    }
    
    update() {
        // Override in subclasses
    }
}

export class Catapult extends InteractiveObject {
    constructor(scene, position) {
        super(scene, position);
        this.loadedStone = null;
        this.isReady = true;
        this.launchForce = 15;
        
        this.createCatapult();
    }
    
    createCatapult() {
        // Create catapult base
        const baseGeometry = new THREE.BoxGeometry(2, 0.5, 3);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Brown color
            roughness: 0.8,
            metalness: 0.2
        });
        this.base = new THREE.Mesh(baseGeometry, baseMaterial);
        this.base.position.copy(this.position);
        this.base.position.y += 0.25;
        this.base.castShadow = true;
        this.base.receiveShadow = true;
        this.scene.add(this.base);
        
        // Create catapult arm
        const armGeometry = new THREE.BoxGeometry(0.3, 0.3, 2.5);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.7,
            metalness: 0.3
        });
        this.arm = new THREE.Mesh(armGeometry, armMaterial);
        this.arm.position.copy(this.position);
        this.arm.position.y += 0.7;
        this.arm.rotation.x = Math.PI / 12; // Slight angle
        this.arm.castShadow = true;
        this.arm.receiveShadow = true;
        this.scene.add(this.arm);
        
        // Create arm holder/pivot
        const pivotGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
        const pivotMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4d4d4d,
            roughness: 0.6,
            metalness: 0.5
        });
        this.pivot = new THREE.Mesh(pivotGeometry, pivotMaterial);
        this.pivot.position.copy(this.position);
        this.pivot.position.y += 0.6;
        this.pivot.position.z += 0.5;
        this.pivot.rotation.x = Math.PI / 2;
        this.pivot.castShadow = true;
        this.scene.add(this.pivot);
        
        // Create basket for stone
        const basketGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
        const basketMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x5c4033,
            roughness: 0.9,
            metalness: 0.1
        });
        this.basket = new THREE.Mesh(basketGeometry, basketMaterial);
        this.basket.position.copy(this.position);
        this.basket.position.y += 0.85;
        this.basket.position.z -= 0.8;
        this.basket.castShadow = true;
        this.scene.add(this.basket);
        
        // Create the counterweight
        const counterweightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const counterweightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.6,
            metalness: 0.7
        });
        this.counterweight = new THREE.Mesh(counterweightGeometry, counterweightMaterial);
        this.counterweight.position.copy(this.position);
        this.counterweight.position.y += 0.7;
        this.counterweight.position.z += 1;
        this.counterweight.castShadow = true;
        this.scene.add(this.counterweight);
        
        // Set the entire catapult as the interactive mesh
        this.mesh = this.base;
        this.mesh.userData.interactive = true;
        this.mesh.userData.parent = this;
    }
    
    loadStone(stone) {
        if (this.isReady && !this.loadedStone) {
            this.loadedStone = stone;
            
            // Move stone to the basket
            stone.mesh.position.copy(this.basket.position);
            stone.mesh.position.y += 0.3;
            
            // Reset arm rotation to loaded position
            this.arm.rotation.x = -Math.PI / 6;
            
            this.isReady = false;
        }
    }
    
    launch() {
        if (this.loadedStone) {
            // Animate the catapult arm
            const initialRotation = this.arm.rotation.x;
            const targetRotation = Math.PI / 3;
            const duration = 500; // milliseconds
            const startTime = Date.now();
            
            const animateArm = () => {
                const elapsedTime = Date.now() - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                // Ease function for smooth motion
                const easeProgress = 1 - Math.cos((progress * Math.PI) / 2);
                
                this.arm.rotation.x = initialRotation + (targetRotation - initialRotation) * easeProgress;
                
                if (progress < 1) {
                    requestAnimationFrame(animateArm);
                } else {
                    // Launch the stone when animation completes
                    this.launchStone();
                    
                    // Reset the arm after a delay
                    setTimeout(() => {
                        this.arm.rotation.x = Math.PI / 12;
                        this.isReady = true;
                    }, 1000);
                }
            };
            
            animateArm();
        }
    }
    
    launchStone() {
        const stone = this.loadedStone;
        
        if (stone) {
            // Calculate launch direction
            const direction = new THREE.Vector3(0, 1, -1);
            direction.normalize();
            
            // Apply launch force
            stone.velocity.copy(direction).multiplyScalar(this.launchForce);
            stone.isLaunched = true;
            
            // Clear loaded stone
            this.loadedStone = null;
        }
    }
    
    update() {
        // Any continuous updates for the catapult
    }
}

export class Stone extends InteractiveObject {
    constructor(scene, position) {
        super(scene, position);
        this.isLaunched = false;
        this.velocity = new THREE.Vector3();
        this.gravity = new THREE.Vector3(0, -9.8, 0);
        this.mass = 1;
        this.radius = 0.3;
        this.bounceFactor = 0.5;
        
        this.createStone();
    }
    
    createStone() {
        // Create a stone mesh
        const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            roughness: 0.9,
            metalness: 0.1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        this.mesh.userData.interactive = true;
        this.mesh.userData.parent = this;
    }
    
    updatePhysics() {
        if (!this.isLaunched) return;
        
        // Apply gravity
        this.velocity.add(this.gravity.clone().multiplyScalar(0.016)); // Assuming 60fps
        
        // Update position
        this.mesh.position.add(this.velocity.clone().multiplyScalar(0.016)); // Assuming 60fps
        
        // Ground collision
        if (this.mesh.position.y < this.radius) {
            this.mesh.position.y = this.radius;
            this.velocity.y = -this.velocity.y * this.bounceFactor;
            
            // Apply friction to horizontal movement
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
            
            // Stop if moving very slowly
            if (this.velocity.length() < 0.5) {
                this.velocity.set(0, 0, 0);
                this.isLaunched = false;
            }
        }
    }
    
    reset() {
        this.isLaunched = false;
        this.velocity.set(0, 0, 0);
        this.mesh.position.copy(this.position);
    }
    
    update() {
        // This is called by the main loop - physics update is handled separately
    }
}

export class Torch extends InteractiveObject {
    constructor(scene, position) {
        super(scene, position);
        this.isLit = false;
        this.baseIntensity = 1.0;
        
        this.createTorch();
    }
    
    createTorch() {
        // Create torch handle
        const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x5c3a21,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.handle = new THREE.Mesh(handleGeometry, handleMaterial);
        this.handle.position.copy(this.position);
        this.handle.castShadow = true;
        this.scene.add(this.handle);
        
        // Create torch head
        const headGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.2, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2c2c2c,
            roughness: 0.9,
            metalness: 0.1
        });
        
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.copy(this.position);
        this.head.position.y += 0.4;
        this.head.castShadow = true;
        this.scene.add(this.head);
        
        // Create flame (initially invisible)
        const flameGeometry = new THREE.ConeGeometry(0.12, 0.3, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff9900,
            transparent: true,
            opacity: 0.8
        });
        
        this.flame = new THREE.Mesh(flameGeometry, flameMaterial);
        this.flame.position.copy(this.position);
        this.flame.position.y += 0.65;
        this.flame.visible = false;
        this.scene.add(this.flame);
        
        // Create light (initially invisible)
        this.light = new THREE.PointLight(0xff9900, this.baseIntensity, 5);
        this.light.position.copy(this.position);
        this.light.position.y += 0.65;
        this.light.visible = false;
        this.light.castShadow = true;
        
        // Configure shadow properties
        this.light.shadow.mapSize.width = 512;
        this.light.shadow.mapSize.height = 512;
        this.light.shadow.camera.near = 0.1;
        this.light.shadow.camera.far = 10;
        
        this.scene.add(this.light);
        
        // Set the handle as the interactive mesh
        this.mesh = this.handle;
        this.mesh.userData.interactive = true;
        this.mesh.userData.parent = this;
    }
    
    toggle() {
        this.isLit = !this.isLit;
        this.flame.visible = this.isLit;
        this.light.visible = this.isLit;
    }
    
    setIntensity(intensity) {
        this.baseIntensity = intensity;
        if (this.light) {
            this.light.intensity = intensity;
        }
    }
    
    animateFlame() {
        if (!this.isLit) return;
        
        // Add subtle movement to the flame
        const time = Date.now() * 0.003;
        
        // Scale the flame slightly
        const scaleX = 1.0 + Math.sin(time * 1.5) * 0.1;
        const scaleY = 1.0 + Math.cos(time) * 0.1;
        const scaleZ = 1.0 + Math.sin(time + 0.5) * 0.1;
        
        this.flame.scale.set(scaleX, scaleY, scaleZ);
        
        // Subtle light intensity fluctuation
        if (this.light) {
            this.light.intensity = this.baseIntensity * (0.9 + Math.sin(time * 2) * 0.1);
        }
    }
    
    update() {
        // Animation is handled separately in animateFlame
    }
}