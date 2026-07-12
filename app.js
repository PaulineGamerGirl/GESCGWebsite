const data = window.__INITIAL_DATA__;

// Configure Marked to wrap tables in a responsive container
if (typeof marked !== 'undefined') {
  const renderer = new marked.Renderer();
  renderer.table = function(header, body) {
    return '<div class="table-responsive"><table>\n'
      + '<thead>\n'
      + header
      + '</thead>\n'
      + '<tbody>\n'
      + body
      + '</tbody>\n'
      + '</table></div>\n';
  };
  marked.use({ renderer });
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

// Auto-render Pre-Acts (no password required)
renderPreActs();

function renderPreActs() {
  const grid = document.getElementById('preacts-grid');
  if (grid.innerHTML !== '') return;
  
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
}

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
        Our specific initial seed fund amount is currently <strong>To Be Announced (TBA)</strong>, as we await final confirmation from the administration. Once the exact amount is provided, this page will be updated immediately. What we can confirm is our allocation ratio: the seed fund will be split evenly, <strong>50% toward the Sakuna Disaster/Emergency Pantry</strong> and <strong>50% toward Micro-Lending</strong>. All remaining projects (such as Transparency Platforms, Accessibility Initiatives, and Education Series) are <strong>zero-cost</strong> platforms. Any expansion of our funded initiatives will be fully supported through <strong>Semana ng Siyensya</strong> and the <strong>Fundraising & Local Business Collaboration Initiative</strong>, relying strictly on partnerships and merchandise, not student fees.<br><br><i>"I believe that the USG is transparent when it comes to the finances, no doubt. But it's where money is placed I believe is where things could be better. I will ensure to spend nothing on what doesn't matter, and everything I have on what does."</i>
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

      // Trigger animation to top middle or center
      if (target === 'home') {
        immersiveNav.classList.remove('at-top-middle');
        document.getElementById('immersive-content').classList.remove('active');
      } else {
        immersiveNav.classList.add('at-top-middle');
        
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
    data.projects.slice(0, 8).forEach((p, index) => {
      const pName = p.name.replace(/^Project \\d+ /, '');
      sideNavHtml += `
        <div class="nav-item" onclick="scrollToImmersiveCard(${index})" data-index="${index}">
          <div class="nav-dot"></div>
          <div class="nav-label">${pName}</div>
        </div>
      `;
      html += `
        <div class="immersive-card-wrapper" id="immersive-card-${index}" data-index="${index}">
          <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay}s">
            ${p.name}
          </h2>
      `;
      delay += 0.1;
      html += `
          <div class="immersive-glass-card animate-in" style="animation-delay: ${delay}s">
            <div class="editable-block markdown-body" style="color: inherit;" data-file-path="${p.folderName}/04_Project_Description.md">
              ${marked.parse(p.description || '*No description available*')}
            </div>
          </div>
      `;
      delay += 0.1;
      if (p.subprojects) {
        html += `
            <div class="immersive-glass-card animate-in" style="animation-delay: ${delay}s">
              <div class="editable-block markdown-body" style="color: inherit;" data-file-path="${p.folderName}/05_Subprojects.md">
                ${marked.parse(p.subprojects)}
              </div>
            </div>
        `;
        delay += 0.1;
      }
      if (p.faq) {
        html += `
            <div class="immersive-glass-card animate-in faq-accordion" style="animation-delay: ${delay}s">
              <div class="faq-header" onclick="toggleFaq(this)">
                <div class="faq-title">
                  <h3>${pName} &mdash; FAQ</h3>
                  <span class="faq-subtitle">Click the drop down to read</span>
                </div>
                <svg class="faq-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <div class="faq-content">
                <div class="faq-inner editable-block markdown-body" style="color: inherit;" data-file-path="${p.folderName}/03_FAQ.md">
                  ${marked.parse(p.faq)}
                </div>
              </div>
            </div>
        `;
        delay += 0.1;
      }
      if (p.executionPlan) {
        html += `
            <div class="immersive-glass-card animate-in" style="animation-delay: ${delay}s">
              <div class="editable-block markdown-body" style="color: inherit;" data-file-path="${p.folderName}/01_Execution_Plan.md">
                ${marked.parse(p.executionPlan)}
              </div>
            </div>
        `;
        delay += 0.1;
      }
      html += `</div>`;
    });
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
              <div class="org-node president" onclick="showOrgDetails('president')">President (Pauline)</div>
              
              <div class="org-branches">
                
                <div class="org-branch">
                  <div class="org-node chief" onclick="showOrgDetails('chief-staff')">Chief of Staff</div>
                  <div class="org-directors">
                    <div class="org-node sm" onclick="showOrgDetails('dir-acad')">Dir. Academics</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-rnd')">Dir. R&D</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-ss')">Dir. Student Services</div>
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
                    <div class="org-node sm" onclick="showOrgDetails('dir-extint')">Dir. EXT/INT</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-advocacy')">Dir. Advocacy</div>
                    <div class="org-node sm" onclick="showOrgDetails('dir-nat')">Dir. National Affairs</div>
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
        </div>
      </div>

      <div class="immersive-card-wrapper ecosystem-wrapper" style="margin-top: 3rem;">
        <div class="immersive-glass-card animate-in" style="animation-delay: ${delay + 0.2}s">
          <div class="ecosystem-explainer markdown-body">
            <h3 style="color: var(--primary); margin-bottom: 1rem; margin-top: 0;">SCG Organizational Ecosystem & Communications</h3>
            <p>The SCG structure operates on strict reporting cadences and escalation paths to ensure no project stalls due to administrative blockades.</p>
            
            <h4>Reporting Cadences</h4>
            <ul>
              <li><strong>Director-to-Chief (Weekly):</strong> Every Friday by 5:00 PM, Directors submit status updates to their respective Chief via Telegram, explicitly highlighting blocked tasks.</li>
              <li><strong>Chief-to-President (Biweekly):</strong> Chiefs consolidate reports and meet with the President biweekly to assess platform health, DAAM statuses, and budget burn rates.</li>
            </ul>

            <h4>Escalation Path for Blocked Dependencies</h4>
            <ol>
              <li><strong>24 Hours Blocked:</strong> Director notifies their Chief via Telegram. Chief attempts to unblock directly.</li>
              <li><strong>48 Hours Blocked:</strong> Chief escalates the issue to the President.</li>
              <li><strong>72 Hours Blocked / Imminent Risk:</strong> President calls an emergency alignment meeting with the affected Director and Chief to trigger fallback plans.</li>
              <li><strong>Administrative Blockade:</strong> If blocked by administration (e.g. Dean refuses LOA), the President and Chief of Staff assume direct control of communications to force a resolution.</li>
            </ol>

            <h4>Cross-Committee Synergy</h4>
            <p>Our projects overlap systematically based on the RACI matrices:</p>
            <ul>
              <li><strong>Dir. Documentations (Under COO):</strong> Acts as the administrative backbone, tracking all SLIFE, APS, and Post-Act submissions across all projects.</li>
              <li><strong>Dir. Finance:</strong> Manages all money movement. No expenditure moves without an SCT, and specimen signatures must be filed prior to event execution.</li>
              <li><strong>Dir. Creatives:</strong> Secures P&M clearance with a 24-hour minimum lead time for all public-facing materials.</li>
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
              Our specific initial seed fund amount is currently <strong>To Be Announced (TBA)</strong>, as we await final confirmation from the administration. Once the exact amount is provided, this page will be updated immediately. What we can confirm is our allocation ratio: the seed fund will be split evenly, <strong>50% toward the Sakuna Disaster/Emergency Pantry</strong> and <strong>50% toward Micro-Lending</strong>. All remaining projects (such as Transparency Platforms, Accessibility Initiatives, and Education Series) are <strong>zero-cost</strong> platforms. Any expansion of our funded initiatives will be fully supported through <strong>Semana ng Siyensya</strong> and the <strong>Fundraising & Local Business Collaboration Initiative</strong>, relying strictly on partnerships and merchandise, not student fees.<br><br><i>"I believe that the USG is transparent when it comes to the finances, no doubt. But it's where money is placed I believe is where things could be better. I will ensure to spend nothing on what doesn't matter, and everything I have on what does."</i>
            </p>
          </div>
        </div>
      `;
  } else if (target === 'me') {
    sideNavHtml += `
      <div class="nav-item" onclick="scrollToImmersiveCard(0)" data-index="0">
        <div class="nav-dot"></div>
        <div class="nav-label">About Me</div>
      </div>
    `;
    html += `
      <div class="immersive-card-wrapper" id="immersive-card-0" data-index="0">
        <h2 class="immersive-section-title animate-in" style="animation-delay: ${delay}s">
          My Hobbies & Interests
        </h2>
        <div class="immersive-glass-card animate-in" style="animation-delay: ${delay + 0.1}s">
          <p style="opacity: 0.8; margin-bottom: 1rem;">This space is reserved for personal hobbies and interests.</p>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  sideNavContainer.innerHTML = sideNavHtml;

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

    suggForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const successMsg = document.getElementById('imm-suggestion-success');
      successMsg.style.display = 'block';
      this.reset();
      document.getElementById('imm-lead-group').style.display = 'none';
      setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
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
      desc: 'Ultimate accountability for the execution, legality, and financial integrity of the platform.',
      projects: ['Signs DAAM LOAs', 'Decides Calamity Tier Activations (P6)', 'Signs Officer Advance Protocols (P6)', 'Primary speaker for Freelancing Seminar (P7)']
    },
    'chief-staff': {
      title: 'Chief of Staff',
      desc: 'Enforces policy compliance, handles sensitive legal/administrative roadblocks, and oversees student welfare projects.',
      projects: ['External Mediator coordination (P3)', 'Student Rights Charter (P3)', 'Lab Audit Access Letter (P4)', 'Legal Disclaimer Review (P5)']
    },
    'chief-ops': {
      title: 'Chief of Operations',
      desc: 'Ensures physical events run smoothly and financial protocols (transparency, FRA reports) are strictly followed.',
      projects: ['Overall Semana ng Siyensya Coordination (P2)', 'Accountability for Pantry Ops (P6) and Fundraising (P8)']
    },
    'chief-comms': {
      title: 'Chief Communications',
      desc: 'Oversees all public messaging, P&M clearances, advocacy initiatives, and external partnerships.',
      projects: ['Plan B Crowdfunding Drive (P8)']
    },
    'dir-acad': {
      title: 'Director for Academics',
      desc: 'Manages all educational resources and faculty coordination.',
      projects: ['COS Student Info Hub', 'Scholarship Calculator', 'Syllabus Transparency Portal', 'Academic Competitions and Faculty Incentives'],
      execs: 'Academics Executives (Data gathering, module building, faculty liaising)'
    },
    'dir-rnd': {
      title: 'Director for Research & Development',
      desc: 'Expands student research opportunities and funding.',
      projects: ['Research Grants Portal', 'Research Job Board', 'Research Readiness Survey'],
      execs: 'R&D Executives (Survey deployment, job board vetting)'
    },
    'dir-ss': {
      title: 'Director for Student Services',
      desc: 'Directly manages student grievances, welfare programs, and direct-aid initiatives.',
      projects: ['Grievance Channel', 'Suggestion Tab Moderation', 'Micro-Grant Fund Operations', 'Welfare Registry', 'Equipment Exchange Platform', 'Freelancing Seminar'],
      execs: 'Student Services Executives (Case logging, item condition checks, registry tracking)'
    },
    'dir-docs': {
      title: 'Director for Documentations',
      desc: 'The administrative backbone. Tracks all SLIFE, APS, SCT, and ADM Pre/Post-Acts.',
      projects: ['DAAM submissions', '14-day External MOA tracking', 'AET feedback collection', '48-hour seminar archive uploads'],
      execs: 'Docs Executives (Filing paperwork, minute-taking, clearance chasing)'
    },
    'dir-log': {
      title: 'Director for Logistics',
      desc: 'Handles physical venue bookings, equipment, and inventory management.',
      projects: ['Venue booking for Gaming Night', 'Lab Audit walkthroughs', 'Freelancing Seminar', 'Food Security Pantry Restock Triggers'],
      execs: 'Logistics Executives (Booth setups, physical inventory counting, equipment transport)'
    },
    'dir-fin': {
      title: 'Director for Finance',
      desc: 'Manages all money movement, SCT processing, and transparency.',
      projects: ['Financial Transparency Ledger', 'Merch Pre-orders', 'Initial Pantry Stock Procurement', 'DF Ring-Fence Declarations', 'FRA Reports & Proceeds Splits'],
      execs: 'Finance Executives (Receipt logging, budget tracking, deposit slips)'
    },
    'dir-creatives': {
      title: 'Director for Creatives',
      desc: 'Produces all visual assets and secures P&M clearances (24-hour lead time) before anything goes public.',
      projects: ['Merchandise Design', 'UI/UX for Web Platforms'],
      execs: 'Creatives Executives (Graphic design, copywriting, video editing)'
    },
    'dir-extint': {
      title: 'Director for EXT/INT Linkages',
      desc: 'Secures external partnerships, MOAs, and sponsorships.',
      projects: ['Discord Gaming Night', 'FSL Partner MOA Negotiation', 'Donation Drive', 'Local Business Partner Outreach & MOAs'],
      execs: 'EXT/INT Executives (Drafting emails, partner follow-ups, Discord moderation)'
    },
    'dir-advocacy': {
      title: 'Director for Advocacy',
      desc: 'Leads social justice, inclusion, and minority representation initiatives.',
      projects: ['FSL Training Program', 'STEM Archive', 'Lab Accessibility Audit', 'Queer Identity Science Forum', 'History Session', 'Shanghay Laya'],
      execs: 'Advocacy Executives (Speaker vetting, consent form collection, resource verification)'
    },
    'dir-nat': {
      title: 'Director for National Affairs',
      desc: 'In charge of publication materials on national issues, encourages COS students to be more politically active, and consults on socio-political alignment for advocacy projects.',
      projects: ['National issues information campaigns', 'Queer identity forums consultation'],
      execs: 'National Affairs Executives (Policy review, content research, and student engagement)'
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

