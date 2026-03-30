/**
 * 四季花海记忆花园 · 报告档案馆交互
 * 依赖：Chart.js（由 dashboard 引入）、/api/history-data
 */
(function () {
    'use strict';

    const root = document.getElementById('memoryGarden');
    if (!root) return;

    let speechTimer = null;

    const butterfliesLayer = document.getElementById('butterfliesLayer');
    const crystalList = document.getElementById('crystalList');
    const petalGrid = document.getElementById('petalCalendarGrid');
    const fairyText = document.getElementById('fairyAiText');
    const btnReadAgain = document.getElementById('btnFairyRead');

    const modal = document.getElementById('agCrystalModal');
    const modalOrb = modal && modal.querySelector('.ag-modal-orb');
    const modalTitle = document.getElementById('agCrystalTitle');
    const modalSummary = document.getElementById('agCrystalSummary');
    const modalDetail = document.getElementById('agCrystalDetail');

    const dayModal = document.getElementById('agDayModal');
    const dayTitle = document.getElementById('agDayTitle');
    const dayScore = document.getElementById('agDayScore');
    const dayMood = document.getElementById('agDayMood');

    const moodColors = {
        great: '#66bb6a',
        good: '#81c784',
        calm: '#a5d6a7',
        low: '#ffb74d',
        rest: '#90caf9'
    };

    const moodLabels = {
        great: '极佳',
        good: '不错',
        calm: '平和',
        low: '略低',
        rest: '休整'
    };

    function setParallax(clientX, clientY) {
        const rect = root.getBoundingClientRect();
        const nx = (clientX - rect.left) / rect.width - 0.5;
        const ny = (clientY - rect.top) / rect.height - 0.5;
        root.style.setProperty('--mx', (nx * 20).toFixed(3));
        root.style.setProperty('--my', (ny * 16).toFixed(3));
    }

    root.addEventListener('pointermove', (e) => setParallax(e.clientX, e.clientY));
    root.addEventListener('touchmove', (e) => {
        if (e.touches[0]) setParallax(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    /** 地面花朵：布置花瓣角度，划过盛开 */
    const flowerField = root.querySelector('.flower-field');
    if (flowerField) {
        const count = 48;
        for (let i = 0; i < count; i++) {
            const f = document.createElement('div');
            f.className = 'garden-flower';
            const petals = 5;
            for (let p = 0; p < petals; p++) {
                const el = document.createElement('div');
                el.className = 'petal';
                el.style.setProperty('--rot', ((360 / petals) * p) + 'deg');
                f.appendChild(el);
            }
            const c = document.createElement('div');
            c.className = 'center-dot';
            f.appendChild(c);
            flowerField.appendChild(f);
            f.addEventListener('mouseenter', () => f.classList.add('is-open'));
            f.addEventListener('mouseleave', () => f.classList.remove('is-open'));
            f.addEventListener('touchstart', () => f.classList.add('is-open'), { passive: true });
        }
    }

    /** 彩色蝴蝶 */
    const bfClasses = ['bf-pink', 'bf-blue', 'bf-gold', 'bf-violet'];
    function spawnButterflies(n) {
        if (!butterfliesLayer) return;
        for (let i = 0; i < n; i++) {
            const b = document.createElement('div');
            b.className = 'butterfly ' + bfClasses[i % bfClasses.length];
            b.innerHTML = '<span class="bf-wing-l"></span><span class="bf-wing-r"></span>';
            b.style.left = (8 + Math.random() * 84) + '%';
            b.style.top = (18 + Math.random() * 55) + '%';
            b.style.animation = 'none';
            butterfliesLayer.appendChild(b);
            animateButterfly(b);
            b.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (!butterfliesLayer) return;
                const lr = butterfliesLayer.getBoundingClientRect();
                const x = ev.clientX - lr.left - 14;
                const y = ev.clientY - lr.top - 11;
                b.classList.add('is-landed');
                b.style.position = 'absolute';
                b.style.left = Math.max(0, x) + 'px';
                b.style.top = Math.max(0, y) + 'px';
                window.setTimeout(() => {
                    b.classList.remove('is-landed');
                    b.style.left = (8 + Math.random() * 84) + '%';
                    b.style.top = (18 + Math.random() * 55) + '%';
                }, 2400);
            });
        }
    }

    function animateButterfly(el) {
        let x = parseFloat(el.style.left) || 40;
        let y = parseFloat(el.style.top) || 30;
        const tick = () => {
            if (!el.isConnected) return;
            if (el.classList.contains('is-landed')) {
                requestAnimationFrame(tick);
                return;
            }
            x += (Math.random() - 0.45) * 0.35;
            y += (Math.random() - 0.48) * 0.22;
            x = Math.max(5, Math.min(92, x));
            y = Math.max(12, Math.min(78, y));
            el.style.left = x + '%';
            el.style.top = y + '%';
            window.setTimeout(() => requestAnimationFrame(tick), 420 + Math.random() * 400);
        };
        requestAnimationFrame(tick);
    }

    spawnButterflies(14);

    function openCrystalModal(rep) {
        if (!modal || !modalTitle || !modalDetail) return;
        const type = rep.type || 'day';
        const vars = {
            day: ['radial-gradient(circle at 35% 30%, #fff, #7ec8ff)', 'rgba(120, 200, 255, 0.65)'],
            week: ['radial-gradient(circle at 35% 30%, #fce4ff, #c9a0ff)', 'rgba(200, 160, 255, 0.65)'],
            month: ['radial-gradient(circle at 35% 30%, #e8ffe8, #7ed957)', 'rgba(120, 220, 130, 0.65)'],
            year: ['radial-gradient(circle at 35% 30%, #fff9e0, #ffd54f)', 'rgba(255, 200, 80, 0.75)']
        };
        const v = vars[type] || vars.day;
        if (modalOrb) {
            modalOrb.style.setProperty('--modal-orb', v[0]);
            modalOrb.style.setProperty('--modal-glow', v[1]);
        }
        modalTitle.textContent = rep.title || '';
        if (modalSummary) modalSummary.textContent = rep.summary || '';
        modalDetail.textContent = rep.detail || '';
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeCrystalModal() {
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
    }

    if (modal) {
        modal.querySelectorAll('.ag-modal-backdrop, .ag-modal-close').forEach((el) => {
            el.addEventListener('click', closeCrystalModal);
        });
    }

    function openDayModal(day, score, mood) {
        if (!dayModal || !dayTitle || !dayScore || !dayMood) return;
        dayTitle.textContent = day + ' 日 · 情绪花瓣';
        dayScore.textContent = '身心指数 ' + score;
        dayMood.textContent = '状态：' + (moodLabels[mood] || mood);
        dayModal.classList.add('is-open');
        dayModal.setAttribute('aria-hidden', 'false');
    }

    function closeDayModal() {
        if (!dayModal) return;
        dayModal.classList.remove('is-open');
        dayModal.setAttribute('aria-hidden', 'true');
    }

    if (dayModal) {
        dayModal.querySelectorAll('.ag-modal-backdrop, .ag-modal-close').forEach((el) => {
            el.addEventListener('click', closeDayModal);
        });
    }

    function renderCrystals(reports) {
        if (!crystalList || !reports) return;
        crystalList.innerHTML = '';
        reports.forEach((rep) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'crystal-orb type-' + (rep.type === 'day' ? 'day' : rep.type === 'week' ? 'week' : rep.type === 'month' ? 'month' : 'year');
            btn.innerHTML = '<span class="crystal-title"></span><p class="crystal-summary"></p>';
            btn.querySelector('.crystal-title').textContent = rep.title || '';
            btn.querySelector('.crystal-summary').textContent = rep.summary || '';
            btn.addEventListener('click', () => {
                btn.classList.remove('is-spinning');
                void btn.offsetWidth;
                btn.classList.add('is-spinning');
                openCrystalModal(rep);
            });
            crystalList.appendChild(btn);
        });
    }

    function renderCalendar(cal, y, m, monthLabel) {
        if (!petalGrid) return;
        petalGrid.innerHTML = '';
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach((w) => {
            const h = document.createElement('div');
            h.className = 'cal-weekday';
            h.textContent = w;
            petalGrid.appendChild(h);
        });
        const first = new Date(y, m - 1, 1).getDay();
        for (let i = 0; i < first; i++) {
            const e = document.createElement('div');
            e.className = 'day-petal empty';
            petalGrid.appendChild(e);
        }
        (cal || []).forEach((d) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'day-petal mood';
            btn.textContent = d.day;
            const col = moodColors[d.mood] || '#a8ddb0';
            btn.style.setProperty('--pcolor', col);
            btn.addEventListener('click', () => {
                btn.classList.add('is-fallen');
                window.setTimeout(() => {
                    btn.classList.remove('is-fallen');
                    openDayModal(d.day, d.score, d.mood);
                }, 850);
            });
            petalGrid.appendChild(btn);
        });
        const calTitle = document.getElementById('moodCalendarTitle');
        if (calTitle) calTitle.textContent = '情绪日历 · ' + (monthLabel || m + ' 月');
    }

    /** 花仙子朗读 + 花瓣字 */
    let speechTimer = null;
    function speakSummary(text) {
        if (!text) return;
        if (!window.speechSynthesis) {
            typePetals(text);
            return;
        }
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        u.rate = 0.92;
        u.pitch = 1.05;
        window.speechSynthesis.speak(u);
        typePetals(text);
    }

    function typePetals(text) {
        if (!fairyText) return;
        fairyText.innerHTML = '';
        speechTimer && clearInterval(speechTimer);
        const chars = text.split('');
        let i = 0;
        const span = document.createElement('span');
        span.className = 'falling-line';
        fairyText.appendChild(span);
        speechTimer = setInterval(() => {
            if (i >= chars.length) {
                clearInterval(speechTimer);
                return;
            }
            const ch = chars[i];
            const s = document.createElement('span');
            s.textContent = ch;
            s.style.display = 'inline-block';
            s.style.animation = 'petalChar 0.55s ease-out';
            s.style.setProperty('--py', (Math.random() * 8 - 4) + 'px');
            span.appendChild(s);
            i++;
        }, 55);
    }

    /** 注入花瓣字动画 */
    const style = document.createElement('style');
    style.textContent = '@keyframes petalChar{0%{opacity:0;transform:translateY(-10px) rotate(-8deg)}100%{opacity:1;transform:translateY(var(--py,0)) rotate(0)}}';
    document.head.appendChild(style);

    fetch('/api/history-data', { credentials: 'same-origin' })
        .then((r) => r.json())
        .then((data) => {
            if (data.season) root.setAttribute('data-season', data.season);
            renderCrystals(data.reports);
            renderCalendar(data.calendar, data.year, data.month, data.month_label);

            if (fairyText && data.ai_summary) {
                fairyText.textContent = '';
                typePetals(data.ai_summary);
            }

            const canvas = document.getElementById('historyChart');
            if (canvas && typeof Chart !== 'undefined' && data.labels && data.values) {
                const ctx = canvas.getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: '历史检测得分',
                            data: data.values,
                            borderColor: '#2e7d4a',
                            backgroundColor: 'rgba(46, 125, 74, 0.12)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: true } }
                    }
                });
            }
        })
        .catch(() => {});

    if (btnReadAgain) {
        btnReadAgain.addEventListener('click', () => {
            fetch('/api/history-data', { credentials: 'same-origin' })
                .then((r) => r.json())
                .then((d) => {
                    if (d.ai_summary) speakSummary(d.ai_summary);
                })
                .catch(() => {});
        });
    }
})();
