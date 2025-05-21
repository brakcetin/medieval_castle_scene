import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SceneManager } from './scene.js';
import { Catapult, Stone, Torch } from './objects.js';

// Ana uygulama sınıfı
class App {
    constructor() {
        // DOM elementlerine erişim
        this.loadingElement = document.getElementById('loading');
        this.scoreElement = document.getElementById('score');
        this.dayNightToggle = document.getElementById('day-night-toggle');
        
        // Three.js bileşenleri
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.sceneManager = null;
        
        // Kullanıcı girdisi
        this.keys = {};
        
        // Zaman takibi
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        
        // Işık ve gökyüzü ayarları
        this.isDay = true;
        this.gui = null;
        
        // Kaynaklar
        this.resources = {
            models: {},
            textures: {}
        };
        
        // Başlatma
        this.init();
    }
    
    init() {
        // Renderer oluşturma
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('scene-canvas'),
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        
        // Kamera oluşturma
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Kontroller oluşturma
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Yerden geçmemesi için sınırlama
        
        // Scene Manager oluşturma
        this.sceneManager = new SceneManager(this.renderer, this.camera);
          // Reset fonksiyonu - tüm sahneyi temizler ve yeniden oluşturur
        window.resetScene = async () => {
            console.log("Sahne sıfırlanıyor...");
            
            // AssetLoader'ı temizle ve sıfırla
            try {
                const { assetLoader } = await import('./AssetLoader.js');
                console.log("Asset önbelleği temizleniyor...");
                assetLoader.clearCache();
            } catch (error) {
                console.warn("AssetLoader temizlenemedi:", error);
            }
            
            // Eski SceneManager'ı temizle
            if (this.sceneManager && this.sceneManager.scene) {
                console.log("SceneManager temizleniyor...");
                this.sceneManager.cleanupScene();
            }
            
            // Eski SceneManager'ı yok et
            this.sceneManager = null;
            
            // Yeni bir SceneManager oluştur
            console.log("Yeni SceneManager oluşturuluyor...");
            this.sceneManager = new SceneManager(this.renderer, this.camera);
            
            console.log("Sahne sıfırlandı");
            
            // Score'u sıfırla
            this.score = 0;
            if (this.scoreElement) {
                this.scoreElement.textContent = "0";
            }
        };
        
        // Olay dinleyiciler
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        this.dayNightToggle.addEventListener('click', this.toggleDayNight.bind(this));
        
        // GUI oluşturma
        this.setupGUI();
        
        // Modelleri yükle
        this.loadModels();
        
        // Animasyon döngüsünü başlat
        this.animate();
    }
    
    setupGUI() {
        this.gui = new dat.GUI();
        
        // Işık ayarları
        const lightFolder = this.gui.addFolder('Işık Ayarları');
        const lightSettings = {
            meşaleParlaklığı: 2,
            ambientIntensity: 0.5
        };
        
        lightFolder.add(lightSettings, 'meşaleParlaklığı', 0, 5).onChange((value) => {
            // Tüm meşaleleri güncelle
            if (this.sceneManager.objects.torches) {
                this.sceneManager.objects.torches.forEach(torch => {
                    torch.setIntensity(value);
                });
            }
        });
        
        lightFolder.add(lightSettings, 'ambientIntensity', 0, 1).onChange((value) => {
            if (this.sceneManager.scene.ambientLight) {
                this.sceneManager.scene.ambientLight.intensity = value;
            }
        });
        
        lightFolder.open();
        
        // Mancınık ayarları
        const catapultFolder = this.gui.addFolder('Mancınık Ayarları');
        const catapultSettings = {
            maxPower: 100
        };
        
        catapultFolder.add(catapultSettings, 'maxPower', 50, 200).onChange((value) => {
            if (this.sceneManager.objects.catapult) {
                this.sceneManager.objects.catapult.maxPower = value;
            }
        });
        
        // Kamera ayarları
        const cameraFolder = this.gui.addFolder('Kamera Ayarları');
        const cameraSettings = {
            speed: 5
        };
        
        cameraFolder.add(cameraSettings, 'speed', 1, 10);
    }    async loadModels() {
        // Yükleme ekranını göster
        if (this.loadingElement) {
            this.loadingElement.style.display = 'block';
        }
        
        try {
            // AssetLoader'ı içe aktar
            const { assetLoader } = await import('./AssetLoader.js');
            
            // Tüm modelleri önceden yükle
            console.log("Tüm modeller AssetLoader ile yükleniyor...");
            await assetLoader.preloadAllModels();
            
            // Scene Manager aracılığıyla sahneyi yükle
            await this.sceneManager.loadCastle();
            
            // Mancınık model yükleme ve yerleştirme
            this.sceneManager.objects.catapult = new Catapult(this.sceneManager);
            
            // Modelleri AssetLoader kullanarak yükle
            if (assetLoader.assets['catapult']) {
                this.sceneManager.objects.catapult.model = assetLoader.getModelCopy('catapult');
                this.sceneManager.scene.add(this.sceneManager.objects.catapult.model);
                this.sceneManager.objects.catapult.loaded = true;
                console.log("Mancınık modeli AssetLoader'dan yüklendi");
            } else {
                // Yüklenemezse normal yöntemle yükle
                console.log("Mancınık modelinin normal yüklemesi başlatılıyor...");
                const loader = new GLTFLoader();
                this.sceneManager.objects.catapult.load(loader);
            }
            
            // Meşale modellerini oluştur
            this.sceneManager.objects.torches = [];
            const torchPositions = [
                new THREE.Vector3(5, 0, 5),
                new THREE.Vector3(-5, 0, 5),
                new THREE.Vector3(5, 0, -5),
                new THREE.Vector3(-5, 0, -5)
            ];
            
            torchPositions.forEach(position => {
                const torch = new Torch(this.sceneManager, position);
                
                // AssetLoader ile yüklemeyi dene
                if (assetLoader.assets['torch']) {
                    torch.model = assetLoader.getModelCopy('torch');
                    torch.model.position.copy(position);
                    torch.model.scale.set(assetLoader.TORCH_SCALE, assetLoader.TORCH_SCALE, assetLoader.TORCH_SCALE);
                    this.sceneManager.scene.add(torch.model);
                    torch.loaded = true;
                } else {
                    // Normal yükleme
                    torch.load();
                }
                
                this.sceneManager.objects.torches.push(torch);
            });
            
            // Taş modelini test için yükleyelim - kalenin dışına yerleştir
            const stone = new Stone(this.sceneManager);
            stone.position.set(10, 1, 10); // Kale dışında bir pozisyon
            stone.radius = 0.5; // Taşın boyutunu küçült
            
            // AssetLoader ile yüklemeyi dene
            if (assetLoader.assets['stone']) {
                stone.mesh = assetLoader.getModelCopy('stone');
                stone.mesh.position.copy(stone.position);
                stone.mesh.scale.set(assetLoader.STONE_SCALE, assetLoader.STONE_SCALE, assetLoader.STONE_SCALE);
                this.sceneManager.scene.add(stone.mesh);
                stone.loaded = true;
            } else {
                // Normal yükleme
                stone.load();
            }
            
            // Yükleme tamamlandı, ekranı gizle
            if (this.loadingElement) {
                this.loadingElement.style.display = 'none';
            }
        } catch (error) {
            console.error("Model yükleme hatası:", error);
            
            // Hata durumunda eski yöntemle yükleyelim
            console.log("Klasik yüklemeye geçiliyor...");
            this.loadModelsLegacy();
        }
    }
    
    // Eski yöntem model yükleme (AssetLoader çalışmazsa)
    loadModelsLegacy() {
        console.log("Modeller klasik yöntemle yükleniyor...");
        
        const gltfLoader = new GLTFLoader();
        let totalModels = 4; // kale, mancınık, taş, meşale
        let loadedModels = 0;
        
        // Yükleme tamamlandığında kontrol
        const checkLoaded = () => {
            loadedModels++;
            if (loadedModels >= totalModels) {
                if (this.loadingElement) {
                    this.loadingElement.style.display = 'none';
                }
            }
        };
        
        // Kale modelini yükle
        gltfLoader.load('./models/castle.glb', (gltf) => {
            const castle = gltf.scene;
            castle.name = "castle";
            castle.userData.type = "castle";
            
            // Kale ölçeğini sabit olarak ayarla
            castle.scale.set(0.08, 0.08, 0.08);
            castle.position.set(0, 0, 0);
            
            castle.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Varsa önceki kaleyi kaldır
            if (this.sceneManager.objects.castle) {
                this.sceneManager.scene.remove(this.sceneManager.objects.castle);
            }
            
            this.sceneManager.objects.castle = castle;
            this.sceneManager.scene.add(castle);
            
            checkLoaded();
        }, undefined, (error) => {
            console.error('Kale modeli yüklenirken hata oluştu:', error);
            checkLoaded();
        });
        
        // Mancınık modelini yükle
        this.sceneManager.objects.catapult = new Catapult(this.sceneManager);
        this.sceneManager.objects.catapult.load(gltfLoader);
        checkLoaded();
        
        // Meşale modellerini oluştur
        this.sceneManager.objects.torches = [];
        const torchPositions = [
            new THREE.Vector3(5, 0, 5),
            new THREE.Vector3(-5, 0, 5),
            new THREE.Vector3(5, 0, -5),
            new THREE.Vector3(-5, 0, -5)
        ];
        
        torchPositions.forEach(position => {
            const torch = new Torch(this.sceneManager, position);
            torch.load();
            this.sceneManager.objects.torches.push(torch);
        });
        checkLoaded();
        
        // Taş modelini test için yükleyelim
        const stone = new Stone(this.sceneManager);
        stone.position.set(10, 1, 10);
        stone.radius = 0.5;
        stone.load();
        checkLoaded();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
      toggleDayNight() {
        this.isDay = !this.isDay;
        
        if (this.isDay) {
            // Gündüz ayarları
            this.sceneManager.scene.background = new THREE.Color(0x87CEEB);
            if (this.sceneManager.directionalLight) {
                this.sceneManager.directionalLight.intensity = 0.8;
            }
            if (this.sceneManager.ambientLight) {
                this.sceneManager.ambientLight.intensity = 0.6;
            }
            // Meşale ışıklarını azalt
            if (this.sceneManager.objects.torches) {
                this.sceneManager.objects.torches.forEach(torch => {
                    torch.setIntensity(2);
                });
            }
            // Fog'u kaldır veya azalt
            this.sceneManager.scene.fog = new THREE.FogExp2(0xcccccc, 0.005);
            
            this.dayNightToggle.textContent = "Geceye Geç";
        } else {
            // Gece ayarları
            this.sceneManager.scene.background = new THREE.Color(0x000022);
            if (this.sceneManager.directionalLight) {
                this.sceneManager.directionalLight.intensity = 0.1;
            }
            if (this.sceneManager.ambientLight) {
                this.sceneManager.ambientLight.intensity = 0.2;
            }
            // Meşale ışıklarını artır
            if (this.sceneManager.objects.torches) {
                this.sceneManager.objects.torches.forEach(torch => {
                    torch.setIntensity(5);
                });
            }
            // Sis ekle
            this.sceneManager.scene.fog = new THREE.FogExp2(0x000022, 0.01);
            
            this.dayNightToggle.textContent = "Gündüze Geç";
        }
    }
    
    handleInput() {
        // Mancınık kontrolü
        const catapult = this.sceneManager.objects.catapult;
        if (catapult) {
            if (this.keys['ArrowLeft']) {
                catapult.rotate(1);
            }
            if (this.keys['ArrowRight']) {
                catapult.rotate(-1);
            }
            if (this.keys['Space'] && !this.spacePressed) {
                this.spacePressed = true;
                catapult.startCharging();
            }
            if (!this.keys['Space'] && this.spacePressed) {
                this.spacePressed = false;
                const stone = catapult.fire();
                if (stone) {
                    this.sceneManager.objects.stones.push(stone);
                }
            }
        }
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.deltaTime = this.clock.getDelta();
        
        // Kullanıcı girişini işle
        this.handleInput();
        
        // Sahnedeki objeleri güncelle
        if (this.sceneManager.objects.catapult) {
            this.sceneManager.objects.catapult.update(this.deltaTime);
        }
        
        // Taşları güncelle
        if (this.sceneManager.objects.stones) {
            for (let i = this.sceneManager.objects.stones.length - 1; i >= 0; i--) {
                const stone = this.sceneManager.objects.stones[i];
                stone.update(this.deltaTime);
                if (!stone.active) {
                    this.sceneManager.objects.stones.splice(i, 1);
                }
            }
        }
        
        // Meşaleleri güncelle
        if (this.sceneManager.objects.torches) {
            this.sceneManager.objects.torches.forEach(torch => {
                torch.update(this.deltaTime);
            });
        }
        
        // Kontrolleri güncelle
        this.controls.update();
        
        // Sahneyi render et
        this.renderer.render(this.sceneManager.scene, this.camera);
    }
    
    updateScore(value) {
        this.sceneManager.score += value;
        this.scoreElement.textContent = this.sceneManager.score;
    }
}

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM yüklendi, uygulama başlatılıyor...");
    
    try {
        // AssetLoader'ı ilk olarak yükle ve ön yükleme yap
        const { assetLoader } = await import('./AssetLoader.js');
        console.log("AssetLoader hazırlanıyor...");
        
        // Uygulamayı başlat
        const app = new App();
        
        // Global resetScene referansını ata
        if (!window.resetScene) {
            console.log("Global resetScene fonksiyonu atanıyor");
            window.resetScene = app.resetScene.bind(app);
        }
        
        console.log("Uygulama başarıyla başlatıldı");
    } catch (error) {
        console.error("Uygulama başlatılırken hata oluştu:", error);
    }
});
