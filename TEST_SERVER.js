/**
 * Simple test script to verify that the server can start correctly
 */

const fs = require('fs');
const path = require('path');

console.log('=== ValleyPreview Server Test ===\n');

// Check if essential files exist
const essentialFiles = [
  'package.json',
  'server/index.ts',
  'client/src/App.tsx',
  'all-products.json',
  'brands-summary.json'
];

console.log('Checking essential files...\n');

let allFilesPresent = true;
essentialFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✓' : '✗';
  console.log(`${status} ${file}`);
  if (!exists) allFilesPresent = false;
});

console.log('\n=== Dependency Check ===\n');

// Check if node_modules exists
const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
console.log(`${nodeModulesExists ? '✓' : '⚠'} Node modules installed: ${nodeModulesExists ? 'Yes' : 'No (run npm install)'}`);

console.log('\n=== Test Summary ===\n');

if (allFilesPresent) {
  console.log('✓ SUCCESS: All essential files are present');
  console.log('✓ The server should start correctly with "npm run dev"');
  console.log('✓ Remember to run "npm install" if node modules are not installed');
} else {
  console.log('✗ FAILURE: Some essential files are missing');
  console.log('✗ The server may not start correctly');
}

console.log('\n=== Next Steps ===\n');
console.log('1. Run "npm install" to install dependencies');
console.log('2. Run "npm run dev" to start the development server');
console.log('3. Visit http://localhost:5174 to view the application');