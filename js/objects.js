// filepath: c:\Users\brakc\Burak\Computer Science\GaziU\3.2\computer_graphics\project\js\objects.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Catapult {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.loaded = false;
        this.angle = 0;
        this.power = 50;
        this.maxPower = 100;
        this.charging = false;
        this.animationTime = 0;
        this.armRotation = 0;
        this.animating = false;
        
        // Position and properties
        this.position = new THREE.Vector3(0, 0, 10);
        this.radius = 2;
        
        // Catapult parts
        this.base = null;
        this.arm = null;
        this.bucket = null;
    }
      
    load(gltfLoader) {
        // Gerçek GLTF model yükleme işlemi
        gltfLoader.load('./models/catapult.glb', (gltf) => {
            this.model = gltf.scene;
            this.model.position.copy(this.position);
            this.model.rotation.y = this.angle; // Açı artık constructor'da Math.PI olarak ayarlandı
            this.model.scale.set(0.8, 0.8, 0.8); // Scale according to your needs
            
            // Traverse all child objects to set shadows
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
                
                // Find catapult parts for animation
                if (child.name.includes('base')) {
                    this.base = child;
                } else if (child.name.includes('arm')) {
                    this.arm = child;
                } else if (child.name.includes('bucket')) {
                    this.bucket = child;
                }
            });
            
            // If model doesn't have named parts, create them for animation purposes
            if (!this.arm) {
                // Create a simple arm and bucket for testing
                const armGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
                const armMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                this.arm = new THREE.Mesh(armGeometry, armMaterial);
                this.arm.position.y = 0.5;
                this.model.add(this.arm);
                
                const bucketGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.4);
                const bucketMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
                this.bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
                this.bucket.position.y = 1.5;
                this.arm.add(this.bucket);
            }
              
            this.scene.add(this.model); // Fixed: using add instead of addObject
            this.loaded = true;
        }, undefined, (error) => {
            console.error('Mancınık modeli yüklenirken hata oluştu:', error);
            
            // Error case: Use a simple model instead
            const geometry = new THREE.BoxGeometry(2, 1, 3);
            const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            this.model = new THREE.Mesh(geometry, material);
            this.model.position.copy(this.position);
            this.model.castShadow = true;
            
            // Create simple arm and bucket
            const armGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
            const armMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            this.arm = new THREE.Mesh(armGeometry, armMaterial);
            this.arm.position.set(0, 0.5, -1);
            this.arm.rotation.x = -Math.PI / 4; // Default arm position
            this.model.add(this.arm);
            
            const bucketGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.4);
            const bucketMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
            this.bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
            this.bucket.position.y = 1;
            this.arm.add(this.bucket);
            
            this.scene.add(this.model); // Fixed: using add instead of addObject
            this.loaded = true;
        });
    }
    
    update(deltaTime) {
        if (!this.loaded) return;
        
        if (this.charging) {
            this.power = Math.min(this.power + 30 * deltaTime, this.maxPower);
            
            // Pull back arm while charging
            if (this.arm) {
                this.arm.rotation.x = Math.max(-Math.PI / 2, -Math.PI / 4 - (this.power / this.maxPower) * Math.PI / 4);
            }
        }
        
        // Animate firing
        if (this.animating) {
            this.animationTime += deltaTime * 3; // Animation speed
            
            if (this.animationTime <= 1) {
                // Forward arm movement
                if (this.arm) {
                    this.arm.rotation.x = -Math.PI / 2 + this.animationTime * Math.PI / 2;
                }
            } else {
                this.animating = false;
                this.animationTime = 0;
                
                // Reset arm position
                if (this.arm) {
                    this.arm.rotation.x = -Math.PI / 4;
                }
            }
        }
        
        // Update model position and rotation
        this.model.position.copy(this.position);
        this.model.rotation.y = this.angle;
    }
    
    rotate(direction) {
        this.angle += direction * 0.02;
    }
    
    startCharging() {
        this.charging = true;
        this.power = 20;
    }
    
    fire() {
        if (!this.charging) return null;
        
        this.charging = false;
        this.animating = true;
        this.animationTime = 0;
        
        const stone = new Stone(this.scene);
        
        // Calculate firing direction based on catapult angle
        const direction = new THREE.Vector3(
            Math.sin(this.angle),
            0.5,
            Math.cos(this.angle)
        ).normalize();
        
        // Set stone position at the bucket
        const bucketWorldPos = new THREE.Vector3();
        if (this.bucket) {
            this.bucket.getWorldPosition(bucketWorldPos);
            stone.position.copy(bucketWorldPos);
        } else {
            stone.position.copy(this.position).add(direction.clone().multiplyScalar(2).setY(1));
        }
        
        // Set velocity based on power and direction
        stone.velocity.copy(direction).multiplyScalar(this.power);
        
        stone.load();
        return stone;
    }
}

export class Stone {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null; // Renamed from model for consistency
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.radius = 0.3; // Daha küçük taş yarıçapı
        this.lifetime = 10; // Seconds before despawning
        this.active = true;
    }
    
    load() {
        // GLTF model yüklemeyi dene
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('./models/stone.glb', (gltf) => {
            this.mesh = gltf.scene;
            this.mesh.position.copy(this.position);
            this.mesh.scale.set(0.2, 0.2, 0.2); // Boyutu küçült
            
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            this.scene.add(this.mesh); // Fixed: using add instead of addObject
        }, undefined, (error) => {
            // Yüklenemezse basit küreyi kullan
            console.error("Taş modeli yüklenirken hata:", error);
            const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
            const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.copy(this.position);
            this.mesh.castShadow = true;
            this.scene.add(this.mesh); // Fixed: using add instead of addObject
        });
    }
    
    update(deltaTime) {
        if (!this.mesh) return;
        
        // Apply gravity
        this.velocity.add(this.scene.gravity.clone().multiplyScalar(deltaTime));
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);
        
        // Decrease lifetime
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.remove();
        }
        
        // Check for ground collision
        if (this.position.y <= this.radius) {
            this.position.y = this.radius;
            this.velocity.y *= -0.5; // Bounce with damping
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
            
            // If velocity is very low, stop movement
            if (this.velocity.length() < 1) {
                this.velocity.set(0, 0, 0);
            }
        }
        
        // Check collision with other objects
        const collider = this.scene.checkCollisions(this);
        if (collider) {
            // Handle collision
            this.handleCollision(collider);
        }
    }
    
    handleCollision(collider) {
        // Simple collision response
        const direction = new THREE.Vector3().subVectors(this.position, collider.position).normalize();
        this.velocity.reflect(direction);
        this.velocity.multiplyScalar(0.7); // Reduce velocity after collision
        
        // Move away from collision to prevent sticking
        const separation = this.radius + collider.radius - this.position.distanceTo(collider.position);
        if (separation > 0) {
            this.position.add(direction.multiplyScalar(separation));
        }
    }
    
    remove() {
        if (!this.active) return;
        
        this.active = false;
        if (this.mesh) {
            this.scene.remove(this.mesh); // Fixed: using remove instead of removeObject
            this.mesh = null;
        }
    }
}

export class Torch {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position.clone();
        this.model = null;
        this.light = null;
        this.flame = null;
        this.intensity = 4; // Meşale ışığını artır
        this.color = 0xff6a00;
        this.flickerSpeed = 0.5;
        this.flickerIntensity = 0.2;
        this.time = Math.random() * 1000; // Random start time for varied flickering
    }
    
    load() {
        // GLTF model yüklemeyi dene
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('./models/torch.glb', (gltf) => {            
            this.model = gltf.scene;
            this.model.position.copy(this.position);
            this.model.scale.set(0.1, 0.1, 0.1); // Boyutu çok daha küçük ayarla
            
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            this.addLight();
            
            this.scene.add(this.model); // Fixed: using add instead of addObject
        }, undefined, (error) => {
            // Model yüklenemezse basit bir meşale oluştur
            console.error("Meşale modeli yüklenirken hata:", error);
              
            // Meşale gövdesi - daha küçük
            const torchGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
            const torchMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            this.model = new THREE.Mesh(torchGeometry, torchMaterial);
            this.model.position.copy(this.position);
            this.model.castShadow = true;
            
            // Alev - daha küçük
            const flameGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const flameMaterial = new THREE.MeshBasicMaterial({ 
                color: this.color,
                transparent: true,
                opacity: 0.8
            });
            this.flame = new THREE.Mesh(flameGeometry, flameMaterial);
            this.flame.position.y = 0.2;
            this.model.add(this.flame);
              
            // Işık
            this.light = new THREE.PointLight(this.color, this.intensity, 5);
            this.light.position.y = 0.2;
            this.light.castShadow = true;
            this.model.add(this.light);
            
            this.scene.add(this.model); // Fixed: using add instead of addObject
        });
    }
      
    update(deltaTime) {
        if (!this.model) return;
        
        // Update time for flickering effect
        this.time += deltaTime;
        
        // Calculate flicker based on noise
        const flicker = Math.sin(this.time * this.flickerSpeed) * this.flickerIntensity;
        
        // Apply flicker to light intensity if light exists
        if (this.light) {
            this.light.intensity = this.intensity * (1 + flicker);
        }
        
        // Apply flicker to flame size if flame exists
        if (this.flame) {
            const scale = 1 + flicker * 0.5;
            this.flame.scale.set(scale, scale, scale);
        }
    }
    
    setIntensity(value) {
        this.intensity = value;
        if (this.light) {
            this.light.intensity = value;
        }
    }
    
    // Meşaleye ışık ekleyen yardımcı metod - AssetLoader ile kullanılır
    addLight() {
        if (!this.model) {
            console.error("Meşale modeli hazır değil, ışık eklenemedi");
            return;
        }
        
        // Işık oluştur
        this.light = new THREE.PointLight(this.color, this.intensity, 5); // Daha küçük mesafe
        this.light.position.y = 0.3; // Işığı daha altta konumlandır
        this.light.castShadow = true; // Gölge oluştur
        this.model.add(this.light);
        
        // Alev efekti için
        const flameGeometry = new THREE.SphereGeometry(0.05, 8, 8); // Daha küçük alev
        const flameMaterial = new THREE.MeshBasicMaterial({ 
            color: this.color,
            transparent: true,
            opacity: 0.8
        });
        this.flame = new THREE.Mesh(flameGeometry, flameMaterial);
        this.flame.position.y = 0.3; // Alevin pozisyonu
        this.model.add(this.flame);
        
        console.log("Meşale ışığı ve alev efekti eklendi:", this.position);
    }
    
    // Toggle the torch on/off
    toggle() {
        if (!this.light) return false;
        
        const wasLit = this.light.intensity > 0;
        this.light.intensity = wasLit ? 0 : this.intensity;
        
        if (this.flame) {
            this.flame.visible = !wasLit;
        }
        
        return wasLit;
    }
}
