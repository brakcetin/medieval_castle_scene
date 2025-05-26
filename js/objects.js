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
        
        // Taş yükleme özellikleri
        this.hasStone = false;
        this.loadedStone = null;
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
      loadStone(stone) {
        if (!this.hasStone && stone && !stone.isLaunched) {
            this.hasStone = true;
            this.loadedStone = stone;
            
            // Taşı mancınığın kovasına yerleştir
            if (this.bucket && stone.mesh) {
                // Taşın pozisyonunu güncelle (dünya koordinatlarında)
                const bucketWorldPosition = new THREE.Vector3();
                this.bucket.getWorldPosition(bucketWorldPosition);
                
                // Taşın pozisyonunu kovaya ayarla
                stone.mesh.position.copy(bucketWorldPosition);
                stone.position.copy(bucketWorldPosition);
                stone.mesh.position.y += 0.3; // Kovadan biraz yukarıda
                stone.position.y += 0.3;
                
                // Taşın görünür olduğundan emin ol
                stone.mesh.visible = true;
                
                console.log("Taş mancınığa yüklendi, pozisyon:", stone.mesh.position);
            }
            
            return true;
        }
        return false;
    }
      launch() {
        if (this.hasStone && this.loadedStone) {
            const stone = this.loadedStone;
            this.hasStone = false;
            this.loadedStone = null;
            
            // Taşı fırlat
            stone.isLaunched = true;
            stone.isStatic = false; // Statik durumdan çıkar, fizik etkisi başlasın
            
            // Mancınık animasyonunu başlat
            this.animating = true;
            this.animationTime = 0;
            
            // Yüklü bir taş kullanıldı, isCollected değerini sıfırlayalım
            // böylece atış sonrası tekrar toplanabilmez
            stone.isCollected = false;
            
            console.log("Mancınıktan taş fırlatıldı");
            
            return stone;
        }
        return null;
    }
}

export class Stone {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = null;
        
        if (position) {        this.position = position.clone();
        } else {
            this.position = null;
        }
        
        this.velocity = new THREE.Vector3();
        this.radius = 0.3; // Yarıçapı küçülttük
        this.lifetime = 10;
        this.active = true;
        this.isStatic = true;
        this.isLaunched = false;
        this.isCollected = false; // Toplama durumu için yeni özellik
    }
      load() {
        console.log("Stone.load() çağrıldı, pozisyon:", this.position);
        
        if (!this.position) {
            console.log("Taş yüklenmedi: pozisyon belirtilmemiş");
            return;
        }
        
        const gltfLoader = new GLTFLoader();        gltfLoader.load('./models/stone.glb', (gltf) => {
            console.log("Stone modeli başarıyla yüklendi");            this.mesh = gltf.scene;
            this.mesh.position.copy(this.position);
            this.mesh.scale.set(0.25, 0.25, 0.25); // Boyutu küçülttük
            
            // Stone için identifier ekle
            this.mesh.name = `stone_${Math.random().toString(36).substr(2, 9)}`;
            this.mesh.userData = {
                type: 'stone',
                stoneRef: this,
                isClickable: true
            };
            
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Child meshler için de userData ekle
                    child.userData = {
                        type: 'stone',
                        stoneRef: this,
                        isClickable: true
                    };
                }
            });
            
            this.scene.scene.add(this.mesh); // SceneManager'dan scene'e erişim
            console.log("Taş sahneye eklendi");
        }, undefined, (error) => {            console.error("Taş modeli yüklenirken hata:", error);            console.log("Fallback küre geometrisi oluşturuluyor");
              const geometry = new THREE.SphereGeometry(0.3, 16, 16); // Boyutu küçülttük (1.2'den 0.3'e)
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xFF4444,  // Parlak kırmızı renk
                roughness: 0.3,
                metalness: 0.1,
                emissive: 0x441111, // Hafif kırmızı ışıma
                emissiveIntensity: 0.3
            });            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.copy(this.position);
            this.mesh.castShadow = true;
            
            // Fallback stone için de identifier ekle
            this.mesh.name = `fallback_stone_${Math.random().toString(36).substr(2, 9)}`;
            this.mesh.userData = {
                type: 'stone',
                stoneRef: this,
                isClickable: true
            };
            
            this.scene.scene.add(this.mesh); // SceneManager'dan scene'e erişim
            console.log("Fallback taş sahneye eklendi, pozisyon:", this.position);
            console.log("Taş mesh ID:", this.mesh.uuid);
            console.log("Sahne çocuk sayısı (taş eklendikten sonra):", this.scene.scene.children.length);
        });
    }      update(deltaTime) {
        // Eğer mesh yoksa veya pozisyon atanmamışsa işlem yapma
        if (!this.mesh || !this.position) return;
        
        // Performance: Toplanan taşları güncelleme - tamamen atla
        if (this.isCollected && !this.isLaunched) return;
        
        // Performance: Update interval azaltma (her frame değil)
        this.updateCounter = (this.updateCounter || 0) + 1;
        if (this.isStatic && this.updateCounter % 5 !== 0) {
            return; // Statik taşları her 5. frame'de güncelle
        }
        
        // Mancınığa yüklenen taş güncelleme (pozisyon sync)
        if (this.isCollected && this.isLaunched) {
            // Mancınıktan fırlatılmışsa mesh pozisyonunu güncelle
            if (this.mesh) {
                this.mesh.position.copy(this.position);
            }
        }
        
        // Statik taşlar için fiziği uygulamıyoruz
        if (!this.isStatic) {
            // Apply gravity
            this.velocity.add(this.scene.gravity.clone().multiplyScalar(deltaTime));
            
            // Update position
            this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
            
            if (this.mesh) {
                this.mesh.position.copy(this.position);
            }
            
            // Decrease lifetime
            this.lifetime -= deltaTime;
            if (this.lifetime <= 0) {
                this.remove();
                return;
            }
                  // Check for ground collision
            if (this.position.y <= this.radius * 0.5) { // Yarıçapın yarısı kadar mesafe yeterli
                this.position.y = this.radius * 0.5; // Taş yarı yarıya toprağa gömülü olsun
                this.velocity.y *= -0.3; // Zıplama etkisini azalt (0.5 -> 0.3)
                this.velocity.x *= 0.8; // Sürtünmeyi artır (0.9 -> 0.8)
                this.velocity.z *= 0.8; // Sürtünmeyi artır (0.9 -> 0.8)
                
                // If velocity is very low, stop movement                
                if (this.velocity.length() < 1) {
                    this.velocity.set(0, 0, 0);
                    this.isStatic = true; // Performans için statik yap
                    
                    // Taş durduğunda tam olarak yere otursun
                    this.position.y = this.radius;
                }
            }
        } else {
            // Statik taşlar için sadece pozisyonu güncelleyelim (daha az sıklıkla)
            if (this.mesh && this.updateCounter % 10 === 0) {
                this.mesh.position.copy(this.position);
            }
        }
        
        // Performance: Collision detection'ı azalt
        if (!this.isStatic && this.updateCounter % 3 === 0) {
            // Check collision with other objects
            const collider = this.scene.checkCollisions(this);
            if (collider) {
                // Handle collision
                this.handleCollision(collider);
            }
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
    }      remove() {
        if (!this.active) return;
        
        this.active = false;
        if (this.mesh) {
            this.scene.scene.remove(this.mesh); // SceneManager'dan scene'e erişim
            
            // Memory cleanup
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(mat => mat.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
            
            this.mesh = null;
            console.log("Taş başarıyla temizlendi");
        }
    }
    
    // Performance cleanup metodu
    dispose() {
        this.remove();
        this.position = null;
        this.velocity = null;
        this.scene = null;
    }
    
    // Taşın fırlatılmasını sağlayan metod
    launch(direction, power) {
        // Taşı statik olmayan ve fırlatılmış olarak işaretle
        this.isStatic = false;
        this.isLaunched = true;
        
        // Hızını ayarla
        this.velocity.copy(direction).multiplyScalar(power);
    }    // Taşın toplanmasını sağlayan metod
    collect() {
        if (this.isCollected) {
            console.log("Stone already collected");
            return false;
        }
        
        this.isCollected = true;
        console.log("Stone collected successfully!");
        
        // Toplama animasyonu göster
        if (this.mesh) {
            this.showCollectEffect();
            
            // Taşı tamamen kaldır (sadece gizlemek yerine)
            setTimeout(() => {
                if (this.mesh) {
                    // Önce görünmez yap
                    this.mesh.visible = false;
                    
                    // Sonra tamamen kaldır (memory cleanup için)
                    setTimeout(() => {
                        this.remove();
                    }, 100);
                }
            }, 300); // 300ms sonra taşı gizle (efektten sonra)
        }
        
        return true;
    }
    
    // Taş toplama efekti
    showCollectEffect() {
        if (!this.mesh || !this.scene || !this.scene.scene) return;
        
        // Parıldama efekti için basit bir küre
        const glowGeom = new THREE.SphereGeometry(0.4, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.7
        });
        
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.copy(this.position);
        glow.scale.set(1, 1, 1);
        
        this.scene.scene.add(glow);
        
        // Büyüyüp kaybolan animasyon
        const startTime = Date.now();
        const duration = 300; // ms cinsinden süre
        
        const animateGlow = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = elapsedTime / duration;
            
            if (progress >= 1) {
                // Animasyon bitti, efekti kaldır
                this.scene.scene.remove(glow);
                glowGeom.dispose();
                glowMat.dispose();
                return;
            }
            
            // Büyüme ve şeffaflaşma
            const scale = 1 + progress * 2; // 1x'den 3x'e büyü
            const opacity = 0.7 * (1 - progress); // 0.7'den 0'a şeffaflaş
            
            glow.scale.set(scale, scale, scale);
            glowMat.opacity = opacity;
            
            requestAnimationFrame(animateGlow);
        };
        
        // Animasyonu başlat
        animateGlow();
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
        
        // Performance: Update interval azaltma
        this.updateCounter = (this.updateCounter || 0) + 1;
        if (this.updateCounter % 3 !== 0) {
            return; // Her 3. frame'de güncelle
        }
        
        // Update time for flickering effect
        this.time += deltaTime * 3; // deltaTime'ı 3 ile çarp çünkü her 3. frame
        
        // Calculate flicker based on noise
        const flicker = Math.sin(this.time * this.flickerSpeed) * this.flickerIntensity;
        
        // Apply flicker to light intensity if light exists
        if (this.light) {
            this.light.intensity = this.intensity * (1 + flicker);
        }
        
        // Apply flicker to flame size if flame exists (daha az sıklıkla)
        if (this.flame && this.updateCounter % 6 === 0) {
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

export class HandTorch {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.light = null;
        this.flame = null;
        this.intensity = 6;
        this.color = 0xff6a00;
        this.isActive = false;
        this.flickerSpeed = 0.8;
        this.flickerIntensity = 0.3;
        this.time = 0;
    }
    
    create() {
        // Basit meşale modeli oluştur
        const group = new THREE.Group();
        
        // Sap
        const handleGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.4);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.2;
        group.add(handle);
        
        // Meşale başı
        const torchGeometry = new THREE.CylinderGeometry(0.05, 0.03, 0.15);
        const torchMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const torchHead = new THREE.Mesh(torchGeometry, torchMaterial);
        torchHead.position.y = 0.075;
        group.add(torchHead);
        
        // Işık
        this.light = new THREE.PointLight(this.color, this.intensity, 8);
        this.light.position.y = 0.15;
        this.light.castShadow = true;
        this.light.shadow.mapSize.width = 512;
        this.light.shadow.mapSize.height = 512;
        group.add(this.light);
        
        // Alev efekti
        const flameGeometry = new THREE.ConeGeometry(0.04, 0.1, 6);
        const flameMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4500,
            transparent: true,
            opacity: 0.8
        });
        this.flame = new THREE.Mesh(flameGeometry, flameMaterial);
        this.flame.position.y = 0.15;
        group.add(this.flame);
          this.model = group;
        
        return group;
    }
      updatePosition(camera) {
        if (!this.model || !this.isActive || !camera) return;
        
        // Kameranın sağ alt köşesine yerleştir
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(camera.up, cameraDirection).normalize();
        
        const position = camera.position.clone();
        position.add(rightVector.multiplyScalar(0.3)); // Sağa
        position.add(cameraDirection.multiplyScalar(0.5)); // Öne
        position.y -= 0.2; // Aşağı
        
        this.model.position.copy(position);
        
        // Kamera yönüne bakacak şekilde döndür
        this.model.lookAt(
            position.x + cameraDirection.x,
            position.y + cameraDirection.y,
            position.z + cameraDirection.z
        );
    }
    
    update(deltaTime, camera) {
        if (!this.isActive || !this.model) return;
        
        this.time += deltaTime;
        this.updatePosition(camera);
        
        // Titreme efekti
        const flicker = Math.sin(this.time * this.flickerSpeed) * this.flickerIntensity;
        
        if (this.light) {
            this.light.intensity = this.intensity * (1 + flicker);
        }
        
        if (this.flame) {
            const scale = 1 + flicker * 0.5;
            this.flame.scale.set(scale, scale, scale);
        }
    }

    show() {
        this.isActive = true;
        
        if (!this.model) {
            this.scene.scene.add(this.create());
        } else {
            this.model.visible = true;
        }
    }

    hide() {
        this.isActive = false;
        
        if (this.model) {
            this.model.visible = false;
        }
    }
    
    toggle() {
        this.isActive = !this.isActive;
        
        if (this.isActive) {
            if (!this.model) {
                this.scene.scene.add(this.create());
            } else {
                this.model.visible = true;
            }
        } else if (this.model) {
            this.model.visible = false;
        }
        
        return this.isActive;
    }
    
    remove() {
        if (this.model) {
            this.scene.scene.remove(this.model);
            this.model = null;
        }
        this.isActive = false;
    }
}
