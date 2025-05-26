// Console monitoring script for medieval castle scene
// Run this in browser console to check current state

console.log("🏰 MEDIEVAL CASTLE SCENE - DEBUG MONITOR");
console.log("==========================================");

// Function to check current state
function checkSceneState() {
    console.log("\n📊 CURRENT STATE CHECK:");
    
    // 1. Check if app exists
    if (typeof window.app !== 'undefined' && window.app) {
        console.log("✅ App instance found");
        
        // 2. Check scene manager
        if (window.app.sceneManager) {
            console.log("✅ SceneManager found");
            
            // 3. Check stones array
            const stones = window.app.sceneManager.objects.stones;
            console.log(`📍 Stones array length: ${stones ? stones.length : 'undefined'}`);
            
            // 4. Check each stone
            if (stones && stones.length > 0) {
                console.log("🗿 Stone details:");
                stones.forEach((stone, index) => {
                    console.log(`  Stone ${index}:`, {
                        mesh: stone.mesh ? "✅" : "❌",
                        position: stone.position,
                        isStatic: stone.isStatic,
                        isCollected: stone.isCollected
                    });
                });
            } else {
                console.log("❌ No stones found in array");
            }
            
            // 5. Check scene children count
            const childCount = window.app.sceneManager.scene.children.length;
            console.log(`🎭 Scene children count: ${childCount}`);
            
            // 6. Check camera position
            if (window.app.camera) {
                const pos = window.app.camera.position;
                console.log(`📹 Camera position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}`);
            }
            
        } else {
            console.log("❌ SceneManager not found");
        }
    } else {
        console.log("❌ App instance not found");
    }
}

// Function to manually create stones
function forceCreateStones() {
    console.log("\n🔨 FORCE CREATING STONES:");
    if (window.app && window.app.sceneManager) {
        window.app.sceneManager.createStones();
        console.log("✅ createStones() called manually");
    } else {
        console.log("❌ Cannot create stones - app/sceneManager not available");
    }
}

// Function to test click detection
function testClickDetection() {
    console.log("\n🎯 TESTING CLICK DETECTION:");
    
    // Simulate a click in the center of the screen
    const event = {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2
    };
    
    if (window.app && window.app.onClick) {
        console.log("🖱️ Simulating click in center of screen...");
        window.app.onClick(event);
    } else {
        console.log("❌ onClick method not available");
    }
}

// Function to check time control
function checkTimeControl() {
    console.log("\n⏰ CHECKING TIME CONTROL:");
    
    const timeSlider = document.getElementById('time-slider');
    const timeDisplay = document.getElementById('time-display');
    
    console.log("Time slider element:", timeSlider ? "✅ Found" : "❌ Not found");
    console.log("Time display element:", timeDisplay ? "✅ Found" : "❌ Not found");
    
    if (timeSlider) {
        console.log(`Current slider value: ${timeSlider.value}`);
    }
}

// Automatic monitoring
function startMonitoring() {
    console.log("🔄 Starting automatic monitoring (every 5 seconds)...");
    
    const interval = setInterval(() => {
        console.log("\n" + "=".repeat(50));
        console.log("⏱️ AUTOMATIC CHECK - " + new Date().toLocaleTimeString());
        checkSceneState();
    }, 5000);
    
    // Stop monitoring after 30 seconds
    setTimeout(() => {
        clearInterval(interval);
        console.log("\n🛑 Monitoring stopped after 30 seconds");
    }, 30000);
    
    return interval;
}

// Expose functions globally
window.checkSceneState = checkSceneState;
window.forceCreateStones = forceCreateStones;
window.testClickDetection = testClickDetection;
window.checkTimeControl = checkTimeControl;
window.startMonitoring = startMonitoring;

// Initial check
console.log("🎬 INITIAL STATE CHECK:");
setTimeout(checkSceneState, 1000); // Wait 1 second for app to initialize
setTimeout(checkTimeControl, 1000);

console.log("\n🛠️ AVAILABLE COMMANDS:");
console.log("• checkSceneState() - Check current scene state");
console.log("• forceCreateStones() - Manually create stones");
console.log("• testClickDetection() - Test click detection");
console.log("• checkTimeControl() - Check time control elements");
console.log("• startMonitoring() - Start automatic monitoring");

export { checkSceneState, forceCreateStones, testClickDetection, checkTimeControl, startMonitoring };
