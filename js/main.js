import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';
import { SceneManager } from './scene.js';
import { Catapult, Stone, Torch, HandTorch } from './objects.js';

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
        this.timeOfDay = 12; // 0-24 saat arası (12 = öğlen)
        this.sunAngle = 0; // Güneşin açısı
        
        // Özel meşale
        this.handTorch = null;
        this.hasHandTorch = false;
        
        // Kaynaklar
        this.resources = {
            models: {},
            textures: {}
        };        // Kamera ayarları
        this.cameraSpeed = 5;
        this.cameraRotationSpeed = 0.002;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canRotate = false;
          // Performans optimizasyonları
        this.targetFPS = 60; // 60 FPS'e yükselt (daha akıcı deneyim için)
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.lastFPSCheck = 0;
        this.currentFPS = 0;
        this.lowPerfWarningShown = false; // Tekrarlayan uyarıları önlemek için
        
        // Memory management
        this.memoryCleanupInterval = 30000; // 30 saniyede bir temizlik
        this.lastMemoryCleanup = 0;
        this.maxObjectDistance = 100; // Nesnelerin maksimum görüş mesafesi
        
        // Kamera rotasyon açıları için ayrı değişkenler
        this.cameraYaw = 0; // Y ekseni etrafında dönüş (sağa/sola)
        this.cameraPitch = 0; // X ekseni etrafında dönüş (yukarı/aşağı)
          // Etkileşim için yeni değişkenler
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
          // Mancınık etkileşim sistemi
        this.playerInventory = { 
            hasRock: false,
            collectedStone: null 
        };
          // Bildirim sistemi
        this.notificationTimeout = null;
        this.catapultState = 'empty'; // 'empty', 'loaded', 'ready'
        
        // Başlatma
        this.init();
    }
    
    init() {        // Renderer oluşturma - performans odaklı ayarlar
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('scene-canvas'),
            antialias: false, // Antialiasing kapalı (performans artışı)
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            logarithmicDepthBuffer: false // Performans için kapalı
        });
        
        // Performans ayarları
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Pixel ratio sınırlandı
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Gölge ayarları - performans odaklı
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap; // En hızlı gölge tipi
        this.renderer.shadowMap.autoUpdate = false; // Manuel güncelleme
        
        // Renderer optimizasyonları
        this.renderer.sortObjects = false; // Sorting'i kapat
        this.renderer.autoClear = true;// Kamera oluşturma
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0.8, 10); // Kamera yüksekliğini düşürdük (1.6'dan 0.8'e)
        this.camera.lookAt(0, 0.8, 0);
        
        // Kamera başlangıç açılarını ayarla
        this.cameraYaw = 0; // Doğu-batı yönünde 0 açı
        this.cameraPitch = 0; // Yatay bakış
        this.camera.rotation.order = 'YXZ'; // Rotasyon sıralaması
        
        console.log("Kamera pozisyonu:", this.camera.position);
          // Scene Manager oluşturma
        this.sceneManager = new SceneManager(this.renderer, this.camera);
        
        // El meşalesini oluştur
        this.handTorch = new HandTorch(this.sceneManager, this.camera);
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
    }    setupGUI() {
        console.log("setupGUI çağrıldı - HTML kontrolleri bağlanıyor...");
        
        // HTML slider kontrolleri
        const timeSlider = document.getElementById('time-slider');
        const timeDisplay = document.getElementById('time-display');
        
        if (timeSlider && timeDisplay) {
            timeSlider.addEventListener('input', (event) => {
                const value = parseFloat(event.target.value);
                this.timeOfDay = value;
                timeDisplay.textContent = value.toFixed(1);
                this.updateTimeOfDay(value);
            });
            console.log("HTML time slider bağlandı");
        } else {
            console.error("Time slider elementleri bulunamadı");
        }
        
        // dat.GUI'yi de deneyebiliriz (varsa)
        try {
            if (typeof dat !== 'undefined') {
                this.gui = new dat.GUI();
                console.log("dat.GUI başarıyla oluşturuldu");
                
                // Zaman Kontrolü
                const timeFolder = this.gui.addFolder('Zaman Ayarları');
                const timeSettings = {
                    saatAyarı: 12
                };
                
                timeFolder.add(timeSettings, 'saatAyarı', 0, 24).onChange((value) => {
                    this.timeOfDay = value;
                    this.updateTimeOfDay(value);
                    // HTML slider'ı da güncelle
                    if (timeSlider) timeSlider.value = value;
                    if (timeDisplay) timeDisplay.textContent = value.toFixed(1);
                });
                timeFolder.open();
                console.log("dat.GUI zaman kontrol slider'ı eklendi");
            }
        } catch (error) {
            console.log("dat.GUI yüklenemedi, HTML kontrolleri kullanılıyor:", error.message);
        }
        
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
    }
    
    // Saate göre gün/gece döngüsü
    updateTimeOfDay(hour) {
        // Gece: 20-6 arası, Gündüz: 6-20 arası
        if (hour >= 20 || hour <= 6) {
            // Gece modu
            this.isDay = false;
            this.sceneManager.scene.background = new THREE.Color(0x000033);
            
            if (this.sceneManager.directionalLight) {
                this.sceneManager.directionalLight.intensity = 0.1;
            }
            if (this.sceneManager.ambientLight) {
                this.sceneManager.ambientLight.intensity = 0.2;
            }
            
            // Meşaleleri parlat
            if (this.sceneManager.objects.torches) {
                this.sceneManager.objects.torches.forEach(torch => {
                    torch.setIntensity(5);
                });
            }
            
            this.sceneManager.scene.fog = new THREE.FogExp2(0x000033, 0.01);
            this.dayNightToggle.textContent = "Gündüze Geç";
        } else {
            // Gündüz modu - güneş pozisyonunu hesapla
            this.isDay = true;
            
            // Saat 6-18 arası güneş hareketi (0-180 derece)
            const normalizedHour = Math.max(6, Math.min(18, hour));
            this.sunAngle = ((normalizedHour - 6) / 12) * Math.PI; // 0 - PI arası
            
            // Güneş pozisyonu
            if (this.sceneManager.directionalLight) {
                const x = Math.sin(this.sunAngle) * 100;
                const y = Math.cos(this.sunAngle) * 100 + 50;
                const z = 50;
                
                this.sceneManager.directionalLight.position.set(x, y, z);
                
                // Güneş yüksekliğine göre parlaklık
                const intensity = Math.max(0.3, Math.cos(this.sunAngle - Math.PI/2) * 0.8);
                this.sceneManager.directionalLight.intensity = intensity;
            }
            
            // Gökyüzü rengi - güneş pozisyonuna göre
            const skyIntensity = Math.max(0.2, Math.cos(this.sunAngle - Math.PI/2));
            const skyColor = new THREE.Color().setHSL(0.6, 0.6, 0.4 + skyIntensity * 0.4);
            this.sceneManager.scene.background = skyColor;
            
            if (this.sceneManager.ambientLight) {
                this.sceneManager.ambientLight.intensity = 0.3 + skyIntensity * 0.3;
            }
            
            // Meşaleleri söndür
            if (this.sceneManager.objects.torches) {
                this.sceneManager.objects.torches.forEach(torch => {
                    torch.setIntensity(1);
                });
            }
              this.sceneManager.scene.fog = new THREE.FogExp2(0xcccccc, 0.005);
            this.dayNightToggle.textContent = "Geceye Geç";
        }
    }

    toggleHandTorch() {
        if (!this.handTorch) {
            // İlk kez F tuşuna basıldığında el meşalesini oluştur
            this.handTorch = new HandTorch(this.sceneManager);
            console.log("El meşalesi oluşturuldu!");
        }
        
        this.hasHandTorch = !this.hasHandTorch;
        
        if (this.hasHandTorch) {
            this.handTorch.show();
            console.log("El meşalesi açıldı!");
        } else {
            this.handTorch.hide();
            console.log("El meşalesi kapatıldı!");
        }
    }

    async loadModels() {
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
            await this.sceneManager.loadCastle();            // Mancınık SceneManager tarafından initializeCatapult() metodu ile oluşturulacak
            await this.sceneManager.initializeCatapult();
            console.log("Mancınık SceneManager tarafından oluşturuldu");
            
            // Mancınık yüklendikten sonra taşları oluştur
            await this.sceneManager.createStones();
            console.log("Taşlar mancınık yüklendikten sonra oluşturuldu");
            
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
        let totalModels = 3; // kale, mancınık+taşlar, meşaleler
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
        });        // Mancınık modelini SceneManager ile yükle
        this.sceneManager.initializeCatapult().then(() => {
            console.log("Mancınık SceneManager tarafından yüklendi (legacy mode)");
            
            // Mancınık yüklendikten sonra taşları oluştur
            return this.sceneManager.createStones();
        }).then(() => {
            console.log("Taşlar mancınık yüklendikten sonra oluşturuldu (legacy mode)");
            checkLoaded();
        }).catch(error => {
            console.error("Mancınık veya taşlar yüklenirken hata oluştu:", error);
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
      // Düşük performanslı donanım için optimizasyon metodu
    enableLowEndMode() {
        console.log("Düşük performans modu etkinleştiriliyor...");
        
        // Frame rate'i daha da düşür
        this.targetFPS = 20;
        this.frameInterval = 1000 / this.targetFPS;
        
        // Render distance'ı azalt
        this.maxObjectDistance = 50;
        
        // Kamera far plane'ini azalt
        this.camera.far = 200;
        this.camera.updateProjectionMatrix();
        
        // Fog'u daha yakın yap
        if (this.sceneManager.scene.fog) {
            this.sceneManager.scene.fog.near = 10;
            this.sceneManager.scene.fog.far = 50;
        }
        
        // Shadow map boyutunu daha da küçült
        if (this.sceneManager.directionalLight && this.sceneManager.directionalLight.shadow) {
            this.sceneManager.directionalLight.shadow.mapSize.width = 256;
            this.sceneManager.directionalLight.shadow.mapSize.height = 256;
        }
        
        // Meşale sayısını azalt
        if (this.sceneManager.objects.torches) {
            this.sceneManager.objects.torches.forEach((torch, index) => {
                if (index % 2 === 0) { // Her iki meşaleden birini gizle
                    torch.setIntensity(0);
                }
            });
        }
        
        console.log("Düşük performans modu etkinleştirildi");
    }
      // FPS'e göre otomatik kalite ayarı - daha az agresif
    autoAdjustQuality() {
        if (this.currentFPS < 15) { // Sadece çok düşük FPS'de müdahale et
            console.log("Kritik düşük FPS tespit edildi, kalite düşürülüyor...");
            this.enableLowEndMode();
        } else if (this.currentFPS < 20) {
            // Hafif optimizasyon
            this.maxObjectDistance = 75;
            console.log("Hafif performans optimizasyonu uygulandı");
        }
    }// Memory cleanup fonksiyonu
    performMemoryCleanup() {
        try {
            console.log("Memory cleanup başlatıldı...");
            
            // Texture cache temizliği
            if (THREE.Cache && THREE.Cache.files) {
                const cacheSize = Object.keys(THREE.Cache.files).length;
                if (cacheSize > 50) { // 50'den fazla cache varsa temizle
                    console.log(`Cache temizleniyor: ${cacheSize} dosya`);
                    THREE.Cache.clear();
                }
            }
            
            // Renderer info temizliği
            if (this.renderer && this.renderer.info && this.renderer.info.memory) {
                if (this.renderer.info.memory.geometries > 100) {
                    console.log("Fazla geometry tespit edildi, temizlik yapılıyor");
                    // Not calling dispose on renderer as it can cause issues
                    console.log("Geometry cleanup atlandı - potansiyel sorun");
                }
            }
            
            // Garbage collection önerisi (manuel)
            if (window.gc && typeof window.gc === 'function') {
                window.gc();
            }
            
            console.log("Memory cleanup tamamlandı");
        } catch (error) {
            console.warn("Memory cleanup sırasında hata:", error);
        }
    }// Null objeleri arraylerden temizle
    cleanupNullObjects() {
        if (!this.sceneManager.objects) return;
        
        try {            // Null taşları temizle
            if (this.sceneManager.objects.stones && Array.isArray(this.sceneManager.objects.stones)) {
                const originalLength = this.sceneManager.objects.stones.length;
                this.sceneManager.objects.stones = this.sceneManager.objects.stones.filter(stone => {
                    // More comprehensive validation
                    if (!stone) return false;
                    if (!stone.mesh) return false;
                    if (!stone.mesh.position) return false;
                    if (stone.isCollected) {
                        // Toplanan taşları tamamen kaldır
                        console.log("Removing collected stone from array");
                        if (stone.mesh && stone.mesh.parent) {
                            stone.mesh.parent.remove(stone.mesh);
                        }
                        return false;
                    }
                    return true;
                });
                
                const newLength = this.sceneManager.objects.stones.length;
                if (originalLength !== newLength) {
                    console.log(`Cleaned up ${originalLength - newLength} invalid stones`);
                }
            }
            
            // Null meşaleleri temizle
            if (this.sceneManager.objects.torches && Array.isArray(this.sceneManager.objects.torches)) {
                const originalLength = this.sceneManager.objects.torches.length;
                this.sceneManager.objects.torches = this.sceneManager.objects.torches.filter(torch => {
                    if (!torch) return false;
                    // Torch should have either light or model or position
                    if (!torch.light && !torch.model && !torch.position) return false;
                    return true;
                });
                
                const newLength = this.sceneManager.objects.torches.length;
                if (originalLength !== newLength) {
                    console.log(`Cleaned up ${originalLength - newLength} invalid torches`);
                }
            }
        } catch (error) {
            console.warn("Error during null object cleanup:", error);
        }
    }// Object culling ile nesne güncellemesi
    updateObjectsWithCulling() {
        if (!this.sceneManager.objects) return;
        
        const cameraPosition = this.camera.position;
        
        // Taşları distance culling ile güncelle
        if (this.sceneManager.objects.stones && Array.isArray(this.sceneManager.objects.stones)) {
            this.sceneManager.objects.stones.forEach((stone, index) => {
                try {
                    // Comprehensive null check
                    if (!stone || !stone.mesh || !stone.mesh.position || stone.isCollected) return;
                    
                    const distance = cameraPosition.distanceTo(stone.mesh.position);
                    
                    // Çok uzaktaki taşları gizle
                    if (distance > this.maxObjectDistance) {
                        if (stone.mesh && typeof stone.mesh.visible !== 'undefined') {
                            stone.mesh.visible = false;
                        }
                    } else {
                        if (stone.mesh && typeof stone.mesh.visible !== 'undefined') {
                            stone.mesh.visible = true;
                        }
                        
                        // Yakındaki taşları daha az sıklıkla güncelle
                        if (distance > 50) {
                            // Uzaktaki taşları her 3. frame'de güncelle
                            if (this.frameCount % 3 !== 0) return;
                        }
                    }
                } catch (error) {
                    console.warn(`Stone culling error at index ${index}:`, error);
                    // Remove problematic stone from array
                    this.sceneManager.objects.stones.splice(index, 1);
                }
            });
        }
        
        // Meşaleleri distance culling ile güncelle
        if (this.sceneManager.objects.torches && Array.isArray(this.sceneManager.objects.torches)) {
            this.sceneManager.objects.torches.forEach((torch, index) => {
                try {
                    // Comprehensive null check
                    if (!torch) return;
                    
                    // Torch'lar için model pozisyonunu kullan
                    let torchPosition;
                    if (torch.model && torch.model.position) {
                        torchPosition = torch.model.position;
                    } else if (torch.position) {
                        torchPosition = torch.position;
                    } else {
                        return; // No valid position found
                    }
                    
                    const distance = cameraPosition.distanceTo(torchPosition);
                    
                    if (distance > this.maxObjectDistance) {
                        if (torch.light && typeof torch.light.visible !== 'undefined') {
                            torch.light.visible = false;
                        }
                        if (torch.model && typeof torch.model.visible !== 'undefined') {
                            torch.model.visible = false;
                        }
                    } else {
                        if (torch.light && typeof torch.light.visible !== 'undefined') {
                            torch.light.visible = true;
                        }
                        if (torch.model && typeof torch.model.visible !== 'undefined') {
                            torch.model.visible = true;
                        }
                    }
                } catch (error) {
                    console.warn(`Torch culling error at index ${index}:`, error);
                    // Remove problematic torch from array
                    this.sceneManager.objects.torches.splice(index, 1);
                }
            });
        }
    }

    updateScore(value) {
        this.sceneManager.score += value;
        this.scoreElement.textContent = this.sceneManager.score;
    }    // Ana animasyon döngüsü - Performance optimized
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const currentTime = performance.now();
        
        // Delta time hesaplama (frame limiting kaldırıldı - daha akıcı performans için)
        this.deltaTime = this.clock.getDelta();
        
        // Delta time'ı sınırla (çok büyük değerleri önle)
        this.deltaTime = Math.min(this.deltaTime, 0.033); // Max 33ms (30 FPS minimum)
          // FPS hesaplama ve izleme (5 saniyede bir kontrol et)
        this.frameCount++;
        if (currentTime - this.lastFPSCheck > 5000) { // 5 saniyede bir FPS kontrol et
            this.currentFPS = Math.round(this.frameCount / 5); // 5 saniye için ortalama
            this.frameCount = 0;
            this.lastFPSCheck = currentTime;
            
            // Performans izleme - sadece gerçekten düşük FPS'de uyar
            if (this.currentFPS < 20 && !this.lowPerfWarningShown) {
                console.log(`⚠️ Düşük FPS tespit edildi: ${this.currentFPS}`);
                this.lowPerfWarningShown = true; // Bir kez uyar
                this.autoAdjustQuality();
            } else if (this.currentFPS >= 25) {
                this.lowPerfWarningShown = false; // FPS düzelirse uyarıyı sıfırla
            }
        }
          // Memory cleanup kontrolü (60 saniyede bir - daha az sıklıkla)
        if (currentTime - this.lastMemoryCleanup > 60000) { // 60 saniyede bir
            this.performMemoryCleanup();
            this.lastMemoryCleanup = currentTime;
        }
        
        // Scene güncellemeleri
        if (this.sceneManager) {
            this.sceneManager.update(this.deltaTime);
        }
        
        // Performans optimizasyonları - daha az sıklıkla çalıştır
        if (this.frameCount % 30 === 0) { // Her 30 frame'de bir (yaklaşık 0.5 saniyede bir)
            this.cleanupNullObjects();
            this.updateObjectsWithCulling();
        }
        
        // El meşalesi güncelleme
        if (this.handTorch && this.hasHandTorch) {
            this.handTorch.update(this.deltaTime, this.camera);
        }
          // Kamera kontrolleri (manuel)
        this.updateCameraMovement();
        
        // Shadow map güncellemesi (performans için çok sınırlı)
        if (this.frameCount % 10 === 0) { // Her 10. frame'de shadow update (daha az sıklıkta)
            this.renderer.shadowMap.needsUpdate = true;
        }
          // Render
        this.renderer.render(this.sceneManager.scene, this.camera);
    }
    
    // Kamera hareketi güncelleme
    updateCameraMovement() {
        const moveSpeed = this.cameraSpeed * this.deltaTime;
        const rotateSpeed = this.cameraRotationSpeed;
        
        // Kamera hareketi
        if (this.moveForward) {
            this.camera.position.x -= Math.sin(this.cameraYaw) * moveSpeed;
            this.camera.position.z -= Math.cos(this.cameraYaw) * moveSpeed;
        }
        if (this.moveBackward) {
            this.camera.position.x += Math.sin(this.cameraYaw) * moveSpeed;
            this.camera.position.z += Math.cos(this.cameraYaw) * moveSpeed;
        }
        if (this.moveLeft) {
            this.camera.position.x -= Math.cos(this.cameraYaw) * moveSpeed;
            this.camera.position.z += Math.sin(this.cameraYaw) * moveSpeed;
        }
        if (this.moveRight) {
            this.camera.position.x += Math.cos(this.cameraYaw) * moveSpeed;
            this.camera.position.z -= Math.sin(this.cameraYaw) * moveSpeed;
        }
        
        // Kamera yükseklik sınırları
        this.camera.position.y = Math.max(0.5, Math.min(50, this.camera.position.y));
        
        // Kamera rotasyonunu uygula
        this.camera.rotation.x = this.cameraPitch;
        this.camera.rotation.y = this.cameraYaw;
    }
    
    // Event handlers for camera movement
    onKeyDown(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true;
                break;
            case 'KeyF':
                this.toggleHandTorch();
                break;
            case 'Space':
                event.preventDefault();
                // Mancınık kontrolü için boşluk tuşu
                break;
        }
    }
    
    onKeyUp(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false;
                break;
        }
    }    onMouseDown(event) {
        // Sol tık (button === 0) ve sağ tık (button === 2) ile kamera kontrolü
        if (event.button === 0 || event.button === 2) {
            this.canRotate = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            
            // Store click position for click detection
            this.clickStartPos = { x: event.clientX, y: event.clientY };
            this.clickStartTime = Date.now();
            
            // Only prevent default for mouse movement, not clicks
            // event.preventDefault(); // Commented out to allow click events
            
            // Pointer lock sistemi için canvas'ı aktif et (sadece drag işlemi için)
            // const canvas = document.getElementById('scene-canvas');
            // if (canvas && document.pointerLockElement !== canvas) {
            //     canvas.requestPointerLock();
            // }
        }
    }
      onMouseUp(event) {
        // Sol tık ve sağ tık için kamera kontrolünü durdur
        if (event.button === 0 || event.button === 2) {
            this.canRotate = false;
            
            // Check if this was a click (not a drag)
            const timeDiff = Date.now() - (this.clickStartTime || 0);
            const moveDistance = this.clickStartPos ? 
                Math.sqrt(
                    Math.pow(event.clientX - this.clickStartPos.x, 2) + 
                    Math.pow(event.clientY - this.clickStartPos.y, 2)
                ) : 0;
            
            // If it was a quick click without much movement, treat as click
            if (timeDiff < 200 && moveDistance < 5) {
                console.log("Quick click detected, allowing click event to fire");
                // Don't prevent default to allow click event
            } else {
                console.log("Drag detected, preventing click event");
                // event.preventDefault(); // Still prevent for drags
            }
            
            // Reset click tracking
            this.clickStartPos = null;
            this.clickStartTime = null;
            
            // Pointer lock'u serbest bırak
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
    }
      onMouseMove(event) {
        if (this.canRotate) {
            let movementX, movementY;
            
            // Pointer lock varsa movementX/Y kullan, yoksa el ile hesapla
            if (document.pointerLockElement) {
                movementX = event.movementX || 0;
                movementY = event.movementY || 0;
            } else {
                // El ile hesaplama (pointer lock yoksa)
                movementX = event.clientX - (this.lastMouseX || event.clientX);
                movementY = event.clientY - (this.lastMouseY || event.clientY);
                this.lastMouseX = event.clientX;
                this.lastMouseY = event.clientY;
            }
              // Mouse hassasiyetini iyileştir
            const sensitivity = 0.003; // Hassasiyeti artır (0.002'den 0.003'e)
            this.cameraYaw -= movementX * sensitivity;
            this.cameraPitch -= movementY * sensitivity;
            
            // Pitch sınırları (yukarı/aşağı bakma)
            this.cameraPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraPitch));
        }
    }    onClick(event) {
        try {
            console.log("=== CLICK EVENT FIRED ===");
            console.log("Click coordinates:", event.clientX, event.clientY);
            console.log("Window size:", window.innerWidth, window.innerHeight);
            
            // Mouse pozisyonunu normalize et
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            console.log("Normalized mouse coords:", this.mouse.x, this.mouse.y);
              // Raycasting - sadece görünür ve aktif nesneleri kontrol et
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Önce tüm intersections'ı al
            const allIntersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);
            
            // Sadece görünür ve clickable nesneleri filtrele
            const intersects = allIntersects.filter(intersection => {
                const obj = intersection.object;
                
                // Görünür olmalı
                if (!obj.visible) return false;
                
                // Parent'ı da görünür olmalı (recursive check)
                let parent = obj.parent;
                while (parent) {
                    if (!parent.visible) return false;
                    parent = parent.parent;
                }
                
                // Eğer userData varsa, type kontrolü yap
                if (obj.userData && obj.userData.type === 'collected_stone') {
                    return false; // Topunanmış taşları dahil etme
                }
                
                return true;
            });
            
            console.log(`Total intersections: ${allIntersects.length}, Filtered: ${intersects.length}`);
            
            console.log(`Click detected, ${intersects.length} intersections found`);
              if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                
                // ÖNCE görünürlük kontrolü yap - görünmez objeleri tamamen atla
                if (!clickedObject.visible) {
                    console.log("🚫 Clicked object is invisible, skipping");
                    return;
                }
                
                console.log("=== CLICK DEBUG ===");
                console.log("Clicked object type:", clickedObject.type);
                console.log("Clicked object name:", clickedObject.name);
                console.log("Clicked object UUID:", clickedObject.uuid);
                console.log("Clicked object userData:", clickedObject.userData);
                console.log("Clicked object visible:", clickedObject.visible);
                console.log("Clicked object parent:", clickedObject.parent?.type);
                console.log("Distance:", intersects[0].distance);
                console.log("==================");
                
                  // Taş toplama kontrolü - önce userData kontrolü yap, sonra stones array'inde ara
                let stone = null;
                
                // Method 1: userData ile direkt erişim
                if (clickedObject.userData && clickedObject.userData.type === 'stone' && clickedObject.userData.stoneRef) {
                    stone = clickedObject.userData.stoneRef;
                    console.log("Stone found via userData");
                }
                  // Method 2: stones array'inde mesh'i match eden taşı bul
                if (!stone && this.sceneManager.objects.stones && Array.isArray(this.sceneManager.objects.stones)) {
                    stone = this.sceneManager.objects.stones.find(s => {
                        // Check if the clicked object matches this stone's mesh or is a child of it
                        if (!s || !s.mesh) return false;
                        
                        // ÖNCE collection durumunu kontrol et
                        if (s.isCollected || s.isBeingCollected) return false;
                        
                        // Mesh'in görünür olduğunu kontrol et
                        if (!s.mesh.visible) return false;
                        
                        if (s.mesh === clickedObject) return true;
                        
                        // Check if clicked object is a child of the stone mesh
                        let parent = clickedObject.parent;
                        while (parent) {
                            if (parent === s.mesh) return true;
                            parent = parent.parent;
                        }
                        
                        return false;
                    });
                      if (stone) {
                        console.log("Stone found via array search");
                    }
                }                // Stone collection logic - let collect() method handle its own locking
                if (stone && !stone.isCollected && !stone.isBeingCollected) {
                    
                    // 🚨 INVENTORY KONTROLÜ - Envanterde zaten taş varsa yeni taş almayı engelle
                    if (this.playerInventory.hasRock && this.playerInventory.collectedStone) {
                        console.log("🚫 ENVANTER DOLU! Mevcut taşı mancınığa yerleştirmeden yeni taş alamazsınız!");
                        this.showNotification("Envanterde zaten taş var! Önce mancınığa yerleştirin.", 3000, 'warning');
                        return; // Yeni taş almayı engelle
                    }
                    
                    console.log("Stone found and collecting...");
                    
                    console.log("Stone mesh visible before collection:", stone.mesh ? stone.mesh.visible : "no mesh");
                    console.log("Stone mesh parent before collection:", stone.mesh ? stone.mesh.parent?.type : "no mesh");
                    console.log("Stone in scene before collection:", stone.mesh ? this.sceneManager.scene.children.includes(stone.mesh) : "no mesh");
                      if (stone.collect && typeof stone.collect === 'function') {
                        const collected = stone.collect();if (collected) {
                            console.log("✅ TAŞ BAŞARIYLA TOPLANDI - tek tıklamada!");
                              // Score ve inventory güncelle
                            this.updateScore(10);
                            console.log("Taş toplandı! +10 puan");
                            this.playerInventory.hasRock = true; // Taşı envantere ekle
                            this.playerInventory.collectedStone = stone; // Taşı referansını sakla
                            
                            // Envanter UI'nı güncelle
                            this.updateInventoryUI();
                            
                            // Ekranda toplama mesajı göster
                            this.showNotification("Taş toplandı! Mancınığa yüklemek için mancınığa tıklayın.", 3000, 'success');
                            
                            // Collection başarılı oldu, işlemi sonlandır
                            return;
                        } else {
                            console.log("❌ Collection failed");
                            stone.isBeingCollected = false; // Lock'u kaldır
                        }                    }                } else if (stone && (stone.isCollected || stone.isBeingCollected)) {
                    console.log("⚠️ Bu taş zaten toplandı veya toplanıyor - yeni tıklama engellendi");
                    return;                }
                
                // Mancınık kontrolü - taş yükleme ve fırlatma
                else if (clickedObject.userData && (clickedObject.userData.type === 'catapult_part' || clickedObject.userData.type === 'catapult')) {
                    console.log("🏹 Mancınık tıklandı");
                    
                    const catapult = this.sceneManager.objects.catapult;
                    
                    // Oyuncunun envanterinde taş varsa mancınığa yükle
                    if (this.playerInventory.hasRock && this.playerInventory.collectedStone && catapult && !catapult.hasStone) {
                        console.log("📦 Taş mancınığa yükleniyor...");
                        
                        const loaded = catapult.loadStone(this.playerInventory.collectedStone);
                          if (loaded) {
                            this.playerInventory.hasRock = false;
                            this.playerInventory.collectedStone = null;
                            
                            // Envanter UI'nı güncelle
                            this.updateInventoryUI();
                            
                            this.showNotification("✅ Taş mancınığa yüklendi! Fırlatmak için tekrar tıklayın!", 3000, 'success');
                        }
                    } 
                    // Mancınık zaten yüklüyse fırlat
                    else if (catapult && catapult.hasStone) {
                        console.log("🚀 Mancınıktan taş fırlatılıyor...");
                        this.sceneManager.launchStone();
                        this.showNotification("🚀 Taş fırlatıldı!", 3000, 'success');
                    } 
                    // Taş yok uyarısı
                    else {
                        this.showNotification("⚠️ Önce bir taş toplamalısınız!", 3000, 'warning');
                    }
                }
                
                // Debug için - genel nesne bilgisi
                console.log("Clicked object info:", {
                    name: clickedObject.name,
                    type: clickedObject.type,
                    userData: clickedObject.userData,
                    position: clickedObject.position
                });
            } else {
                console.log("No objects clicked");
            }
        } catch (error) {
            console.error("Error in onClick:", error);
        }
   }
      // Ekranda bildirim gösterme metodu - gelişmiş versiyon
    showNotification(message, duration = 3000, type = 'info') {
        // Önceki bildirimi temizle
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
        
        // Bildirim elementi var mı kontrol et
        let notificationElement = document.getElementById('game-notification');
        
        if (!notificationElement) {
            // Element yoksa oluştur
            notificationElement = document.createElement('div');
            notificationElement.id = 'game-notification';
            notificationElement.style.position = 'fixed';
            notificationElement.style.bottom = '20px';
            notificationElement.style.left = '50%';
            notificationElement.style.transform = 'translateX(-50%)';
            notificationElement.style.color = 'white';
            notificationElement.style.padding = '10px 20px';
            notificationElement.style.borderRadius = '5px';
            notificationElement.style.fontWeight = 'bold';
            notificationElement.style.zIndex = '1000';
            notificationElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-out';
            document.body.appendChild(notificationElement);
        }
        
        // Bildirim tipine göre renk ve ikon ayarla
        let bgColor, icon;
        switch (type) {
            case 'success':
                bgColor = 'rgba(46, 125, 50, 0.9)'; // Yeşil
                icon = '✅ ';
                break;
            case 'warning':
                bgColor = 'rgba(237, 108, 2, 0.9)'; // Turuncu
                icon = '⚠️ ';
                break;
            case 'error':
                bgColor = 'rgba(211, 47, 47, 0.9)'; // Kırmızı
                icon = '❌ ';
                break;
            case 'info':
            default:
                bgColor = 'rgba(0, 0, 0, 0.8)';
                icon = 'ℹ️ ';
                break;
        }
        
        notificationElement.style.backgroundColor = bgColor;
        
        // Mesajı ayarla ve göster
        notificationElement.textContent = icon + message;
        notificationElement.style.opacity = '1';
        notificationElement.style.transform = 'translateX(-50%) translateY(0)';
        
        // Animasyon efekti ekle
        notificationElement.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => {
            notificationElement.style.transform = 'translateX(-50%) translateY(0)';
        }, 50);
        
        // Belirli bir süre sonra bildirim kaybolsun
        this.notificationTimeout = setTimeout(() => {
            notificationElement.style.opacity = '0';
            notificationElement.style.transform = 'translateX(-50%) translateY(20px)';        }, duration);
    }
    
    // Envanter UI'nı güncelleyen fonksiyon
    updateInventoryUI() {
        const inventoryElement = document.getElementById('inventory-status');
        if (!inventoryElement) return;
        
        if (this.playerInventory.hasRock && this.playerInventory.collectedStone) {
            inventoryElement.textContent = '🗿 Envanter: Taş Var';
            inventoryElement.style.color = '#4CAF50'; // Yeşil
            inventoryElement.style.fontWeight = 'bold';
        } else {
            inventoryElement.textContent = '🎒 Envanter: Boş';
            inventoryElement.style.color = '#666';
            inventoryElement.style.fontWeight = 'normal';
        }
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
        
        // Global App referansını window'a ata (diagnostic tools için)
        window.app = app;
        
        // Global resetScene referansını ata
        if (!window.resetScene) {
            console.log("Global resetScene fonksiyonu atanıyor");
            window.resetScene = app.resetScene.bind(app);
        }
        
        console.log("Uygulama başarıyla başlatıldı");
        console.log("window.app global referansı oluşturuldu");
    } catch (error) {
        console.error("Uygulama başlatılırken hata oluştu:", error);
    }
});
