const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const outputFile = path.join(rootDir, 'Master_Content_Edit.md');

const projectFolders = fs.readdirSync(rootDir).filter(f => f.startsWith('Project_') && fs.statSync(path.join(rootDir, f)).isDirectory());

let output = '';

// Helper to append a file
function appendFile(filePath, relativePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    output += `\n<!-- BEGIN FILE: ${relativePath} -->\n`;
    output += content;
    if (!content.endsWith('\n')) output += '\n';
    output += `<!-- END FILE: ${relativePath} -->\n\n`;
  }
}

// 1. Global Docs
const rootFiles = fs.readdirSync(rootDir);
const globalDocFiles = rootFiles.filter(f => f.startsWith('00_') && f.endsWith('.md'));
globalDocFiles.forEach(file => {
  appendFile(path.join(rootDir, file), file);
});

// 2. Project Docs
projectFolders.forEach(folder => {
  const projectPath = path.join(rootDir, folder);
  
  const files = [
    '01_Execution_Plan.md',
    '03_FAQ.md',
    '04_Pubmat_Description.md',
    '05_Subprojects.md'
  ];
  
  files.forEach(file => {
    appendFile(path.join(projectPath, file), path.join(folder, file).replace(/\\/g, '/'));
  });
  
  // 3. Pre-Acts
  const preActsDir = path.join(projectPath, '02_PreActs');
  if (fs.existsSync(preActsDir)) {
    const preActFiles = fs.readdirSync(preActsDir).filter(f => f.endsWith('.md'));
    preActFiles.forEach(file => {
      appendFile(path.join(preActsDir, file), path.join(folder, '02_PreActs', file).replace(/\\/g, '/'));
    });
  }
});

fs.writeFileSync(outputFile, output);
console.log('Master_Content_Edit.md created at ' + outputFile);
