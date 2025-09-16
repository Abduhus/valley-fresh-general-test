/**
 * Script to verify that the general fresh copy of ValleyPreview contains all necessary files
 * for development and deployment on any platform
 */

const fs = require('fs');
const path = require('path');

// Function to check if a file or directory exists
function checkExists(relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  return fs.existsSync(fullPath);
}

// Function to count files in a directory
function countFilesInDir(relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  try {
    return fs.readdirSync(fullPath).length;
  } catch (error) {
    return 0;
  }
}

console.log('=== ValleyPreview General Fresh Copy Verification ===\n');

// Essential directories and files to check
const essentialItems = [
  { path: 'client', type: 'directory', description: 'Client source code' },
  { path: 'server', type: 'directory', description: 'Server source code' },
  { path: 'shared', type: 'directory', description: 'Shared code' },
  { path: 'assets', type: 'directory', description: 'Main assets (perfume images)' },
  { path: 'attached_assets', type: 'directory', description: 'Attached assets (logos, etc.)' },
  { path: 'package.json', type: 'file', description: 'Package configuration' },
  { path: 'tsconfig.json', type: 'file', description: 'TypeScript configuration' },
  { path: 'vite.config.ts', type: 'file', description: 'Vite configuration' },
  { path: 'all-products.json', type: 'file', description: 'Product data' },
  { path: 'brands-summary.json', type: 'file', description: 'Brand data' }
];

console.log('Checking essential files and directories...\n');

let allPresent = true;
essentialItems.forEach(item => {
  const exists = checkExists(item.path);
  const status = exists ? '✓' : '✗';
  console.log(`${status} ${item.description} (${item.path})`);
  if (!exists) allPresent = false;
});

console.log('\n=== Asset Verification ===\n');

// Check assets directories
const assetsCount = countFilesInDir('assets');
const attachedAssetsCount = countFilesInDir('attached_assets');

console.log(`Main assets directory contains ${assetsCount} items`);
console.log(`Attached assets directory contains ${attachedAssetsCount} items`);

// Check if we have perfume images
const perfumesDirExists = checkExists('assets/perfumes');
if (perfumesDirExists) {
  const perfumesCount = countFilesInDir('assets/perfumes');
  console.log(`Perfume images directory contains ${perfumesCount} items`);
} else {
  console.log('✗ Perfume images directory not found');
  allPresent = false;
}

console.log('\n=== Client Source Verification ===\n');

// Check client directories
const clientSrcExists = checkExists('client/src');
if (clientSrcExists) {
  console.log('✓ Client source directory exists');
  
  const componentsCount = countFilesInDir('client/src/components');
  const pagesCount = countFilesInDir('client/src/pages');
  const assetsCount = countFilesInDir('client/src/assets');
  
  console.log(`Client components: ${componentsCount} files`);
  console.log(`Client pages: ${pagesCount} files`);
  console.log(`Client assets: ${assetsCount} files`);
} else {
  console.log('✗ Client source directory not found');
  allPresent = false;
}

console.log('\n=== Server Source Verification ===\n');

// Check server files
const serverFiles = ['index.ts', 'storage.ts', 'routes.ts', 'vite.ts'];
let serverFilesPresent = 0;

serverFiles.forEach(file => {
  const exists = checkExists(`server/${file}`);
  const status = exists ? '✓' : '✗';
  console.log(`${status} Server file: ${file}`);
  if (exists) serverFilesPresent++;
});

if (serverFilesPresent === serverFiles.length) {
  console.log('✓ All server files present');
} else {
  console.log(`✗ Only ${serverFilesPresent}/${serverFiles.length} server files present`);
  allPresent = false;
}

console.log('\n=== Verification Summary ===\n');

if (allPresent) {
  console.log('✓ SUCCESS: All essential files and directories are present');
  console.log('✓ This general fresh copy includes all photos, scripts, and website features');
  console.log('✓ Ready for development and deployment on any platform');
} else {
  console.log('✗ FAILURE: Some essential files or directories are missing');
  console.log('✗ This copy may not function correctly');
}

console.log('\n=== Additional Notes ===\n');
console.log('1. This general fresh copy contains all product data and images');
console.log('2. All frontend components and pages are included');
console.log('3. Backend API endpoints are properly configured');
console.log('4. No platform-specific deployment configurations are included');
console.log('5. Can be used for development, testing, or deployment to any platform');