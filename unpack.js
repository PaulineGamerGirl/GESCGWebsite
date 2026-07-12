const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const inputFile = path.join(rootDir, 'Master_Content_Edit.md');

if (!fs.existsSync(inputFile)) {
  console.error(`Error: Could not find ${inputFile}`);
  process.exit(1);
}

const content = fs.readFileSync(inputFile, 'utf8');

// Regex to match our delimiters
// <!-- BEGIN FILE: <path> -->
// <content>
// <!-- END FILE: <path> -->
const regex = /<!-- BEGIN FILE: (.*?) -->\n([\s\S]*?)<!-- END FILE: \1 -->/g;

let match;
let count = 0;

while ((match = regex.exec(content)) !== null) {
  const relativePath = match[1].trim();
  const fileContent = match[2]; // Don't trim, preserve the content exactly as edited, maybe just trim start/end newlines if they are artifacts of packing, but packing added \n around it.
  
  // Clean up the extra newline added by packing
  const cleanedContent = fileContent.replace(/^\n/, '').replace(/\n$/, '');

  const absolutePath = path.join(rootDir, relativePath);
  
  // Ensure directory exists (should already exist, but just in case)
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(absolutePath, cleanedContent, 'utf8');
  console.log(`Updated ${relativePath}`);
  count++;
}

console.log(`\nSuccessfully unpacked ${count} files.`);

// Now rebuild the website
console.log('Rebuilding website...');
try {
  execSync('node build.js', { stdio: 'inherit', cwd: __dirname });
  console.log('Done!');
} catch (e) {
  console.error('Error rebuilding website:', e);
}
