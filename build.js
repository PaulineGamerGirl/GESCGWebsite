const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const data = {
  projects: [],
  preActs: {},
  globalDocs: []
};

const projectFolders = fs.readdirSync(rootDir).filter(f => f.startsWith('Project_') && fs.statSync(path.join(rootDir, f)).isDirectory());

// Sort projects logically P1 -> P7
projectFolders.sort();

projectFolders.forEach(folder => {
  const projectPath = path.join(rootDir, folder);
  const projectName = folder.replace(/_/g, ' ');
  const projectId = folder.split('_')[1];
  
  const executionPlanPath = path.join(projectPath, '01_Execution_Plan.md');
  const faqPath = path.join(projectPath, '03_FAQ.md');
  const descriptionPath = path.join(projectPath, '04_Project_Description.md');
  const subprojectsPath = path.join(projectPath, '05_Subprojects.md');
  
  let faq = '';
  let description = '';
  let executionPlan = '';
  let subprojects = '';
  
  if (fs.existsSync(faqPath)) {
    faq = fs.readFileSync(faqPath, 'utf8');
  }
  if (fs.existsSync(descriptionPath)) {
    description = fs.readFileSync(descriptionPath, 'utf8');
  }
  if (fs.existsSync(executionPlanPath)) {
    executionPlan = fs.readFileSync(executionPlanPath, 'utf8');
  }
  if (fs.existsSync(subprojectsPath)) {
    subprojects = fs.readFileSync(subprojectsPath, 'utf8');
  }
  
  data.projects.push({
    id: `project-${projectId}`,
    folderName: folder,
    name: projectName,
    faq,
    description,
    executionPlan,
    subprojects
  });

  // Read Pre-Acts
  const preActsDir = path.join(projectPath, '02_PreActs');
  if (fs.existsSync(preActsDir)) {
    const preActFiles = fs.readdirSync(preActsDir).filter(f => f.endsWith('.md'));
    if (preActFiles.length > 0) {
      data.preActs[`project-${projectId}`] = {
        name: projectName,
        files: []
      };
      preActFiles.forEach(file => {
        const content = fs.readFileSync(path.join(preActsDir, file), 'utf8');
        data.preActs[`project-${projectId}`].files.push({
          filename: file,
          content
        });
      });
    }
  }
});

// Read Global Strategy Docs
const rootFiles = fs.readdirSync(rootDir);
const globalDocFiles = rootFiles.filter(f => f.startsWith('00_') && f.endsWith('.md'));

globalDocFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  data.globalDocs.push({
    filename: file,
    name: file.replace('00_', '').replace(/_/g, ' ').replace('.md', ''),
    content
  });
});

const output = `window.__INITIAL_DATA__ = ${JSON.stringify(data)};`;
fs.writeFileSync(path.join(__dirname, 'data.js'), output);
console.log('data.js generated successfully.');
