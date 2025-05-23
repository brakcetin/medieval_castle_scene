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
        
        // Kamera ayarları
        this.cameraSpeed = 5;
        this.cameraRotationSpeed = 0.002;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canRotate = false;
        
        // Etkileşim için yeni değişkenler
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedStone = null;
        this.isNearCatapult = false;
        
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
        this.camera.position.set(0, 0.8, 10); // Kamera yüksekliğini düşürdük (1.6'dan 0.8'e)
        this.camera.lookAt(0, 0.8, 0);
        
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
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.dayNightToggle.addEventListener('click', this.toggleDayNight.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        
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
              // Mancınık SceneManager tarafından initializeCatapult() metodu ile oluşturulacak
            await this.sceneManager.initializeCatapult();
            console.log("Mancınık SceneManager tarafından oluşturuldu");
              // NOT: Meşaleler artık sadece scene.js içindeki createTorches() metodu ile oluşturuluyor
            // NOT: Taşlar artık sadece scene.js içindeki createStones() metodu ile oluşturuluyor
            
            // Bu kısımda taş oluşturma kodu kaldırıldı - kalenin ortasındaki taş sorununu çözüyor
            
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
            const castle = gltf.scene;            castle.name = "castle";
            castle.userData.type = "castle";
            
            // Kale ölçeğini sabit olarak ayarla
            castle.scale.set(0.34, 0.34, 0.34); // Değer 0.08'den 0.34'e yükseltildi
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
          // Mancınık modelini SceneManager ile yükle
        this.sceneManager.initializeCatapult().then(() => {
            console.log("Mancınık SceneManager tarafından yüklendi (legacy mode)");
            checkLoaded();
        }).catch(error => {
            console.error("Mancınık yüklenirken hata oluştu:", error);
            checkLoaded();
        });
          // Meşaleler scene.js içindeki createTorches() metodu ile oluşturuluyor
        // SceneManager'a meşaleleri yükleme talimatı ver
        this.sceneManager.createTorches().then(() => {
            console.log("Meşaleler SceneManager tarafından yüklendi (legacy mode)");
            checkLoaded();
        }).catch(error => {
            console.error("Meşaleler yüklenirken hata oluştu:", error);
            checkLoaded();
        });        // Taşlar scene.js içindeki createStones() metodu ile oluşturuluyor
        this.sceneManager.createStones().then(() => {
            console.log("Taşlar SceneManager tarafından yüklendi (legacy mode)");
            checkLoaded();
        }).catch(error => {
            console.error("Taşlar yüklenirken hata oluştu:", error);
            checkLoaded();
        });
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
    
    onMouseDown(event) {
        if (event.button === 0) { // Sol tık
            this.canRotate = true;
            document.body.requestPointerLock();
        }
    }
    
    onMouseUp(event) {
        if (event.button === 0) { // Sol tık
            this.canRotate = false;
            document.exitPointerLock();
        }
    }
    
    onMouseMove(event) {
        if (this.canRotate) {
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            
            // Yatay rotasyon (sağa/sola bakma)
            this.camera.rotation.y -= movementX * this.cameraRotationSpeed;
            
            // Dikey rotasyon (yukarı/aşağı bakma) - sınırlı açıda
            const verticalRotation = this.camera.rotation.x - movementY * this.cameraRotationSpeed;
            // Yukarı/aşağı bakma açısını sınırla (-45 ile 45 derece arası)
            this.camera.rotation.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, verticalRotation));
        }
    }
    
    onClick(event) {
        // Mouse pozisyonunu normalize et
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Raycaster'ı güncelle
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Taş seçili değilse ve mancınığın yanında değilsek
        if (!this.selectedStone && !this.isNearCatapult) {
            // Tüm nesneleri kontrol et
            const intersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);
            
            // Taş kontrolü
            for (const intersect of intersects) {
                if (intersect.object.userData.isStone) {
                    const stone = intersect.object.userData.stoneObject;
                    if (stone && !stone.isLaunched) {
                        this.selectedStone = stone;
                        console.log("Taş seçildi");
                        return;
                    }
                }
            }
        }
        
        // Taş seçili ve mancınığın yanındaysak
        if (this.selectedStone && this.isNearCatapult) {
            const catapult = this.sceneManager.objects.catapult;
            if (catapult && catapult.model) {
                const distance = this.camera.position.distanceTo(catapult.model.position);
                if (distance < 6) {
                    // Taşı mancınığa yükle
                    if (catapult.loadStone(this.selectedStone)) {
                        console.log("Taş mancınığa yüklendi");
                        this.selectedStone = null;
                    }
                }
            }
        }
        
        // Mancınığın yanındaysak ve taş yüklüyse
        if (this.isNearCatapult) {
            const catapult = this.sceneManager.objects.catapult;
            if (catapult && catapult.hasStone) {
                const distance = this.camera.position.distanceTo(catapult.model.position);
                if (distance < 6) {
                    // Taşı fırlat
                    this.sceneManager.launchStone();
                    console.log("Taş fırlatıldı");
                }
            }
        }
    }
    
    handleInput() {
        const delta = this.deltaTime;
        const moveSpeed = this.cameraSpeed * delta;
        
        // Kameranın baktığı yönü hesapla
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.y = 0; // Y ekseninde hareketi engelle
        direction.normalize();
        
        // İleri/geri hareket
        if (this.moveForward) {
            this.camera.position.addScaledVector(direction, moveSpeed);
        }
        if (this.moveBackward) {
            this.camera.position.addScaledVector(direction, -moveSpeed);
        }
        
        // Sağa/sola hareket için yan vektörü hesapla
        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(this.camera.up, direction).normalize();
        
        if (this.moveRight) {
            this.camera.position.addScaledVector(rightVector, -moveSpeed); // D tuşu için yönü ters çevirdik
        }
        if (this.moveLeft) {
            this.camera.position.addScaledVector(rightVector, moveSpeed); // A tuşu için yönü ters çevirdik
        }
        
        // Kameranın y pozisyonunu sabit tut
        this.camera.position.y = 0.8;
        
        // Mancınığa yakınlık kontrolü
        const catapult = this.sceneManager.objects.catapult;
        if (catapult && catapult.model) {
            const distance = this.camera.position.distanceTo(catapult.model.position);
            this.isNearCatapult = distance < 6; // 3 birimden 6 birime çıkardık
        } else {
            this.isNearCatapult = false;
        }
        
        // Seçili taşı kamerayla birlikte hareket ettir
        if (this.selectedStone && this.selectedStone.mesh) {
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            direction.y = 0;
            direction.normalize();
            
            // Taşı kameranın önünde tut
            this.selectedStone.mesh.position.copy(this.camera.position);
            this.selectedStone.mesh.position.addScaledVector(direction, 1.5); // 1.5 birim önde
            this.selectedStone.mesh.position.y = 0.8; // Kamera ile aynı yükseklikte
        }
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.deltaTime = this.clock.getDelta();
        
        // Kullanıcı girişini işle
        this.handleInput();
        
        // Sahnedeki objeleri güncelle
        if (this.sceneManager) {
            this.sceneManager.update(this.deltaTime);
        }
        
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
