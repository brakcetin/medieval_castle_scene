// Visual Debug Helper - Add visual aids to help locate stones
// Call this from browser console: addVisualDebugHelpers()

function addVisualDebugHelpers() {
    console.log("🎨 Adding visual debug helpers...");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ App or SceneManager not available");
        return;
    }
    
    const scene = window.app.sceneManager.scene;
    
    // 1. Add a bright wireframe sphere at each stone position to show where they should be
    const stonePositions = [
        { x: 1, y: 0.5, z: 5 },
        { x: 2, y: 0.5, z: 4 },
        { x: 0, y: 0.5, z: 4 },
        { x: -1, y: 0.5, z: 5 },
        { x: 1.5, y: 0.5, z: 3 },
        { x: -1.5, y: 0.5, z: 3 },
        { x: 0, y: 0.5, z: 2 }
    ];
    
    console.log("📍 Adding position markers...");
    stonePositions.forEach((pos, index) => {
        // Wireframe sphere marker
        const geometry = new THREE.SphereGeometry(1.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00, 
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(pos.x, pos.y, pos.z);
        marker.name = `debug_marker_${index}`;
        scene.add(marker);
        
        // Add a glowing center point
        const pointGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const pointMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00,
            emissive: 0xFFFF00,
            emissiveIntensity: 1
        });
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.set(pos.x, pos.y, pos.z);
        point.name = `debug_point_${index}`;
        scene.add(point);
        
        console.log(`  ✅ Marker ${index + 1} added at (${pos.x}, ${pos.y}, ${pos.z})`);
    });
    
    // 2. Add camera position indicator
    console.log("📹 Adding camera position indicator...");
    const camGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const camMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0.5
    });
    const camMarker = new THREE.Mesh(camGeometry, camMaterial);
    const camPos = window.app.camera.position;
    camMarker.position.set(camPos.x, camPos.y, camPos.z);
    camMarker.name = 'debug_camera_marker';
    scene.add(camMarker);
    console.log(`  📹 Camera marker added at (${camPos.x.toFixed(2)}, ${camPos.y.toFixed(2)}, ${camPos.z.toFixed(2)})`);
    
    // 3. Add grid helper for spatial reference
    console.log("🏁 Adding grid helper...");
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x888888);
    gridHelper.name = 'debug_grid';
    scene.add(gridHelper);
    
    // 4. Add axis helper
    console.log("🎯 Adding axis helper...");
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.name = 'debug_axes';
    scene.add(axesHelper);
    
    console.log("✅ Visual debug helpers added!");
    console.log("🔧 Use removeVisualDebugHelpers() to clean up");
}

function removeVisualDebugHelpers() {
    console.log("🧹 Removing visual debug helpers...");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ App or SceneManager not available");
        return;
    }
    
    const scene = window.app.sceneManager.scene;
    const objectsToRemove = [];
    
    // Find all debug objects
    scene.traverse((object) => {
        if (object.name && object.name.startsWith('debug_')) {
            objectsToRemove.push(object);
        }
    });
    
    // Remove them
    objectsToRemove.forEach(object => {
        scene.remove(object);
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
    });
    
    console.log(`🧹 Removed ${objectsToRemove.length} debug objects`);
}

function highlightActualStones() {
    console.log("🗿 Highlighting actual stones...");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ App or SceneManager not available");
        return;
    }
    
    const stones = window.app.sceneManager.objects.stones;
    if (!stones || stones.length === 0) {
        console.log("❌ No stones found in stones array");
        return;
    }
    
    console.log(`🔍 Found ${stones.length} stones in array`);
    
    stones.forEach((stone, index) => {
        if (stone.mesh) {
            console.log(`  Stone ${index}: ✅ Has mesh at position`, stone.mesh.position);
            
            // Add a bright outline helper
            const box = new THREE.Box3().setFromObject(stone.mesh);
            const helper = new THREE.Box3Helper(box, 0xFFFF00);
            helper.name = `debug_stone_outline_${index}`;
            window.app.sceneManager.scene.add(helper);
            
        } else {
            console.log(`  Stone ${index}: ❌ No mesh`);
        }
    });
}

// Expose functions globally
window.addVisualDebugHelpers = addVisualDebugHelpers;
window.removeVisualDebugHelpers = removeVisualDebugHelpers;
window.highlightActualStones = highlightActualStones;

console.log("🎨 Visual Debug Helper loaded!");
console.log("📝 Available commands:");
console.log("  • addVisualDebugHelpers() - Add visual markers");
console.log("  • removeVisualDebugHelpers() - Remove visual markers");  
console.log("  • highlightActualStones() - Highlight existing stones");

export { addVisualDebugHelpers, removeVisualDebugHelpers, highlightActualStones };
