/**
 * ============================================================================
 * STUDENT SERVICES HUB - CONFIGURATION & DESIGN SYSTEM
 * ============================================================================
 * 
 * HOW TO EDIT THIS FILE:
 * 1. Right-click this file and open with Notepad, VSCode, or any text editor.
 * 2. To change colors, fonts, or sizes, edit the `DESIGN_SYSTEM` object below.
 * 3. To change the text, links, or buttons, edit the `CONTENT` object below.
 * 4. Save the file. The website will automatically update!
 * 
 * NOTE FOR AI ASSISTANTS: This file is the single source of truth for the 
 * Student Services tab. All CSS is dynamically generated from the DESIGN_SYSTEM.
 */

const StudentServicesConfig = {
    // 🎨 1. DESIGN SYSTEM (Change colors and fonts here)
    DESIGN_SYSTEM: {
        colors: {
            primaryText: "#FFFFFF",        // Main text color
            secondaryText: "rgba(255, 255, 255, 0.7)",      // Subtitles and softer text
            backgroundColor: "transparent",// Background of the tab
            cardBackground: "rgba(255, 255, 255, 0.04)",     // Background of the glass cards
            borderColor: "rgba(255, 255, 255, 0.1)",        // Borders around cards
            
            // Tooltip Colors (The [i] button)
            tooltipIconBg: "rgba(255, 255, 255, 0.1)",
            tooltipIconText: "#d8b4fe",
            tooltipPopupBg: "rgba(15, 15, 25, 0.95)",
            tooltipPopupText: "#FFFFFF",

            // Bento Box Highlights (The big buttons)
            categoryColors: {
                enlistment: { bg: "rgba(236, 72, 153, 0.15)", text: "#FFFFFF", border: "rgba(236, 72, 153, 0.4)", lightBg: "rgba(236, 72, 153, 0.05)" }, // Pink Glass
                finance: { bg: "rgba(16, 185, 129, 0.15)", text: "#FFFFFF", border: "rgba(16, 185, 129, 0.4)", lightBg: "rgba(16, 185, 129, 0.05)" },    // Green Glass
                advising: { bg: "rgba(139, 92, 246, 0.15)", text: "#FFFFFF", border: "rgba(139, 92, 246, 0.4)", lightBg: "rgba(139, 92, 246, 0.05)" },   // Purple Glass
                grievance: { bg: "rgba(245, 158, 11, 0.15)", text: "#FFFFFF", border: "rgba(245, 158, 11, 0.4)", lightBg: "rgba(245, 158, 11, 0.05)" },  // Orange Glass
                shifting: { bg: "rgba(14, 165, 233, 0.15)", text: "#FFFFFF", border: "rgba(14, 165, 233, 0.4)", lightBg: "rgba(14, 165, 233, 0.05)" }    // Blue Glass
            }
        },
        typography: {
            titleFont: "'Clash Display', sans-serif",
            bodyFont: "'Poppins', sans-serif",
            
            // Font Sizes
            heroTitleSize: "clamp(2rem, 5vw, 3rem)",
            heroSubtitleSize: "1.1rem",
            cardTitleSize: "1.5rem",
            headingSize: "1.2rem",
            textSize: "0.95rem",
            tooltipTextSize: "0.85rem"
        },
        layout: {
            cardRadius: "16px",
            buttonRadius: "8px"
        }
    },

    // 📝 2. CONTENT (Change the actual information here)
    CONTENT: {
        heroTitle: "Student Services & Info",
        heroSubtitle: "Everything you need to survive and thrive, explained simply. Click a category below to expand.",
        
        // Glossary: Add terms here and wrap them in @term@ in the text below to make them tooltips!
        // Example: "You need your @EAF@ to enter."
        glossary: {
            "EAF": "Enrollment Assessment Form - Your official proof of enrollment showing your schedule and fees.",
            "Archers Hub": "The new centralized portal for enlistment, adding/dropping subjects, clearances, and administrative tickets.",
            "Clearance": "A status indicating you have no pending liabilities (financial, library, disciplinary). Required to enroll.",
            "Flowchart": "Your degree's map of subjects. You must follow the prerequisites listed here."
        },

        // The Categories (Big Buttons)
        categories: [
            {
                id: "enlistment",
                title: "ENLISTMENT",
                subtitle: "Schedules, Flowcharts, & Archers Hub",
                colorKey: "enlistment",
                sections: [
                    {
                        type: "highlight",
                        content: "**The Process:** Enlistment happens via @Archers Hub@. Ensure your @Clearance@ is settled before your scheduled date."
                    },
                    {
                        type: "links",
                        title: "Important Links",
                        items: [
                            { text: "Archers Hub (Adding/Dropping Guide)", url: "https://www.facebook.com/share/p/186o9KhVcU/" },
                            { text: "Archers Hub (Logging In)", url: "https://www.facebook.com/share/p/1AsMkTd53V/" },
                            { text: "Steps for Dropping", url: "https://www.facebook.com/share/18AVQhCkDW/" },
                            { text: "Schedule for Dropping & Withdrawal", url: "https://www.facebook.com/share/p/1BedQ96nJd/" },
                            { text: "Term Enrollment Guide", url: "https://www.dlsu.edu.ph/wp-content/uploads/pdf/registrar/schedules/enroll_ug.pdf" },
                            { text: "ID124 Flowcharts", url: "https://bit.ly/COS_ID124FLOWCHARTS" },
                            { text: "COS Course Offerings", url: "https://bit.ly/COS_T2CourseOfferings" },
                            { text: "USG Enlistment Guide", url: "https://linktr.ee/USGOVPIA_Enlistment_Guide" }
                        ]
                    }
                ]
            },
            {
                id: "finance",
                title: "FEES & PAYMENT",
                subtitle: "Tuition Tables & Payment Channels",
                colorKey: "finance",
                sections: [
                    {
                        type: "highlight",
                        content: "**Settling Your Fees:** Once you have your @EAF@, you must settle your tuition to avoid being dropped from your classes. Late payments incur surcharges."
                    },
                    {
                        type: "links",
                        title: "Payment Resources",
                        items: [
                            { text: "Settling Payment Guide", url: "https://www.facebook.com/share/p/174z5zFchQ/" },
                            { text: "Updated Payment Channels", url: "https://www.facebook.com/share/p/1DZ8icCGa7/" },
                            { text: "View Tuition Fee Table", url: "https://enroll.dlsu.edu.ph/dlsu/view_fees_table" },
                            { text: "Glossary of Fees (What are you paying for?)", url: "https://www.dlsu.edu.ph/wp-content/uploads/pdf/registrar/glossary-of-fees.pdf" }
                        ]
                    }
                ]
            },
            {
                id: "advising",
                title: "ACADEMIC ADVISING",
                subtitle: "Need help with your subjects?",
                colorKey: "advising",
                sections: [
                    {
                        type: "text",
                        title: "Who to talk to",
                        content: "If you failed a prerequisite or need to adjust your @Flowchart@, contact your Academic Adviser immediately."
                    },
                    {
                        type: "links",
                        title: "Support Channels",
                        items: [
                            { text: "iNeedAssistProgram (USG Telegram)", url: "https://bit.ly/USG_iNeedAssistProgram" }
                        ]
                    }
                ]
            },
            {
                id: "grievance",
                title: "ADMIN & GRIEVANCES",
                subtitle: "IT Support & Admin Tickets",
                colorKey: "grievance",
                sections: [
                    {
                        type: "highlight",
                        content: "**NOTE:** Always file a ticket via @Archers Hub@ first before reaching out to the SCG. Provide your Ticket Number when asking us for follow-ups!"
                    },
                    {
                        type: "table",
                        title: "Who to Contact",
                        headers: ["Issue", "DLSU Admin", "USG Help"],
                        rows: [
                            ["Cannot log into Archers Hub", "ITS Help Desk", "SCG Welfare Board"],
                            ["Clearance Hold Issue", "Archers Hub Admin Services", "USG OVPIA"],
                            ["Professor Grievance", "Department Vice Chair", "SCG Batch Rep"]
                        ]
                    },
                    {
                        type: "links",
                        title: "Portals",
                        items: [
                            { text: "Archers Hub (Availing Admin Services)", url: "https://www.facebook.com/share/p/1DJDqpyZdD/" },
                            { text: "ITS FAQs", url: "https://www.dlsu.edu.ph/offices/its/frequently-asked-questions/#mls" }
                        ]
                    }
                ]
            },
            {
                id: "shifting",
                title: "SHIFTING",
                subtitle: "Changing your degree program",
                colorKey: "shifting",
                sections: [
                    {
                        type: "highlight",
                        content: "**Internal Shifting** is moving to another course *within* the College of Science.\n\n**External Shifting** is moving to a different college entirely (e.g., CLA or COB). Both require passing grades and clearance from your current department."
                    }
                ]
            }
        ]
    }
};

/**
 * ============================================================================
 * RENDERING ENGINE (DO NOT EDIT BELOW UNLESS YOU KNOW JAVASCRIPT)
 * ============================================================================
 */

(function() {
    // 1. Inject the Design System CSS
    function injectStyles() {
        const ds = StudentServicesConfig.DESIGN_SYSTEM;
        let css = `
            /* Dynamically Generated CSS from DESIGN_SYSTEM */
            #student-services {
                background-color: ${ds.colors.backgroundColor};
                color: ${ds.colors.primaryText};
                font-family: ${ds.typography.bodyFont};
            }
            .ss-hero {
                text-align: center;
                margin-bottom: 3rem;
            }
            .ss-hero-title {
                font-family: ${ds.typography.titleFont};
                font-size: ${ds.typography.heroTitleSize};
                font-weight: 700;
                margin-bottom: 0.5rem;
                color: ${ds.colors.primaryText};
            }
            .ss-hero-subtitle {
                font-size: ${ds.typography.heroSubtitleSize};
                color: ${ds.colors.secondaryText};
                max-width: 600px;
                margin: 0 auto;
            }
            .ss-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
            }
            .ss-card {
                background-color: ${ds.colors.cardBackground};
                backdrop-filter: blur(32px);
                -webkit-backdrop-filter: blur(32px);
                border: 1px solid ${ds.colors.borderColor};
                border-right: 1px solid rgba(255, 255, 255, 0.03);
                border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                border-radius: ${ds.layout.cardRadius};
                overflow: hidden;
                box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .ss-card-header {
                padding: 1.5rem;
                cursor: pointer;
                transition: background-color 0.2s;
                position: relative;
            }
            .ss-card-header:hover {
                filter: brightness(1.1);
            }
            .ss-card-header::after {
                content: "▼";
                position: absolute;
                right: 1.5rem;
                top: 50%;
                transform: translateY(-50%);
                font-size: 1rem;
                transition: transform 0.3s;
                opacity: 0.8;
            }
            .ss-card.expanded .ss-card-header::after {
                transform: translateY(-50%) rotate(180deg);
            }
            .ss-card-title {
                font-family: ${ds.typography.titleFont};
                font-size: ${ds.typography.cardTitleSize};
                font-weight: 700;
                margin-bottom: 0.25rem;
                letter-spacing: 0.02em;
            }
            .ss-card-subtitle {
                font-size: 0.95rem;
                opacity: 0.9;
            }
            .ss-card-content {
                padding: 0 1.5rem;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.4s ease-out, padding 0.4s ease;
                background-color: transparent;
            }
            .ss-card.expanded .ss-card-content {
                padding: 1.5rem;
                max-height: 1000px;
                border-top: 1px solid ${ds.colors.borderColor};
            }
            .ss-section {
                margin-bottom: 1.5rem;
            }
            .ss-section:last-child {
                margin-bottom: 0;
            }
            .ss-section-title {
                font-family: ${ds.typography.titleFont};
                font-size: ${ds.typography.headingSize};
                font-weight: 600;
                margin-bottom: 0.75rem;
                color: ${ds.colors.primaryText};
            }
            .ss-text {
                font-size: ${ds.typography.textSize};
                line-height: 1.6;
                color: ${ds.colors.secondaryText};
            }
            .ss-highlight-block {
                background: rgba(255, 255, 255, 0.04);
                border-left: 3px solid #d8b4fe;
                padding: 14px 18px;
                border-radius: 0 12px 12px 0;
                font-size: ${ds.typography.textSize};
                line-height: 1.6;
                color: ${ds.colors.primaryText};
            }
            .ss-link {
                display: inline-block;
                padding: 0.5rem 1rem;
                background-color: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: ${ds.colors.primaryText};
                text-decoration: none;
                border-radius: ${ds.layout.buttonRadius};
                font-weight: 500;
                margin-right: 0.5rem;
                margin-bottom: 0.5rem;
                transition: background-color 0.2s, transform 0.2s;
            }
            .ss-link:hover {
                background-color: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }
            .ss-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.95rem;
            }
            .ss-table th, .ss-table td {
                padding: 0.75rem;
                text-align: left;
                border-bottom: 1px solid ${ds.colors.borderColor};
            }
            .ss-table th {
                font-weight: 600;
                background-color: rgba(255, 255, 255, 0.08);
                color: ${ds.colors.primaryText};
            }
            
            /* Tooltip Styles */
            .ss-tooltip-trigger {
                position: relative;
                display: inline-flex;
                align-items: center;
                gap: 2px;
                cursor: help;
                font-weight: 600;
                color: ${ds.colors.primaryText};
                border-bottom: 1px dashed ${ds.colors.secondaryText};
            }
            .ss-tooltip-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 14px;
                height: 14px;
                background-color: ${ds.colors.tooltipIconBg};
                color: ${ds.colors.tooltipIconText};
                border-radius: 50%;
                font-size: 10px;
                font-weight: bold;
                font-style: normal;
                margin-left: 2px;
            }
            .ss-tooltip-popup {
                position: absolute;
                bottom: 120%;
                left: 50%;
                transform: translateX(-50%) translateY(10px);
                background-color: ${ds.colors.tooltipPopupBg};
                color: ${ds.colors.tooltipPopupText};
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                font-size: ${ds.typography.tooltipTextSize};
                width: max-content;
                max-width: 250px;
                text-align: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s, transform 0.2s;
                z-index: 100;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                pointer-events: none;
                font-weight: normal;
            }
            .ss-tooltip-popup::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: ${ds.colors.tooltipPopupBg} transparent transparent transparent;
            }
            .ss-tooltip-trigger:hover .ss-tooltip-popup {
                opacity: 1;
                visibility: visible;
                transform: translateX(-50%) translateY(0);
            }
        `;

        // Inject category specific colors
        for (const [key, colors] of Object.entries(ds.colors.categoryColors)) {
            css += `
                .ss-card-header-${key} {
                    background-color: ${colors.bg};
                    color: ${colors.text};
                    border-bottom: 1px solid ${colors.border};
                }
                .ss-card-${key}.expanded .ss-card-content {
                    background-color: ${colors.lightBg};
                }
                .ss-card-header-${key} .ss-card-subtitle {
                    color: rgba(255,255,255,0.85);
                }
            `;
        }

        const styleEl = document.createElement('style');
        styleEl.id = 'student-services-styles';
        styleEl.innerHTML = css;
        document.head.appendChild(styleEl);
    }

    // 2. Parse Markdown-like tags (e.g. bold, tooltips)
    function parseText(text) {
        let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Find @term@ for tooltips
        parsed = parsed.replace(/@(.*?)@/g, (match, term) => {
            const definition = StudentServicesConfig.CONTENT.glossary[term];
            if (definition) {
                return `
                    <span class="ss-tooltip-trigger">
                        ${term}<i class="ss-tooltip-icon">i</i>
                        <span class="ss-tooltip-popup">${definition}</span>
                    </span>
                `;
            }
            return term; // Fallback if not found in glossary
        });
        
        return parsed;
    }

    // 3. Render Sections
    function renderSections(sections) {
        let html = '';
        sections.forEach(sec => {
            html += `<div class="ss-section">`;
            if (sec.title) html += `<h4 class="ss-section-title">${sec.title}</h4>`;
            
            if (sec.type === 'text') {
                html += `<div class="ss-text">${parseText(sec.content)}</div>`;
            } else if (sec.type === 'highlight') {
                html += `<div class="ss-highlight-block">${parseText(sec.content)}</div>`;
            } else if (sec.type === 'links') {
                html += `<div>`;
                sec.items.forEach(link => {
                    html += `<a href="${link.url}" target="_blank" class="ss-link">${link.text} ↗</a>`;
                });
                html += `</div>`;
            } else if (sec.type === 'table') {
                html += `
                    <div style="overflow-x: auto;">
                        <table class="ss-table">
                            <thead>
                                <tr>${sec.headers.map(h => `<th>${h}</th>`).join('')}</tr>
                            </thead>
                            <tbody>
                                ${sec.rows.map(row => `<tr>${row.map(cell => `<td>${parseText(cell)}</td>`).join('')}</tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            html += `</div>`;
        });
        return html;
    }

    // 4. Main Render Function
    window.renderStudentServices = function(containerId = 'student-services') {
        const container = document.getElementById(containerId);
        if (!container) return; // Wait until container exists

        // Only inject styles once
        if (!document.getElementById('student-services-styles')) {
            injectStyles();
        }

        const content = StudentServicesConfig.CONTENT;
        
        let html = `
            <div class="ss-hero">
                <h1 class="ss-hero-title">${content.heroTitle}</h1>
                <p class="ss-hero-subtitle">${content.heroSubtitle}</p>
            </div>
            <div class="ss-grid">
        `;

        content.categories.forEach(cat => {
            html += `
                <div class="ss-card ss-card-${cat.colorKey}" onclick="this.classList.toggle('expanded')">
                    <div class="ss-card-header ss-card-header-${cat.colorKey}">
                        <div class="ss-card-title">${cat.title}</div>
                        <div class="ss-card-subtitle">${cat.subtitle}</div>
                    </div>
                    <div class="ss-card-content" onclick="event.stopPropagation()">
                        ${renderSections(cat.sections)}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    };

})();
