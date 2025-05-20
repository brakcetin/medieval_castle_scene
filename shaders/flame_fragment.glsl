uniform float time;
varying vec2 vUv;
varying float noise;

void main() {
    // Base flame color (yellow)
    vec3 baseColor = vec3(1.0, 0.8, 0.2);
    
    // Inner flame color (white-ish)
    vec3 innerColor = vec3(1.0, 0.95, 0.8);
    
    // Outer flame color (red-orange)
    vec3 outerColor = vec3(0.9, 0.3, 0.1);
    
    // Color intensity and gradient
    float intensity = 1.0 - pow(vUv.y, 1.5);
    
    // Mix colors based on y position and noise
    vec3 color = mix(baseColor, innerColor, smoothstep(0.1, 0.9, noise));
    color = mix(color, outerColor, smoothstep(0.3, 0.9, vUv.y));
    
    // Add flickering over time
    float flicker = 0.95 + 0.05 * sin(time * 10.0);
    color *= flicker * intensity;
    
    // Alpha is stronger at the bottom and fades towards the top
    float alpha = smoothstep(1.0, 0.0, vUv.y) * 0.9;
    alpha = mix(alpha, alpha * noise, 0.5);
    
    // Output final color with alpha
    gl_FragColor = vec4(color, alpha);
}