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
        
        // Kamera ayarları
        this.cameraSpeed = 5;
        this.cameraRotationSpeed = 1.5;
        this.isCameraLocked = false; // Kamera kontrollerini kilitleme durumu
        this.cameraMode = 'free'; // Kamera modu (free, follow, overhead)
        
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
        
        // Yardım paneli için DOM elementleri
        this.helpPanel = document.getElementById('controls-help');
        this.helpToggle = document.getElementById('help-toggle');
        this.closeHelp = document.getElementById('close-help');
        
        // Olay dinleyiciler
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        this.dayNightToggle.addEventListener('click', this.toggleDayNight.bind(this));
        
        // Yardım paneli olay dinleyicileri
        if (this.helpToggle) {
            this.helpToggle.addEventListener('click', () => {
                this.helpPanel.classList.toggle('hidden');
                // Yardım paneli açıkken kontrolleri devre dışı bırak
                this.controls.enabled = this.helpPanel.classList.contains('hidden');
            });
        }
        
        if (this.closeHelp) {
            this.closeHelp.addEventListener('click', () => {
                this.helpPanel.classList.add('hidden');
                // Panel kapandığında kontrolleri etkinleştir
                this.controls.enabled = true;
            });
        }
        
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
            maxPower: 100,
            fireAngle: 45,
            gravity: 9.81
        };
        
        catapultFolder.add(catapultSettings, 'maxPower', 50, 200).onChange((value) => {
            if (this.sceneManager.objects.catapult) {
                this.sceneManager.objects.catapult.maxPower = value;
            }
        });
        
        catapultFolder.add(catapultSettings, 'fireAngle', 15, 75).onChange((value) => {
            if (this.sceneManager.objects.catapult) {
                this.sceneManager.objects.catapult.fireAngle = value;
            }
        });
        
        catapultFolder.add(catapultSettings, 'gravity', 5, 15).onChange((value) => {
            if (this.sceneManager.scene) {
                this.sceneManager.gravity.y = -value;
            }
        });
        
        catapultFolder.open();
        
        // Kamera ayarları
        const cameraFolder = this.gui.addFolder('Kamera Ayarları');
        const cameraSettings = {
            speed: this.cameraSpeed,
            rotationSpeed: this.cameraRotationSpeed,
            mode: this.cameraMode,
            lockCamera: this.isCameraLocked
        };
        
        cameraFolder.add(cameraSettings, 'speed', 1, 10).onChange((value) => {
            this.cameraSpeed = value;
        });
        
        cameraFolder.add(cameraSettings, 'rotationSpeed', 0.5, 3).onChange((value) => {
            this.cameraRotationSpeed = value;
        });
        
        cameraFolder.add(cameraSettings, 'mode', ['free', 'follow', 'overhead']).onChange((value) => {
            this.setCameraMode(value);
        });
        
        cameraFolder.add(cameraSettings, 'lockCamera').onChange((value) => {
            this.isCameraLocked = value;
            this.controls.enabled = !value;
        });
        
        cameraFolder.open();
    }async loadModels() {
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
      handleInput() {
        // Mancınık kontrolü
        const catapult = this.sceneManager.objects.catapult;
        if (catapult) {
            // Yatay dönüş (sağa/sola)
            if (this.keys['ArrowLeft']) {
                catapult.rotate(1);
            }
            if (this.keys['ArrowRight']) {
                catapult.rotate(-1);
            }
            
            // Dikey atış açısı kontrolü (yukarı/aşağı)
            if (this.keys['ArrowUp']) {
                catapult.adjustFireAngle(1); // Açıyı artır = daha yükseğe atış
            }
            if (this.keys['ArrowDown']) {
                catapult.adjustFireAngle(-1); // Açıyı azalt = daha alçağa atış
            }
            
            // Şarj etme ve ateşleme
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

        // Kamera kontrolleri
        if (!this.isCameraLocked) {
            const moveSpeed = this.cameraSpeed * this.deltaTime;
            const rotateSpeed = this.cameraRotationSpeed * this.deltaTime;
            
            // Kamera modu kontrolü
            if (this.keys['Digit1']) {
                this.setCameraMode('free');
            } else if (this.keys['Digit2']) {
                this.setCameraMode('follow');
            } else if (this.keys['Digit3']) {
                this.setCameraMode('overhead');
            }
            
            // Kamera kilit kontrolü
            if (this.keys['KeyL'] && !this.lKeyPressed) {
                this.lKeyPressed = true;
                this.toggleCameraLock();
            }
            if (!this.keys['KeyL'] && this.lKeyPressed) {
                this.lKeyPressed = false;
            }

            // Serbest kamera modu kontrolü
            if (this.cameraMode === 'free') {
                // WASD ile ileri, geri, sola, sağa hareket
                if (this.keys['KeyW']) {
                    this.moveCamera('forward', moveSpeed);
                }
                if (this.keys['KeyS']) {
                    this.moveCamera('backward', moveSpeed);
                }
                if (this.keys['KeyA']) {
                    this.moveCamera('left', moveSpeed);
                }
                if (this.keys['KeyD']) {
                    this.moveCamera('right', moveSpeed);
                }
                
                // Q ve E ile yukarı ve aşağı hareket
                if (this.keys['KeyQ']) {
                    this.moveCamera('up', moveSpeed);
                }
                if (this.keys['KeyE']) {
                    this.moveCamera('down', moveSpeed);
                }
                
                // Yön tuşları ile dönüş (kamera yönünü değiştirme)
                if (this.keys['KeyZ']) {
                    this.rotateCamera('left', rotateSpeed);
                }
                if (this.keys['KeyC']) {
                    this.rotateCamera('right', rotateSpeed);
                }
                if (this.keys['KeyR']) {
                    this.rotateCamera('up', rotateSpeed);
                }
                if (this.keys['KeyF']) {
                    this.rotateCamera('down', rotateSpeed);
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
            
            // Kamera modu takipte ise mancınığı takip et
            if (this.cameraMode === 'follow' && !this.isCameraLocked) {
                const catapult = this.sceneManager.objects.catapult;
                // Mancınığın arkasında ve biraz yukarıda konum
                this.camera.position.set(
                    catapult.position.x - 5 * Math.sin(catapult.angle),
                    catapult.position.y + 3,
                    catapult.position.z - 5 * Math.cos(catapult.angle)
                );
                // Mancınığa bak
                this.camera.lookAt(catapult.position);
            }
        }
        
        // Taşları güncelle
        if (this.sceneManager.objects.stones) {
            for (let i = this.sceneManager.objects.stones.length - 1; i >= 0; i--) {
                const stone = this.sceneManager.objects.stones[i];
                stone.update(this.deltaTime);
                
                // Taş aktif değilse veya çok uzağa düştüyse kaldır
                if (!stone.active || stone.position.y < -10 || 
                    stone.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 50) {
                    this.sceneManager.objects.stones.splice(i, 1);
                }
                
                // Aktif taş fırlatıldıysa ve takip modunda isek, fırlatılan taşı takip et
                if (stone.active && stone.isLaunched && this.cameraMode === 'follow' && !this.isCameraLocked) {
                    const offset = new THREE.Vector3(0, 2, 5); // Taşın arkasında ve biraz yukarıda
                    this.camera.position.copy(stone.position).add(offset);
                    this.camera.lookAt(stone.position);
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
        if (this.controls.enabled) {
            this.controls.update();
        }
        
        // Sahneyi render et
        this.renderer.render(this.sceneManager.scene, this.camera);
    }
    
    updateScore(value) {
        this.sceneManager.score += value;
        this.scoreElement.textContent = this.sceneManager.score;
    }
    
    // Kamera modunu değiştirme metodu
    setCameraMode(mode) {
        if (this.cameraMode === mode) return;
        
        this.cameraMode = mode;
        
        // Mode değişiminde kamera konumunu sıfırlama
        switch (mode) {
            case 'free':
                // Serbest mod - mevcut konumu koru
                this.controls.enabled = true;
                break;
                
            case 'follow':
                // Takip modu - mancınığı takip eden kamera
                this.controls.enabled = false;
                if (this.sceneManager.objects.catapult) {
                    const catapult = this.sceneManager.objects.catapult;
                    // Mancınığın arkasında ve biraz yukarıda konum
                    this.camera.position.set(
                        catapult.position.x - 5 * Math.sin(catapult.angle),
                        catapult.position.y + 3,
                        catapult.position.z - 5 * Math.cos(catapult.angle)
                    );
                    // Mancınığa bak
                    this.camera.lookAt(catapult.position);
                }
                break;
                
            case 'overhead':
                // Kuşbakışı mod - yukarıdan bakış
                this.controls.enabled = false;
                this.camera.position.set(0, 20, 0);
                this.camera.lookAt(0, 0, 0);
                break;
        }
        
        console.log(`Kamera modu değiştirildi: ${mode}`);
    }
    
    // Kamera hareketi metodu
    moveCamera(direction, speed) {
        if (!this.camera) return;
        
        // Yön vektörlerini oluştur
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0);
        
        // İlgili yönde hareket et
        switch (direction) {
            case 'forward':
                this.camera.position.addScaledVector(forward, speed);
                break;
            case 'backward':
                this.camera.position.addScaledVector(forward, -speed);
                break;
            case 'left':
                this.camera.position.addScaledVector(right, -speed);
                break;
            case 'right':
                this.camera.position.addScaledVector(right, speed);
                break;
            case 'up':
                this.camera.position.addScaledVector(up, speed);
                break;
            case 'down':
                this.camera.position.addScaledVector(up, -speed);
                break;
        }
    }
    
    // Kamera döndürme metodu
    rotateCamera(direction, speed) {
        if (!this.camera) return;
        
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        
        switch (direction) {
            case 'left':
                euler.y += speed;
                break;
            case 'right':
                euler.y -= speed;
                break;
            case 'up':
                euler.x = Math.max(-Math.PI / 2, euler.x + speed);
                break;
            case 'down':
                euler.x = Math.min(Math.PI / 2, euler.x - speed);
                break;
        }
        
        this.camera.quaternion.setFromEuler(euler);
    }
    
    // Kamera kilidini aç/kapat
    toggleCameraLock() {
        this.isCameraLocked = !this.isCameraLocked;
        this.controls.enabled = !this.isCameraLocked;
        console.log(`Kamera kilidi: ${this.isCameraLocked ? 'Açık' : 'Kapalı'}`);
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
