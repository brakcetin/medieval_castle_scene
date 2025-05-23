// CRITICAL EMERGENCY STONE CREATOR
// This creates stones that are 100% guaranteed to be visible and clickable

function createCriticalEmergencyStones() {
    console.log("🚨🚨🚨 CRITICAL EMERGENCY STONE CREATION 🚨🚨🚨");
    console.log("Creating stones that are IMPOSSIBLE to miss!");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ FATAL: No app or scene manager");
        return false;
    }
    
    const scene = window.app.sceneManager.scene;
    const camera = window.app.camera;
    
    // 1. Clear ALL existing stones first
    console.log("🧹 Clearing ALL existing stones...");
    const toRemove = [];
    scene.traverse((child) => {
        if (child.name && (
            child.name.includes('stone') || 
            child.name.includes('Stone') ||
            child.name.includes('emergency') ||
            child.name.includes('force_visible')
        )) {
            toRemove.push(child);
        }
    });
    
    toRemove.forEach(obj => {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    
    // Clear stones array
    if (window.app.sceneManager.objects.stones) {
        window.app.sceneManager.objects.stones.length = 0;
    }
    
    console.log(`🗑️ Removed ${toRemove.length} existing stone objects`);
    
    // 2. Create MASSIVE, GLOWING stones directly in camera view
    const emergencyStones = [];
    
    // Position stones in a cross pattern directly in front of camera
    const baseDistance = 3; // Very close to camera
    const stonePositions = [
        // Center stone (directly in front)
        { 
            x: camera.position.x + 0, 
            y: camera.position.y + 0, 
            z: camera.position.z + baseDistance,
            name: "CRITICAL_CENTER_STONE"
        },
        // Four cardinal directions
        { 
            x: camera.position.x + 2, 
            y: camera.position.y + 0, 
            z: camera.position.z + baseDistance,
            name: "CRITICAL_RIGHT_STONE"
        },
        { 
            x: camera.position.x - 2, 
            y: camera.position.y + 0, 
            z: camera.position.z + baseDistance,
            name: "CRITICAL_LEFT_STONE"
        },
        { 
            x: camera.position.x + 0, 
            y: camera.position.y + 2, 
            z: camera.position.z + baseDistance,
            name: "CRITICAL_TOP_STONE"
        },
        { 
            x: camera.position.x + 0, 
            y: camera.position.y - 2, 
            z: camera.position.z + baseDistance,
            name: "CRITICAL_BOTTOM_STONE"
        }
    ];
    
    stonePositions.forEach((pos, index) => {
        console.log(`🔴 Creating CRITICAL stone ${index + 1} at (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
        
        // Create ENORMOUS geometry - 2 unit radius!
        const geometry = new THREE.SphereGeometry(2.0, 32, 32);
        
        // Create SUPER BRIGHT material
        const material = new THREE.MeshStandardMaterial({
            color: 0xFF0000,           // Bright red
            emissive: 0xFF4444,        // Bright red emissive
            emissiveIntensity: 1.0,    // Maximum emissive intensity
            metalness: 0,
            roughness: 0.1,
            transparent: false,
            opacity: 1.0
        });
        
        const stoneMesh = new THREE.Mesh(geometry, material);
        stoneMesh.position.set(pos.x, pos.y, pos.z);
        stoneMesh.name = pos.name;
        stoneMesh.castShadow = true;
        stoneMesh.receiveShadow = true;
        stoneMesh.visible = true;
        
        // Add to scene
        scene.add(stoneMesh);
        
        // Also add a bright wireframe outline
        const wireGeometry = new THREE.SphereGeometry(2.1, 16, 16);
        const wireMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
        wireframe.position.copy(stoneMesh.position);
        wireframe.name = pos.name + "_WIREFRAME";
        scene.add(wireframe);
        
        // Create stone object for the game system
        const stoneObject = {
            mesh: stoneMesh,
            position: new THREE.Vector3(pos.x, pos.y, pos.z),
            isStatic: true,
            isCollected: false,
            isCriticalEmergency: true,
            name: pos.name
        };
        
        // Add to stones array
        window.app.sceneManager.objects.stones.push(stoneObject);
        emergencyStones.push(stoneObject);
        
        console.log(`✅ CRITICAL stone ${index + 1} created and added to scene`);
    });
    
    // 3. Force a render to make sure they appear
    if (window.app.renderer) {
        window.app.renderer.render(scene, camera);
    }
    
    // 4. Verify they're actually in the scene
    console.log("\n🔍 VERIFICATION:");
    let foundStones = 0;
    scene.traverse((child) => {
        if (child.name && child.name.includes('CRITICAL')) {
            foundStones++;
            console.log(`✅ Found stone in scene: ${child.name} at (${child.position.x.toFixed(2)}, ${child.position.y.toFixed(2)}, ${child.position.z.toFixed(2)})`);
        }
    });
    
    console.log(`\n🎯 FINAL RESULT:`);
    console.log(`✅ Created ${emergencyStones.length} critical emergency stones`);
    console.log(`✅ Found ${foundStones} stones in scene`);
    console.log(`✅ Stones array now has ${window.app.sceneManager.objects.stones.length} items`);
    console.log(`📹 Camera at (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`);
    
    // 5. Test immediate click detection
    console.log("\n🎯 TESTING IMMEDIATE CLICK on center stone...");
    setTimeout(() => {
        testCriticalClick();
    }, 1000);
    
    return emergencyStones;
}

function testCriticalClick() {
    console.log("🖱️ TESTING CLICK on center stone...");
    
    if (!window.app || !window.app.onClick) {
        console.error("❌ onClick method not available");
        return;
    }
    
    // Simulate click in exact center of screen
    const event = {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2
    };
    
    console.log(`🎯 Simulating click at screen center: (${event.clientX}, ${event.clientY})`);
    window.app.onClick(event);
}

function analyzeCameraView() {
    console.log("\n📹 CAMERA VIEW ANALYSIS:");
    
    if (!window.app || !window.app.camera) {
        console.error("❌ Camera not available");
        return;
    }
    
    const camera = window.app.camera;
    const raycaster = new THREE.Raycaster();
    
    // Cast ray from camera center forward
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const intersects = raycaster.intersectObjects(window.app.sceneManager.scene.children, true);
    
    console.log(`📡 Raycaster from camera center found ${intersects.length} objects`);
    
    if (intersects.length > 0) {
        intersects.slice(0, 5).forEach((intersect, index) => {
            console.log(`  ${index + 1}. ${intersect.object.name || intersect.object.type} at distance ${intersect.distance.toFixed(2)}`);
        });
    } else {
        console.log("❌ No objects found in camera's direct line of sight");
    }
    
    // Check what's visible to camera
    const frustum = new THREE.Frustum();
    const cameraMatrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraMatrix);
    
    let visibleStones = 0;
    window.app.sceneManager.objects.stones.forEach((stone, index) => {
        if (stone.mesh && frustum.containsPoint(stone.mesh.position)) {
            visibleStones++;
            console.log(`👁️ Stone ${index + 1} is in camera frustum`);
        }
    });
    
    console.log(`📊 ${visibleStones} stones are potentially visible to camera`);
}

// Expose functions globally
window.createCriticalEmergencyStones = createCriticalEmergencyStones;
window.testCriticalClick = testCriticalClick;
window.analyzeCameraView = analyzeCameraView;

console.log("🚨 CRITICAL EMERGENCY TOOLS LOADED!");
console.log("Commands available:");
console.log("• createCriticalEmergencyStones() - Create impossible-to-miss stones");
console.log("• testCriticalClick() - Test clicking on center stone");  
console.log("• analyzeCameraView() - Analyze what camera can see");
