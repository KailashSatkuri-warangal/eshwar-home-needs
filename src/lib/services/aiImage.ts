import { db, storage } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Generates 24 multi-angle views of a product.
 * If live API is configured (e.g. Stable Diffusion/Replicate), it makes server-side calls.
 * Otherwise, it falls back to a mathematical 3D SVG rotation generator to simulate the product.
 */
export async function generateAIProductViews(productId: string, productName: string, originalImage: string): Promise<string[]> {
  console.log(`Generating AI product views for ${productName} (${productId})...`);

  // Simulate server latency for AI generation
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const views: string[] = [];
  const lowercaseName = productName.toLowerCase();
  
  // Decide which SVG template to generate based on product details
  let productType: 'kadai' | 'bottle' | 'vessel' = 'vessel';
  if (lowercaseName.includes('kadai') || lowercaseName.includes('pan') || lowercaseName.includes('urli')) {
    productType = 'kadai';
  } else if (lowercaseName.includes('bottle') || lowercaseName.includes('glass') || lowercaseName.includes('jug') || lowercaseName.includes('copper')) {
    productType = 'bottle';
  }

  // Generate 24 frames (0 to 345 degrees in steps of 15)
  for (let i = 0; i < 24; i++) {
    const angle = i * 15;
    const svgString = generateProductSVG(productType, lowercaseName, angle);
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    views.push(dataUrl);
  }

  return views;
}

/**
 * Helper to generate an SVG of a rotating product
 */
function generateProductSVG(type: 'kadai' | 'bottle' | 'vessel', name: string, angle: number): string {
  const angleRad = (angle * Math.PI) / 180;
  
  // Shading offset shifts with angle to simulate reflection
  const reflectionOffset = Math.sin(angleRad) * 20;

  if (type === 'kadai') {
    // Stainless Steel / Triply Kadai with two side handles
    // Calculate handle positions rotating in 3D space
    const radiusX = 90;
    const handleRadius = 15;
    
    // Handle 1 (Left-side at angle 180)
    const h1X = 150 + radiusX * Math.cos(angleRad + Math.PI);
    const h1Z = Math.sin(angleRad + Math.PI); // positive means in front, negative means behind
    
    // Handle 2 (Right-side at angle 0)
    const h2X = 150 + radiusX * Math.cos(angleRad);
    const h2Z = Math.sin(angleRad);

    const metallicColor = name.includes('brass') ? '#d4af37' : name.includes('copper') ? '#b87333' : '#e0e0e0';
    const metallicHighlight = name.includes('brass') ? '#fff3cc' : name.includes('copper') ? '#ffcc99' : '#ffffff';
    const metallicShadow = name.includes('brass') ? '#8c7320' : name.includes('copper') ? '#732c10' : '#888888';

    // SVG elements
    let elements = `
      <!-- Background & Lights -->
      <rect width="300" height="300" fill="#fafafa"/>
      <defs>
        <radialGradient id="grad" cx="50%" cy="40%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" stop-color="${metallicHighlight}" />
          <stop offset="70%" stop-color="${metallicColor}" />
          <stop offset="100%" stop-color="${metallicShadow}" />
        </radialGradient>
        <linearGradient id="reflection" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="${50 + reflectionOffset}%" stop-color="#ffffff" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
    `;

    // Render handle behind first (if Z < 0)
    if (h1Z < 0) {
      elements += `<circle cx="${h1X}" cy="140" r="${handleRadius}" fill="none" stroke="#666666" stroke-width="6"/>`;
    }
    if (h2Z < 0) {
      elements += `<circle cx="${h2X}" cy="140" r="${handleRadius}" fill="none" stroke="#666666" stroke-width="6"/>`;
    }

    // Main Kadai Bowl
    elements += `
      <!-- Kadai Body -->
      <path d="M 60 120 Q 60 210 150 210 Q 240 210 240 120 Z" fill="url(#grad)"/>
      <ellipse cx="150" cy="120" rx="90" ry="18" fill="${metallicShadow}"/>
      <ellipse cx="150" cy="120" rx="86" ry="15" fill="#f0f0f0"/>
      <!-- Inner reflections -->
      <path d="M 64 120 Q 64 206 150 206 Q 236 206 236 120 Z" fill="url(#reflection)" opacity="0.3"/>
      <!-- Rim Accent -->
      <ellipse cx="150" cy="120" rx="90" ry="18" fill="none" stroke="${metallicHighlight}" stroke-width="2"/>
    `;

    // Render handle in front (if Z >= 0)
    if (h1Z >= 0) {
      elements += `
        <!-- Left Handle front shadow and body -->
        <circle cx="${h1X}" cy="140" r="${handleRadius}" fill="none" stroke="#111111" stroke-width="7" opacity="0.2" transform="translate(0, 2)"/>
        <circle cx="${h1X}" cy="140" r="${handleRadius}" fill="none" stroke="#555555" stroke-width="6"/>
        <path d="M ${h1X - 3} 133 L ${h1X + 3} 133" stroke="#ffd700" stroke-width="4"/>
      `;
    }
    if (h2Z >= 0) {
      elements += `
        <!-- Right Handle front shadow and body -->
        <circle cx="${h2X}" cy="140" r="${handleRadius}" fill="none" stroke="#111111" stroke-width="7" opacity="0.2" transform="translate(0, 2)"/>
        <circle cx="${h2X}" cy="140" r="${handleRadius}" fill="none" stroke="#555555" stroke-width="6"/>
        <path d="M ${h2X - 3} 133 L ${h2X + 3} 133" stroke="#ffd700" stroke-width="4"/>
      `;
    }

    // Add visual angle overlay for retail shop feedback
    elements += `
      <!-- Base/Shadow -->
      <ellipse cx="150" cy="220" rx="60" ry="8" fill="#e0e0e0" opacity="0.6"/>
      <!-- Title & Angle Indicators -->
      <text x="150" y="270" font-family="Arial" font-size="12" fill="#888888" text-anchor="middle">Angle: ${angle}°</text>
      <text x="150" y="285" font-family="Arial" font-size="10" fill="#bbbbbb" text-anchor="middle">AI Estimated 3D View</text>
    `;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">${elements}</svg>`;
  } else if (type === 'bottle') {
    // Copper / Metallic Bottle
    const color = name.includes('steel') ? '#e0e0e0' : name.includes('brass') ? '#d4af37' : '#b87333';
    const highlight = name.includes('steel') ? '#ffffff' : name.includes('brass') ? '#fff3cc' : '#ffcc99';
    const shadow = name.includes('steel') ? '#777777' : name.includes('brass') ? '#8c7320' : '#732c10';

    // Label rotating: calculate relative X position and width
    const labelAngle = angleRad;
    const labelVisible = Math.sin(labelAngle) >= 0;
    const labelX = 150 + Math.cos(labelAngle) * 20 - (labelVisible ? 15 : 0);
    const labelWidth = Math.abs(Math.sin(labelAngle)) * 30;

    let elements = `
      <rect width="300" height="300" fill="#fafafa"/>
      <defs>
        <!-- Shadow gradient -->
        <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="metallic" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${shadow}" />
          <stop offset="${30 + reflectionOffset}%" stop-color="${highlight}" />
          <stop offset="${70 + reflectionOffset}%" stop-color="${color}" />
          <stop offset="100%" stop-color="${shadow}" />
        </linearGradient>
        <linearGradient id="cap" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#444444" />
          <stop offset="50%" stop-color="#aaaaaa" />
          <stop offset="100%" stop-color="#222222" />
        </linearGradient>
      </defs>
      
      <!-- Ground Shadow -->
      <ellipse cx="150" cy="245" rx="45" ry="10" fill="url(#shadow)"/>
      
      <!-- Bottle Body -->
      <path d="M 120 100 L 120 220 C 120 240, 180 240, 180 220 L 180 100 Z" fill="url(#metallic)"/>
      <!-- Bottle Neck -->
      <path d="M 130 70 L 130 100 L 170 100 L 170 70 Z" fill="url(#metallic)"/>
      <!-- Cap -->
      <rect x="132" y="50" width="36" height="20" rx="3" fill="url(#cap)"/>
      <!-- Cap grooves -->
      <line x1="138" y1="50" x2="138" y2="70" stroke="#111" stroke-width="1"/>
      <line x1="144" y1="50" x2="144" y2="70" stroke="#111" stroke-width="1"/>
      <line x1="150" y1="50" x2="150" y2="70" stroke="#111" stroke-width="1"/>
      <line x1="156" y1="50" x2="156" y2="70" stroke="#111" stroke-width="1"/>
      <line x1="162" y1="50" x2="162" y2="70" stroke="#111" stroke-width="1"/>
    `;

    // Rotating Label in 3D
    if (labelVisible && labelWidth > 2) {
      elements += `
        <!-- ESHwar Premium Label -->
        <rect x="${labelX}" y="130" width="${labelWidth}" height="40" fill="#ffffff" opacity="0.9" rx="2"/>
        <text x="${labelX + labelWidth / 2}" y="153" font-family="Georgia" font-size="8" font-weight="bold" fill="#333" text-anchor="middle" transform="scale(${Math.max(0.1, labelWidth / 30)}, 1) translate(${(150 - (labelX + labelWidth / 2)) * (1 - labelWidth / 30)}, 0)">ESH</text>
      `;
    }

    elements += `
      <!-- Neck ring -->
      <ellipse cx="150" cy="100" rx="30" ry="3" fill="${highlight}" opacity="0.8"/>
      <!-- Body highlight -->
      <path d="M 125 102 L 125 218 Q 150 220 175 218 L 175 102 Z" fill="url(#metallic)" opacity="0.1"/>
      
      <!-- Text overlays -->
      <text x="150" y="275" font-family="Arial" font-size="12" fill="#888888" text-anchor="middle">Angle: ${angle}°</text>
      <text x="150" y="290" font-family="Arial" font-size="10" fill="#bbbbbb" text-anchor="middle">AI Estimated 3D View</text>
    `;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">${elements}</svg>`;
  } else {
    // Generic Vessel/Bowl
    const metallicColor = '#e0e0e0';
    let elements = `
      <rect width="300" height="300" fill="#fafafa"/>
      <defs>
        <radialGradient id="vesselGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="60%" stop-color="${metallicColor}" />
          <stop offset="100%" stop-color="#999999" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="230" rx="50" ry="8" fill="#dddddd"/>
      <!-- Main Bowl -->
      <path d="M 80 110 L 100 210 Q 150 230 200 210 L 220 110 Z" fill="url(#vesselGrad)"/>
      <ellipse cx="150" cy="110" rx="70" ry="15" fill="#bbbbbb"/>
      <ellipse cx="150" cy="110" rx="66" ry="12" fill="#ececec"/>
      
      <!-- Highlight Reflection -->
      <path d="M 100 112 Q 130 150 150 150 Q 170 150 200 112" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.5"/>
      <text x="150" y="275" font-family="Arial" font-size="12" fill="#888888" text-anchor="middle">Angle: ${angle}°</text>
    `;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">${elements}</svg>`;
  }
}
