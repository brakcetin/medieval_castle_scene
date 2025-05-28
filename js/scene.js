import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Catapult, Stone, Torch } from './objects.js'; // corrected import

export class SceneManager {
    constructor(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;
        
        // Global SceneManager referansını oluştur veya güncelle
        if (!window._sceneManagerInstance) {
            window._sceneManagerInstance = this;
        } else {
            // Eğer önceki bir SceneManager örneği varsa, nesneleri temizle
            console.log("Önceki SceneManager örneği bulundu, temizleniyor...");
            if (window._sceneManagerInstance.scene) {
                window._sceneManagerInstance.cleanupScene();
            }
            // Referansı güncelle
            window._sceneManagerInstance = this;
        }
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.02);
        
        // Physics settings
        this.gravity = new THREE.Vector3(0, -9.81, 0);
        this.timeStep = 1/60;
        
        // Collision objects
        this.colliders = [];
        
        this.objects = {
            castle: null,
            catapult: null,
            stones: [],
            torches: []
        };
        
        this.score = 0;
        
        // Initialize scene
        this.initialize();
    }
      initialize() {
        // Sahneyi düzgün şekilde temizle
        this.cleanupScene();
        
        // Kamera pozisyonunu ayarla (artık main.js'de yapılıyor)
        // this.camera.position.set(0, 5, 15);
        // this.camera.lookAt(0, 0, 0);
          // Setup renderer (performans odaklı ayarlar main.js'de yapıldı)
        this.renderer.setClearColor(0x87CEEB); // Açık mavi gökyüzü rengi
        
        // Fog ekle (uzak nesneleri gizleyerek performans artırır)
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);
        
        // Aydınlatma sistemi ekle
        this.setupLighting();
        
        // Add event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        
        // Setup scene
        this.setupScene();
    }
    
    // Sahnenin tüm kaynaklarını temizleyen fonksiyon
    cleanupScene() {
        console.log("Sahne temizleme başladı - nesne sayısı:", this.scene.children.length);
        
        // İlk olarak, tüm özel nesnelerimizi temizleyelim
        if (this.objects) {
            // Kaleyi temizle
            if (this.objects.castle) {
                console.log("Kaldırılıyor: castle", this.objects.castle.name);
                this.scene.remove(this.objects.castle);
                this.objects.castle = null;
            }
            
            // Mancınıkları temizle
            if (this.objects.catapult) {
                console.log("Kaldırılıyor: catapult");
                if (this.objects.catapult.model) {
                    this.scene.remove(this.objects.catapult.model);
                }
                this.objects.catapult = null;
            }
            
            // Meşaleleri temizle
            if (this.objects.torches && this.objects.torches.length > 0) {
                console.log("Kaldırılıyor:", this.objects.torches.length, "torches");
                this.objects.torches.forEach(torch => {
                    if (torch && torch.model) {
                        this.scene.remove(torch.model);
                    }
                });
                this.objects.torches = [];
            }
            
            // Taşları temizle
            if (this.objects.stones && this.objects.stones.length > 0) {
                console.log("Kaldırılıyor:", this.objects.stones.length, "stones");
                this.objects.stones.forEach(stone => {
                    if (stone && stone.mesh) {
                        this.scene.remove(stone.mesh);
                    }
                });
                this.objects.stones = [];
            }
        }
        
        // Şimdi geriye kalan tüm nesneleri temizle
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            this.scene.remove(object);
        }
        
        // İlişkili kaynakları temizle
        this.objects = {
            castle: null,
            catapult: null,
            stones: [],
            torches: []
        };
        
        console.log("Sahne temizlendi - kalan nesne sayısı:", this.scene.children.length);
    }    setupLighting() {
        // Ambient light - genel ortam ışığı
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambientLight);
        
        // Directional light - güneş ışığı etkisi (performans odaklı)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(50, 200, 100);
        this.directionalLight.castShadow = true;
        
        // Gölge ayarları - daha iyi gölge kalitesi için orta çözünürlük
        this.directionalLight.shadow.mapSize.width = 1024; // Daha iyi kalite için 512'den 1024'e çıkarıldı
        this.directionalLight.shadow.mapSize.height = 1024; // Daha iyi kalite için 512'den 1024'e çıkarıldı
        this.directionalLight.shadow.camera.near = 10;
        this.directionalLight.shadow.camera.far = 200; 
        this.directionalLight.shadow.camera.left = -30;
        this.directionalLight.shadow.camera.right = 30;
        this.directionalLight.shadow.camera.top = 30;
        this.directionalLight.shadow.camera.bottom = -30;
        
        // Gölge kalitesini artırmak için ek ayarlar
        this.directionalLight.shadow.bias = -0.0005; // Gölge artefaktlarını azaltma
        this.directionalLight.shadow.normalBias = 0.02; // Normal bias ile daha doğru gölgeler
        
        this.scene.add(this.directionalLight);
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
    
    async setupScene() {
        console.log("Sahne oluşturuluyor...");
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556B2F,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01; // Hafif aşağı kaydır, z-fighting'i önle
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        try {
            // Modelleri yüklemeyi dene
            console.log("Modeller yükleniyor...");
            
            // Kaleyi yükle
            await this.loadCastle();
            
            // Mancınık oluştur - kale modeli yüklendikten sonra
            await this.initializeCatapult();
            
            // Meşaleleri oluştur
            console.log("Meşaleler oluşturuluyor...");
            await this.createTorches();
            
            // Taşları oluştur
            console.log("Taşlar oluşturuluyor...");
            await this.createStones();
            
            console.log("Sahne başarıyla oluşturuldu.");
        } catch (error) {
            console.error("Sahne oluşturulurken hata:", error);
        }
    }async loadCastle() {
        console.log("Kale yükleme başladı...");
        
        // Önce mevcut kaleyi temizle
        this.cleanupModelsByName("castle");

        // AssetLoader'ı içe aktarmadık, o yüzden import etmemiz gerekiyor
        try {
            // Dinamik import ile AssetLoader'ı yükle
            const { assetLoader } = await import('./AssetLoader.js');
            
            // AssetLoader üzerinden kale modelini al
            let castle;
            try {
                // Önce zaten yüklenmiş mi kontrol et
                if (assetLoader.assets['castle']) {
                    console.log("Kale modeli önbellekten alınıyor");
                    castle = assetLoader.getModelCopy('castle');
                } else {
                    // Yüklenmemişse yeni yükle
                    console.log("Kale modeli yükleniyor");
                    castle = await assetLoader.loadModel('castle', './models/castle.glb', assetLoader.CASTLE_SCALE);
                    castle = assetLoader.getModelCopy('castle');
                }
                
                // Kale modelini doğru pozisyona yerleştir
                castle.position.set(0, 0, 0);
                
                // Referansı güncelle ve sahneye ekle
                this.objects.castle = castle;
                this.scene.add(castle);
                
                console.log("Kale sahneye eklendi, ölçeği:", assetLoader.CASTLE_SCALE);
            } catch (error) {
                console.error('Kale yüklenirken hata:', error);
            }
        } catch (error) {
            console.error('AssetLoader yüklenirken hata:', error);
            this.loadCastleFallback();  // AssetLoader yüklenemezse eski yönteme geri dön
        }
    }
    
    // Yedek kale yükleme yöntemi - AssetLoader çalışmazsa
    loadCastleFallback() {
        console.log("Kale yükleme işlemi yedek yöntemle başlatıldı");
        
        // KALENIN SABIT ÖLÇEK DEĞERI
        const CASTLE_SCALE = 0.34; // Değer 0.08'den 0.34'e yükseltildi, AssetLoader ile aynı değer
        
        // Tüm mevcut kaleleri temizle
        this.cleanupModelsByName("castle");
        
        const loader = new GLTFLoader();
        loader.load('./models/castle.glb', (gltf) => {
            const castle = gltf.scene;
            castle.name = "castle";
            castle.userData.type = "castle";
            
            // Kale modelinin ölçeğini SABİT olarak ayarla
            castle.scale.set(CASTLE_SCALE, CASTLE_SCALE, CASTLE_SCALE);
            castle.position.set(0, 0, 0);
            
            castle.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData.type = "castle_part";
                }
            });
            
            // Referansı güncelle ve sahneye ekle
            this.objects.castle = castle;
            this.scene.add(castle);
            
            console.log("Kale sahneye eklendi (yedek yöntem), ölçeği:", CASTLE_SCALE);
        },
        undefined,
        (error) => {
            console.error('Kale yüklenirken hata (yedek yöntem):', error);
        });
    }
    
    // İsme göre model temizleme yardımcı fonksiyonu
    cleanupModelsByName(name) {
        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            const child = this.scene.children[i];
            if (child.name === name || (child.userData && child.userData.type === name)) {
                console.log(`Mevcut ${name} kaldırıldı:`, child);
                this.scene.remove(child);
            }
        }
        
        // Obje referansını temizle
        if (this.objects[name]) {
            this.objects[name] = null;
        }
    }async createTorches() {
        // Create wall torches - kale çevresinde konumlandır
        const torchPositions = [
            new THREE.Vector3(-3, 0.2, -3),
            new THREE.Vector3(3, 0.2, -3),
            new THREE.Vector3(-3, 0.2, 3),
            new THREE.Vector3(3, 0.2, 3)
        ];
        
        // Torch modelini AssetLoader'dan almayı deneyelim
        try {
            const { assetLoader } = await import('./AssetLoader.js');
            
            // Önceki torch'ları temizle
            if (this.objects.torches && this.objects.torches.length > 0) {
                this.objects.torches.forEach(torch => {
                    if (torch && torch.model) {
                        this.scene.remove(torch.model);
                    }
                });
                this.objects.torches = [];
            }
            
            // Yeni meşaleleri ekle
            for (const position of torchPositions) {
                const torch = new Torch(this, position);
                
                // AssetLoader kullanarak ekleyelim
                if (assetLoader.assets['torch']) {
                    const torchModel = assetLoader.getModelCopy('torch');
                    torchModel.position.copy(position);
                    torchModel.scale.set(assetLoader.TORCH_SCALE, assetLoader.TORCH_SCALE, assetLoader.TORCH_SCALE);
                    
                    // Modeli Torch nesnesine bağla
                    torch.model = torchModel;
                    torch.loaded = true;
                    
                    // Sahneye ekle
                    this.scene.add(torchModel);
                    
                    // Işık ekle
                    torch.addLight();
                } else {
                    // Manuel yükle
                    torch.load();
                }
                
                this.objects.torches.push(torch);
            }
        } catch (error) {
            console.error("Meşale yüklenirken hata:", error);
            
            // Klasik yöntemle meşaleleri yükle
            torchPositions.forEach(position => {
                const torch = new Torch(this, position);
                torch.load();
                this.objects.torches.push(torch);
            });
        }
    }    async createStones() {
        console.log("createStones metodu çağrıldı");
        
        // Önceki taşları temizle
        if (this.objects.stones && this.objects.stones.length > 0) {
            console.log(`${this.objects.stones.length} önceki taş temizleniyor`);
            this.objects.stones.forEach(stone => {
                if (stone && stone.mesh) {
                    this.scene.remove(stone.mesh);
                }
            });
            this.objects.stones = [];
        }        // Mancınığın yanında tıklanabilir kayalar oluştur (sağ tarafta)
        const catapultPos = this.objects.catapult ? this.objects.catapult.position : new THREE.Vector3(0, 0, 10);
        console.log("Mancınık pozisyonu:", catapultPos);        
        
        // Taşları mancınığın sağ tarafına yan yana düzgün bir şekilde yerleştir
        // Yükseklik 0.2'den 0.02'ye düşürülerek taşlar yere daha yakın konumlandırıldı
        const stonePositions = [
            new THREE.Vector3(6, 0.02, 11),    // İlk taş
            new THREE.Vector3(7, 0.02, 11),    // İkinci taş
            new THREE.Vector3(8, 0.02, 11),    // Üçüncü taş
            new THREE.Vector3(9, 0.02, 11),    // Dördüncü taş
            new THREE.Vector3(10, 0.02, 11),   // Beşinci taş
            new THREE.Vector3(11, 0.02, 11),   // Altıncı taş
            new THREE.Vector3(12, 0.02, 11)    // Yedinci taş
        ];

        for (let i = 0; i < stonePositions.length; i++) {
            const position = stonePositions[i];
            console.log(`Taş ${i + 1} oluşturuluyor, pozisyon:`, position);
            
            const stone = new Stone(this, position);
            stone.isStatic = true;
            stone.isCollected = false; // Toplama durumu için
            stone.load(); // Stone'u yükle
            this.objects.stones.push(stone);
        }
          console.log(`${stonePositions.length} adet tıklanabilir kaya oluşturuldu`);
        console.log("Toplam stones array uzunluğu:", this.objects.stones.length);
        console.log("Sahnedeki toplam çocuk sayısı:", this.scene.children.length);
    }
    
    interactWithObject(raycaster) {
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // Check torch interaction
            const torch = this.objects.torches.find(t => 
                t.model && t.model.children.includes(object)
            );
            if (torch) {
                const wasLit = torch.toggle();
                this.updateScore(wasLit ? 5 : -5);
                return true;
            }
            
            // Check stone interaction
            const stone = this.objects.stones.find(s => 
                s.mesh === object && !s.isLaunched
            );
            if (stone && this.objects.catapult.loadStone(stone)) {
                this.updateScore(2);
                return true;
            }
        }
        
        return false;
    }    launchStone() {
        const stone = this.objects.catapult.launch();
        if (stone) {
            // Mancınık ters döndü ama aynı pozisyonda, o yüzden negatif Z yönünde fırlat
            const direction = new THREE.Vector3(0, 1, -1).normalize(); // z ekseni boyunca negatif yönde fırlat (kaleye doğru)
            
            // Biraz rasgele faktör ekle (daha doğal atış için)
            direction.x += (Math.random() * 0.2) - 0.1;
            direction.z += (Math.random() * 0.1) - 0.05;
            direction.normalize();
            
            // Daha yüksek güç (15'ten 20'ye)
            stone.launch(direction, 20);
            
            // Taşın görünürlüğünü kontrol et
            if (stone.mesh) {
                stone.mesh.visible = true;
            }
            
            this.updateScore(10);
            console.log("Taş fırlatıldı! Yön:", direction, "Başlangıç pozisyonu:", stone.position);
        } else {
            console.log("Fırlatılacak taş yok!");
        }
    }
    
    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    }
      update(deltaTime) {
        // Performance: Update interval yönetimi
        this.updateCounter = (this.updateCounter || 0) + 1;
        
        // Update catapult (daha az sıklıkla)
        if (this.objects.catapult && this.updateCounter % 2 === 0) {
            this.objects.catapult.update();
        }
        
        // Update stones (chunk'lar halinde)
        const stoneChunkSize = 5; // Her frame'de maksimum 5 taş güncelle
        const startIndex = (this.updateCounter * stoneChunkSize) % this.objects.stones.length;
        const endIndex = Math.min(startIndex + stoneChunkSize, this.objects.stones.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            if (this.objects.stones[i]) {
                this.objects.stones[i].update(deltaTime);
            }
        }
        
        // Update torches (daha az sıklıkla)
        if (this.updateCounter % 3 === 0) {
            const torchChunkSize = 3; // Her 3. frame'de maksimum 3 meşale güncelle
            const torchStartIndex = ((this.updateCounter / 3) * torchChunkSize) % this.objects.torches.length;
            const torchEndIndex = Math.min(torchStartIndex + torchChunkSize, this.objects.torches.length);
            
            for (let i = torchStartIndex; i < torchEndIndex; i++) {
                if (this.objects.torches[i]) {
                    this.objects.torches[i].update(deltaTime);
                }
            }
        }
        
        // Performance: Garbage collection önerisi (uzun süre çalışan oyunlar için)
        if (this.updateCounter % 1800 === 0) { // Her 60 saniyede bir (30fps * 60s = 1800 frame)
            this.performPerformanceOptimization();
        }
    }
    
    // Performans optimizasyonu metodu
    performPerformanceOptimization() {
        console.log("Scene performance optimization başlatıldı...");
        
        // Ölü taşları temizle
        this.objects.stones = this.objects.stones.filter(stone => {
            if (!stone.active || stone.isCollected) {
                stone.dispose();
                return false;
            }
            return true;
        });
        
        // Renderer cache temizliği
        if (this.renderer.info.memory.geometries > 50) {
            console.log("Renderer cache temizleniyor...");
        }
        
        console.log(`Scene optimization tamamlandı. Aktif taş sayısı: ${this.objects.stones.length}`);
    }
    
    // Mancınık oluşturan ve yükleyen metod
    async initializeCatapult() {
        console.log("Mancınık oluşturuluyor...");
          // Mevcut mancınık varsa temizle
        if (this.objects.catapult && this.objects.catapult.model) {
            this.scene.remove(this.objects.catapult.model);
        }        // Yeni mancınık nesnesi oluştur - kaleye daha yakın pozisyonda
        const position = new THREE.Vector3(0, 0.45, 10); // Daha yakın pozisyon ve yerden yükseltilmiş (y: 0 -> 0.5)
        const catapult = new Catapult(this);
        catapult.position = position;
        // Mancınık yönünü ters çevir - 180 derece (PI) döndür
        catapult.angle = Math.PI; // Sadece yönünü değiştir
        
        // AssetLoader kullanarak yüklemeyi dene
        try {
            const { assetLoader } = await import('./AssetLoader.js');
            
            if (assetLoader.assets['catapult']) {
                const catapultModel = assetLoader.getModelCopy('catapult');
                catapultModel.position.copy(position);
                catapultModel.rotation.y = catapult.angle;
                      // Modeli Catapult nesnesine bağla
                catapult.model = catapultModel;
                catapult.loaded = true;
                
                // Mancınık parçalarını bul
                catapultModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Mancınık için tıklanabilir userData ekle
                        child.userData = {
                            type: 'catapult_part',
                            catapultRef: catapult,
                            isClickable: true
                        };
                    }
                    
                    // Mancınık parçalarını isimlerine göre tanımla
                    if (child.name.includes('base')) {
                        catapult.base = child;
                    } else if (child.name.includes('arm')) {
                        catapult.arm = child;
                    } else if (child.name.includes('bucket')) {
                        catapult.bucket = child;
                    }
                });
                
                // Sahneye ekle
                this.scene.add(catapultModel);
                console.log("Mancınık modeli AssetLoader'dan başarıyla yüklendi");
            } else {
                // Normal yüklemeye geri dön
                console.log("Mancınık modeli AssetLoader'dan bulunamadı, normal yükleme başlatılıyor...");
                catapult.load(new GLTFLoader());
            }
        } catch (error) {
            console.error("Mancınık yüklenirken hata:", error);
            catapult.load(new GLTFLoader());
        }
          // Referansı güncelle
        this.objects.catapult = catapult;
        
        // Mancınık oluşturulduktan sonra kayaları oluştur
        setTimeout(() => {
            this.createStones();
        }, 500); // Mancınığın yüklenmesi için kısa bir bekleme
        
        return catapult;
    }
}