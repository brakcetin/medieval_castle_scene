import * as THREE from 'three';

export class LightingManager {
    constructor(scene) {
        this.scene = scene;
        this.lights = {
            ambient: null,
            directional: null,
            hemisphere: null
        };
        
        // Current mode
        this.isDayMode = true;
        
        // Initialize lighting setup
        this.setupLighting();
    }
    
    setupLighting() {
        // Ambient light for base illumination
        this.lights.ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(this.lights.ambient);
        
        // Hemisphere light for sky/ground color variation
        this.lights.hemisphere = new THREE.HemisphereLight(
            0xffffbb, // Sky color
            0x080820, // Ground color
            0.6       // Intensity
        );
        this.scene.add(this.lights.hemisphere);
        
        // Directional light (sun)
        this.lights.directional = new THREE.DirectionalLight(0xffffff, 1);
        this.lights.directional.position.set(5, 10, 2);
        this.lights.directional.castShadow = true;
        
        // Configure shadow properties
        this.lights.directional.shadow.mapSize.width = 2048;
        this.lights.directional.shadow.mapSize.height = 2048;
        this.lights.directional.shadow.camera.near = 0.5;
        this.lights.directional.shadow.camera.far = 50;
        
        // Adjust shadow camera frustum to cover the scene
        const shadowSize = 15;
        this.lights.directional.shadow.camera.left = -shadowSize;
        this.lights.directional.shadow.camera.right = shadowSize;
        this.lights.directional.shadow.camera.top = shadowSize;
        this.lights.directional.shadow.camera.bottom = -shadowSize;
        
        this.scene.add(this.lights.directional);
        
        // Create a visual representation of the sun
        this.createSun();
    }
    
    createSun() {
        // Create a simple sun sphere
        const sunGeometry = new THREE.SphereGeometry(1, 16, 16);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.6
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.copy(this.lights.directional.position);
        this.sun.position.normalize().multiplyScalar(40); // Place sun far away
        this.scene.add(this.sun);
        
        // Create a glow effect for the sun
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd66,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sunGlow.position.copy(this.sun.position);
        this.scene.add(this.sunGlow);
    }
    
    toggleDayNight(isNightMode) {
        this.isDayMode = !isNightMode;
        
        if (isNightMode) {
            // Night mode settings
            this.scene.background = new THREE.Color(0x001133); // Dark blue night sky
            
            // Dim ambient and hemisphere light
            this.lights.ambient.intensity = 0.2;
            this.lights.hemisphere.intensity = 0.1;
            
            // Hide directional light (sun)
            this.lights.directional.intensity = 0.05;
            
            // Hide sun objects
            this.sun.visible = false;
            this.sunGlow.visible = false;
            
            // Add moon if not already present
            if (!this.moon) {
                this.createMoon();
            } else {
                this.moon.visible = true;
                this.moonGlow.visible = true;
            }
        } else {
            // Day mode settings
            this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
            
            // Restore daylight intensities
            this.lights.ambient.intensity = 0.5;
            this.lights.hemisphere.intensity = 0.6;
            this.lights.directional.intensity = 1.0;
            
            // Show sun objects
            this.sun.visible = true;
            this.sunGlow.visible = true;
            
            // Hide moon if present
            if (this.moon) {
                this.moon.visible = false;
                this.moonGlow.visible = false;
            }
        }
    }
    
    createMoon() {
        // Create a simple moon sphere
        const moonGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: 0xdddddd,
            transparent: true,
            opacity: 0.9
        });
        
        this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
        
        // Position moon opposite to sun
        this.moon.position.copy(this.lights.directional.position);
        this.moon.position.negate().normalize().multiplyScalar(40);
        this.scene.add(this.moon);
        
        // Create a glow effect for the moon
        const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaaaff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        this.moonGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.moonGlow.position.copy(this.moon.position);
        this.scene.add(this.moonGlow);
    }
    
    updateSunPosition(elevation, azimuth) {
        // Update sun position based on elevation and azimuth
        const radius = 40;
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        this.sun.position.set(x, y, z);
        this.sunGlow.position.copy(this.sun.position);
        
        // Calculate normalized direction for directional light
        const direction = new THREE.Vector3().copy(this.sun.position).normalize();
        this.lights.directional.position.copy(direction.multiplyScalar(10));
        
        // Update shadow camera
        this.lights.directional.shadow.camera.updateProjectionMatrix();
        
        // If moon exists, update its position to be opposite of the sun
        if (this.moon) {
            this.moon.position.copy(this.sun.position).negate();
            this.moonGlow.position.copy(this.moon.position);
        }
    }
    
    updateLightIntensity(type, intensity) {
        switch (type) {
            case 'ambient':
                this.lights.ambient.intensity = intensity;
                break;
            case 'directional':
                this.lights.directional.intensity = intensity;
                break;
            case 'hemisphere':
                this.lights.hemisphere.intensity = intensity;
                break;
        }
    }
}