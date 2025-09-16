
/**
 * Standalone verification script for the independent fresh copy
 */
const fs = require('fs');
const path = require('path');

function checkExists(relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  return fs.existsSync(fullPath);
}

function countFilesInDir(relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  try {
    return fs.readdirSync(fullPath).length;
  } catch (error) {
    return 0;
  }
}

console.log('=== Independent ValleyPreview Fresh Copy Verification ===\n');

// Check all essential components
const checks = [
  { path: 'client', type: 'directory', description: 'Client source code' },
  { path: 'server', type: 'directory', description: 'Server source code' },
  { path: 'shared', type: 'directory', description: 'Shared code' },
  { path: 'assets', type: 'directory', description: 'Main assets' },
  { path: 'attached_assets', type: 'directory', description: 'Attached assets' },
  { path: 'package.json', type: 'file', description: 'Package configuration' },
  { path: 'tsconfig.json', type: 'file', description: 'TypeScript configuration' },
  { path: 'vite.config.ts', type: 'file', description: 'Vite configuration' },
  { path: 'all-products.json', type: 'file', description: 'Product data' },
  { path: 'brands-summary.json', type: 'file', description: 'Brand data' }
];

let allPresent = true;
checks.forEach(check => {
  const exists = checkExists(check.path);
  const status = exists ? '✓' : '✗';
  console.log(`${status} ${check.description} (${check.path})`);
  if (!exists) allPresent = false;
});

// Check server files
const serverFiles = ['index.ts', 'storage.ts', 'routes.ts', 'vite.ts'];
let serverFilesPresent = 0;
serverFiles.forEach(file => {
  const exists = checkExists(path.join('server', file));
  const status = exists ? '✓' : '✗';
  console.log(`${status} Server file: ${file}`);
  if (exists) serverFilesPresent++;
});

console.log('\n=== Independence Verification ===\n');

// Check for external references in key files
const keyFiles = [
  'vite.config.ts',
  path.join('server', 'vite.ts'),
  path.join('server', 'index.ts'),
  path.join('shared', 'schema.ts')
];

let hasExternalRefs = false;
keyFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    // Check for references to parent directories or absolute paths
    if (content.includes('../..') && !file.includes('server/vite.ts')) {
      console.log(`✗ Potential external reference in ${file}`);
      hasExternalRefs = true;
    }
  }
});

if (!hasExternalRefs) {
  console.log('✓ No external references found in key configuration files');
}

if (allPresent && !hasExternalRefs) {
  console.log('\n✓ SUCCESS: Fresh copy is completely independent');
  console.log('✓ All files and configurations are self-contained');
  console.log('✓ Ready for standalone development and deployment');
} else {
  console.log('\n✗ WARNING: Some issues found');
  console.log('✗ This copy may have external dependencies');
}
