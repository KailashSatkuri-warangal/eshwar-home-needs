const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Manually parse env files
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.includes('#')) {
        value = value.split('#')[0].trim();
      }
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

parseEnv(path.join(__dirname, '../.env'));
parseEnv(path.join(__dirname, '../.env.local'));

const apiKey = process.env.GEMINI_API_KEY;

console.log('====================================================');
console.log('       ESHwar Gemini Vision API Diagnostic Tool     ');
console.log('====================================================\n');

if (!apiKey) {
  console.error('❌ ERROR: No GEMINI_API_KEY found in .env.local or .env files!');
  console.log('\nTroubleshooting:');
  console.log('1. Open your .env.local file');
  console.log('2. Add this line: GEMINI_API_KEY=your_actual_api_key');
  process.exit(1);
}

console.log(`🔑 Key found: "${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}"`);

if (!apiKey.startsWith('AIzaSy')) {
  console.warn('⚠️  WARNING: Your key does NOT start with "AIzaSy".');
  console.warn('   AI Studio developer API keys always start with "AIzaSy".');
  console.warn('   The key currently saved is likely a Vertex access token and will fail.\n');
} else {
  console.log('✅ Key format verified (starts with "AIzaSy").\n');
}

const genAI = new GoogleGenerativeAI(apiKey);

async function runDiagnostics() {
  let textSuccess = false;
  let visionSuccess = false;

  // Test 1: Simple Text Generation
  console.log('⏳ Test 1: Testing Text Generation (gemini-3.6-flash)...');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent('Hi! Respond with "OK" if you receive this.');
    const text = result.response.text().trim();
    console.log(`✅ Text Test Success! Gemini Response: "${text}"\n`);
    textSuccess = true;
  } catch (err) {
    console.error(`❌ Text Test Failed: ${err.message}\n`);
  }

  // Test 2: Vision / Multimodal Capability (Using a 1x1 transparent PNG pixel base64)
  console.log('⏳ Test 2: Testing Vision Analysis (gemini-3.6-flash with image)...');
  try {
    const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const imagePart = {
      inlineData: {
        data: mockImageBase64,
        mimeType: 'image/png'
      }
    };
    
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent([
      'What color is this 1x1 image? Respond with a single word.',
      imagePart
    ]);
    const responseText = result.response.text().trim();
    console.log(`✅ Vision Test Success! Gemini Response: "${responseText}"\n`);
    visionSuccess = true;
  } catch (err) {
    console.error(`❌ Vision Test Failed: ${err.message}\n`);
  }

  // Final Summary
  console.log('====================================================');
  console.log('                 DIAGNOSTIC SUMMARY                 ');
  console.log('====================================================');
  console.log(`Text Connection:   ${textSuccess ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Vision capability: ${visionSuccess ? '✅ WORKING' : '❌ FAILED'}`);
  console.log('====================================================\n');

  if (textSuccess && visionSuccess) {
    console.log('🎉 SUCCESS: Your Gemini API Key is fully working for both Text and Vision!');
    console.log('You can now restart your dev server (npm run dev) and use the AI scrap estimator!');
  } else {
    console.log('🛑 ACTION REQUIRED: Your API key is not fully configured.');
    console.log('1. Make sure you generated a key from https://aistudio.google.com/');
    console.log('2. Make sure the Generative Language API is enabled in your Google Cloud Console.');
  }
}

runDiagnostics();
