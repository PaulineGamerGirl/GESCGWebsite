const data = window.__INITIAL_DATA__;

// Helper: true when mobile-ui class is active (real phone OR desktop preview toggle)
function isMobileUI() {
  return document.documentElement.classList.contains('mobile-ui');
}

// Configure Marked to wrap tables in a responsive container safely
if (typeof marked !== 'undefined') {
  const originalParse = marked.parse;
  marked.parse = function(src, options) {
    let html = originalParse.call(marked, src, options);
    if (typeof html === 'string') {
      return html.replace(/<table>/g, '<div class="table-responsive"><table>').replace(/<\/table>/g, '</table></div>');
    }
    return html;
  };
}

// Setup Nav Links
const projectNavLinks = document.getElementById('project-nav-links');
data.projects.forEach((p, index) => {
  const a = document.createElement('a');
  a.href = `#${p.id}`;
  a.className = 'project-tab';
  const pName = p.name.replace(/^Project \d+ /, ''); // Actual name
  a.innerHTML = `<div class="tab-dot project-color-${index + 1}"></div> ${pName}`;
  projectNavLinks.appendChild(a);
});

// Add global reference to shader
let shaderInstance = null;

// Routing
function handleRoute() {
  const hash = window.location.hash || '#experiment';
  
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('.project-tab').forEach(a => a.classList.remove('active'));
  
  if (shaderInstance) {
      shaderInstance.stop();
  }

  if (hash === '#experiment') {
    document.getElementById('experiment').classList.add('active');
    if (!shaderInstance) {
      const canvas = document.getElementById('shader-bg');
      shaderInstance = initShaderBackground(canvas);
    }
    shaderInstance.start();
  } else if (hash === '#home') {
    document.getElementById('home').classList.add('active');
    document.querySelector('.nav-links a[href="#home"]')?.classList.add('active');
    renderCharts();
    renderCalendar();
    renderProjectCards();
    renderDetailedTimelines();
  } else if (hash === '#preacts') {
    document.getElementById('preacts').classList.add('active');
    document.querySelector('.nav-links a[href="#preacts"]')?.classList.add('active');
  } else if (hash === '#global-strategy') {
    document.getElementById('global-strategy').classList.add('active');
    document.querySelector('.nav-links a[href="#global-strategy"]')?.classList.add('active');
    renderGlobalStrategy();
  } else if (hash === '#suggestions') {
    document.getElementById('suggestions').classList.add('active');
    document.querySelector('.nav-links a[href="#suggestions"]')?.classList.add('active');
  } else if (hash === '#finances') {
    document.getElementById('finances').classList.add('active');
    document.querySelector('.nav-links a[href="#finances"]')?.classList.add('active');
    renderFinances();
  } else if (hash === '#student-services') {
    document.getElementById('student-services').classList.add('active');
    document.querySelector('.nav-links a[href="#student-services"]')?.classList.add('active');
    if (window.renderStudentServices) window.renderStudentServices();
  } else if (hash === '#me') {
    document.getElementById('me').classList.add('active');
    document.querySelector('.nav-links a[href="#me"]')?.classList.add('active');
  } else {
    // Project View
    const projectId = hash.substring(1);
    const project = data.projects.find(p => p.id === projectId);
    
    if (project) {
      document.getElementById('project-view').classList.add('active');
      const activeTab = document.querySelector(`.project-tab[href="#${projectId}"]`);
      if (activeTab) activeTab.classList.add('active');
      document.getElementById('project-title').innerText = project.name;
      document.getElementById('project-pubmat').innerHTML = marked.parse(project.description || '*No project description available*');
      document.getElementById('project-faq').innerHTML = marked.parse(project.faq || '*No FAQ available*');
      document.getElementById('project-execution-plan').innerHTML = marked.parse(project.executionPlan || '*No Execution Plan available*');
      
      const subprojectsContainer = document.getElementById('project-subprojects-container');
      const subprojectsElem = document.getElementById('project-subprojects');
      if (project.subprojects) {
        subprojectsContainer.style.display = 'block';
        subprojectsElem.innerHTML = marked.parse(project.subprojects);
      } else {
        subprojectsContainer.style.display = 'none';
      }
    } else {
      window.location.hash = '#home';
    }
  }
}

// Calendar Rendering
let currentCalDate = new Date(2026, 10, 1); // Nov 2026

window.changeMonth = (delta) => {
  currentCalDate.setMonth(currentCalDate.getMonth() + delta);
  renderCalendar();
};

function renderCalendar() {
  const container = document.getElementById('calendar-render');
  if (!container) return; 
  
  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const projectGanttData = {};
  data.projects.forEach(p => {
    projectGanttData[p.id] = [];
    const plan = p.executionPlan || '';
    const match = plan.match(/### 3\. Proposed Timeline[\s\S]*?(?=### 4\.)/);
    if (match) {
      const lines = match[0].split('\n');
      lines.forEach(line => {
        const dateMatch = line.match(/- \*\*(.*?):\*\*(.*)/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const desc = dateMatch[2].toLowerCase();
          
          if (desc.includes('midterm') || desc.includes('ilw') || desc.includes('ban')) return;

          let type = 'planning';
          if (desc.includes('launch') || desc.includes('execut') || desc.includes('deploy')) {
            type = 'live';
          } else if (desc.includes('submit') || desc.includes('moa') || desc.includes('pitch')) {
            type = 'preacts';
          } else if (desc.includes('approve') || desc.includes('secure')) {
            type = 'approved';
          }
          
          let startStr, endStr;
          if (dateStr.includes('–')) {
            const parts = dateStr.split('–').map(s => s.trim());
            const monthMatch = parts[0].match(/[A-Za-z]+/);
            const month = monthMatch ? monthMatch[0] : 'Jan';
            startStr = parts[0] + (parts[0].includes('202') ? '' : ', 2027');
            endStr = (parts[1].includes(month) || parts[1].match(/[A-Za-z]+/)) ? parts[1] : `${month} ${parts[1]}`;
            endStr = endStr + (endStr.includes('202') ? '' : ', 2027');
          } else {
            startStr = dateStr + (dateStr.includes('202') ? '' : ', 2027');
            endStr = startStr;
          }
          
          const start = new Date(startStr);
          const end = new Date(endStr);
          
          if (!isNaN(start) && !isNaN(end)) {
             projectGanttData[p.id].push({
               type,
               name: dateMatch[2].trim(),
               start: start.toISOString().split('T')[0],
               end: end.toISOString().split('T')[0]
             });
          }
        }
      });
    }
  });

  const blackouts = [
    { name: 'Midterms', start: '2027-02-16', end: '2027-02-21' },
    { name: 'ILW', start: '2027-03-02', end: '2027-03-07' },
    { name: 'Activity Ban', start: '2027-03-30', end: '2027-04-11' }
  ];

  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Group into weeks
  let weeks = [];
  let currentWeek = [];
  
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  let gridHtml = '';
  
  weeks.forEach(week => {
    let weekHtml = '';
    
    // 1. Render Day Cells
    week.forEach((d, index) => {
      if (d === null) {
        weekHtml += `<div class="calendar-day empty" style="grid-column: ${index + 1}; grid-row: 1;"></div>`;
      } else {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const currentDayTime = new Date(dateStr).getTime();
        
        let isBlackout = false;
        let blackoutLabel = '';
        blackouts.forEach(b => {
          const bs = new Date(b.start).getTime();
          const be = new Date(b.end).getTime();
          if (currentDayTime >= bs && currentDayTime <= be) {
            isBlackout = true;
            blackoutLabel = b.name;
          }
        });
        
        weekHtml += `
          <div class="calendar-day ${isBlackout ? 'blackout' : ''}" style="grid-column: ${index + 1}; grid-row: 1;">
            <div class="calendar-day-header">
              <span>${d}</span>
              ${isBlackout ? `<span class="blackout-label">${blackoutLabel}</span>` : ''}
            </div>
          </div>
        `;
      }
    });
    
    // 2. Render Spanning Events
    const weekStartDay = week.find(d => d !== null);
    const weekEndDay = [...week].reverse().find(d => d !== null);
    
    const weekStartStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(weekStartDay).padStart(2, '0')}`;
    const weekEndStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(weekEndDay).padStart(2, '0')}`;
    const weekStartTime = new Date(weekStartStr).getTime();
    const weekEndTime = new Date(weekEndStr).getTime();
    
    data.projects.forEach((p, projectIndex) => {
      const phases = projectGanttData[p.id] || [];
      phases.forEach(phase => {
        if (phase.type === 'planning') return;

        const psTime = new Date(phase.start).getTime();
        const peTime = new Date(phase.end).getTime();
        
        if (psTime <= weekEndTime && peTime >= weekStartTime) {
           let startCol = 1;
           if (psTime > weekStartTime) {
              const startD = new Date(phase.start).getDate();
              startCol = week.indexOf(startD) + 1;
           } else {
              startCol = week.indexOf(weekStartDay) + 1;
           }
           
           let endCol = 7;
           if (peTime < weekEndTime) {
              const endD = new Date(phase.end).getDate();
              endCol = week.indexOf(endD) + 1;
           } else {
              endCol = week.indexOf(weekEndDay) + 1;
           }
           
           const span = endCol - startCol + 1;
           const pName = p.name.replace(/^Project \d+ /, '');
           
           const slot = projectIndex;
           
           weekHtml += `
             <div class="calendar-event-span project-color-${projectIndex + 1}" style="grid-column: ${startCol} / span ${span}; grid-row: 1; margin-top: ${24 + slot * 24}px;" title="${pName}: ${phase.name}">
               ${pName}
             </div>
           `;
        }
      });
    });
    
    gridHtml += `<div class="calendar-week">\n${weekHtml}\n</div>`;
  });
  
  const containerHtml = `
    <div class="calendar-controls">
      <button class="btn btn-outline" onclick="changeMonth(-1)">Previous</button>
      <div class="calendar-title">${monthNames[month]} ${year}</div>
      <button class="btn btn-outline" onclick="changeMonth(1)">Next</button>
    </div>
    
    <div class="calendar-legend">
      ${data.projects.map((p, i) => `
        <div class="legend-item"><div class="legend-color project-color-${i+1}"></div> ${p.name.replace(/^Project \d+ /, '')}</div>
      `).join('')}
      <div class="legend-item"><div class="legend-color" style="background: rgba(239, 68, 68, 0.15); border: 1px solid var(--error);"></div> Blackout</div>
    </div>
    
    <div class="calendar-header">
      <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
    </div>
    <div class="calendar-grid">
      ${gridHtml}
    </div>
  `;
  
  container.innerHTML = containerHtml;
}

// Chart Rendering
function renderCharts() {
  const container = document.getElementById('chart-render');
  if (!container || container.innerHTML !== '') return;
  
  // Hand-built horizontal bar chart matching Genesis
  const featureCounts = {
    'project-1': 10,
    'project-2': 4,
    'project-3': 3,
    'project-4': 3,
    'project-5': 3,
    'project-6': 2,
    'project-7': 2
  };
  
  const maxFeatures = 10;
  
  const html = `
    <div class="chart-container">
      <div class="bar-chart">
        ${data.projects.map(p => {
          const count = featureCounts[p.id] || 0;
          const width = (count / maxFeatures) * 100;
          return `
            <div class="bar-row">
              <div class="bar-label">${p.name.replace(/^Project \d+ /, '')}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${width}%"></div>
              </div>
              <div class="bar-value">${count}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  container.innerHTML = html;
}

function renderProjectCards() {
  const container = document.getElementById('project-cards-render');
  if (!container || container.innerHTML !== '') return;
  
  let html = '';
  data.projects.forEach(p => {
    const actualName = p.name.replace(/^Project \d+ /, '');
    html += `
      <a href="#${p.id}" class="card" style="text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s;">
        <h4 style="margin: 0; color: var(--primary);">${actualName}</h4>
      </a>
    `;
  });
  
  container.innerHTML = html;
}

function renderDetailedTimelines() {
  const container = document.getElementById('detailed-timelines-render');
  if (!container || container.innerHTML !== '') return;
  
  let html = '<div style="display: flex; flex-direction: column; gap: var(--spacing-4);">';
  
  data.projects.forEach(p => {
    const actualName = p.name.replace(/^Project \d+ /, '');
    const plan = p.executionPlan || '';
    const match = plan.match(/### 3\. Proposed Timeline[\s\S]*?(?=### 4\.)/);
    if (match) {
      const lines = match[0].split('\n');
      let itemsHtml = '';
      lines.forEach(line => {
        const itemMatch = line.match(/^-\s+\*\*(.*?)\*\*\s*(.*)/);
        if (itemMatch) {
          const dateStr = itemMatch[1].replace(':', '');
          const action = itemMatch[2].replace(/\*/g, '');
          
          let badgeColor = 'var(--text-secondary)';
          let badgeBg = 'var(--background)';
          const actionLower = action.toLowerCase();
          
          if (actionLower.includes('launch') || actionLower.includes('deployment')) {
            badgeColor = 'var(--primary)';
            badgeBg = 'rgba(16, 185, 129, 0.1)';
          } else if (actionLower.includes('submit') || actionLower.includes('endorsement')) {
            badgeColor = 'rgba(245, 158, 11, 0.9)';
            badgeBg = 'rgba(245, 158, 11, 0.1)';
          } else if (actionLower.includes('midterms') || actionLower.includes('ilw') || actionLower.includes('ban')) {
            badgeColor = 'var(--error)';
            badgeBg = 'rgba(239, 68, 68, 0.1)';
          } else if (actionLower.includes('finalized') || actionLower.includes('finalize') || actionLower.includes('concept')) {
            badgeColor = 'rgba(99, 102, 241, 0.9)';
            badgeBg = 'rgba(99, 102, 241, 0.1)';
          }

          itemsHtml += `
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <div style="width: 140px; font-weight: 600; font-size: 13px; color: var(--text-primary); flex-shrink: 0; padding-top: 2px;">${dateStr}</div>
              <div style="flex-grow: 1; font-size: 14px; padding-left: 16px; border-left: 2px solid ${badgeColor}; padding-bottom: 8px;">
                <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 6px; display: inline-block;">${actualName} Phase</span>
                <div style="color: var(--text-secondary); line-height: 1.5;">${action}</div>
              </div>
            </div>
          `;
        }
      });
      
      if (itemsHtml) {
        html += `
          <div style="background: var(--surface); padding: var(--spacing-6); border: 1px solid var(--border); border-radius: var(--radius-lg);">
            <h4 style="margin-top: 0; margin-bottom: 20px; color: var(--primary); font-size: 16px;">${actualName} Actions</h4>
            ${itemsHtml}
          </div>
        `;
      }
    }
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// Initial render of Pre-Acts lock screen
renderPreActs();

function renderPreActs() {
  const grid = document.getElementById('preacts-grid');
  if (grid.innerHTML !== '') return;
  
  grid.innerHTML = `
    <div class="card" style="grid-column: span 2; text-align: center; padding: 60px 20px;">
      <h2 style="color: var(--primary); margin-bottom: 16px;">Restricted Access</h2>
      <p style="color: var(--text-primary); margin-bottom: 12px;">This section is strictly for the <strong>Future Documentation Committee</strong> to access.</p>
      <p style="color: var(--text-secondary); margin-bottom: 32px; font-style: italic; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.6;">
        "If I were to be elected, I'll ensure all pre-activity documents are made before the term even starts, as this is one of the biggest blockages of projects not being executed."
      </p>
      
      <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <input type="password" id="preacts-password" placeholder="Enter Password" style="padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text-primary); width: 100%; max-width: 250px; text-align: center; font-family: var(--font-body); font-size: 14px; outline: none;">
        <button onclick="window.unlockPreActs()" style="padding: 12px 32px; background: var(--primary); color: #fff; border: none; border-radius: var(--radius-sm); cursor: pointer; font-weight: 600; font-family: var(--font-heading); font-size: 14px; transition: all 0.2s ease;">Unlock</button>
        <p id="preacts-error" style="color: #ef4444; margin-top: 8px; display: none; font-size: 13px;">Incorrect password.</p>
      </div>
    </div>
  `;
}

window.unlockPreActs = function() {
  const pwd = document.getElementById('preacts-password').value;
  if (pwd === 'PaulineForCAP') {
    const grid = document.getElementById('preacts-grid');
    let html = '';
    for (const [projectId, projectData] of Object.entries(data.preActs)) {
      html += `
        <div class="card" style="grid-column: span 2;">
          <h3>${projectData.name} - Pre-Acts</h3>
          ${projectData.files.map(f => `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
              <h4 style="font-family: var(--font-body); font-size: 16px;">${f.filename}</h4>
              <div class="markdown-body" style="font-size: 13px;">${marked.parse(f.content)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    if (html === '') {
      html = '<p>No Bucket A Pre-Acts found.</p>';
    }
    
    grid.innerHTML = html;
  } else {
    document.getElementById('preacts-error').style.display = 'block';
  }
};

function renderGlobalStrategy() {
  const grid = document.getElementById('global-strategy-grid');
  if (grid.innerHTML !== '') return;
  
  let html = '';
  data.globalDocs.forEach(doc => {
    html += `
      <div class="card" style="grid-column: span 2;">
        <h3>${doc.name}</h3>
        <div class="markdown-body" style="font-size: 14px;">${marked.parse(doc.content)}</div>
      </div>
    `;
  });
  
  if (html === '') {
    html = '<p>No Global Strategy documents found.</p>';
  }
  
  grid.innerHTML = html;
}

// Suggestions Form Logic
document.getElementById('sugg-type').addEventListener('change', function(e) {
  const leadGroup = document.getElementById('lead-group');
  if (e.target.value === 'proposal') {
    leadGroup.style.display = 'flex';
  } else {
    leadGroup.style.display = 'none';
    document.getElementById('sugg-lead').checked = false;
  }
});

document.getElementById('suggestion-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Since there is no backend yet, mock a successful submission
  const successMsg = document.getElementById('suggestion-success');
  successMsg.style.display = 'block';
  
  // Clear the form
  this.reset();
  
  // Reset UI specific elements
  document.getElementById('lead-group').style.display = 'none';
  
  // Hide success message after 3 seconds
  setTimeout(() => {
    successMsg.style.display = 'none';
  }, 3000);
});

// Finances Rendering Logic
function renderFinances() {
  const grid = document.getElementById('finances-grid');
  if (grid.innerHTML !== '') return;

  const financesHtml = `
    <div class="card" style="grid-column: span 2;">
      <h3 style="color: var(--primary);">Student Emergency Response & Relief Program</h3>
      <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px;">Direct aid for vulnerable students, prioritizing basic survival needs.</p>
      
      <div style="background: rgba(99,102,241,0.05); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; font-size: 15px;">Food Security Pantry</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px;">
          <span>Rice (Est. ₱50/kg) & Sardines (Est. ₱26/can)</span>
          <span style="font-weight: 600;">50% Allocation</span>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary);">Provides survival food packs (1kg rice + 2 canned goods per pack) scaled to budget.</div>
      </div>

      <div style="background: rgba(99,102,241,0.05); padding: 16px; border-radius: var(--radius-sm);">
        <h4 style="margin: 0 0 8px 0; font-size: 15px;">Emergency Micro-Grants</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px;">
          <span>Small cash aid (₱50 - ₱150)</span>
          <span style="font-weight: 600;">50% Allocation</span>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary);">Reserves small grants for sudden commute deficits or immediate emergency meal needs.</div>
      </div>

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 600; color: var(--text-primary);">Subtotal Allocation</span>
        <span style="font-weight: 700; color: var(--secondary); font-size: 18px;">100% of Seed Fund</span>
      </div>
    </div>


    
    <div class="card" style="grid-column: span 2; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2);">
      <h3 style="margin-top: 0; color: var(--secondary);">Initial Seed Fund Allocation (TBA)</h3>
      <p style="margin-bottom: 0; font-size: 14px; color: var(--text-primary); line-height: 1.5;">
        Our specific initial seed fund amount is currently <strong>To Be Announced (TBA)</strong>, as we await final confirmation from the administration. Once the exact amount is provided, this page will be updated immediately. What we can confirm is our allocation ratio: the seed fund will be split evenly, <strong>50% toward the Sakuna Disaster/Emergency Pantry</strong> and <strong>50% toward Micro-Lending</strong>. All remaining projects (such as Transparency Platforms, Accessibility Initiatives, and Education Series) are <strong>zero-cost</strong> platforms. Any expansion of our funded initiatives will be fully supported through <strong>Semana ng Siyensya</strong> and the <strong>Fundraising & Local Business Collaboration Initiative</strong>, relying strictly on partnerships and merchandise, not student fees.<br><br><strong>NOTE:</strong> TO BE FULLY TRANSPARENT: I cannot guarantee that Project 6: Student Emergency Response & Relief Program will ultimately operate under the SCG. While it is entirely feasible under both the USG Financial Manual and the DAAM Manual, it is still subject to potential rejection by SLIFE. However, should that happen, I will personally ensure the continuation of this initiative independently, outside of the Science College Government. It will be the exact same project, with the exact same execution guidelines.
      </p>
    </div>
  `;
  
  grid.innerHTML = financesHtml;
}

window.addEventListener('hashchange', handleRoute);
handleRoute();

// --- Vanilla JS Shader Integration ---
function initShaderBackground(canvas) {
  const VERT = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
uniform vec4 u_scene;
uniform vec4 u_shape;
uniform vec4 u_surface;
uniform vec4 u_finish;
uniform vec4 u_transform;
uniform vec4 u_space;
uniform vec4 u_cursor;

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}

vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1], smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  vec2 q = p * 1.6;
  float amp = 0.25 + u_intensity * 0.85;
  for (float i = 1.0; i < 5.0; i += 1.0) {
    q.x += amp / i * cos(i * 2.4 * q.y + t * 0.8 + u_seed);
    q.y += amp / i * cos(i * 1.7 * q.x + t * 0.6);
  }
  return palette(0.5 + 0.5 * sin(q.x + q.y));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float cursorMask = 0.0;

  if (u_cursorPresence > 0.001) {
    vec2 cursor = (0.5 * u_mouse * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec2 cursorDelta = p - cursor;
    if (u_cursorEffect < 0.5) {
      p += cursor * u_cursorPresence * u_cursorStrength * 0.55;
    } else {
      float cursorDistance = length(cursorDelta);
      vec2 cursorDirection = cursorDelta / max(cursorDistance, 0.0001);
      cursorMask = u_cursorPresence * (1.0 - smoothstep(0.0, u_cursorRadius, cursorDistance));
      if (u_cursorEffect < 1.5) {
        p -= cursorDirection * cursorMask * u_cursorStrength * 0.24;
      } else if (u_cursorEffect < 2.5) {
        float cursorAngle = cursorMask * u_cursorStrength * 2.2;
        float cc = cos(cursorAngle), cs = sin(cursorAngle);
        p = cursor + mat2(cc, -cs, cs, cc) * cursorDelta;
      } else if (u_cursorEffect < 3.5) {
        float ripple = sin(cursorDistance / max(u_cursorRadius, 0.001) * 18.0 - u_time * 5.0);
        p -= cursorDirection * ripple * cursorMask * u_cursorStrength * 0.07;
      }
    }
  }

  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(fbm(p * u_detail + u_seed), fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
  } else {
    col = shade(uv, p, u_time);
  }
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001)
    col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001)
    col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_cursorPresence > 0.001 && u_cursorEffect > 3.5)
    col += (vec3(0.18) + col * 0.12) * cursorMask * u_cursorStrength;
  if (u_grain > 0.0001)
    col += (grainHash(gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

  const UNIFORMS = {
    colors: [
      [0.00784313725490196, 0.00392156862745098, 0.0392156862745098],
      [0.01568627450980392, 0.0196078431372549, 0.1803921568627451],
      [0.23921568627450981, 0.17254901960784313, 0.5529411764705883],
      [0.5686274509803921, 0.4196078431372549, 0.7490196078431373],
      [0.5686274509803921, 0.4196078431372549, 0.7490196078431373],
      [0.5686274509803921, 0.4196078431372549, 0.7490196078431373],
      [0.5686274509803921, 0.4196078431372549, 0.7490196078431373],
      [0.5686274509803921, 0.4196078431372549, 0.7490196078431373]
    ],
    colorCount: 4,
    scale: 1.260,
    intensity: 0.280,
    paramA: 0.500,
    warp: 0.000,
    detail: 2.400,
    contrast: 1.113,
    brightness: 0.000,
    saturation: 1.000,
    hue: 0.0000,
    vignette: 0.000,
    blur: 0.0000,
    grain: 0.049,
    seed: 1581.0,
    rotate: 0.0000,
    offsetX: 0.000,
    offsetY: 0.000,
    drift: 0.000,
    cursorEnabled: false,
    cursorEffect: 2.0,
    cursorStrength: 0.650,
    cursorRadius: 0.460,
    oklab: 0.0,
    timeScale: 0.765,
  };

  const gl = canvas.getContext("webgl", { antialias: false });
  if (!gl) return;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
    }
    return s;
  };

  const program = gl.createProgram();
  const vertexShader = compile(gl.VERTEX_SHADER, VERT);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAG);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const loc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uni = {
    colors: gl.getUniformLocation(program, "u_colors"),
    scene: gl.getUniformLocation(program, "u_scene"),
    shape: gl.getUniformLocation(program, "u_shape"),
    surface: gl.getUniformLocation(program, "u_surface"),
    finish: gl.getUniformLocation(program, "u_finish"),
    transform: gl.getUniformLocation(program, "u_transform"),
    space: gl.getUniformLocation(program, "u_space"),
    cursor: gl.getUniformLocation(program, "u_cursor"),
  };

  gl.uniform3fv(uni.colors, new Float32Array(UNIFORMS.colors.flat()));
  gl.uniform4f(uni.shape, UNIFORMS.scale, UNIFORMS.intensity, UNIFORMS.paramA, UNIFORMS.warp);
  gl.uniform4f(uni.surface, UNIFORMS.detail, UNIFORMS.contrast, UNIFORMS.brightness, UNIFORMS.saturation);
  gl.uniform4f(uni.finish, UNIFORMS.hue, UNIFORMS.vignette, UNIFORMS.blur, UNIFORMS.grain);
  gl.uniform4f(uni.transform, UNIFORMS.seed, UNIFORMS.rotate, UNIFORMS.drift, UNIFORMS.oklab);
  gl.uniform4f(uni.cursor, 0, UNIFORMS.cursorEffect, UNIFORMS.cursorStrength, UNIFORMS.cursorRadius);

  const start = performance.now();
  let raf;

  const resizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    const rawWidth = Math.max(1, Math.round(bounds.width * dpr));
    const rawHeight = Math.max(1, Math.round(bounds.height * dpr));
    const pixelScale = Math.min(1, Math.sqrt(2000000 / Math.max(1, rawWidth * rawHeight)));
    const width = Math.max(1, Math.round(rawWidth * pixelScale));
    const height = Math.max(1, Math.round(rawHeight * pixelScale));
    
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  window.addEventListener('resize', resizeCanvas);
  
  // Wait a tick for bounds to be computed correctly when first shown
  setTimeout(resizeCanvas, 0);

  function render(now) {
    if (!window.isExperimentActive) return;

    resizeCanvas();
    const width = canvas.width;
    const height = canvas.height;
    
    gl.uniform4f(
      uni.scene,
      width,
      height,
      ((now - start) / 1000) * UNIFORMS.timeScale,
      UNIFORMS.colorCount
    );
    gl.uniform4f(uni.space, UNIFORMS.offsetX, UNIFORMS.offsetY, 0, 0);
    gl.uniform4f(uni.cursor, 0, UNIFORMS.cursorEffect, UNIFORMS.cursorStrength, UNIFORMS.cursorRadius);
    
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(render);
  }

  return {
    start: () => {
      if (!raf) {
        window.isExperimentActive = true;
        resizeCanvas();
        raf = requestAnimationFrame(render);
      }
    },
    stop: () => {
      window.isExperimentActive = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }
  };
}

// Immersive Nav Animation Logic
document.addEventListener('DOMContentLoaded', () => {
  const immersiveNav = document.getElementById('immersive-nav');
  if (!immersiveNav) return;

  const navBtns = immersiveNav.querySelectorAll('.glassy-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // For now, prevent default navigation so we can see the animation smoothly
      e.preventDefault();
      
      const target = btn.getAttribute('data-target');

      // Update active state
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (target === 'home') {
        immersiveNav.classList.remove('at-top-middle');
        document.getElementById('immersive-side-nav').classList.remove('visible');
        
        let container = document.getElementById('immersive-content');
        let navWidth = immersiveNav.offsetWidth || 800;
        
        // Remove scrollbar and padding for home screen (desktop only)
        if (typeof isMobileUI === 'function' && isMobileUI()) {
          // Mobile: keep CSS padding-top so content clears the nav bar
          container.style.paddingTop = '';
          container.style.paddingBottom = '';
          container.style.overflow = '';
        } else {
          container.style.paddingTop = '0px';
          container.style.paddingBottom = '0px';
          container.style.overflow = 'visible';
        }

        // ── Mobile home: normal flow layout ──
        if (typeof isMobileUI === 'function' && isMobileUI()) {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; padding: 20px 16px 40px; gap: 16px; min-height: 80vh; justify-content: center;">
              <div class="animate-in" style="animation-delay:0.1s;">
                <img src="welcomepng.png"
                     style="width: 75vw; max-width: 280px; display: block; animation: breathe-scale-img 6s ease-in-out infinite;"
                     alt="Welcome">
              </div>
              <div class="animate-in" style="animation-delay:0.3s; text-align: center; max-width: 340px;">
                <p style="font-size: 0.92rem; line-height: 1.6; color: rgba(255,255,255,0.92); margin-bottom: 8px;">
                  This is the official platform and operations hub of the
                  <span style="color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.6); font-weight: bold; animation: breathe-glow-text 5s ease-in-out infinite; display: inline-block;">Science College Government (SCG)</span> for Academic Year 2026–2027.
                </p>
                <p style="font-size: 0.82rem; color: rgba(255,255,255,0.7);">Explore our Term 1 initiatives, governance frameworks, and student services.</p>
              </div>
              <div class="scg-assistance-container" style="width: 100%; display: flex; justify-content: center; margin-top: 8px;">
                <div class="scg-assistance-row-clean">
                  <span class="scg-assistance-lead">For assistance:</span>
                  <span class="scg-person"><strong>Pauline Galias</strong>, President <a href="https://t.me/PaulineGalias07" target="_blank" rel="noopener noreferrer">@PaulineGalias07</a></span>
                  <span class="scg-bullet">&bull;</span>
                  <span class="scg-person"><strong>Trish Longboy</strong>, Chief of Staff <a href="https://t.me/onetwo_trish" target="_blank" rel="noopener noreferrer">@onetwo_trish</a></span>
                  <span class="scg-bullet">&bull;</span>
                  <span class="scg-person"><strong>Ace Licuanan</strong>, COO <a href="https://t.me/acecarloo" target="_blank" rel="noopener noreferrer">@acecarloo</a></span>
                  <span class="scg-bullet">&bull;</span>
                  <span class="scg-person"><strong>Ann Farala</strong>, CCO <a href="https://t.me/annfarala" target="_blank" rel="noopener noreferrer">@annfarala</a></span>
                </div>
              </div>
            </div>
          `;
        } else {
          // Desktop: centered layout
          container.innerHTML = `
            <div class="animate-in" style="position: absolute; top: -10vh; left: 5vw; z-index: 10; pointer-events: none; animation-delay: 0.1s;">
              <img src="welcomepng.png" style="width: 540px; max-width: 70vw; animation: breathe-scale-img 6s ease-in-out infinite;">
            </div>
            <div style="position: absolute; top: calc(50vh + 35px); left: 0; width: 100%; display: flex; justify-content: center; pointer-events: auto;">
              <div class="animate-in" style="width: auto; max-width: 95vw; padding: 12px 24px; text-align: center; animation-delay: 0.3s;">
                <p style="font-size: 1rem; line-height: 1.6; color: rgba(255,255,255,0.92); margin-bottom: 6px; font-weight: 500;">
                  This is the official platform and operations hub of the <span style="color: #fff; text-shadow: 0 0 12px rgba(255,255,255,0.6); font-weight: 700; display: inline-block; animation: breathe-glow-text 5s ease-in-out infinite;">Science College Government (SCG)</span> for Academic Year 2026–2027.
                </p>
                <p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); font-weight: 400; margin-bottom: 0;">
                  Explore our Term 1 initiatives, governance frameworks, and student services.
                </p>
              </div>
            </div>
            <!-- SCG Assistance Glass Bar - positioned BELOW at bottom of screen, perfectly centered across full viewport -->
            <div class="scg-assistance-container">
              <div class="scg-assistance-row-clean">
                <span class="scg-assistance-lead">For assistance:</span>
                <span class="scg-person"><strong>Pauline Galias</strong>, President <a href="https://t.me/PaulineGalias07" target="_blank" rel="noopener noreferrer">@PaulineGalias07</a></span>
                <span class="scg-bullet">&bull;</span>
                <span class="scg-person"><strong>Trish Longboy</strong>, Chief of Staff <a href="https://t.me/onetwo_trish" target="_blank" rel="noopener noreferrer">@onetwo_trish</a></span>
                <span class="scg-bullet">&bull;</span>
                <span class="scg-person"><strong>Ace Licuanan</strong>, COO <a href="https://t.me/acecarloo" target="_blank" rel="noopener noreferrer">@acecarloo</a></span>
                <span class="scg-bullet">&bull;</span>
                <span class="scg-person"><strong>Ann Farala</strong>, CCO <a href="https://t.me/annfarala" target="_blank" rel="noopener noreferrer">@annfarala</a></span>
              </div>
            </div>
          `;
        }
        document.getElementById('immersive-content').classList.add('active');
      } else {
        immersiveNav.classList.add('at-top-middle');
        
        let container = document.getElementById('immersive-content');
        // Restore scrollbar and padding for other tabs
        container.style.paddingTop = '';
        container.style.paddingBottom = '';
        container.style.overflow = '';       
        // Render specific immersive section
        renderImmersiveView(target);
        
        document.getElementById('immersive-content').classList.add('active');
        document.getElementById('immersive-side-nav').classList.add('visible');
        
        if (target !== 'home') {
          // ensure the page holds
          document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
          document.getElementById('experiment').classList.add('active');
        }
      }
      
      // Optionally handle the hash change after animation if needed later
      // window.location.hash = '#' + target;
    });
  });

  // Automatically trigger a click on the default active button on initial load
  // to populate the immersive-content container (fixes the blank home tab bug)
  document.querySelector('#immersive-nav .glassy-btn.active')?.click();

  // Inject and wire scroll progress bar for mobile
  const progressBar = document.createElement('div');
  progressBar.id = 'mobile-scroll-progress';
  document.body.appendChild(progressBar);

  const scrollContent = document.getElementById('immersive-content');
  if (scrollContent) {
    scrollContent.addEventListener('scroll', () => {
      const bar = document.getElementById('mobile-scroll-progress');
      if (!bar) return;
      const pct = (scrollContent.scrollTop / (scrollContent.scrollHeight - scrollContent.clientHeight)) * 100;
      bar.style.width = Math.min(pct || 0, 100) + '%';
    });
  }
});

let projectObserver = null;

// Render Immersive View
function renderImmersiveView(target) {
  const container = document.getElementById('immersive-content');
  const sideNavContainer = document.getElementById('immersive-side-nav');

  let html = '';
  let sideNavHtml = '';
  let delay = 0.2; // Stagger animation delay

  if (target === 'projects') {
    const SCG_TERM1_PROJECTS = [
  {
    "idx": 0,
    "num": "01",
    "id": "scg-p1",
    "title": "H2Zero.ai — Standalone Offline AI Desktop Application",
    "shortTitle": "H2Zero.ai",
    "type": "Early Processed · Free",
    "funded": false,
    "top": "12%",
    "left": "16%",
    "anim": "float-1 4.2s",
    "subs": [
      "Offline Desktop AI Assistant",
      "Zero Water Datacenter Footprint",
      "100% Privacy for Academic Data"
    ],
    "classification": "Early Processed",
    "nature": "Student Service",
    "daamType": "thru APS; Others",
    "date": "October 7, 2026 (Wednesday)",
    "budget": "₱0.00",
    "lead": "Director for Research & Development (Dir. R&D)",
    "collab": "Dir. Academics, Dir. Creatives, Dir. Documentations",
    "venue": "Desktop Application / Digital Distribution",
    "issue": "Intense academic workloads, paywalled computational tools, student privacy concerns, and severe environmental water cooling footprints associated with centralized cloud datacenter AI models.",
    "objective": "Provide a 100% offline, locally-run AI assistant and scientific calculation environment that uses zero datacenter water and preserves student academic privacy.",
    "metric": "300+ unique student downloads in Term 1; zero telemetry transmitted; 100% offline functionality verified.",
    "continuity": null,
    "description": "A standalone, 100% offline, locally-run AI assistant and computational desktop application engineered specifically for College of Science students. Built to mitigate the immense water-cooling footprints of external commercial AI datacenters, H2Zero.ai runs locally on student hardware with zero server dependency, zero internet requirement, and zero telemetry tracking. Includes built-in support for LaTeX mathematical typesetting, scientific literature parsing, offline prompt guidance, and course-tailored STEM study flashcard generation.",
    "phases": [
      {
        "name": "Phase 1: Local Packaging & Model Quantization",
        "date": "Sept 24–Oct 2, 2026",
        "lead": "Dir. R&D, ExA, ExB",
        "check": "Verified offline binary for Windows & macOS",
        "items": [
          "Package and benchmark quantized local LLM & LaTeX math parser",
          "Ensure zero telemetry, offline execution, and zero cloud API dependency",
          "Chief of Staff check-in: Verify zero-water local execution and binary stability"
        ]
      },
      {
        "name": "Phase 2: DAAM Pre-Act Clearance & Install Documentation",
        "date": "Sept 25–Oct 6, 2026",
        "lead": "Dir. Docs, Dir. Creatives",
        "check": "Approved APS package & P&M clear",
        "items": [
          "Dir. Docs: Submit Early Processing Letter + APS Form to DAAM",
          "Dir. Creatives: Produce clean installation guide carousel and visual launch kit",
          "Dir. Docs: Secure DAAM P&M clearance code for public launch broadcast"
        ]
      },
      {
        "name": "Phase 3: Platform Launch & College Distribution",
        "date": "Oct 7, 2026",
        "lead": "Dir. R&D, Chief Comms",
        "check": "Live direct download & user setup guide",
        "items": [
          "Deploy public download distribution via SCG Centralized Portal",
          "Dir. Promotions: Broadcast launch post across college channels and student groups",
          "Deliver quick-start setup video and prompt engineering reference sheet"
        ]
      },
      {
        "name": "Phase 4: Feedback Triage & Bug Mitigation",
        "date": "Oct 14–Nov 4, 2026",
        "lead": "Dir. R&D, ExA",
        "check": "Post-launch patch notes & triage report",
        "items": [
          "Monitor student bug reports, hardware compatibility, and feature suggestions",
          "Release v1.1 performance patch for lower-spec student laptops",
          "Compile user feedback and submit Post-Activity Compliance Report to DAAM"
        ]
      }
    ]
  },
  {
    "idx": 1,
    "num": "02",
    "id": "scg-p2",
    "title": "SCG Centralized Student Portal (Integrated 7-Module Platform)",
    "shortTitle": "SCG Student Portal",
    "type": "Yearlong · Free",
    "funded": false,
    "top": "8%",
    "left": "50%",
    "anim": "float-2 3.8s",
    "subs": [
      "7-Module Digital Platform",
      "Syllabus & Course Outline Vault",
      "FLOSS Directory & Grade Tools"
    ],
    "classification": "Yearlong",
    "nature": "Student Service",
    "daamType": "thru SLIFE; Website Launch",
    "date": "October 14, 2026 (Wednesday)",
    "budget": "₱0.00",
    "lead": "Director for Academics & Director for Student Services",
    "collab": "Dir. Finance (Ledger), Dir. Creatives (UI/UX), Dir. Documentations, President (Grievances)",
    "venue": "Online Web Portal (scg-portal.dlsu.edu.ph)",
    "issue": "Fragmented academic materials, lost links, and disjointed college portals causing academic friction and missed opportunities across COS.",
    "objective": "Centralize 7 core student services into one unified, ultra-responsive digital hub: (1) Syllabus Vault, (2) Scholarship Calculator, (3) Academic Pathing, (4) Centralized Grievances, (5) Financial Transparency Ledger, (6) Free Software/FLOSS Directory, and (7) Research Opportunity Board.",
    "metric": "800+ unique student visits in Term 1; 100% of syllabus outlines uploaded; zero server maintenance costs.",
    "continuity": null,
    "description": "The SCG Centralized Student Portal is a modular, client-side digital platform designed to unite all vital college resources into a single access point. Built without ongoing server costs, it features an interactive Syllabus Transparency Vault, a customized Scholarship Grade Calculator tailored for COS ID systems, an Academic Pathing flowchart for course retakes, a secure Centralized Grievance mediation channel, a real-time Financial Transparency Ledger, an open-source FLOSS software directory, and an active student Research Job Board.",
    "phases": [
      {
        "name": "Phase 1: 7-Module Architecture & Database Population",
        "date": "Sept 24–Oct 8, 2026",
        "lead": "Dir. Academics, Dir. SS, Creatives",
        "check": "Staging portal functional across all 7 modules",
        "items": [
          "Build and integrate 7 responsive service modules with zero server overhead",
          "Dir. Academics: Populate syllabus repository and scholarship criteria tables",
          "President check-in: Audit grievance reporting security and confidential routing"
        ]
      },
      {
        "name": "Phase 2: DAAM SLIFE Pre-Act Clearance & User Testing",
        "date": "Sept 25–Oct 12, 2026",
        "lead": "Dir. Docs, Dir. Promotions",
        "check": "Approved SLIFE clearance & mobile responsive QA",
        "items": [
          "Dir. Docs: Submit SLIFE Website Launch Pre-Activity package",
          "Conduct end-to-end user testing across mobile and desktop browsers",
          "Secure DAAM P&M promotional approval for portal launch campaign"
        ]
      },
      {
        "name": "Phase 3: Public Portal Deployment",
        "date": "Oct 14, 2026",
        "lead": "Dir. Academics, Dir. SS, Chief Comms",
        "check": "Portal live at scg-portal.dlsu.edu.ph",
        "items": [
          "Deploy production build and open public student access",
          "Dir. Promotions: Launch multi-platform video tour explaining all 7 modules",
          "Release interactive Grade Calculator and Academic Pathing flowchart tools"
        ]
      },
      {
        "name": "Phase 4: Mid-Term Resource Updates & Post-Act",
        "date": "Oct 21–Nov 18, 2026",
        "lead": "Dir. Docs, Dir. Academics",
        "check": "Mid-term update log & DAAM compliance report",
        "items": [
          "Dir. Finance: Publish real-time council budget transactions to Public Ledger",
          "Dir. Academics: Ingest mid-term study guides and exam preparation resources",
          "Dir. Docs: Submit formal Post-Activity report to DAAM"
        ]
      }
    ]
  },
  {
    "idx": 2,
    "num": "03",
    "id": "scg-p3",
    "title": "Women and Minorities in STEM",
    "shortTitle": "Women in STEM",
    "type": "Yearlong · Free",
    "funded": false,
    "top": "12%",
    "left": "84%",
    "anim": "float-3 5.1s",
    "subs": [
      "Representation Spotlight",
      "Interview Docu-Series",
      "COS Science Scholar Profiles"
    ],
    "classification": "Yearlong",
    "nature": "Issue Advocacy",
    "daamType": "thru APS; Media Coverage",
    "date": "October 21, 2026 (Ep. 1 Launch, Yearlong Ongoing)",
    "budget": "₱0.00",
    "lead": "Director for Promotions & Director for Advocacy",
    "collab": "Dir. Creatives, Chief Communications, Dir. Documentations",
    "venue": "Social Media Video Reels & Digital Web Archive",
    "issue": "Systematic underrepresentation and lack of media visibility for women, queer scholars, and marginalized scientists within science departments and research laboratories.",
    "objective": "Produce an inspiring multimedia spotlight and digital archive highlighting diverse science leaders, student researchers, and alumni.",
    "metric": "3 episodic video features in Term 1; 1,500+ student engagements; permanent digital archive.",
    "continuity": null,
    "description": "A dedicated multimedia representation and advocacy campaign celebrating the breakthroughs, research journeys, and personal triumphs of women, queer scholars, and underrepresented minorities in the College of Science. Through professionally produced 60-second video spotlights, in-depth feature articles, and an online research archive, this yearlong series actively breaks stereotypes and creates accessible role models for incoming and current science scholars.",
    "phases": [
      {
        "name": "Phase 1: Talent Outreach & Vetting",
        "date": "Sept 24–Oct 10, 2026",
        "lead": "Dir. Advocacy, Dir. Promotions",
        "check": "Confirmed feature list & signed consent releases",
        "items": [
          "Identify and reach out to female and minority student researchers and faculty",
          "Conduct pre-interviews and outline narrative focus for Episode 1",
          "Secure RA 10173 data privacy and media publication consent forms"
        ]
      },
      {
        "name": "Phase 2: Pre-Act Clearance & Production",
        "date": "Sept 25–Oct 16, 2026",
        "lead": "Dir. Promotions, Dir. Creatives",
        "check": "Approved P&M clearance & finalized video cut",
        "items": [
          "Dir. Docs: File APS Media Coverage Pre-Act form with DAAM",
          "Dir. Creatives: Film high-definition video interview and design branding kit",
          "Secure DAAM P&M publicity code for teaser and full feature releases"
        ]
      },
      {
        "name": "Phase 3: Episodic Broadcast (Episode 1)",
        "date": "Oct 21, 2026",
        "lead": "Dir. Promotions, Chief Comms",
        "check": "Episode 1 video live across socials & web archive",
        "items": [
          "Publish Episode 1 spotlight reel across official SCG channels",
          "Launch dedicated profile and research bibliography on SCG Portal archive",
          "Foster discussions and student reflections in comment channels"
        ]
      },
      {
        "name": "Phase 4: Archival & Term Continuation",
        "date": "Oct 28–Nov 20, 2026",
        "lead": "Dir. Advocacy, Dir. Docs",
        "check": "Portal feature page & pre-production for Ep. 2",
        "items": [
          "Collate audience reach, engagement metrics, and feedback",
          "Begin candidate scoping and scheduling for Episodes 2 & 3",
          "Dir. Docs: Submit DAAM compliance documentation"
        ]
      }
    ]
  },
  {
    "idx": 3,
    "num": "04",
    "id": "scg-p4",
    "title": "HomeCOStasis — COS Comprehensive Student Guide (Batch 126 Refresh)",
    "shortTitle": "HomeCOStasis (Batch 126)",
    "type": "Termlong Continuity · Free",
    "funded": false,
    "top": "40%",
    "left": "88%",
    "anim": "float-4 4.6s",
    "subs": [
      "Last Year SCG Initiative Refreshed",
      "COS Comprehensive Survival Guide",
      "Enrollment, Labs & Prof Advising"
    ],
    "classification": "Termlong Continuity",
    "nature": "Student Service",
    "daamType": "thru APS; Others",
    "date": "October 14, 2026 (Wednesday)",
    "budget": "₱0.00",
    "lead": "Director for Student Services",
    "collab": "Dir. Academics, Dir. Creatives, Dir. Documentations",
    "venue": "Centralized Digital Student Navigation Guide (Activity Code: G-SCG-25260011)",
    "issue": "Incoming Batch 126 frosh, shiftees, transferees, and irregular students experience severe disorientation regarding campus laboratory safety protocols, course prerequisite tracking, and enrollment procedures.",
    "objective": "Provide a unified, master navigation handbook and digital survival kit specifically refreshed and localized for Batch 126 and incoming science students.",
    "metric": "Minimum of 10 guide modules refreshed; 100% of Batch 126 blocks reached via block representatives and digital links.",
    "continuity": "Institutional Continuity: HomeCOStasis originates from last year's Science College Government initiative (AY 2025–2026, Activity Code: G-SCG-25260011). Under President Pauline Galias, this hallmark project is formally renewed, upgraded, and expanded to guarantee zero loss of institutional knowledge for Batch 126 and transferees.",
    "description": "HomeCOStasis is the foundational student navigation manual of the College of Science. Originally initiated in AY 2025–2026 (ARC: G-SCG-25260011), this initiative is systematically refreshed and modernized for AY 2026–2027. It features audited course flowchart prerequisite guides, laboratory attire and safety rules, department faculty contact directories, step-by-step enlistment and petition tutorials, campus study spot listings, and academic FAQ modules. Available via high-speed digital download, Google Drive repository, and integrated directly into the SCG Centralized Portal.",
    "phases": [
      {
        "name": "Phase 1: Content Audit & Institutional Review",
        "date": "Sept 24–Oct 7, 2026",
        "lead": "Dir. Student Services, Dir. Academics",
        "check": "Updated AY 2026–2027 survival guide manuscript",
        "items": [
          "Audit AY 2025–2026 materials (ARC: G-SCG-25260011) for policy changes and faculty updates",
          "Interface with College Dean's Office and department chairs to verify prerequisite flowcharts",
          "Chief of Staff check-in: Verify laboratory safety guidelines and grading rules accuracy"
        ]
      },
      {
        "name": "Phase 2: Visual Styling & Mobile Digital Layout",
        "date": "Sept 25–Oct 11, 2026",
        "lead": "Dir. Creatives, Dir. Docs",
        "check": "Formatted PDF manual & interactive web module",
        "items": [
          "Format 40-page comprehensive handbook into sleek, mobile-friendly PDF",
          "Ingest interactive guide into the SCG Centralized Portal",
          "Dir. Docs: File APS Pre-Activity and secure DAAM P&M publicity code"
        ]
      },
      {
        "name": "Phase 3: Rollout & Frosh Block Distribution",
        "date": "Oct 14, 2026",
        "lead": "Dir. Student Services, Batch 126 Reps",
        "check": "Guide distributed to 100% of COS frosh blocks",
        "items": [
          "Broadcast digital handbook link via Telegram, Facebook, and Google Drive",
          "Direct dissemination to all Batch 126 block chats and frosh orientations",
          "Host live online Q&A thread addressing first-week student inquiries"
        ]
      },
      {
        "name": "Phase 4: Feedback & Midterm Advisory Supplement",
        "date": "Oct 21–Nov 14, 2026",
        "lead": "Dir. Student Services, Dir. Docs",
        "check": "Midterm FAQ release & DAAM Post-Act",
        "items": [
          "Monitor incoming student inquiries and publish a Midterm Enlistment Addendum",
          "Collate download statistics and student feedback survey results",
          "Submit completed Post-Activity compliance report to DAAM"
        ]
      }
    ]
  },
  {
    "idx": 4,
    "num": "05",
    "id": "scg-p5",
    "title": "COS Bulletin Board — Real-Time Telegram Broadcast",
    "shortTitle": "COS Bulletin Board",
    "type": "Termlong Continuity · Free",
    "funded": false,
    "top": "74%",
    "left": "84%",
    "anim": "float-5 4.9s",
    "subs": [
      "Real-Time Telegram Broadcast",
      "Official Announcement Dispatch",
      "Fast Alert Notifications"
    ],
    "classification": "Termlong Continuity",
    "nature": "Student Service",
    "daamType": "thru APS; Others",
    "date": "October 14, 2026 (Wednesday)",
    "budget": "₱0.00",
    "lead": "Director for Student Services & Director for Documentations",
    "collab": "Chief Communications, Executive Secretary",
    "venue": "Telegram Broadcast Channel & SCG Social Media (Activity Code: G-SCG-25260016)",
    "issue": "Critical academic announcements, room reassignments, weather suspensions, and enlistment deadlines are buried by social media algorithms, leading to missed student deadlines.",
    "objective": "Provide a real-time, zero-noise, algorithm-free Telegram broadcast channel delivering instant verified advisories to College of Science students.",
    "metric": "500+ verified COS subscribers in Term 1; 100% of urgent advisories broadcast within 20 minutes of official university release.",
    "continuity": "Institutional Continuity: Originally established in AY 2025–2026 (ARC: G-SCG-25260016) and continued under President Pauline Galias. Upgraded with synchronized web notification banners on the SCG Centralized Portal.",
    "description": "A direct, chronological, and noise-free Telegram broadcast channel alongside website alerts. Eliminates social media feed suppression so that students never miss urgent university notices, enlistment advisories, shifting deadlines, or emergency suspension alerts. All announcements are tagged with clear categories (#Academics, #Enrollment, #Suspensions, #Events) and verified directly with official university offices before dispatch.",
    "phases": [
      {
        "name": "Phase 1: Telegram Channel Architecture & Bot Integration",
        "date": "Sept 24–Oct 8, 2026",
        "lead": "Dir. SS, Dir. Docs",
        "check": "Telegram channel configured with categorization tags",
        "items": [
          "Establish hashtag categorization structure (#Enrollment, #Suspensions, #Academics, #Events)",
          "Configure automated cross-broadcast relays and emergency push notifications",
          "Establish verification protocol with USG and Dean's Office communication liaisons"
        ]
      },
      {
        "name": "Phase 2: DAAM Continuity & Promotion Clearance",
        "date": "Sept 25–Oct 11, 2026",
        "lead": "Dir. Docs, Dir. Promotions",
        "check": "Approved APS continuity permit & P&M clear",
        "items": [
          "File DAAM APS form under continuing student services",
          "Dir. Creatives: Produce high-visibility joining campaign ('One Channel. All Alerts.')",
          "Secure DAAM P&M approval code"
        ]
      },
      {
        "name": "Phase 3: Launch Broadcast & College-Wide Onboarding",
        "date": "Oct 14, 2026",
        "lead": "Dir. SS, Chief Comms",
        "check": "Channel live with 300+ initial member onboarding",
        "items": [
          "Publish invite link across all batch groups, block chats, and student org pages",
          "Release first official weekly digest and college operational bulletin",
          "Synchronize real-time feed with SCG Centralized Portal dashboard"
        ]
      },
      {
        "name": "Phase 4: Operational Cadence & Term Archival",
        "date": "Oct 15–Nov 28, 2026",
        "lead": "Dir. Docs, Dir. SS",
        "check": "Daily dispatch log & DAAM post-act",
        "items": [
          "Maintain active dispatch protocol with daily verification checks",
          "Collate subscriber retention, engagement metrics, and alert speed benchmarks",
          "File DAAM Post-Activity Compliance Report at term conclusion"
        ]
      }
    ]
  },
  {
    "idx": 5,
    "num": "06",
    "id": "scg-p6",
    "title": "Taft Food Crawl: COS Student Food & Local Business Guide",
    "shortTitle": "Taft Food Crawl",
    "type": "Multiple Dates · Free",
    "funded": false,
    "top": "84%",
    "left": "50%",
    "anim": "float-6 3.5s",
    "subs": [
      "Batch 126 Collaboration",
      "Budget Meals Under ₱150",
      "Study Cafes & Downloadable Map"
    ],
    "classification": "Multiple Dates",
    "nature": "Student Service / Promotional",
    "daamType": "thru APS; Media Coverage",
    "date": "October 19, 20, 21, 2026 (Monday–Wednesday)",
    "budget": "₱0.00",
    "lead": "Director for Promotions & Director for EXT/INT Linkages",
    "collab": "Batch 126 Government, Dir. Creatives, Dir. Documentations",
    "venue": "Local Taft Avenue Merchants & Digital Media Channels",
    "issue": "Frosh students, scholars, and irregulars experience budget constraints and unfamiliarity with safe, affordable food spots, quiet study cafes, and reliable Wi-Fi locations around the Manila campus.",
    "objective": "Produce a high-engagement 3-episode video series and downloadable digital Taft Food Map curated specifically for student budgets in collaboration with Batch 126.",
    "metric": "3 released video episodes; 2,000+ views; 500+ digital food map downloads; zero student fee expense.",
    "continuity": null,
    "description": "A collaborative digital lifestyle and student survival series produced in close partnership with the Batch 126 Government. Over three consecutive days, this initiative reviews budget-friendly student meals (under ₱150), quiet cafes with strong Wi-Fi and power outlets for study sessions, and hidden food gems around Taft Avenue. Paired with a downloadable, high-resolution visual Taft Food Map Infographic available on the SCG Portal.",
    "phases": [
      {
        "name": "Phase 1: Merchant Outreach & Scripting",
        "date": "Sept 24–Oct 12, 2026",
        "lead": "Dir. Promotions, Dir. EXT/INT, Batch 126 Reps",
        "check": "Confirmed merchant list via DM/verbal — NO MOA needed",
        "items": [
          "Finalize 3-episode route: Ep. 1 Budget Meals (<₱150), Ep. 2 Top Study Cafes, Ep. 3 Hidden Gems",
          "Reach out to 6–8 small food vendors and student cafes for on-site filming access",
          "Script short, engaging video reels featuring Batch 126 frosh co-hosts"
        ]
      },
      {
        "name": "Phase 2: DAAM Pre-Act & Video Filming",
        "date": "Sept 25–Oct 14, 2026",
        "lead": "Dir. Promotions, Dir. Creatives, Dir. Docs",
        "check": "Approved APS package & P&M video/infographic clearances",
        "items": [
          "Submit APS Media Coverage package and PPR Table 1 to DAAM",
          "Shoot on-site footage around Taft Avenue and University Mall",
          "Dir. Creatives: Edit three 60-second video reels and design printable/downloadable Taft Food Map PDF"
        ]
      },
      {
        "name": "Phase 3: Multi-Day Episodic Rollout",
        "date": "Oct 19–21, 2026",
        "lead": "Dir. Promotions, Chief Comms, ExA, ExB",
        "check": "3 Video Reels published + Map Infographic live",
        "items": [
          "Mon, Oct 19: Release Episode 1 (Best Budget Meals under ₱150)",
          "Tue, Oct 20: Release Episode 2 (Top Study-Friendly Cafes with Wi-Fi & Outlets)",
          "Wed, Oct 21: Release Episode 3 (Hidden Gems) + Downloadable Taft Food Map"
        ]
      },
      {
        "name": "Phase 4: Impact Collation & Post-Act",
        "date": "Oct 22–Nov 4, 2026",
        "lead": "Dir. EXT/INT, Dir. Docs",
        "check": "Engagement metrics report & DAAM Post-Act filed",
        "items": [
          "Collate audience metrics (reach, saves, food map download count)",
          "Gather merchant feedback and student comments",
          "Submit DAAM Post-Activity Compliance Report"
        ]
      }
    ]
  },
  {
    "idx": 6,
    "num": "07",
    "id": "scg-p7",
    "title": "Scientific Terminologies Spelling Bee: Biology Edition",
    "shortTitle": "Scientific Spelling Bee",
    "type": "Single Date · Free",
    "funded": false,
    "top": "74%",
    "left": "16%",
    "anim": "float-7 5.5s",
    "subs": [
      "Biology Terminology Tournament",
      "Inter-Batch Competition",
      "Certificates & Champion Token"
    ],
    "classification": "Single Date",
    "nature": "Academic Competitions",
    "daamType": "thru APS; Others",
    "date": "October 28, 2026 (Wednesday, 2:00 PM – 5:00 PM)",
    "budget": "₱0.00",
    "lead": "Director for Academics & Director for Promotions",
    "collab": "Dir. Logistics, Dir. Creatives, Dir. Documentations, Biology Faculty",
    "venue": "Teresa Yuchengco Hall Y508",
    "issue": "Midterm academic fatigue, intense memorization stress, and lack of interactive, community-building academic events that reinforce scientific rigor.",
    "objective": "Host a lively, high-energy academic competition testing complex biological nomenclature, medical terminology, and evolutionary taxonomy in a supportive environment.",
    "metric": "30+ student competitors; 50+ spectators; certificates awarded; zero registration fees.",
    "continuity": null,
    "description": "A competitive yet highly supportive academic spelling bee specifically centered on advanced biological terminology, physiological processes, cellular anatomy, and taxonomy. Open to all College of Science batches, this tournament promotes mastery of foundational scientific vocabulary while fostering inter-batch camaraderie prior to midterm examinations. Winners receive formal certificates of academic distinction and token recognition.",
    "phases": [
      {
        "name": "Phase 1: Venue Booking & Academic Mechanics",
        "date": "Sept 24–Oct 9, 2026",
        "lead": "Dir. Academics, Dir. Logistics",
        "check": "RRS Room Reservation & vetted word bank",
        "items": [
          "Reserve Teresa Yuchengco Hall Y508 via DLSU Room Reservation System (RRS)",
          "Curate comprehensive 3-tier word bank (Easy, Moderate, Hard) vetted by Biology faculty",
          "Establish competition rulebook, buzzer guidelines, and tie-breaker mechanics"
        ]
      },
      {
        "name": "Phase 2: DAAM Pre-Act Clearance & Registration",
        "date": "Sept 25–Oct 21, 2026",
        "lead": "Dir. Docs, Dir. Creatives, Dir. Academics",
        "check": "Approved APS permit & registration roster of 30+ students",
        "items": [
          "Submit APS Pre-Activity form and Activity Project Proposal to DAAM",
          "Dir. Creatives: Release promotional pubmat series and rule explainer",
          "Open online participant registration and confirm event judges"
        ]
      },
      {
        "name": "Phase 3: Competition Execution",
        "date": "Oct 28, 2026",
        "lead": "Dir. Academics, Dir. Logistics, ExA, ExB",
        "check": "Live event successfully conducted @ Y508",
        "items": [
          "Coordinate stage setup, audio-visual equipment, and live buzzer system in Y508",
          "Facilitate Preliminary, Semifinal, and Championship rounds",
          "Award certificates of recognition, academic commendations, and championship token"
        ]
      },
      {
        "name": "Phase 4: Evaluation & Post-Act",
        "date": "Oct 29–Nov 11, 2026",
        "lead": "Dir. Docs, Dir. Academics",
        "check": "Digital AET collated & DAAM Post-Act approved",
        "items": [
          "Administer digital Activity Evaluation Tool (AET) to participants and spectators",
          "Publish official winner announcement pubmat across SCG social channels",
          "Dir. Docs: Submit complete Post-Activity Report to DAAM"
        ]
      }
    ]
  },
  {
    "idx": 7,
    "num": "08",
    "id": "scg-p8",
    "title": "SCG General Assembly & Officer Workshop Training",
    "shortTitle": "SCG General Assembly",
    "type": "Single Date · Free",
    "funded": false,
    "top": "40%",
    "left": "12%",
    "anim": "float-8 4.3s",
    "subs": [
      "Internal Governance Alignment",
      "USG Manual & DAAM Workflows",
      "Leadership Development"
    ],
    "classification": "Single Date",
    "nature": "Organizational Development",
    "daamType": "thru APS; Others",
    "date": "October 21, 2026 (Wednesday, 1:00 PM – 5:00 PM)",
    "budget": "₱0.00",
    "lead": "Executive Secretary & Director for Logistics",
    "collab": "President Pauline Galias, Chief of Staff, Dir. Documentations, Dir. Finance",
    "venue": "Teresa Yuchengco Hall Y508",
    "issue": "Governance friction caused by lack of familiarization with USG DAAM compliance, OTREAS financial manual rules, and inter-committee coordination workflows among newly appointed officers.",
    "objective": "Convene all executive board members, committee directors, and executive associates for an intensive operational alignment and capacity-building workshop.",
    "metric": "100% officer attendance across executive committees; 100% passing rate on internal DAAM workflow assessments.",
    "continuity": null,
    "description": "A comprehensive general assembly and operational leadership workshop uniting the full roster of Science College Government officers, executive associates, and committee directors. The session delivers intensive training on USG DAAM documentation standards, OTREAS financial manual compliance, PR/pubmat branding pipelines, and confidential student grievance mediation. Designed to establish unified teamwork and bulletproof operational discipline.",
    "phases": [
      {
        "name": "Phase 1: Venue Booking & Agenda Formulation",
        "date": "Sept 24–Oct 7, 2026",
        "lead": "Executive Secretary, Dir. Logistics",
        "check": "Confirmed Y508 booking & finalized master agenda",
        "items": [
          "Reserve Teresa Yuchengco Hall Y508 via RRS",
          "Formulate workshop modules: DAAM Pre-Act/Post-Act routing, OTREAS liquidation, and media standards",
          "Issue formal attendance notices to all elected and appointed SCG officers"
        ]
      },
      {
        "name": "Phase 2: DAAM Pre-Act Clearance & Training Kits",
        "date": "Sept 25–Oct 14, 2026",
        "lead": "Dir. Docs, Executive Secretary",
        "check": "Approved APS package & digital training handbook",
        "items": [
          "Submit APS Organizational Development Pre-Act package to DAAM",
          "Compile digital SCG Officer Handbook and interactive compliance templates",
          "Chief of Staff check-in: Audit presentation decks and inter-committee breakout workflows"
        ]
      },
      {
        "name": "Phase 3: Assembly Execution & Simulation Labs",
        "date": "Oct 21, 2026",
        "lead": "President, Chief of Staff, Exec Sec",
        "check": "4-hour workshop executed with full council quorum",
        "items": [
          "Conduct presidential address, operational state of the college, and committee targets",
          "Run hands-on paperwork simulation: Drafting A-Forms, PPR tables, and liquidation workflows",
          "Facilitate breakout planning sessions for Term 1 project committees"
        ]
      },
      {
        "name": "Phase 4: Minutes Documentation & Post-Act",
        "date": "Oct 22–Oct 28, 2026",
        "lead": "Executive Secretary, Dir. Docs",
        "check": "Official assembly minutes & DAAM Post-Act filed",
        "items": [
          "Finalize comprehensive meeting minutes and resolution registry",
          "Collate officer evaluation feedback and action commitment sheets",
          "Dir. Docs: Submit complete Post-Activity Compliance Report to DAAM"
        ]
      }
    ]
  },
  {
    "idx": 8,
    "num": "09",
    "id": "scg-p9",
    "title": "LaTeX Essentials: Scientific Typesetting Seminar",
    "shortTitle": "LaTeX Essentials Seminar",
    "type": "Single Date · Free",
    "funded": false,
    "top": "26%",
    "left": "33%",
    "anim": "float-1 3.9s",
    "subs": [
      "Scientific Typesetting Workshop",
      "Math Circle & PhySoc Collab",
      "Starter Templates & Live Compiling"
    ],
    "classification": "Single Date",
    "nature": "Educational / Academic Seminar",
    "daamType": "thru APS; Others",
    "date": "November 4, 2026 (Wednesday, 2:00 PM – 5:00 PM)",
    "budget": "₱0.00",
    "lead": "Director for Academics",
    "collab": "Physics Society (PhySoc), Mathematics Circle (Math Circle), Dir. Logistics, Dir. Creatives, Dir. Docs",
    "venue": "Br. Andrew Gonzalez Hall A903 (E-Classroom)",
    "issue": "Science students face severe difficulty formatting complex mathematical equations, scientific notations, chemical structures, and thesis manuscripts in standard word processors.",
    "objective": "Equip 40+ science students with foundational to intermediate LaTeX typesetting proficiency through hands-on compilation in Overleaf and TeX Live.",
    "metric": "40+ student participants; free starter template bundle distributed; 100% successful document compilation rate.",
    "continuity": null,
    "description": "A hands-on, peer-led scientific typesetting seminar tailored for College of Science students, particularly Mathematics, Physics, Chemistry, and Biology majors preparing for research thesis submissions. Held in a campus computer laboratory with peer facilitators from the Mathematics Circle and Physics Society, participants learn equation syntax, matrix formatting, chemical formulas, Overleaf collaboration, and BibTeX citation management.",
    "phases": [
      {
        "name": "Phase 1: Venue Booking & Speaker Alignment",
        "date": "Sept 24–Oct 9, 2026",
        "lead": "Dir. Academics, Dir. Logistics",
        "check": "RRS A903 booking & speaker credentials form",
        "items": [
          "Reserve Br. Andrew Hall A903 (E-Classroom) via RRS",
          "Coordinate with Math Circle and PhySoc peer instructors; draft DAAM speaker credential forms",
          "Develop hands-on LaTeX starter template bundle (Mathematics, Thesis, Lab Report)"
        ]
      },
      {
        "name": "Phase 2: DAAM Pre-Act Clearance & Promo",
        "date": "Sept 25–Oct 21, 2026",
        "lead": "Dir. Docs, Dir. Creatives, Dir. Promotions",
        "check": "Approved APS clearance & room permit",
        "items": [
          "Dir. Docs: Submit APS package (A-Form, PPR Tables 1 & 2, Speaker Credentials) to DAAM",
          "Dir. Creatives: Design promotional pubmats emphasizing 100% FREE admission",
          "Open online registration desk (capped at 45 seats for computer lab capacity)"
        ]
      },
      {
        "name": "Phase 3: Hands-On Seminar Execution",
        "date": "Nov 4, 2026",
        "lead": "Dir. Academics, Dir. Logistics, ExA, ExB",
        "check": "Live hands-on masterclass conducted @ A903",
        "items": [
          "Coordinate A903 projector, terminal workstations, and Overleaf environment check",
          "Facilitate 3-hour hands-on typesetting workshop: Equation syntax, tables, BibTeX citations",
          "Record high-definition video of seminar for permanent archival on SCG Portal"
        ]
      },
      {
        "name": "Phase 4: Video Archival & Post-Act",
        "date": "Nov 5–Nov 11, 2026",
        "lead": "Dir. Docs, Dir. Academics",
        "check": "Seminar archive live on Portal & Post-Act approved",
        "items": [
          "Administer digital AET evaluation survey before attendees exit",
          "Upload recorded masterclass and templates to SCG Centralized Portal Resource Hub",
          "Submit completed Post-Activity Compliance Report to DAAM"
        ]
      }
    ]
  },
  {
    "idx": 9,
    "num": "10",
    "id": "scg-p10",
    "title": "Shanghay Laya: Sa Gitna ng Lahat Pt. 2 (Platform Launch)",
    "shortTitle": "Shanghay Laya",
    "type": "Single Date · Free",
    "funded": false,
    "top": "26%",
    "left": "67%",
    "anim": "float-3 4.5s",
    "subs": [
      "Term 1 Culminating Activity",
      "LGBTQIA+ Healthcare Directory",
      "Affirming Resources & Advocacy"
    ],
    "classification": "Single Date (Term 1 Culmination)",
    "nature": "Issue Advocacy",
    "daamType": "thru SLIFE; Website Launch",
    "date": "November 7, 2026 (Saturday) — FINAL ACTIVITY OF TERM 1",
    "budget": "₱0.00",
    "lead": "Director for Advocacy & Director for Promotions",
    "collab": "Chief of Staff, Dir. Creatives, Dir. Documentations",
    "venue": "Digital Educational Platform Launch (scg-portal.dlsu.edu.ph/laya)",
    "issue": "Queer and transgender science students navigate unscientific gender stereotypes, lack of verified LGBTQIA+-affirming healthcare information, and institutional isolation in STEM spaces.",
    "objective": "Launch an affirming, evidence-based digital resource portal featuring vetted queer health directories, science-backed literature on gender diversity, and peer support networks.",
    "metric": "Culminating initiative of Term 1; 1,000+ views; 100% verified clinic directory listings; zero council expense.",
    "continuity": null,
    "description": "Official public launch of the specialized queer health and identity platform as the culminating activity of Term 1. Featuring vetted directories of LGBTQIA+-affirming endocrinologists and mental health professionals, scientific research debunking biological essentialism, and historical contexts of gender diversity, Shanghay Laya creates an uncompromisingly safe, evidence-grounded sanctuary for queer science students.",
    "phases": [
      {
        "name": "Phase 1: Content Curation & Legal Review",
        "date": "Sept 24–Oct 12, 2026",
        "lead": "Dir. Advocacy, Chief of Staff, President",
        "check": "Signed Legal Disclaimer Review Memo",
        "items": [
          "Compile vetted directory of LGBTQIA+-affirming endocrinologists and mental health practitioners",
          "Curate scientific studies on gender diversity and biological variation",
          "Draft and endorse mandatory Legal Disclaimer Memo in compliance with university policy"
        ]
      },
      {
        "name": "Phase 2: Web Sub-Portal Build & SLIFE Submission",
        "date": "Sept 25–Oct 26, 2026",
        "lead": "Dir. Creatives, Dir. Docs, Dir. Promotions",
        "check": "Approved SLIFE Form & P&M clearances",
        "items": [
          "Dir. Docs: Submit SLIFE Integrated Form + PPR Table 1 + Legal Disclaimer",
          "Build dedicated, responsive educational sub-portal on the SCG Centralized Portal",
          "Clear launch trailer video and educational infographic carousel through DAAM P&M"
        ]
      },
      {
        "name": "Phase 3: Public Platform Launch — Final Activity",
        "date": "Nov 7, 2026",
        "lead": "Dir. Advocacy, Dir. Promotions, Chief Comms",
        "check": "Live platform traffic & public deployment",
        "items": [
          "Deploy public platform link across college channels as the Term 1 culminating release",
          "Release launch video reel explaining platform mission and evidence-based science",
          "Distribute digital mental health and support resource cards to student networks"
        ]
      },
      {
        "name": "Phase 4: Feedback & Post-Act Filing",
        "date": "Nov 8–Nov 18, 2026",
        "lead": "Dir. Docs, Dir. Advocacy, ExA",
        "check": "Approved Post-Act filed with DAAM",
        "items": [
          "Monitor anonymous feedback on resource accuracy, directory links, and safety",
          "Collate platform engagement traffic and digital access logs",
          "File comprehensive DAAM Post-Activity Compliance Report, closing out Term 1 operations"
        ]
      }
    ]
  }
];

    // ---- OVERVIEW NAV ITEM ----
    sideNavHtml += `
      <div class="nav-item animate-in" onclick="document.getElementById('project-constellation').scrollIntoView({behavior:'smooth',block:'start'})" data-index="overview" style="opacity:0.7; animation-delay: 0.1s;">
        <div class="nav-dot" style="background:rgba(167,139,250,0.5);"></div>
        <div class="nav-label" style="font-style:italic;">Overview</div>
      </div>
    `;

    SCG_TERM1_PROJECTS.forEach((p, index) => {
      sideNavHtml += `
        <div class="nav-item animate-in" onclick="scrollToImmersiveCard(${index})" data-index="${index}" style="animation-delay: ${0.15 + (index * 0.04)}s;">
          <div class="nav-dot"></div>
          <div class="nav-label">${p.shortTitle}</div>
        </div>
      `;
    });

    const generalDirection = `Every single Term 1 project under the Science College Government operates with zero pesos in council fee charges (₱0.00 student budget impact). We prioritize direct, tangible student utility: high-performance academic tooling, transparent grievance mediation, institutional continuity from previous administrations, and verified welfare initiatives. This is a disciplined, step-by-step operational governance model with strict DAAM clearance gates and measurable student outcomes.`;

    html += `
      <div class="project-constellation" id="project-constellation">
        <div class="animate-in" style="position: absolute; bottom: -50px; left: 0; width: 100%; text-align: center; z-index: 10; animation-delay: 1s; pointer-events: none;">
          <div class="scroll-helper-text" style="color: #ffffff; opacity: 0.7; font-size: 0.9rem; font-weight: 500; letter-spacing: 0.5px; animation: breathe-glow-text 4s ease-in-out infinite;">
            Scroll down for each project, or click a project to go directly there
          </div>
        </div>

        <div class="constellation-core">
          <div class="core-label-wrapper">
            <div class="core-label">SCG Operations<br>Direction</div>
            <div class="core-hint">Hover to read</div>
          </div>
          <div class="core-content-expanded">
            <p>${generalDirection}</p>
            <span class="core-popup-quote">I will spend nothing on what doesn't matter, and everything I have on the people who do.</span>
          </div>
        </div>

        ${SCG_TERM1_PROJECTS.map((n, i) => `
          <div class="animate-in" style="position: absolute; top:${n.top}; left:${n.left}; animation-delay: ${0.2 + (i * 0.08)}s; z-index: 2;">
            <div class="constellation-node" id="cnode-${n.idx}"
                 style="position: relative; top: 0; left: 0; animation:${n.anim} ease-in-out infinite alternate;"
                 onclick="scrollToImmersiveCard(${n.idx})">
              <span class="node-number">${n.num}</span>
              <div class="node-title">${n.shortTitle}</div>
              <div class="node-type">${n.type}</div>
              <div class="node-arrow">↗</div>
              <div class="node-subs">
                <ul class="node-subs-list">
                  ${n.subs.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // ── Mobile swipe strip (shown on mobile-ui) ──
    html += `
      <div class="mobile-project-section">
        <span class="mobile-strip-label" style="text-align:center;">Swipe a project, tap the card to go there.</span>
        <div class="mobile-project-strip">
          <div class="mobile-project-card mobile-gd-card"
               onclick="document.getElementById('mobile-gd-section')?.scrollIntoView({behavior:'smooth',block:'start'})"
               tabindex="0" role="button" aria-label="Governance Direction">
            <span class="mpn" style="font-size:10px;">DIRECTION</span>
            <div class="mpt">Operations Hub</div>
            <div class="mptype">AY 2026–2027</div>
          </div>
          ${SCG_TERM1_PROJECTS.map(n => `
            <div class="mobile-project-card"
                 onclick="scrollToImmersiveCard(${n.idx})"
                 tabindex="0" role="button" aria-label="Go to project ${n.num}">
              <span class="mpn">${n.num}</span>
              <div class="mpt">${n.shortTitle}</div>
              <div class="mptype">${n.type}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // ── Individual Project Cards ──
    SCG_TERM1_PROJECTS.forEach((p, index) => {
      html += `
        <div class="immersive-card-wrapper" id="immersive-card-${index}" data-index="${index}">
          <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay}s">
            <span style="color: #d8b4fe; font-weight: 700; text-shadow: 0 0 12px rgba(216, 180, 254, 0.6);">Project ${p.num}</span> &mdash; <span style="color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.3);">${p.shortTitle}</span>
          </h2>
      `;
      delay += 0.08;

      html += `
          <div class="immersive-glass-card animate-in" style="animation-delay: ${delay}s">
            <h3 style="font-size: 1.35rem; font-weight: 700; color: #fff; margin-top: 0; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.18); padding-bottom: 0.5rem; letter-spacing: 0.01em;">
              ${p.title}
            </h3>

            <ul style="list-style: none; padding-left: 0; margin: 0 0 1.25rem 0; font-size: 0.92rem; line-height: 1.8; color: rgba(255,255,255,0.88);">
              <li><strong style="color: #fff; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.45);">Classification & Nature:</strong> ${p.classification} &bull; ${p.nature} (${p.daamType})</li>
              <li><strong style="color: #fff; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.45);">Budget:</strong> <span style="color: #fff; font-weight: 600; text-shadow: 0 0 6px rgba(255,255,255,0.3);">${p.budget}</span></li>
              <li><strong style="color: #fff; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.45);">Target Date:</strong> <span style="color: #d8b4fe; font-weight: 600; text-shadow: 0 0 8px rgba(216, 180, 254, 0.45);">${p.date}</span></li>
              <li><strong style="color: #fff; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.45);">Lead Committee:</strong> ${p.lead}</li>
              <li><strong style="color: #fff; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.45);">Collaborators & Partners:</strong> ${p.collab}</li>
              <li><strong style="color: #fff; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.45);">Venue / Platform:</strong> ${p.venue}</li>
            </ul>

            ${p.continuity ? `
              <div style="margin-bottom: 1.25rem; padding-left: 1rem; border-left: 2px solid #c4b5fd;">
                <p style="margin: 0; font-size: 0.92rem; line-height: 1.7; color: rgba(255,255,255,0.92);">
                  <strong style="color: #d8b4fe; font-weight: 700; text-shadow: 0 0 8px rgba(216, 180, 254, 0.5);">Institutional Continuity:</strong> ${p.continuity}
                </p>
              </div>
            ` : ''}

            <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.35); margin-top: 1.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 0.35rem;">
              Project Description
            </h4>
            <p style="font-size: 0.93rem; line-height: 1.75; color: rgba(255,255,255,0.88); margin-bottom: 1.5rem;">
              ${p.description}
            </p>

            <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.35); margin-top: 1.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 0.35rem;">
              Objectives & Impact Targets
            </h4>
            <ul style="padding-left: 1.4rem; margin: 0 0 1.5rem 0; font-size: 0.92rem; line-height: 1.8; color: rgba(255,255,255,0.88);">
              <li><strong style="color: #fff; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.45);">Issue Addressed:</strong> ${p.issue}</li>
              <li><strong style="color: #fff; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.45);">Core Objective:</strong> ${p.objective}</li>
              <li><strong style="color: #fff; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.45);">Target Metric:</strong> <span style="color: #fff; font-weight: 600; text-shadow: 0 0 6px rgba(255,255,255,0.3);">${p.metric}</span></li>
            </ul>

            <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.35); margin-top: 1.5rem; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 0.35rem;">
              Step-by-Step Deliverables & Timeline (CPD Tracker)
            </h4>
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              ${p.phases.map((ph, phIdx) => `
                <div style="padding-left: 0.85rem; border-left: 2px solid rgba(216, 180, 254, 0.45);">
                  <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 0.35rem;">
                    <span style="font-weight: 700; font-size: 0.96rem; color: #fff; text-shadow: 0 0 6px rgba(255,255,255,0.3);">${ph.name}</span>
                    <span style="font-size: 0.82rem; font-family: 'JetBrains Mono', monospace; color: #d8b4fe; text-shadow: 0 0 8px rgba(216, 180, 254, 0.4);">${ph.date} &bull; ${ph.lead}</span>
                  </div>
                  <ul style="padding-left: 1.25rem; margin: 0.35rem 0; font-size: 0.9rem; line-height: 1.7; color: rgba(255,255,255,0.84);">
                    ${ph.items.map(it => `<li>${it}</li>`).join('')}
                  </ul>
                  <div style="font-size: 0.82rem; color: rgba(255,255,255,0.7); margin-top: 0.25rem;">
                    <strong style="color: #fff; font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.45);">Verification Gate:</strong> ${ph.check}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      delay += 0.08;
    });

    // ── Mobile-only: Governance Direction section at the bottom ──
    html += `
      <div id="mobile-gd-section" class="mobile-gd-bottom animate-in" style="animation-delay:0.2s">
        <span class="mobile-strip-label" style="margin-bottom: 12px; display: block;">Governance Direction & Finance Principle</span>
        <div class="immersive-glass-card" style="margin: 0;">
          <p style="font-size:14px; line-height:1.8; color:rgba(255,255,255,0.92);">${generalDirection}</p>
          <p style="font-size:13px; font-style:italic; color:#d8b4fe; margin-top:16px; border-left:3px solid #a78bfa; padding-left:12px;">
            I will spend nothing on what doesn&rsquo;t matter, and everything I have on the people who do.
          </p>
        </div>
      </div>
    `;
  } else if (target === 'preacts') {
    Object.values(data.preActs).forEach((p, index) => {
      sideNavHtml += `
        <div class="nav-item" onclick="scrollToImmersiveCard(${index})" data-index="${index}">
          <div class="nav-dot"></div>
          <div class="nav-label">${p.name}</div>
        </div>
      `;
      html += `
        <div class="immersive-card-wrapper" id="immersive-card-${index}" data-index="${index}">
          <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay}s">
            ${p.name} - Pre-Acts
          </h2>
      `;
      delay += 0.1;
      p.files.forEach(f => {
        html += `
            <div class="immersive-glass-card animate-in" style="animation-delay: ${delay}s">
              <h4 style="margin-top: 0; color: var(--primary);">${f.filename}</h4>
              <div class="editable-block markdown-body" style="color: inherit;" data-file-path="${p.name.replace(/ /g, '_')}/02_PreActs/${f.filename}">
                ${marked.parse(f.content)}
              </div>
            </div>
        `;
        delay += 0.1;
      });
      html += `</div>`;
    });
  } else if (target === 'global-strategy') {
    sideNavHtml += `
      <div class="nav-item" onclick="scrollToImmersiveCard(0)" data-index="0">
        <div class="nav-dot"></div>
        <div class="nav-label">SCG Structure</div>
      </div>
    `;

    html += `
      <div class="immersive-card-wrapper" id="immersive-card-0" data-index="0">
        <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay}s">
          Internal SCG Structure
        </h2>
        <div class="immersive-glass-card animate-in" style="animation-delay: ${delay + 0.1}s">
          <p style="opacity: 0.8; margin-bottom: 2rem;">Click on any role in the interactive tree to view specific responsibilities and projects.</p>
          <div class="org-layout" id="org-layout-container">
            <div class="org-tree-container">
              <div class="org-presidential-cluster">
                <div class="org-node president" onclick="showOrgDetails('president')">President (Pauline)</div>
                <div class="org-secretary-wrapper">
                  <div class="org-sec-connector"></div>
                  <div class="org-node secretary" onclick="showOrgDetails('secretary')">Secretary</div>
                </div>
              </div>
              
              <div class="org-branches">
                
                <div class="org-branch">
                  <div class="org-node chief" onclick="showOrgDetails('chief-staff')">Chief of Staff</div>
                  <div class="org-directors">
                    <div class="org-node sm" onclick="showOrgDetails('dir-acad')">Dir. Academics</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-rnd')">Dir. R&D</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-ss')">Dir. Student Services</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-welfare')">Dir. Student Welfare</div>
                  </div>
                </div>

                <div class="org-branch">
                  <div class="org-node chief" onclick="showOrgDetails('chief-ops')">Chief of Ops</div>
                  <div class="org-directors">
                    <div class="org-node sm" onclick="showOrgDetails('dir-log')">Dir. Logistics</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-fin')">Dir. Finance</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-docs')">Dir. Documentations</div>
                  </div>
                </div>

                <div class="org-branch">
                  <div class="org-node chief" onclick="showOrgDetails('chief-comms')">Chief Comms</div>
                  <div class="org-directors">
                    <div class="org-node sm" onclick="showOrgDetails('dir-creatives')">Dir. Creatives</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-promotions')">Dir. Promotions</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-extint')">Dir. EXT/INT</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-advocacy')">Dir. Advocacy</div>
                  </div>
                </div>

              </div>
            </div>
            
            <div id="org-details-pane" class="glass-pane">
              <div style="min-width: 300px;">
                <h3 id="org-role-title" style="margin-top: 0; color: var(--primary);">Select a role</h3>
                <p id="org-role-desc" style="opacity: 0.9; margin-bottom: 1rem;">Click on a node in the organization tree to see their core responsibilities and projects.</p>
                <div id="org-role-projects"></div>
                <div id="org-role-execs" style="display: none; margin-top: 1rem; font-size: 0.9em; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile accordion org tree (shown only when html.mobile-ui is active) -->
          <div class="mobile-org-tree">
            <div class="mobile-org-president" onclick="showMobileOrgDetails('president')">★ President (Pauline)</div>
            <div class="mobile-org-secretary" onclick="showMobileOrgDetails('secretary')">📋 Secretary (to the President)</div>

            <div class="mobile-org-chief-block" id="mob-chief-staff">
              <button class="mobile-org-chief-btn" onclick="toggleMobileChief('mob-chief-staff')">
                Chief of Staff <span class="mobile-org-chief-icon">⌄</span>
              </button>
              <div class="mobile-org-dirs"><div class="mobile-org-dirs-inner">
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-acad')"><span class="mobile-org-dir-name">Dir. Academics</span><span class="mobile-org-dir-arrow">›</span></div>
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-rnd')"><span class="mobile-org-dir-name">Dir. R&amp;D</span><span class="mobile-org-dir-arrow">›</span></div>
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-ss')"><span class="mobile-org-dir-name">Dir. Student Services</span><span class="mobile-org-dir-arrow">›</span></div>
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-welfare')"><span class="mobile-org-dir-name">Dir. Student Welfare</span><span class="mobile-org-dir-arrow">›</span></div>
              </div></div>
            </div>

            <div class="mobile-org-chief-block" id="mob-chief-ops">
              <button class="mobile-org-chief-btn" onclick="toggleMobileChief('mob-chief-ops')">
                Chief of Ops <span class="mobile-org-chief-icon">⌄</span>
              </button>
              <div class="mobile-org-dirs"><div class="mobile-org-dirs-inner">
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-log')"><span class="mobile-org-dir-name">Dir. Logistics</span><span class="mobile-org-dir-arrow">›</span></div>
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-fin')"><span class="mobile-org-dir-name">Dir. Finance</span><span class="mobile-org-dir-arrow">›</span></div>
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-docs')"><span class="mobile-org-dir-name">Dir. Documentations</span><span class="mobile-org-dir-arrow">›</span></div>
              </div></div>
            </div>

            <div class="mobile-org-chief-block" id="mob-chief-comms">
              <button class="mobile-org-chief-btn" onclick="toggleMobileChief('mob-chief-comms')">
                Chief Comms <span class="mobile-org-chief-icon">⌄</span>
              </button>
              <div class="mobile-org-dirs"><div class="mobile-org-dirs-inner">
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-creatives')"><span class="mobile-org-dir-name">Dir. Creatives</span><span class="mobile-org-dir-arrow">›</span></div>
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-promotions')"><span class="mobile-org-dir-name">Dir. Promotions</span><span class="mobile-org-dir-arrow">›</span></div>
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-extint')"><span class="mobile-org-dir-name">Dir. EXT/INT</span><span class="mobile-org-dir-arrow">›</span></div>
                <div class="mobile-org-dir-item" onclick="showMobileOrgDetails('dir-advocacy')"><span class="mobile-org-dir-name">Dir. Advocacy</span><span class="mobile-org-dir-arrow">›</span></div>
              </div></div>
            </div>

            <div class="mobile-org-details" id="mobile-org-details"></div>
          </div>

        </div>
      </div>

      <div class="immersive-card-wrapper ecosystem-wrapper" style="margin-top: 3rem;">
        <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay + 0.15}s">
          SCG Organizational Ecosystem & Communications
        </h2>
        <div class="immersive-glass-card animate-in" style="animation-delay: ${delay + 0.2}s">
          <div class="ecosystem-explainer markdown-body">
            <p>The SCG structure operates on strict reporting cadences and escalation paths to ensure no project stalls due to administrative blockades.</p>
            
            <h4>Reporting Cadences</h4>
            <ul>
              <li><strong>Director-to-Chief (Weekly):</strong> Every Friday by 5:00 PM, Directors submit status updates to their respective Chief via Telegram, explicitly highlighting blocked tasks.</li>
              <li><strong>Chief-to-President & Secretary (Biweekly):</strong> Chiefs consolidate reports and align with the President and Secretary biweekly to assess platform health, DAAM statuses, and budget burn rates.</li>
              <li><strong>Executive Secretary Daily Sync:</strong> The Secretary continuously monitors project calendars and milestone trackers, liaising across all three Chiefs to brief the President on imminent deadlines, blocked dependencies, and priority reminders.</li>
            </ul>

            <h4>Escalation Path for Blocked Dependencies</h4>
            <ol>
              <li><strong>24 Hours Blocked:</strong> Director notifies their Chief via Telegram. Chief attempts to unblock directly.</li>
              <li><strong>48 Hours Blocked:</strong> Chief escalates the issue to the President and Secretary.</li>
              <li><strong>72 Hours Blocked / Imminent Risk:</strong> President calls an emergency alignment meeting with the affected Director, Chief, and Secretary to trigger fallback plans.</li>
              <li><strong>Administrative Blockade:</strong> If blocked by administration (e.g. Dean refuses LOA), the President and Chief of Staff assume direct control of communications to force a resolution.</li>
            </ol>

            <h4>Cross-Committee Synergy</h4>
            <p>Our projects overlap systematically based on the RACI matrices:</p>
            <ul>
              <li><strong>Secretary (Executive Office):</strong> Central custodian for master timelines, council calendar syncs, cross-chief monitoring, and presidential reminders across all 12 GOSM initiatives.</li>
              <li><strong>Dir. Student Welfare (Under Chief of Staff):</strong> Frontline intake and triage for confidential student grievances (referring formal advocacy to the College President) and student grievance intake support.</li>
              <li><strong>Dir. Promotions & Dir. Creatives (Under Chief Comms):</strong> Synergistic creative powerhouse. Creatives leads visual branding, UI/UX, and pubmat design; Promotions directs video reels, documentary featurettes, scripts, actors/cameramen, and interactive booth activations.</li>
              <li><strong>Dir. Documentations (Under COO):</strong> Acts as the administrative backbone, tracking all SLIFE, APS, and Post-Act submissions across all projects.</li>
              <li><strong>Dir. Finance:</strong> Manages all money movement. No expenditure moves without an SCT, and specimen signatures must be filed prior to event execution.</li>
            </ul>

            <h4>How Telegram Works</h4>
            <p>Telegram is the primary operations layer. Every project has its own group, and within each group, dedicated channels keep communication clean and traceable. Nobody has to chase anyone down — if it's not in the right channel, it doesn't exist.</p>
            <ul>
              <li><strong>Per-Committee Channels:</strong> Each committee has its own channel. Anyone from another committee who needs to flag something to, say, Finance or Creatives, drops it there directly. No middlemen. No message getting buried in a general chat.</li>
              <li><strong>General Channel:</strong> Important updates that everyone needs to see go here — event confirmations, cleared Pre-Acts, reminders before deadlines. Not every message, just the ones that matter. Within this channel are dedicated topics:
                <ul style="margin-top: 0.5rem; margin-bottom: 0;">
                  <li><strong>Pre-Documents & Links:</strong> One topic holds all relevant pre-activity documents, DAAM links, clearance forms, and official references in one place so no one's asking for the same file twice.</li>
                  <li><strong>P&M Submissions:</strong> When a committee needs a pubmat done, they message the P&M topic with the brief. Dir. Creatives picks it up from there. It creates a clean paper trail and keeps requests from landing in unmonitored DMs.</li>
                </ul>
              </li>
            </ul>
            <p>The structure is deliberately simple. Fewer group chats, clearer channels, less confusion. If a message is in the right place, it gets seen by the right people. That's the whole point.</p>
          </div>
        </div>
      </div>
    `;
    delay += 0.3;

    const EXCLUDED_DOCS = [
      'Comms Protocol',
      'Handover Notes',
      'Master Execution Tracker',
      'Project Defense Briefing',
      'Risk Register',
    ];

    const filteredDocs = data.globalDocs.filter(doc => {
      const pName = doc.name.replace('.md', '').replace(/^00_/, '').replace(/_/g, ' ').trim();
      return !EXCLUDED_DOCS.some(ex => pName.toLowerCase().includes(ex.toLowerCase()));
    });

    filteredDocs.forEach((doc, i) => {
      const index = i + 2; // offset by 2: 0 = SCG Tree, 1 = ecosystem
      const pName = doc.name.replace('.md', '').replace(/^00_/, '').replace(/_/g, ' ');
      sideNavHtml += `
        <div class="nav-item" onclick="scrollToImmersiveCard(${index})" data-index="${index}">
          <div class="nav-dot"></div>
          <div class="nav-label">${pName}</div>
        </div>
      `;
      html += `
        <div class="immersive-card-wrapper" id="immersive-card-${index}" data-index="${index}">
          <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay}s">
            ${pName}
          </h2>
      `;
      delay += 0.1;
      html += `
          <div class="immersive-glass-card animate-in" style="animation-delay: ${delay}s">
            <div style="color: inherit;">
              ${marked.parse(doc.content)}
            </div>
          </div>
      `;
      delay += 0.1;
      html += `</div>`;
    });

    // Note card
    html += `
      <div class="immersive-card-wrapper" id="immersive-card-note" data-index="note">
        <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay}s">A Note on Leadership</h2>
        <div class="immersive-glass-card animate-in" style="animation-delay: ${delay + 0.1}s">

          <p style="margin-bottom: 1.5rem; opacity: 0.75; font-size: 0.9em; letter-spacing: 0.05em; text-transform: uppercase;">Before anything else, an honest word.</p>

          <p style="margin-bottom: 1.25rem; line-height: 1.8;">Everything you see on this platform <span class="lav-em">only becomes real if the College of Science chooses us</span>. These are not promises handed down from a podium. They are plans built from the ground up, shaped by real conversations with real students, and they remain open to change since <em>good governance listens</em>.</p>

          <p style="margin-bottom: 1.25rem; line-height: 1.8;">If elected, each officer will receive a general brief on their responsibilities as a <span class="lav-em">starting point, not a script</span>. The best ideas we've ever seen came from people who were trusted to think, not just told to comply. We will never reduce our officers to order-takers. You bring your creativity, your instincts, your way of doing things, and together we figure out the best path forward.</p>

          <p style="margin-bottom: 1.25rem; line-height: 1.8;">Something feel off? Think a part of this is missing or just too much? <span class="lav-em">Go to the Suggestions tab</span>. That's literally what it's there for. Nothing's too small to bring up, no pushback is too sharp. We put this out in the open on purpose.</p>

          <div style="margin: 2rem 0; padding: 1.5rem; border-left: 3px solid #d8b4fe; background: rgba(216, 180, 254, 0.05); border-radius: 0 8px 8px 0;">
            <p style="line-height: 1.8; margin: 0;">This administration is <span class="lav-em">NON-PARTISAN</span>. Doesn't matter what org you're in, what side you're on, or where you were before COS. <em>If you want to work, there's a place for you.</em> The only thing we hold people to, ourselves included, is showing up and following through. <span class="lav-em">Creativity and accountability.</span> No excuses. No disappearing. No deadlines treated like suggestions.</p>
          </div>

          <p style="margin-bottom: 1.25rem; line-height: 1.8;">And if a project does not push through because things happen, life is complicated, or administration said no, we will not pretend it didn't exist. <span class="lav-em">A formal justification letter will be published here</span>, visible to every student, explaining exactly what happened and why. You deserve to know.</p>

          <p style="line-height: 1.8; opacity: 0.9;">That is the standard we hold ourselves to. Not because it's required, but because you are watching, and you should be.</p>

          <div style="margin-top: 3rem; text-align: center; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.08);">
            <style>
              @keyframes premium-breathe {
                0% { transform: scale(1); text-shadow: 0 0 5px rgba(216, 180, 254, 0.2); }
                50% { transform: scale(1.05); text-shadow: 0 0 15px rgba(216, 180, 254, 0.6), 0 0 30px rgba(216, 180, 254, 0.3); }
                100% { transform: scale(1); text-shadow: 0 0 5px rgba(216, 180, 254, 0.2); }
              }
              .glowing-signature {
                display: inline-block;
                animation: premium-breathe 5s infinite ease-in-out;
              }
            </style>
            <div class="glowing-signature" style="font-family: 'Fleur De Leah', cursive; font-size: clamp(2rem, 4vw, 3rem); color: #d8b4fe; letter-spacing: 0.05em; line-height: 1.2; margin: 0; text-align: left;">
              <div>Para sa Agham,</div>
              <div style="margin-left: 1.5em;">na Ramdam ng Taumbayan.</div>
            </div>
          </div>

        </div>
      </div>
    `;
    delay += 0.2;
  } else if (target === 'suggestions') {
      sideNavHtml += `
        <div class="nav-item" onclick="scrollToImmersiveCard(0)" data-index="0">
          <div class="nav-dot"></div>
          <div class="nav-label">Submit Idea</div>
        </div>
        <div class="nav-item" onclick="scrollToImmersiveCard(1)" data-index="1">
          <div class="nav-dot"></div>
          <div class="nav-label">Process</div>
        </div>
      `;
      html += `
        <div class="immersive-card-wrapper" id="immersive-card-0" data-index="0">
          <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay}s">
            Submit an Idea
          </h2>
          <div class="immersive-glass-card animate-in" style="animation-delay: ${delay + 0.1}s">
            <form id="immersive-suggestion-form">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label for="imm-sugg-name" style="display:block; margin-bottom: 0.5rem; color: #fff;">Name <span style="opacity:0.7;">(Leave blank to remain anonymous)</span></label>
                <input type="text" id="imm-sugg-name" class="input" placeholder="Your Name" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: #fff;">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label for="imm-sugg-email" style="display:block; margin-bottom: 0.5rem; color: #fff;">Email Address</label>
                <input type="email" id="imm-sugg-email" class="input" placeholder="student@example.com" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: #fff;">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label for="imm-sugg-type" style="display:block; margin-bottom: 0.5rem; color: #fff;">Submission Type</label>
                <select id="imm-sugg-type" class="input" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: #fff;">
                  <option value="suggestion">General Suggestion</option>
                  <option value="question">Question</option>
                  <option value="proposal">New Project Proposal</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label for="imm-sugg-content" style="display:block; margin-bottom: 0.5rem; color: #fff;">The Idea / Question</label>
                <textarea id="imm-sugg-content" class="input" rows="5" placeholder="Describe your idea or question in detail..." required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: #fff;"></textarea>
              </div>
              <div class="form-group checkbox-group" id="imm-lead-group" style="display: none; margin-bottom: 1rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; color: #fff;">
                  <input type="checkbox" id="imm-sugg-lead">
                  I am interested in leading this project if approved.
                </label>
              </div>
              <div id="imm-suggestion-success" style="display: none; color: #34d399; margin-bottom: 16px; font-weight: 500;">
                ✓ Your submission has been received successfully!
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: none; background: #d8b4fe; color: #000; font-weight: 600; cursor: pointer;">Submit</button>
            </form>
          </div>
        </div>
        <div class="immersive-card-wrapper" id="immersive-card-1" data-index="1">
          <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay + 0.2}s">
            Process
          </h2>
          <div class="immersive-glass-card animate-in" style="animation-delay: ${delay + 0.3}s">
            <h3 style="margin-top: 0;">Want to lead a project?</h3>
            <p style="opacity: 0.8; margin-bottom: 1rem;">If you propose a new project and volunteer to lead it, here is how the process works:</p>
            <ol style="padding-left: 1.5rem; line-height: 1.8;">
              <li><strong>Initial Review:</strong> The executive team reviews your proposal for feasibility and alignment with college goals.</li>
              <li><strong>The Interview:</strong> We'll reach out to schedule a casual chat to hear your vision and discuss the timeline.</li>
              <li><strong>Committee Assignment:</strong> If approved, you become the Project Head! We will assign an experienced internal committee to handle the logistics and process documents (like Pre-Acts) so you can focus on the big picture.</li>
              <li><strong>Execution:</strong> You lead the charge, and we provide the resources to back you up.</li>
            </ol>
          </div>
        </div>
      `;
  } else if (target === 'finances') {
      sideNavHtml += `
        <div class="nav-item" onclick="scrollToImmersiveCard(0)" data-index="0">
          <div class="nav-dot"></div>
          <div class="nav-label">Emergency Relief</div>
        </div>
        <div class="nav-item" onclick="scrollToImmersiveCard(1)" data-index="1">
          <div class="nav-dot"></div>
          <div class="nav-label">Summary</div>
        </div>
      `;
      html += `
        <div class="immersive-card-wrapper" id="immersive-card-0" data-index="0">
          <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay}s">
            Student Emergency Response & Relief Program
          </h2>
          <div class="immersive-glass-card animate-in" style="animation-delay: ${delay + 0.1}s">
            <p style="opacity: 0.8; margin-bottom: 1rem;">Direct aid for vulnerable students, prioritizing basic survival needs.</p>
            <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
              <h4 style="margin: 0 0 0.5rem 0;">Food Security Pantry</h4>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span>Rice (Est. ₱50/kg) & Sardines (Est. ₱26/can)</span>
                <span style="font-weight: 600;">50% Allocation</span>
              </div>
              <div style="font-size: 0.85em; opacity: 0.7;">Provides survival food packs (1kg rice + 2 canned goods per pack) scaled to budget.</div>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
              <h4 style="margin: 0 0 0.5rem 0;">Emergency Micro-Grants</h4>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span>Small cash aid (₱50 - ₱150)</span>
                <span style="font-weight: 600;">50% Allocation</span>
              </div>
              <div style="font-size: 0.85em; opacity: 0.7;">Reserves small grants for sudden commute deficits or immediate emergency meal needs.</div>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600;">Subtotal Allocation</span>
              <span style="font-weight: 700; font-size: 1.1em; color: #d8b4fe;">100% of Seed Fund</span>
            </div>
          </div>
        </div>

        <div class="immersive-card-wrapper" id="immersive-card-1" data-index="1">
          <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay + 0.4}s">
            Summary
          </h2>
          <div class="immersive-glass-card animate-in" style="animation-delay: ${delay + 0.5}s; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);">
            <h3 style="margin-top: 0; color: #34d399;">Initial Seed Fund Allocation (TBA)</h3>
            <p style="margin-bottom: 0; line-height: 1.5;">
              Our specific initial seed fund amount is currently <strong>To Be Announced (TBA)</strong>, as we await final confirmation from the administration. Once the exact amount is provided, this page will be updated immediately. What we can confirm is our allocation ratio: the seed fund will be split evenly, <strong>50% toward the Sakuna Disaster/Emergency Pantry</strong> and <strong>50% toward Micro-Lending</strong>. All remaining projects (such as Transparency Platforms, Accessibility Initiatives, and Education Series) are <strong>zero-cost</strong> platforms. Any expansion of our funded initiatives will be fully supported through <strong>Semana ng Siyensya</strong> and the <strong>Fundraising & Local Business Collaboration Initiative</strong>, relying strictly on partnerships and merchandise, not student fees.<br><br><strong>NOTE:</strong> TO BE FULLY TRANSPARENT: I cannot guarantee that Project 6: Student Emergency Response & Relief Program will ultimately operate under the SCG. While it is entirely feasible under both the USG Financial Manual and the DAAM Manual, it is still subject to potential rejection by SLIFE. However, should that happen, I will personally ensure the continuation of this initiative independently, outside of the Science College Government. It will be the exact same project, with the exact same execution guidelines.
            </p>
          </div>
        </div>
      `;
  } else if (target === 'student-services') {
      sideNavHtml = '';
      html = '<div id="ss-immersive-container" style="width: 100%; max-width: 1200px; margin: 0 auto; padding: 20px;"></div>';
      setTimeout(() => {
          if (window.renderStudentServices) {
              window.renderStudentServices('ss-immersive-container');
          }
      }, 50);
  } else if (target === 'me') {
    sideNavHtml += `
      <div class="nav-item" onclick="scrollToImmersiveCard(0)" data-index="0">
        <div class="nav-dot"></div>
        <div class="nav-label">About Me</div>
      </div>
      <div class="nav-item" onclick="scrollToImmersiveCard(1)" data-index="1">
        <div class="nav-dot"></div>
        <div class="nav-label">Where I Stand</div>
      </div>
      <div class="nav-item" onclick="scrollToImmersiveCard(2)" data-index="2">
        <div class="nav-dot"></div>
        <div class="nav-label">Closing Thoughts</div>
      </div>
    `;
    html += `
      <div class="immersive-card-wrapper expanded" id="immersive-card-0" data-index="0">
        <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay}s">
          About Me
        </h2>
        <div class="me-content-layout">
          <div class="immersive-glass-card animate-in me-intro" style="animation-delay: ${delay + 0.1}s; flex: 1; max-width: 900px;">
            <div class="me-text-content">
              <p>Before I was a candidate, I was just a Physics student who spent most of her free time between a controller and a textbook. I think that matters, because everything on this platform came from somewhere real, not from a strategy meeting.</p>
              
              <p><strong>I am a gamer!</strong> Final Fantassy raised me. Then, Last of Us taught me more about grief and loyalty than most classes ever did. I have logged more hours on Valorant and Deadlock this year than I would like to admit, and this is genuinely the first week in months I have not touched either, because campaign season asked for that time instead. I bring this up because it is the reason the COS Discord Gaming Night exists under Semana ng Siyensya. I know what it feels like to want one night that has nothing to do with a deadline, and I wanted to build that for the rest of this college too.</p>

              <p>I took Physics at DLSU because of a question asked even before fire was discovered: are we alone in the universe? That question is what pulled me toward astrobiology, and it is also why the Research Grants and Funding Portal matters so much to me personally. I have spent enough time chasing down funding and orientation for my own research interests to know exactly how disorganized that process can be for a student with no existing connections. The Research Job Board and Research Readiness Survey exist because I lived that gap.</p>

              <p>My current research focus is on <strong>radiation-based treatment protocols for transwomen who have undergone vaginoplasty</strong>. Existing treatment models for prostate related cancers were built around cisgender anatomy, and applying them without adjustment carries <strong>real risk of complications, such as formation of fistulas that can lead to death</strong>. This is not an abstract policy position for me. It is the reason trans healthcare visibility is something I will not soften on this platform, and it is part of why the Queer and Trans Identity Education Series and Shanghay Laya exist as real projects with real medical grounding, not just a page on a website.</p>

              <p>The rest of me is smaller things. I paint in watercolor, I practice calligraphy, and I read more BL movies than I probably should admit in a campaign document. None of that needs to be a project. But I wanted you to know it!</p>

              <p>The remaining projects, the Transparency and Accountability Platform, the Inclusion and Accessibility Initiative, the Student Emergency Response Program, the Financial Empowerment Initiative, and the Fundraising and Local Business Collaboration Initiative, come from a different place. They come from watching this college fail specific students in specific ways and deciding I was done waiting for someone else to fix it.</p>

              <p>Below this section is a table of where I stand on national and university issues. I kept it because I do not believe a candidate should be vague about their politics just to stay likeable to everyone. Some of these stances will cost me votes. <strong>I would rather lose votes being honest than win them being unclear.</strong></p>
            </div>
          </div>
          <div class="me-images-content animate-in" style="animation-delay: ${delay + 0.2}s">
            <img src="./paulinephotofave.jpeg" alt="Pauline Photo" class="me-photo me-photo-top">
            <div class="me-bottom-photo-wrapper">
              <img src="./firstday.jpg" alt="First Day of Campaign" class="me-photo me-photo-bottom">
              <p class="me-photo-caption">my first day of campaign!</p>
            </div>
          </div>
        </div>
      </div>

      <div class="immersive-card-wrapper" id="immersive-card-1" data-index="1">
        <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay + 0.2}s">
          Where I Stand
        </h2>
        <div class="immersive-glass-card animate-in" style="animation-delay: ${delay + 0.3}s">
          <p style="margin-bottom: 2rem; color: rgba(255,255,255,0.8);">These are not the entirety of my views, but they are the fifty I consider most important for you to know before you vote. Where a position needed more than one word to make sense, I explained it.</p>
          
          <h3 class="stance-category-title">National Affairs</h3>
          <div class="stance-table">
            
              <div class="immersive-stance-row">
                <div class="stance-issue">Flood Control Projects, given the ongoing corruption scandal tied to their contracts</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Bataan Nuclear Power Plant Revival</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Arrest of Former President Rodrigo Duterte</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Impeachment of President Bongbong Marcos Jr.</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Impeachment of VP Sara Duterte</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Leni Robredo for President 2028</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Risa Hontiveros for President 2028</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Oil Deregulation Law</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Foreign Military Presence in the Philippines</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Lowering the Age of Criminal Liability</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Charter Change (Cha-Cha)</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Legalizing Same Sex Marriage</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Legalizing Abortion</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Legalizing Recreational Use of Marijuana</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Legalizing Divorce</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">CHED's New General Education Curriculum</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Comprehensive Sex Education</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Mandatory ROTC</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Harassment of Filipino Fishermen by Chinese Vessels</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Historical Revisionism</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Fining Criminals Based on Income Level</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Recognition of Palestine as a Sovereign Nation</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Recognition of Taiwan as a Sovereign Nation</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Jeepney Phaseout</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Jeepney Modernization, as currently implemented without adequate operator support</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">The Marcos Administration</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Legalizing Prostitution</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">NTF-ELCAC</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Use of Confidential Funds by Government Agencies</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Vote Buying</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Continuation of the Partylist System in its current form</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Continuation of the Balikatan Military Exercises</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">The Philippines Urging a Ceasefire in Gaza</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Contractualization (Endo)</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Across the Board Wage Hike</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Extrajudicial Killings (EJK)</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Death Penalty</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">POGO Ban</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Whether Israel is Committing Genocide in Palestine</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Rice Tariffication Law</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Sagip Saka Act</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Right to Care Bill</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">EDCA (Enhanced Defense Cooperation Agreement)</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
          </div>

          <h3 class="stance-category-title" style="margin-top: 3rem;">USG and University Affairs</h3>
          <div class="stance-table">
            
              <div class="immersive-stance-row">
                <div class="stance-issue">Tuition Fee Increase</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">DLSU's Current AI Policy</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Clearance Holds by University Offices</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Abstention Rights for Students in Elections</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Fraternity Ban</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">The Two Party System in DLSU USG Elections</div>
                <div class="immersive-chip immersive-chip-against">AGAINST</div>
              </div>
              <div class="immersive-stance-row">
                <div class="stance-issue">Latin Honors Campaign</div>
                <div class="immersive-chip immersive-chip-for">FOR</div>
              </div>
          </div>
        </div>
      </div>

      <div class="immersive-card-wrapper" id="immersive-card-2" data-index="2">
        <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay + 0.4}s">
          After the Table
        </h2>
        <div class="immersive-glass-card animate-in me-intro" style="animation-delay: ${delay + 0.5}s">
          <p>If you read through all of this, you already know more about how I think than most candidates can tell you in an entire campaign. I did not write this table to be provocative. I wrote it because <u>the same principle runs through both halves of this page</u>: the platform I am building and the politics I hold are not separate things I switched between depending on the audience. They come from the same place.</p>
          <p>This is also, in a way, an extension of what the Transparency and Accountability Platform is supposed to represent. If I am asking this council to publish where every peso goes and to answer every grievance honestly, I owe you the same standard about where I personally stand. <u>A council that hides its politics while demanding transparency from the administration is not a council I would trust either.</u></p>
          <p>If something here surprises you, or you disagree with a stance, the Suggestion Tab is open the moment I take office. I built it to actually get replies, and that applies here too.</p>
          <p class="me-closing-tagline">Muli, Para sa mga isinantabi, tayo naman ang papagitna. Mula laylayan, Hangang sa konseho, ako si Pauline Galias. Tumatakbo, bilang inyong susunod na Presidente sa Kolehiyo ng Agham</p>
        </div>
      </div>
    `;
  }


  container.innerHTML = html;
  sideNavContainer.innerHTML = sideNavHtml;

  // Constellation Intersection Observer to hide Side Nav
  const constellationEl = document.getElementById('project-constellation');
  if (constellationEl) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          sideNavContainer.classList.add('nav-hidden');
        } else {
          sideNavContainer.classList.remove('nav-hidden');
        }
      });
    }, { threshold: 0.25 });
    observer.observe(constellationEl);
  }

  // Re-bind form listener if it exists
  const suggForm = document.getElementById('immersive-suggestion-form');
  if (suggForm) {
    document.getElementById('imm-sugg-type').addEventListener('change', function(e) {
      const leadGroup = document.getElementById('imm-lead-group');
      if (e.target.value === 'proposal') {
        leadGroup.style.display = 'flex';
      } else {
        leadGroup.style.display = 'none';
        document.getElementById('imm-sugg-lead').checked = false;
      }
    });

    suggForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerText;
      submitBtn.innerText = "Submitting...";
      submitBtn.disabled = true;

      const formData = new FormData();
      formData.append('Name', document.getElementById('imm-sugg-name').value || 'Anonymous');
      formData.append('Email', document.getElementById('imm-sugg-email').value || 'N/A');
      formData.append('Type', document.getElementById('imm-sugg-type').value);
      formData.append('Content', document.getElementById('imm-sugg-content').value);
      
      const leadCheckbox = document.getElementById('imm-sugg-lead');
      const isLeadVisible = document.getElementById('imm-lead-group').style.display !== 'none';
      formData.append('WillingToLead', isLeadVisible && leadCheckbox.checked ? 'Yes' : 'No');

      // TODO: Replace with the actual deployed Google Apps Script URL
      const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_SCRIPT_URL_HERE";

      try {
        if (GOOGLE_SCRIPT_URL !== "YOUR_GOOGLE_SCRIPT_URL_HERE") {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors' // Google Apps Script requires this for cross-origin POSTs without preflight
          });
        }

        const successMsg = document.getElementById('imm-suggestion-success');
        successMsg.style.display = 'block';
        this.reset();
        document.getElementById('imm-lead-group').style.display = 'none';
        setTimeout(() => { successMsg.style.display = 'none'; }, 3000);

      } catch (error) {
        console.error("Error submitting form:", error);
        alert("There was an error submitting your suggestion. Please try again.");
      } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
      }
    });

  }

  // Setup Intersection Observer for scroll spy
  if (projectObserver) projectObserver.disconnect();
  
  const options = {
    root: container,
    rootMargin: '0px',
    threshold: 0.3 // Trigger when 30% of the card is visible
  };

  projectObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = entry.target.getAttribute('data-index');
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-index="${idx}"]`);
        if (activeNav) activeNav.classList.add('active');
      }
    });
  }, options);

  // Observe all cards
  document.querySelectorAll('.immersive-card-wrapper').forEach(card => {
    projectObserver.observe(card);
  });
}

window.scrollToImmersiveCard = function(index) {
  const el = document.getElementById(`immersive-card-${index}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.toggleFaq = function(el) {
  const accordion = el.closest('.faq-accordion');
  accordion.classList.toggle('open');
};

// --- Edit Mode Logic ---
window.isEditMode = false;
window.turndownService = null;

window.toggleEditMode = function() {
  if (!window.isEditMode) {
    const password = prompt("Enter password to enable Edit Mode:");
    if (password === "PaulineForCAP") {
      window.isEditMode = true;
      document.querySelector('.settings-icon').classList.add('editing');
      document.getElementById('floating-save-btn').style.display = 'block';
      
      // Initialize Turndown if not already
      if (!window.turndownService && window.TurndownService) {
        window.turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
        // Enable GFM (GitHub Flavored Markdown) to support tables
        if (window.turndownPluginGfm) {
          window.turndownService.use(window.turndownPluginGfm.gfm);
        }
      }
      
      // Make blocks editable
      const blocks = document.querySelectorAll('.editable-block');
      blocks.forEach(block => {
        block.setAttribute('contenteditable', 'true');
      });
      alert("Edit Mode Enabled. Click any text to edit directly.");
    } else {
      if (password !== null) alert("Incorrect password.");
    }
  } else {
    // Disable edit mode
    window.isEditMode = false;
    document.querySelector('.settings-icon').classList.remove('editing');
    document.getElementById('floating-save-btn').style.display = 'none';
    
    const blocks = document.querySelectorAll('.editable-block');
    blocks.forEach(block => {
      block.removeAttribute('contenteditable');
    });
  }
}

window.saveEdits = async function() {
  if (!window.isEditMode || !window.turndownService) return;
  
  const blocks = document.querySelectorAll('.editable-block[contenteditable="true"]');
  const saveBtn = document.getElementById('floating-save-btn');
  const originalText = saveBtn.innerText;
  saveBtn.innerText = "⏳ Saving...";
  saveBtn.style.opacity = '0.7';
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const targetPath = block.getAttribute('data-file-path');
    
    // Convert the edited HTML back to Markdown
    let htmlContent = block.innerHTML;
    let markdown = window.turndownService.turndown(htmlContent);
    
    if (targetPath && markdown) {
      try {
        const response = await fetch('http://127.0.0.1:8080/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetPath, markdown })
        });
        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          failCount++;
          console.error("Save failed for", targetPath, result.error);
        }
      } catch (err) {
        failCount++;
        console.error("Network error while saving", targetPath, err);
      }
    }
  }
  
  saveBtn.innerText = originalText;
  saveBtn.style.opacity = '1';
  
  if (failCount === 0) {
    alert(`Successfully saved ${successCount} sections!`);
    // Re-render to clear any messy HTML tags
    setTimeout(() => {
      location.reload();
    }, 500);
  } else {
    alert(`Saved ${successCount} sections, but ${failCount} failed. Check console.`);
  }
};

window.showOrgDetails = function(roleId) {
  const orgData = {
    'president': {
      title: 'President (Pauline)',
      desc: 'Ultimate executive accountability for the College of Science Government. Holds sole constitutional authority (as an elected officer) to formally advocate and escalate student grievances before University Administration and Faculty Boards. Oversees platform execution, legal DAAM sign-offs, and emergency relief fund activations.',
      projects: ['Formal Administrative Representation for Escalated Student Grievances', 'Final Sign-Off on all DAAM Submissions & LOAs', 'Emergency Student Assistance Protocols', 'General Assembly Keynote & Officer Workshop Training (Oct 21)']
    },
    'secretary': {
      title: 'Secretary (to the President)',
      desc: 'The President\'s executive right-hand and master timeline custodian. Manages the master project tracker, deadlines, and council calendar across all 12 GOSM initiatives. Liaises directly with the three Chiefs to monitor deliverable dates, unblock bottlenecks, and provide high-priority daily briefings and reminders to the President.',
      projects: ['Master GOSM Milestone & Deadline Tracker (All 12 Initiatives)', 'Cross-Chief Progress Sync & Daily Presidential Reminders', 'SCG Master Calendar & Meeting Minutes Management', 'SCG General Assembly & Officer Workshop Logistics Tracking (Oct 21)'],
      execs: 'Executive Office Secretariat (Meeting documentation, calendar dispatch, task reminders)'
    },
    'chief-staff': {
      title: 'Chief of Staff',
      desc: 'Internal governance backbone. Enforces policy compliance, oversees Academics, R&D, Student Services, and Student Welfare portfolios to ensure seamless execution and student rights protection.',
      projects: ['Academic & Research Infrastructure Alignment', 'Student Welfare & Grievance Protocol Compliance', 'Cross-Departmental Synergy with Dean\'s Office & Faculty', 'Lab Accessibility & Inclusion Reviews']
    },
    'chief-ops': {
      title: 'Chief of Operations',
      desc: 'Ensures physical events run smoothly and operational/financial protocols (transparency, FRA reports, venue reservations) are strictly followed.',
      projects: ['SCG General Assembly Logistics Coordination (Oct 21)', 'Operational Oversight for Competitions & Academic Events', 'Overall Operational Flow for Spelling Bee & Seminars']
    },
    'chief-comms': {
      title: 'Chief of Communications',
      desc: 'External voice and engagement engine of SCG. Oversees Creatives, Promotions, EXT/INT Linkages, and Advocacy to ensure high-visibility outreach and community engagement.',
      projects: ['Unified P&M Clearance Pipeline (24-hour lead time)', 'Taft Food Crawl Sponsorships & Merchant Outreach', 'Shanghay Laya Multimedia Advocacy Campaign']
    },
    'dir-acad': {
      title: 'Director for Academics',
      desc: 'Manages all educational resources, academic seminars, and academic survival tools.',
      projects: ['LaTeX Essentials: Scientific Typesetting Seminar (Nov 4)', 'Scientific Terminologies Spelling Bee: Biology Edition (Oct 28)', 'Academic Pathing Tool & Prerequisite Maps', 'Syllabus Transparency Repository'],
      execs: 'Academics Executives (Data gathering, module building, seminar coordination)'
    },
    'dir-rnd': {
      title: 'Director for Research & Development',
      desc: 'Expands undergraduate student research opportunities, tools, and funding pipelines.',
      projects: ['Research Grants & Funding Portal', 'Research Job Board', 'Research Readiness Survey', 'H2Zero.ai Offline Study Companion Integration'],
      execs: 'R&D Executives (Survey deployment, job board vetting, developer support)'
    },
    'dir-ss': {
      title: 'Director for Student Services',
      desc: 'Manages student service platforms, lounge facilities, and material exchanges.',
      projects: ['HomeCOStasis Student Lounge Operations (Oct 14)', 'Batch 126 Academic Guidance Modules', 'COS Bulletin Board Centralized Telegram Hub (Oct 14)', 'Scholarship Grade Calculator & Free Software Directory'],
      execs: 'Student Services Executives (Lounge management, item condition checks, exchange cataloging)'
    },
    'dir-welfare': {
      title: 'Director for Student Welfare',
      desc: 'Frontline guardian of student wellbeing and emergency aid. Operates the confidential grievance intake channel, vets and documents cases, and formally refers cases to the College President (ensuring full compliance with USG elected officer representation rules). Oversees the massive logistics and supply chain for emergency disaster relief and food security.',
      projects: ['Confidential Grievance Intake Channel & Case Triage (Referrals to President)', 'Student Crisis Support & Emergency Case Mediation', 'Confidential Case Registry & Welfare Outreach', 'Student Welfare Assistance & Well-being Inquiries'],
      execs: 'Student Welfare Executives (Case logging & intake triage, pantry inventory managers, emergency relief volunteers)'
    },
    'dir-docs': {
      title: 'Director for Documentations',
      desc: 'The administrative backbone. Tracks all SLIFE, APS, SCT, and ADM Pre/Post-Acts across all 12 initiatives.',
      projects: ['DAAM Pre-Act Submissions & Archiving', '14-day External MOA tracking', 'AET feedback collection', 'Post-Activity Compliance Filings'],
      execs: 'Docs Executives (Filing paperwork, minute-taking, clearance chasing)'
    },
    'dir-log': {
      title: 'Director for Logistics',
      desc: 'Handles physical venue bookings, equipment reservations, and inventory management.',
      projects: ['Physical Venue Booking (Yuchengco, Andrew, Amphitheater)', 'Spelling Bee & General Assembly Stage Setup', 'Event Stage Logistics & Technical Setup', 'Materials Dispatch & Registration Desks'],
      execs: 'Logistics Executives (Booth setups, physical inventory counting, equipment transport)'
    },
    'dir-fin': {
      title: 'Director for Finance',
      desc: 'Manages all money movement, SCT processing, depository funds, and financial transparency.',
      projects: ['Financial Transparency Ledger (72-hour rule)', 'Operational Budget Monitoring & Financial Ledger', 'Depository Fund Ring-Fence Declarations', 'FRA Reports & Post-Activity Liquidations'],
      execs: 'Finance Executives (Receipt logging, budget tracking, deposit slips)'
    },
    'dir-creatives': {
      title: 'Director for Creatives',
      desc: 'Leads visual branding, graphic design, and UI/UX design across all digital and physical touchpoints. Enforces the visual style system and guarantees P&M clearance submissions with strict 24-hour lead times.',
      projects: ['SCG Centralized Student Portal UI/UX Design', 'Official Event Pubmats & Social Media Branding', 'LaTeX Essentials & Spelling Bee Identity Kits', 'Promotional Collateral & Banner Guidelines'],
      execs: 'Creatives Executives (Graphic designers, brand illustrators, UI/UX designers)'
    },
    'dir-promotions': {
      title: 'Director for Promotions',
      desc: 'The creative media production powerhouse. Directs video reels, documentary featurettes, scripted skits, and hype reels. Houses scriptwriters, on-cam talent/actors, and videographers/cameramen. Conceives experiential marketing and interactive booth concepts for physical activations.',
      projects: ['Women & Minorities in STEM Video Featurette Series', 'Taft Food Crawl Video Reels & Merchant Spotlights (Oct 19-21)', 'Scientific Spelling Bee Interactive Booth Concepts (Oct 28)', 'Shanghay Laya Platform Launch Multimedia Assets (Nov 7)'],
      execs: 'Promotions Executives (Scriptwriters, Actors/Hosts, Videographers/Cameramen, Booth Activation Designers)'
    },
    'dir-extint': {
      title: 'Director for EXT/INT Linkages',
      desc: 'Secures external partnerships, merchant sponsorships, and inter-organizational linkages.',
      projects: ['Taft Food Crawl Local Business Outreach & MOAs (Oct 19-21)', 'Inter-College SCG Collaborations', 'Sponsorship Packages for Physical Events', 'Student Discount Directory Partnerships'],
      execs: 'EXT/INT Executives (Partner pitches, MOA drafting, merchant liaison)'
    },
    'dir-advocacy': {
      title: 'Director for Advocacy',
      desc: 'Leads social justice, inclusion, queer/trans representation, and student empowerment initiatives.',
      projects: ['Shanghay Laya: Malaya Maging Ikaw (Platform Launch, Nov 7)', 'Women and Minorities in STEM Digital Research Archive', 'Campus Inclusion & Accessibility Audits', 'Gender-Affirming Policy & Representation Dialogues'],
      execs: 'Advocacy Executives (Speaker coordination, consent compliance, advocacy research)'
    }
  };

  const data = orgData[roleId];
  if(!data) return;
  
  document.getElementById('org-role-title').innerText = data.title;
  document.getElementById('org-role-desc').innerText = data.desc;
  
  let projectsHtml = '<h4 style="margin-top: 1rem; margin-bottom: 0.5rem; color: #fff;">Key Projects Handled</h4><ul style="padding-left: 1.2rem; margin-bottom: 1rem;">';
  data.projects.forEach(p => {
    projectsHtml += `<li style="margin-bottom: 0.5rem; opacity: 0.9;">${p}</li>`;
  });
  projectsHtml += '</ul>';
  document.getElementById('org-role-projects').innerHTML = projectsHtml;
  
  const execsEl = document.getElementById('org-role-execs');
  if (data.directors) {
    execsEl.innerHTML = `<strong>Directors:</strong> ${data.directors}`;
    execsEl.style.display = 'block';
  } else if (data.execs) {
    execsEl.innerHTML = `<strong>Executives:</strong> ${data.execs}`;
    execsEl.style.display = 'block';
  } else {
    execsEl.style.display = 'none';
  }
  
  // Toggle behavior: if already active, turn it off and hide the pane
  if (event && event.currentTarget) {
    if (event.currentTarget.classList.contains('active')) {
      event.currentTarget.classList.remove('active');
      const layoutContainer = document.getElementById('org-layout-container');
      if (layoutContainer) {
        layoutContainer.classList.remove('has-selection');
      }
      const orgWrapper = document.getElementById('immersive-card-0');
      if (orgWrapper) {
        orgWrapper.classList.remove('expanded');
      }
      return; // Stop execution
    }
  }

  // Otherwise, highlight the newly clicked node
  document.querySelectorAll('.org-node').forEach(node => node.classList.remove('active'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  
  // Trigger animation container
  const layoutContainer = document.getElementById('org-layout-container');
  if(layoutContainer) {
    layoutContainer.classList.add('has-selection');
  }
  const orgWrapper = document.getElementById('immersive-card-0');
  if (orgWrapper) {
    orgWrapper.classList.add('expanded');
  }
};

// ── Mobile: Toggle chief accordion (one open at a time) ──
window.toggleMobileChief = function(blockId) {
  const target = document.getElementById(blockId);
  if (!target) return;
  const isOpen = target.classList.contains('open');

  // Close all chiefs (accordion: only one open at a time)
  document.querySelectorAll('.mobile-org-chief-block').forEach(b => b.classList.remove('open'));

  // If it wasn't already open, open it now
  if (!isOpen) {
    target.classList.add('open');
  }
};

// ── Mobile: Show role details in the mobile details panel ──
window.showMobileOrgDetails = function(roleId) {
  const orgData = {
    'president': {
      title: 'President (Pauline)',
      desc: 'Ultimate executive accountability for SCG. Holds sole constitutional authority (as an elected officer) to formally advocate and escalate student grievances before University Administration. Oversees platform execution, legal DAAM sign-offs, and emergency relief fund activations.',
      projects: ['Formal Grievance Escalation & Representation', 'Final sign-off on all DAAMs & LOAs', 'Emergency Relief Fund decisions', 'SCG General Assembly & Workshop Direction (Oct 21)']
    },
    'secretary': {
      title: 'Secretary (to the President)',
      desc: 'The President\'s executive right-hand and master timeline custodian. Manages the master project tracker, deadlines, and council calendar across all 12 GOSM initiatives. Liaises directly with the three Chiefs and provides daily briefings and reminders to the President.',
      projects: ['Master GOSM Milestone & Deadline Tracker (All 12 Initiatives)', 'Cross-Chief Progress Sync & Daily Presidential Reminders', 'SCG Master Calendar & Meeting Minutes', 'General Assembly & Workshop Tracking (Oct 21)']
    },
    'chief-staff': {
      title: 'Chief of Staff',
      desc: 'Internal operations backbone. Manages Academics, R&D, Student Services, and Student Welfare portfolios to ensure policy compliance and student rights protection.',
      projects: ['Academic Hub oversight', 'Research Grant coordination', 'Student Services & Welfare alignment', 'Grievance Protocol Compliance']
    },
    'chief-ops': {
      title: 'Chief of Operations',
      desc: 'Runs logistics, finance, and documentation. Ensures physical event execution and strict compliance with USG finance and venue protocols.',
      projects: ['General Assembly Logistics (Oct 21)', 'Budget burn tracking & SCT clearances', 'DAAM documentation pipeline', 'Physical Venue Bookings']
    },
    'chief-comms': {
      title: 'Chief of Communications',
      desc: 'External face and media engine of SCG. Oversees Creatives, Promotions, EXT/INT Linkages, and Advocacy to maximize student engagement.',
      projects: ['Pubmat clearance via P&M (24-hour lead time)', 'Taft Food Crawl media coverage & merchant MOAs', 'Shanghay Laya platform launch campaign (Nov 7)']
    },
    'dir-acad': {
      title: 'Director for Academics',
      desc: 'Leads academic support initiatives, seminars, and survival tools.',
      projects: ['LaTeX Essentials Seminar (Nov 4)', 'Scientific Spelling Bee: Biology Edition (Oct 28)', 'Academic Pathing Tool', 'Syllabus Transparency Repository']
    },
    'dir-rnd': {
      title: 'Director for R&D',
      desc: 'Drives research support tools, funding pipelines, and the Research Readiness Survey.',
      projects: ['Research Grants & Funding Portal', 'Research Job Board', 'Research Readiness Survey', 'H2Zero.ai Offline Study Companion']
    },
    'dir-ss': {
      title: 'Director for Student Services',
      desc: 'Manages student service platforms, lounge facilities, and material exchanges.',
      projects: ['HomeCOStasis Student Lounge (Oct 14)', 'Batch 126 Guidance Modules', 'COS Bulletin Board Telegram Hub (Oct 14)', 'Scholarship Calculator & Free Software Directory']
    },
    'dir-welfare': {
      title: 'Director for Student Welfare',
      desc: 'Frontline guardian of student wellbeing and emergency aid. Operates confidential grievance intake channel (referring formal advocacy to the College President) and manages the massive logistics of disaster relief.',
      projects: ['Confidential Grievance Intake Channel (Referrals to President)', 'Student Crisis Support & Emergency Case Mediation', 'Confidential Case Registry & Welfare Outreach', 'Student Welfare Assistance & Inquiries']
    },
    'dir-log': {
      title: 'Director for Logistics',
      desc: 'Coordinates physical venue bookings, equipment reservations, and event floor execution.',
      projects: ['Physical Venue Booking (Yuchengco, Andrew, Amphitheater)', 'Spelling Bee & General Assembly Stage Setup', 'Event Stage Logistics & Technical Setup']
    },
    'dir-fin': {
      title: 'Director for Finance',
      desc: 'Manages all money movement. No expenditure moves without an SCT, budget tracking, and transparency.',
      projects: ['Financial Transparency Ledger (72-hour rule)', 'Operational Budget Monitoring & Financial Ledger', 'SCT processing & Depository Fund tracking', 'FRA Post-Activity Liquidations']
    },
    'dir-docs': {
      title: 'Director for Documentations',
      desc: 'Administrative backbone. Tracks all SLIFE, APS, and Post-Act submissions across every project.',
      projects: ['DAAM Pre-Act submissions', 'Post-Act compliance filing', 'AET feedback tracking', '14-day External MOA chasing']
    },
    'dir-creatives': {
      title: 'Director for Creatives',
      desc: 'Handles visual branding, UI/UX design, and pubmats. 24-hour minimum lead time for all public-facing materials.',
      projects: ['SCG Centralized Student Portal UI/UX', 'Official Event Pubmats & Branding', 'LaTeX Essentials & Spelling Bee Identity Kits']
    },
    'dir-promotions': {
      title: 'Director for Promotions',
      desc: 'Creative multimedia production powerhouse. Directs video reels, documentary featurettes, scripts, and actors/cameramen, and conceives interactive booth activations.',
      projects: ['Women & Minorities in STEM Video Featurettes', 'Taft Food Crawl Video Reels & Spotlights (Oct 19-21)', 'Scientific Spelling Bee Interactive Booth Concepts (Oct 28)', 'Shanghay Laya Platform Multimedia Assets (Nov 7)']
    },
    'dir-extint': {
      title: 'Director for EXT/INT Linkages',
      desc: 'Secures external partnerships, sponsorships, and local merchant linkages.',
      projects: ['Taft Food Crawl Merchant Outreach & MOAs (Oct 19-21)', 'Inter-College SCG Collaborations', 'Sponsorship Packages for Physical Events']
    },
    'dir-advocacy': {
      title: 'Director for Advocacy',
      desc: 'Leads social justice, inclusion, diversity, and student empowerment initiatives.',
      projects: ['Shanghay Laya: Malaya Maging Ikaw (Nov 7)', 'Women and Minorities in STEM Research Archive', 'Campus Inclusion & Accessibility Audits']
    }
  };

  const role = orgData[roleId];
  if (!role) return;

  const detailsEl = document.getElementById('mobile-org-details');
  if (!detailsEl) return;

  const projectsHtml = role.projects.map(p => `<li>${p}</li>`).join('');

  detailsEl.classList.remove('visible');
  // Trigger reflow so animation replays on each open
  void detailsEl.offsetWidth;

  detailsEl.innerHTML = `
    <h3>${role.title}</h3>
    <p>${role.desc}</p>
    <strong style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.45); display:block; margin-bottom:6px;">Key Projects</strong>
    <ul>${projectsHtml}</ul>
  `;
  detailsEl.classList.add('visible');

  setTimeout(() => {
    detailsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 80);
};

