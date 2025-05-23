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
        this.fireAngle = 45; // Dikey atış açısı (derece)
        this.charging = false;
        this.animationTime = 0;
        this.armRotation = 0;
        this.animating = false;
        this.cooldown = 0; // Atışlar arası bekleme süresi
        this.loadedStone = null; // Mancınıkta yüklü olan taş
        
        // Position and properties
        this.position = new THREE.Vector3(0, 0, 10);
        this.radius = 2;
        
        // Catapult parts
        this.base = null;
        this.arm = null;
        this.bucket = null;
        
        // Görsel geribildirim için yardımcı elemanlar
        this.powerBar = null;
        this.aimHelper = null;
        
        // Atılan taşların geçici saklanması
        this.firedStones = [];
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
              
            this.scene.add(this.model);
            this.loaded = true;
            
            // Yardımcı görsel elemanları oluştur
            this.initHelpers();
            
            // İlk taşı yükle
            this.loadStone();
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
            
            this.scene.add(this.model);
            this.loaded = true;
            
            // Yardımcı görsel elemanları oluştur
            this.initHelpers();
            
            // İlk taşı yükle
            this.loadStone();
        });
    }
      update(deltaTime) {
        if (!this.loaded) return;
        
        // Soğuma süresini güncelle
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
        
        // Şarj sırasında güç ve görsel geribildirim güncelleme
        if (this.charging) {
            this.power = Math.min(this.power + 30 * deltaTime, this.maxPower);
            
            // Pull back arm while charging
            if (this.arm) {
                this.arm.rotation.x = Math.max(-Math.PI / 2, -Math.PI / 4 - (this.power / this.maxPower) * Math.PI / 4);
            }
            
            // Update power bar
            if (this.powerBar) {
                this.powerBar.scale.y = this.power / this.maxPower;
                
                // Renk değişimi (yeşilden kırmızıya doğru)
                const normalizedPower = this.power / this.maxPower;
                const color = new THREE.Color(normalizedPower, 1 - normalizedPower, 0);
                this.powerBar.material.color = color;
            }
        }
        
        // Atış animasyonu
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
                
                // Animasyon tamamlandıktan sonra yeni taş yükle
                if (!this.loadedStone) {
                    setTimeout(() => {
                        this.loadStone();
                    }, 1000); // 1 saniye sonra yeni taş yükle
                }
            }
        }
        
        // Update model position and rotation
        this.model.position.copy(this.position);
        this.model.rotation.y = this.angle;
        
        // Yüklü taş varsa pozisyonunu güncelle
        if (this.loadedStone && this.loadedStone.mesh) {
            const bucketPos = this.getBucketPosition();
            this.loadedStone.position.copy(bucketPos);
            this.loadedStone.mesh.position.copy(bucketPos);
        }
        
        // Nişan yardımcısını güncelle
        this.updateAimHelper();
    }
    
    rotate(direction) {
        this.angle += direction * 0.02;
        
        // Açıyı 0-2*PI aralığında tut
        if (this.angle < 0) this.angle += 2 * Math.PI;
        if (this.angle > 2 * Math.PI) this.angle -= 2 * Math.PI;
    }
    
    // Atış açısını ayarla (yukarı/aşağı)
    adjustFireAngle(delta) {
        this.fireAngle = Math.max(15, Math.min(75, this.fireAngle + delta));
        
        // Nişan yardımcısını güncelle
        this.updateAimHelper();
    }
    
    startCharging() {
        // Soğuma süreci içerisinde veya taş yoksa şarj etme
        if (this.cooldown > 0 || !this.loadedStone) return;
        
        this.charging = true;
        this.power = 20; // Başlangıç gücü
        
        // Güç göstergesini görünür yap
        if (this.powerBar) {
            this.powerBar.visible = true;
        }
    }
    
    fire() {
        // Şarj edilmiyorsa veya soğuma süreci içerisindeyse ateş etme
        if (!this.charging || this.cooldown > 0 || !this.loadedStone) return null;
        
        this.charging = false;
        this.animating = true;
        this.animationTime = 0;
        this.cooldown = 2; // 2 saniyelik soğuma süresi
        
        // Güç göstergesini gizle
        if (this.powerBar) {
            this.powerBar.visible = false;
        }
        
        // Atış açısını (radyan) hesapla
        const verticalAngle = THREE.MathUtils.degToRad(this.fireAngle);
        
        // Calculate firing direction based on catapult angle and fire angle
        const direction = new THREE.Vector3(
            Math.sin(this.angle) * Math.cos(verticalAngle),
            Math.sin(verticalAngle),
            Math.cos(this.angle) * Math.cos(verticalAngle)
        ).normalize();
        
        // Yüklü taşı al
        const stone = this.loadedStone;
        
        // Taşı statik olmayan, fırlatılmış olarak işaretle
        stone.isStatic = false;
        stone.isLaunched = true;
        
        // Set velocity based on power and direction
        stone.velocity.copy(direction).multiplyScalar(this.power * 0.1);
        
        // Taşın artık mancınığın parçası olmadığını işaretle
        this.loadedStone = null;
        
        // Fırlatılan taşı listeye ekle
        this.firedStones.push(stone);
        
        // Taşı döndür
        stone.addRotation();
        
        return stone;
    }
    
    // Mancınığa yeni taş yükleme metodu
    loadStone() {
        // Eğer zaten yüklü taş varsa, yeni taş yükleme
        if (this.loadedStone) return;
        
        // Kovadaki pozisyonu al
        const bucketPos = this.getBucketPosition();
        
        // Yeni taş oluştur
        const stone = new Stone(this.scene, bucketPos);
        stone.load();
        
        // Taşı mancınığın yüklü taşı olarak referansla
        this.loadedStone = stone;
    }
    
    // Kovanın dünya koordinatlarındaki pozisyonunu alma
    getBucketPosition() {
        if (!this.bucket || !this.model) {
            // Mancınık modeli henüz yüklenmemişse varsayılan değer
            return new THREE.Vector3(
                this.position.x,
                this.position.y + 1,
                this.position.z
            );
        }
        
        // Kovanın dünya pozisyonunu al
        const bucketPos = new THREE.Vector3();
        this.bucket.getWorldPosition(bucketPos);
        
        // Hafif yukarıda olacak şekilde offset ekle
        bucketPos.y += 0.1;
        
        return bucketPos;
    }
    
    initHelpers() {
        // Güç göstergesi oluşturma
        const powerBarGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
        const powerBarMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        this.powerBar = new THREE.Mesh(powerBarGeometry, powerBarMaterial);
        this.powerBar.position.set(0, 0.5, -2); // Mancınığın önünde
        this.powerBar.scale.y = 0.1; // Başlangıçta küçük
        this.model.add(this.powerBar);
        
        // Nişan yardımcısı oluşturma
        const aimHelperGeometry = new THREE.BufferGeometry();
        const numPoints = 50;
        const positions = new Float32Array(numPoints * 3);
        aimHelperGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const aimHelperMaterial = new THREE.LineBasicMaterial({
            color: 0xffff00,
            opacity: 0.7,
            transparent: true
        });
        
        this.aimHelper = new THREE.Line(aimHelperGeometry, aimHelperMaterial);
        this.scene.add(this.aimHelper);
        
        this.updateAimHelper();
    }
    
    updateAimHelper() {
        if (!this.aimHelper) return;
        
        // Nişan çizgisini güncelle
        const numPoints = 50;
        const positions = this.aimHelper.geometry.attributes.position.array;
        
        // Atış açısı (radyan)
        const verticalAngle = THREE.MathUtils.degToRad(this.fireAngle);
        
        // Başlangıç pozisyonu
        const startPos = this.getBucketPosition();
        
        // Atış yönü (mancınık açısına göre)
        const direction = new THREE.Vector3(
            Math.sin(this.angle),
            Math.sin(verticalAngle),
            Math.cos(this.angle)
        ).normalize();
        
        // Atış hızı
        const velocity = direction.clone().multiplyScalar(this.power * 0.1);
        
        // Yerçekimi
        const gravity = this.scene.gravity.clone();
        
        // Eğri noktalarını hesapla
        for (let i = 0; i < numPoints; i++) {
            const t = i * 0.1; // zaman adımı
            
            // v0*t + 0.5*a*t^2 formülüyle pozisyonu hesapla
            const x = startPos.x + velocity.x * t;
            const y = startPos.y + velocity.y * t + 0.5 * gravity.y * t * t;
            const z = startPos.z + velocity.z * t;
            
            // Pozisyonu diziye yaz
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        
        // Geometriyi güncelle
        this.aimHelper.geometry.attributes.position.needsUpdate = true;
    }
}

export class Stone {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = null; // Renamed from model for consistency
        
        // Eğer pozisyon belirtilmişse o pozisyonu kullan, belirtilmemişse boş vektör oluşturma
        if (position) {
            this.position = position.clone();
        } else {
            // Pozisyon belirtilmemiş, varsayılan değer atama
            this.position = null;
        }
          this.velocity = new THREE.Vector3();
        this.radius = 0.25; // Daha küçük taş yarıçapı (0.3 -> 0.25)
        this.lifetime = 10; // Seconds before despawning
        this.active = true;
        this.isStatic = true; // Varsayılan olarak statik (yerçekiminden etkilenmez)
        this.isLaunched = false; // Fırlatılıp fırlatılmadığı
    }
      load() {
        // Eğer pozisyon değeri yoksa, bu taşı yükleme
        if (!this.position) {
            console.log("Taş yüklenmedi: pozisyon belirtilmemiş");
            return;
        }
        
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
    }    update(deltaTime) {
        // Eğer mesh yoksa veya pozisyon atanmamışsa işlem yapma
        if (!this.mesh || !this.position) return;
        
        // Statik taşlar için fiziği uygulamıyoruz
        if (!this.isStatic) {
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
            if (this.position.y <= this.radius * 0.5) { // Yarıçapın yarısı kadar mesafe yeterli
                this.position.y = this.radius * 0.5; // Taş yarı yarıya toprağa gömülü olsun
                this.velocity.y *= -0.3; // Zıplama etkisini azalt (0.5 -> 0.3)
                this.velocity.x *= 0.8; // Sürtünmeyi artır (0.9 -> 0.8)
                this.velocity.z *= 0.8; // Sürtünmeyi artır (0.9 -> 0.8)
                
                // If velocity is very low, stop movement
                if (this.velocity.length() < 1) {
                    this.velocity.set(0, 0, 0);
                    // Taş durduğunda statik yapabiliriz
                    // this.isStatic = true; // İsteğe bağlı
                }
            }
        } else {
            // Statik taşlar için sadece pozisyonu güncelleyelim
            if (this.mesh) {
                this.mesh.position.copy(this.position);
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
    
    // Taşın fırlatılmasını sağlayan metod
    launch(direction, power) {
        // Taşı statik olmayan ve fırlatılmış olarak işaretle
        this.isStatic = false;
        this.isLaunched = true;
        
        // Hızını ayarla
        this.velocity.copy(direction).multiplyScalar(power);
    }
    
    // Taş fırlatıldığında dönüş eklemek için
    addRotation() {
        if (!this.mesh) return;
        
        // Dönüş hızı
        this.rotationSpeed = {
            x: (Math.random() - 0.5) * 2, // -1 ile 1 arasında rastgele değer
            y: (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 2
        };
        
        // Update fonksiyonunu genişlet ve dönüşü ekle
        const originalUpdate = this.update.bind(this);
        this.update = (deltaTime) => {
            originalUpdate(deltaTime);
            
            // Dönüşü uygula
            if (this.mesh && this.rotationSpeed && !this.isStatic) {
                this.mesh.rotation.x += this.rotationSpeed.x * deltaTime;
                this.mesh.rotation.y += this.rotationSpeed.y * deltaTime;
                this.mesh.rotation.z += this.rotationSpeed.z * deltaTime;
            }
        };
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
