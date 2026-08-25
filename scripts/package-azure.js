const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('1. Preparing standalone directory...');
const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const targetNextDir = path.join(standaloneDir, '.next');
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(targetNextDir, 'static');
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');
const localDataSrc = path.join(rootDir, 'data-local.json');
const localDataDest = path.join(standaloneDir, 'data-local.json');

// Ensure destination dirs
if (!fs.existsSync(targetNextDir)) fs.mkdirSync(targetNextDir, { recursive: true });

// Copy public
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
}

// Copy .next/static
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
}

// Copy data-local.json
if (fs.existsSync(localDataSrc)) {
  fs.copyFileSync(localDataSrc, localDataDest);
}

// Create a custom server entry / startup wrapper if needed or ensure server.js exists
console.log('2. Creating standalone zip package...');
const zipFile = path.join(rootDir, 'deploy-standalone.zip');
if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);

const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${standaloneDir}\\*' , '${standaloneDir}\\.next' -DestinationPath '${zipFile}' -Force"`;
execSync(psCommand, { stdio: 'inherit' });

const sizeMB = (fs.statSync(zipFile).size / (1024 * 1024)).toFixed(2);
console.log(`✅ Success! Created deploy-standalone.zip (${sizeMB} MB) ready for Azure.`);
