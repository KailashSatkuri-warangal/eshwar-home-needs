const Razorpay = require('razorpay');
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

parseEnv(path.join(__dirname, '../.env.local'));
parseEnv(path.join(__dirname, '../.env'));

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('====================================================');
console.log('       ESHwar Razorpay API Diagnostic Tool          ');
console.log('====================================================\n');

if (!keyId || !keySecret) {
  console.error('❌ ERROR: Razorpay keys are missing from environment!');
  process.exit(1);
}

console.log(`Key ID:     "${keyId}"`);
console.log(`Key Secret: "${keySecret.substring(0, 4)}...${keySecret.substring(keySecret.length - 4)}"`);

const rzp = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

async function runTest() {
  try {
    console.log('\n⏳ Attempting to create a test order of ₹100.00 (10000 paise)...');
    const order = await rzp.orders.create({
      amount: 10000,
      currency: 'INR',
      receipt: `test_rcpt_${Date.now()}`,
    });

    console.log('✅ SUCCESS: Razorpay order created successfully!');
    console.log('Order ID:', order.id);
  } catch (err) {
    console.error('❌ FAILED: Razorpay API returned an error:');
    console.error(err);
  }
}

runTest();
