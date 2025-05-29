// First-Person Mode Verification Script
// Paste this into the browser console to test the implementation

console.log("🧪 Starting First-Person Mode verification...");

// Check if the app instance exists
if (typeof window.app !== 'undefined') {
    console.log("✅ App instance found");
    
    // Check if first-person variables exist
    const fpVars = [
        'isFirstPersonMode',
        'crosshairElement', 
        'fpsToggleElement'
    ];
    
    fpVars.forEach(varName => {
        if (window.app.hasOwnProperty(varName)) {
            console.log(`✅ ${varName}: ${window.app[varName]}`);
        } else {
            console.log(`❌ Missing variable: ${varName}`);
        }
    });
    
    // Check if methods exist
    const fpMethods = [
        'initializeFirstPersonMode',
        'toggleFirstPersonMode',
        'onFirstPersonClick',
        'handleStoneInteraction',
        'handleCatapultInteraction'
    ];
    
    fpMethods.forEach(methodName => {
        if (typeof window.app[methodName] === 'function') {
            console.log(`✅ Method exists: ${methodName}`);
        } else {
            console.log(`❌ Missing method: ${methodName}`);
        }
    });
    
    // Check DOM elements
    const crosshair = document.getElementById('crosshair');
    const fpsButton = document.getElementById('fps-toggle');
    
    if (crosshair) {
        console.log("✅ Crosshair element found");
        console.log("Crosshair styles:", window.getComputedStyle(crosshair).display);
    } else {
        console.log("❌ Crosshair element missing");
    }
    
    if (fpsButton) {
        console.log("✅ FPS toggle button found");
        console.log("Button text:", fpsButton.textContent);
        console.log("Button classes:", fpsButton.className);
    } else {
        console.log("❌ FPS toggle button missing");
    }
    
    // Test first-person mode toggle
    console.log("🧪 Testing first-person mode toggle...");
    const currentMode = window.app.isFirstPersonMode;
    
    try {
        window.app.toggleFirstPersonMode();
        console.log(`✅ Toggle successful: ${currentMode} → ${window.app.isFirstPersonMode}`);
        
        // Toggle back
        window.app.toggleFirstPersonMode();
        console.log(`✅ Toggle back successful: ${window.app.isFirstPersonMode} → ${currentMode}`);
    } catch (error) {
        console.log(`❌ Toggle error: ${error.message}`);
    }
    
    console.log("🎉 First-Person Mode verification completed!");
    console.log("📖 To test manually:");
    console.log("1. Click the FPS toggle button in the UI");
    console.log("2. Look for the crosshair to appear");
    console.log("3. Click to interact with objects at center screen");
    
} else {
    console.log("❌ App instance not found. Make sure the game has loaded.");
    console.log("💡 Try running this script after the game loads completely.");
}
