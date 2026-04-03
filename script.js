// Database matching high-tier FF logic
const PresetDatabase = [
    { category: "Esports", name: "Pro Player", code: "[b][c][00FFFF]ESPORTS PLAYER\n[FFFFFF]▃ ▄ ▅ ▆ ▇ █ 100%" },
    { category: "Esports", name: "Clutch Master", code: "[b][c][00FF00]1 VS 4 CLUTCH\n[FFFFFF]M A S T E R" },
    { category: "Gun Art", name: "One Tap God", code: "[b][c][FF0099]◈ ONE TAP GOD ◈\n[FFFFFF]▄︻̷̿┻̿═━一" },
    { category: "Gun Art", name: "Sniper King", code: "[b][c][FF0000]A W M  K I N G\n[FFFFFF]︻デ═一" },
    { category: "Toxic/Aggro", name: "No Mercy", code: "[b][c][FF0000]NO MERCY\n[FFFFFF]☠︎︎ DEAD ZONE ☠︎︎" },
    { category: "Toxic/Aggro", name: "Hacker Eye", code: "[b][c][00FF00]◈ HACKER EYE ◈\n[FFFFFF](⌐■_■)" },
    { category: "Minimal", name: "King is Back", code: "[b][c][FFFFFF]KING IS BACK\n[FFD700]亗" },
    { category: "Colors", name: "Red Ruler", code: "[b][c][FF4500]Red Ruler" }
];

const Engine = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderCategories();
        this.renderGrid('All');
        this.updatePreview(this.dom.input.value);
    },

    cacheDOM() {
        this.dom = {
            input: document.getElementById('bio-input'),
            preview: document.getElementById('live-preview'),
            copyStudioBtn: document.getElementById('copy-studio'),
            toolBtns: document.querySelectorAll('.tool-btn'),
            categoryNav: document.getElementById('category-filters'),
            grid: document.getElementById('preset-grid'),
            toastZone: document.getElementById('toast-zone')
        };
    },

    bindEvents() {
        this.dom.input.addEventListener('input', (e) => this.updatePreview(e.target.value));
        
        this.dom.toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.injectCode(e.target.dataset.inject));
        });

        this.dom.copyStudioBtn.addEventListener('click', () => this.copyToClipboard(this.dom.input.value));
    },

    // The Parser: Translates FF logic to HTML
    parseFFCode(rawText) {
        if (!rawText) return "Your output will appear here...";
        
        // Escape HTML to prevent XSS
        let safeText = rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Split by lines to handle [c] (center) block by block natively
        let lines = safeText.split('\n');
        
        let processedLines = lines.map(line => {
            let parsed = line;
            let styles = [];
            let isCentered = false;

            // Extract modifiers
            if (parsed.includes('[c]')) { isCentered = true; parsed = parsed.replace(/\[c\]/g, ''); }
            if (parsed.includes('[b]')) { styles.push('font-weight: 900'); parsed = parsed.replace(/\[b\]/g, ''); }
            if (parsed.includes('[i]')) { styles.push('font-style: italic'); parsed = parsed.replace(/\[i\]/g, ''); }

            // Handle Hex Colors e.g. [FF0000]Text -> applies color to the rest of the string
            // We use a regex that matches [HEX] and wraps the following text in a span
            let parts = parsed.split(/(\[[0-9a-fA-F]{6}\])/g);
            let coloredHTML = "";
            let currentColor = "inherit";

            parts.forEach(part => {
                if (part.match(/\[([0-9a-fA-F]{6})\]/)) {
                    currentColor = `#${part.replace(/[\[\]]/g, '')}`;
                } else if (part !== "") {
                    coloredHTML += `<span style="color: ${currentColor}">${part}</span>`;
                }
            });

            // Build final line structure
            let lineStyle = `display: block; ${isCentered ? 'text-align: center;' : 'text-align: left;'} ${styles.join(';')}`;
            return `<div style="${lineStyle}">${coloredHTML || "&nbsp;"}</div>`;
        });

        return processedLines.join('');
    },

    updatePreview(text) {
        this.dom.preview.innerHTML = this.parseFFCode(text);
    },

    injectCode(code) {
        const input = this.dom.input;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        
        input.value = text.substring(0, start) + code + text.substring(end);
        input.focus();
        input.selectionStart = input.selectionEnd = start + code.length;
        
        this.updatePreview(input.value);
    },

    renderCategories() {
        const categories = ['All', ...new Set(PresetDatabase.map(p => p.category))];
        
        this.dom.categoryNav.innerHTML = categories.map((cat, idx) => `
            <button class="filter-btn ${idx === 0 ? 'active' : ''}" data-cat="${cat}">${cat}</button>
        `).join('');

        this.dom.categoryNav.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.dom.categoryNav.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderGrid(e.target.dataset.cat);
            });
        });
    },

    renderGrid(filter) {
        const filtered = filter === 'All' ? PresetDatabase : PresetDatabase.filter(p => p.category === filter);
        
        this.dom.grid.innerHTML = filtered.map(preset => `
            <div class="preset-card">
                <div class="card-preview">${this.parseFFCode(preset.code)}</div>
                <div class="card-footer">
                    <span class="card-name">${preset.name}</span>
                    <button class="icon-copy-btn" data-code="${preset.code}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Attach copy events to new cards
        this.dom.grid.querySelectorAll('.icon-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.copyToClipboard(e.currentTarget.dataset.code));
        });
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = 'Bio Code Copied!';
            this.dom.toastZone.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => Engine.init());
