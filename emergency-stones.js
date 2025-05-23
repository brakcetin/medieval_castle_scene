// Emergency Stone Creation - Direct scene manipulation
// This script creates stones directly in the scene without relying on model loading

function createEmergencyStones() {
    console.log("🚨 EMERGENCY STONE CREATION - Creating stones directly in scene");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ App or SceneManager not available");
        return false;
    }
    
    const scene = window.app.sceneManager.scene;
    
    // Remove any existing emergency stones
    const existingEmergencyStones = [];
    scene.traverse((object) => {
        if (object.name && object.name.startsWith('emergency_stone_')) {
            existingEmergencyStones.push(object);
        }
    });
    
    existingEmergencyStones.forEach(stone => {
        scene.remove(stone);
        if (stone.geometry) stone.geometry.dispose();
        if (stone.material) stone.material.dispose();
    });
    
    console.log(`🧹 Removed ${existingEmergencyStones.length} existing emergency stones`);
    
    // Create new emergency stones - EXTREMELY visible
    const stonePositions = [
        { x: 0, y: 1, z: 3 },     // Right in front of camera
        { x: -2, y: 1, z: 4 },    // Left side
        { x: 2, y: 1, z: 4 },     // Right side
        { x: -1, y: 1, z: 2 },    // Very close left
        { x: 1, y: 1, z: 2 },     // Very close right
    ];
    
    const emergencyStones = [];
    
    stonePositions.forEach((pos, index) => {
        // Create HUGE, BRIGHT stone
        const geometry = new THREE.SphereGeometry(2, 32, 32); // Massive 2-unit radius
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xFF0000,           // Pure red
            emissive: 0xFF4444,        // Bright red emission
            emissiveIntensity: 0.5,    // Strong emission
            transparent: false,
            opacity: 1,
            wireframe: false
        });
        
        const stone = new THREE.Mesh(geometry, material);
        stone.position.set(pos.x, pos.y, pos.z);
        stone.name = `emergency_stone_${index}`;
        stone.castShadow = true;
        stone.receiveShadow = true;
        
        // Add to scene
        scene.add(stone);
        emergencyStones.push(stone);
        
        console.log(`🗿 Emergency stone ${index + 1} created at (${pos.x}, ${pos.y}, ${pos.z})`);
        
        // Also add to the stones array for click detection
        if (window.app.sceneManager.objects.stones) {
            const stoneObject = {
                mesh: stone,
                position: new THREE.Vector3(pos.x, pos.y, pos.z),
                isStatic: true,
                isCollected: false,
                isEmergency: true
            };
            window.app.sceneManager.objects.stones.push(stoneObject);
        }
    });
    
    console.log(`✅ Created ${emergencyStones.length} MASSIVE emergency stones`);
    console.log("🎯 These stones should be IMPOSSIBLE to miss!");
    console.log(`📊 Scene now has ${scene.children.length} total children`);
    
    return emergencyStones;
}

function createGiantTestSphere() {
    console.log("🔴 Creating GIANT test sphere right in front of camera");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ App not available");
        return;
    }
    
    const scene = window.app.sceneManager.scene;
    
    // Remove existing test sphere
    const existing = scene.getObjectByName('giant_test_sphere');
    if (existing) {
        scene.remove(existing);
        if (existing.geometry) existing.geometry.dispose();
        if (existing.material) existing.material.dispose();
    }
    
    // Create ENORMOUS glowing sphere
    const geometry = new THREE.SphereGeometry(3, 32, 32); // 3-unit radius!
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00FF00,           // Bright green
        emissive: 0x004400,        // Green emission
        emissiveIntensity: 1,      // Maximum emission
        transparent: true,
        opacity: 0.8
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 2, 1); // Right in front of camera
    sphere.name = 'giant_test_sphere';
    
    scene.add(sphere);
    
    console.log("🟢 GIANT green test sphere created at (0, 2, 1)");
    console.log("🎯 If you can't see this, there's a fundamental rendering issue!");
    
    return sphere;
}

function checkSceneRenderingBasics() {
    console.log("🔍 BASIC RENDERING CHECK");
    
    if (!window.app) {
        console.error("❌ No app instance");
        return;
    }
    
    // Check renderer
    if (!window.app.renderer) {
        console.error("❌ No renderer");
        return;
    }
    console.log("✅ Renderer exists");
    
    // Check camera
    if (!window.app.camera) {
        console.error("❌ No camera");
        return;
    }
    
    const cam = window.app.camera;
    console.log(`📹 Camera position: (${cam.position.x.toFixed(2)}, ${cam.position.y.toFixed(2)}, ${cam.position.z.toFixed(2)})`);
    console.log(`📹 Camera rotation: (${cam.rotation.x.toFixed(2)}, ${cam.rotation.y.toFixed(2)}, ${cam.rotation.z.toFixed(2)})`);
    
    // Check scene
    if (!window.app.sceneManager || !window.app.sceneManager.scene) {
        console.error("❌ No scene");
        return;
    }
    
    const scene = window.app.sceneManager.scene;
    console.log(`🎭 Scene children count: ${scene.children.length}`);
    
    // List all scene children
    console.log("📋 Scene children:");
    scene.children.forEach((child, index) => {
        console.log(`  ${index}: ${child.name || child.type} at (${child.position.x.toFixed(1)}, ${child.position.y.toFixed(1)}, ${child.position.z.toFixed(1)})`);
    });
    
    // Check canvas
    const canvas = document.getElementById('scene-canvas');
    if (!canvas) {
        console.error("❌ No canvas element");
        return;
    }
    console.log(`🖼️ Canvas size: ${canvas.width}x${canvas.height}`);
    
    // Check if renderer is actually rendering
    const renderInfo = window.app.renderer.info;
    console.log("🎨 Renderer info:", renderInfo);
    
    return true;
}

// Expose functions globally
window.createEmergencyStones = createEmergencyStones;
window.createGiantTestSphere = createGiantTestSphere;
window.checkSceneRenderingBasics = checkSceneRenderingBasics;

console.log("🚨 Emergency Stone Creator loaded!");
console.log("🛠️ Available emergency commands:");
console.log("  • createEmergencyStones() - Create MASSIVE red stones");
console.log("  • createGiantTestSphere() - Create HUGE green test sphere");
console.log("  • checkSceneRenderingBasics() - Check basic rendering setup");

export { createEmergencyStones, createGiantTestSphere, checkSceneRenderingBasics };
