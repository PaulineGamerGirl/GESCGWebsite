const fs = require('fs');
let data = fs.readFileSync('data.js', 'utf8');

try {
  let startIdx = data.indexOf('{');
  let endIdx = data.lastIndexOf('}') + 1;
  const jsonStr = data.substring(startIdx, endIdx);
  const obj = JSON.parse(jsonStr);
  
  const p6 = obj.projects.find(p => p.id === 'project-6' || p.name.includes('Project 6'));
  if (p6 && p6.subprojects) {
    p6.subprojects = p6.subprojects.replace(/## Emergency Micro-Grant Fund[\s\S]*?(?=##|$)/, '');
    
    // We should preserve whatever was before the JSON object and append a semicolon
    const prefix = data.substring(0, startIdx);
    const finalData = prefix + JSON.stringify(obj) + ';\n';
    fs.writeFileSync('data.js', finalData);
    console.log('Successfully updated data.js');
  } else {
    console.log('Project 6 or subprojects not found');
  }
} catch (e) {
  console.error('Error parsing data.js:', e);
}
