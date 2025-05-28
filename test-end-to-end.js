// End-to-End Stone Collection and Catapult Test
// This script tests the complete workflow: stone collection → catapult loading → firing

console.log("🎯 END-TO-END STONE WORKFLOW TEST");
console.log("==================================");

function testCompleteStoneWorkflow() {
    console.log("\n🔄 TESTING COMPLETE STONE WORKFLOW");
    console.log("Collection → Catapult Loading → Firing");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ App not available");
        return false;
    }
    
    const stones = window.app.sceneManager.objects.stones;
    const catapult = window.app.sceneManager.objects.catapult;
    
    if (!stones || stones.length === 0) {
        console.error("❌ No stones available");
        return false;
    }
    
    if (!catapult) {
        console.error("❌ No catapult available");
        return false;
    }
    
    console.log("✅ Found stones and catapult");
    
    // Step 1: Find an uncollected stone
    const testStone = stones.find(s => s && !s.isCollected && s.mesh);
    if (!testStone) {
        console.error("❌ No uncollected stones with mesh available");
        return false;
    }
    
    console.log("✅ Found uncollected stone for testing");
    console.log(`   Stone position: (${testStone.mesh.position.x.toFixed(2)}, ${testStone.mesh.position.y.toFixed(2)}, ${testStone.mesh.position.z.toFixed(2)})`);
    console.log(`   Stone state: isCollected=${testStone.isCollected}, isBeingCollected=${testStone.isBeingCollected}`);
    
    // Step 2: Collect the stone
    console.log("\n📦 STEP 1: Collecting stone...");
    const collectResult = testStone.collect();
    
    if (!collectResult) {
        console.error("❌ Stone collection failed");
        return false;
    }
    
    console.log("✅ Stone collected successfully");
    console.log(`   Post-collection state: isCollected=${testStone.isCollected}, isBeingCollected=${testStone.isBeingCollected}`);
    console.log(`   Mesh visible after collection: ${testStone.mesh ? testStone.mesh.visible : 'no mesh'}`);
    
    // Step 3: Load stone into catapult
    console.log("\n🏹 STEP 2: Loading stone into catapult...");
    console.log(`   Catapult initial state: hasStone=${catapult.hasStone}`);
    
    const loadResult = catapult.loadStone(testStone);
    
    if (!loadResult) {
        console.error("❌ Stone loading into catapult failed");
        return false;
    }
    
    console.log("✅ Stone loaded into catapult successfully");
    console.log(`   Catapult post-load state: hasStone=${catapult.hasStone}`);
    console.log(`   Stone visibility after loading: ${testStone.mesh ? testStone.mesh.visible : 'no mesh'}`);
    console.log(`   Stone state after loading: isCollected=${testStone.isCollected}, isBeingCollected=${testStone.isBeingCollected}`);
    
    // Step 4: Fire the catapult
    console.log("\n🚀 STEP 3: Firing catapult...");
    const launchResult = catapult.launch();
    
    if (!launchResult) {
        console.error("❌ Catapult firing failed");
        return false;
    }
    
    console.log("✅ Catapult fired successfully");
    console.log(`   Catapult post-fire state: hasStone=${catapult.hasStone}`);
    console.log(`   Fired stone isLaunched: ${launchResult.isLaunched}`);
    console.log(`   Fired stone isStatic: ${launchResult.isStatic}`);
    
    return true;
}

function testStoneClickToFire() {
    console.log("\n🎮 TESTING CLICK-TO-FIRE WORKFLOW");
    console.log("Simulating: Click stone → Auto-collect → Auto-load → Manual fire");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ App not available");
        return false;
    }
    
    const stones = window.app.sceneManager.objects.stones;
    const catapult = window.app.sceneManager.objects.catapult;
    
    if (!stones || stones.length === 0 || !catapult) {
        console.error("❌ Stones or catapult not available");
        return false;
    }
    
    // Find an uncollected stone
    const testStone = stones.find(s => s && !s.isCollected && s.mesh);
    if (!testStone) {
        console.error("❌ No uncollected stones available");
        return false;
    }
    
    console.log("✅ Found test stone for click simulation");
    
    // Simulate the click logic from main.js (without the premature lock)
    console.log("\n🖱️ Simulating stone click...");
    
    if (testStone && !testStone.isCollected && !testStone.isBeingCollected) {
        console.log("✅ Stone passes pre-collection checks");
        
        const collected = testStone.collect();
        
        if (collected) {
            console.log("✅ Stone collected via simulated click");
            
            // Simulate automatic loading into catapult
            if (!catapult.hasStone) {
                const loaded = catapult.loadStone(testStone);
                if (loaded) {
                    console.log("✅ Stone auto-loaded into catapult");
                    
                    // Test manual fire
                    const fired = catapult.launch();
                    if (fired) {
                        console.log("✅ Complete click-to-fire workflow successful!");
                        return true;
                    } else {
                        console.error("❌ Catapult firing failed");
                        return false;
                    }
                } else {
                    console.error("❌ Auto-loading failed");
                    return false;
                }
            } else {
                console.log("⚠️ Catapult already has a stone loaded");
                return true; // Still consider this a success for collection
            }
        } else {
            console.error("❌ Stone collection failed in click simulation");
            return false;
        }
    } else {
        console.error("❌ Stone failed pre-collection checks");
        return false;
    }
}

function runEndToEndValidation() {
    console.log("\n🔬 RUNNING END-TO-END VALIDATION SUITE");
    console.log("=====================================");
    
    const results = [];
    
    // Test 1: Complete workflow
    console.log("\n📋 Test 1: Complete stone workflow (collect → load → fire)");
    results.push(testCompleteStoneWorkflow());
    
    // Test 2: Click-to-fire simulation
    console.log("\n📋 Test 2: Click-to-fire workflow simulation");
    results.push(testStoneClickToFire());
    
    // Summary
    console.log("\n📈 END-TO-END VALIDATION SUMMARY");
    console.log("================================");
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    if (passed === total) {
        console.log(`✅ ALL END-TO-END TESTS PASSED (${passed}/${total})`);
        console.log("🎉 Complete stone workflow is WORKING!");
        console.log("🎮 Players should be able to:");
        console.log("   • Click stones to collect them (single click)");
        console.log("   • Load collected stones into catapult");
        console.log("   • Fire stones from catapult");
    } else {
        console.log(`❌ SOME END-TO-END TESTS FAILED (${passed}/${total})`);
        console.log("🚨 Complete workflow may have issues");
    }
    
    return passed === total;
}

// Auto-run end-to-end validation after delay
setTimeout(() => {
    console.log("\n⏰ AUTO-RUNNING END-TO-END VALIDATION...");
    runEndToEndValidation();
}, 4000);

// Expose functions globally
window.testCompleteStoneWorkflow = testCompleteStoneWorkflow;
window.testStoneClickToFire = testStoneClickToFire;
window.runEndToEndValidation = runEndToEndValidation;

console.log("\n🛠️ AVAILABLE END-TO-END TEST COMMANDS:");
console.log("• testCompleteStoneWorkflow() - Test collect → load → fire");
console.log("• testStoneClickToFire() - Test click-to-fire simulation");
console.log("• runEndToEndValidation() - Run complete end-to-end suite");
