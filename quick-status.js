// Quick Status Check - Run this in browser console
// This provides a quick overview of the current state

function quickStatusCheck() {
    console.log("🏰 QUICK STATUS CHECK");
    console.log("===================");
    
    // Basic availability check
    const hasApp = typeof window.app !== 'undefined';
    const hasSceneManager = hasApp && window.app.sceneManager;
    const hasScene = hasSceneManager && window.app.sceneManager.scene;
    const hasStones = hasSceneManager && window.app.sceneManager.objects.stones;
    
    console.log(`App Available: ${hasApp ? '✅' : '❌'}`);
    console.log(`SceneManager: ${hasSceneManager ? '✅' : '❌'}`);
    console.log(`Scene: ${hasScene ? '✅' : '❌'}`);
    console.log(`Stones Array: ${hasStones ? '✅' : '❌'}`);
    
    if (hasStones) {
        const stones = window.app.sceneManager.objects.stones;
        const stonesWithMesh = stones.filter(s => s.mesh).length;
        console.log(`Stones in array: ${stones.length}`);
        console.log(`Stones with meshes: ${stonesWithMesh}`);
        
        if (hasScene) {
            const sceneChildren = window.app.sceneManager.scene.children.length;
            console.log(`Scene children: ${sceneChildren}`);
            
            // Quick check for stone meshes in scene
            let stonesInScene = 0;
            window.app.sceneManager.scene.traverse((child) => {
                if (child.name && (child.name.includes('stone') || child.name.includes('Stone') || child.name.includes('CRITICAL'))) {
                    stonesInScene++;
                }
            });
            console.log(`Stones found in scene: ${stonesInScene}`);
        }
    }
    
    if (hasApp && window.app.camera) {
        const cam = window.app.camera;
        console.log(`Camera position: (${cam.position.x.toFixed(1)}, ${cam.position.y.toFixed(1)}, ${cam.position.z.toFixed(1)})`);
    }
    
    // Check if critical functions are available
    const hasCritical = typeof window.createCriticalEmergencyStones !== 'undefined';
    const hasVerify = typeof window.verifyStoneSystem !== 'undefined';
    console.log(`Critical tools: ${hasCritical ? '✅' : '❌'}`);
    console.log(`Verify tools: ${hasVerify ? '✅' : '❌'}`);
    
    return {
        hasApp,
        hasSceneManager,
        hasScene,
        hasStones,
        hasCritical,
        hasVerify
    };
}

// Auto-run
window.quickStatusCheck = quickStatusCheck;
console.log("🔧 Quick status checker loaded. Run quickStatusCheck() anytime.");

export { quickStatusCheck };
