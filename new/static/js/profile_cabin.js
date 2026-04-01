(function () {
    'use strict';

    const root = document.getElementById('cabinRoot');
    const lampBtn = document.getElementById('lampHotspot');
    const plush = document.getElementById('plushSpirit');
    const plushWrap = document.getElementById('plushWrap');
    const btnExport = document.getElementById('btnExport');
    const exportToast = document.getElementById('exportToast');

    const customGrid = document.getElementById('customGrid');
    const emotionInput = document.getElementById('emotionInput');
    const btnVoice = document.getElementById('btnVoice');
    const btnClearInput = document.getElementById('btnClearInput');
    const btnDropBad = document.getElementById('btnDropBad');
    const btnStoreGood = document.getElementById('btnStoreGood');
    const badList = document.getElementById('badList');
    const goodList = document.getElementById('goodList');

    const lampModes = ['mid', 'bright', 'dim'];
    let lampIdx = 0;

    if (root) {
        root.dataset.lamp = lampModes[lampIdx];
    }

    if (lampBtn && root) {
        lampBtn.addEventListener('click', () => {
            lampIdx = (lampIdx + 1) % lampModes.length;
            root.dataset.lamp = lampModes[lampIdx];
        });
    }

    if (plush) {
        let stretchTimer = null;
        plush.addEventListener('click', (e) => {
            e.stopPropagation();
            if (plushWrap && plushWrap.classList.contains('delivering')) return;
            plush.classList.remove('stretching');
            void plush.offsetWidth;
            plush.classList.add('stretching');
            if (stretchTimer) clearTimeout(stretchTimer);
            stretchTimer = window.setTimeout(() => {
                plush.classList.remove('stretching');
            }, 1150);
        });
    }

    /** 卡片随指针轻微 3D 倾斜 */
    document.querySelectorAll('.tilt-card[data-card]').forEach((card) => {
        let rect;
        const maxTilt = 8;
        const onMove = (clientX, clientY) => {
            if (!rect) return;
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const nx = (clientX - cx) / (rect.width / 2);
            const ny = (clientY - cy) / (rect.height / 2);
            const rx = (-ny * maxTilt).toFixed(2);
            const ry = (nx * maxTilt).toFixed(2);
            card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
        };
        card.addEventListener('pointerenter', () => {
            rect = card.getBoundingClientRect();
        });
        card.addEventListener('pointermove', (e) => {
            rect = card.getBoundingClientRect();
            onMove(e.clientX, e.clientY);
        });
        card.addEventListener('pointerleave', () => {
            card.style.transform = '';
            rect = null;
        });
    });

    function syncDeviceRow(checkbox) {
        const item = checkbox.closest('.prop-item');
        if (!item) return;
        const on = checkbox.checked;
        item.dataset.connected = on ? '1' : '0';
        const status = item.querySelector('.prop-status');
        if (status) status.textContent = on ? '已连接' : '未连接';
    }

    document.querySelectorAll('.prop-item input[type="checkbox"][data-device]').forEach((cb) => {
        cb.addEventListener('change', () => syncDeviceRow(cb));
        syncDeviceRow(cb);
    });

    function syncPermToggle(toggle) {
        const input = toggle.querySelector('input[type="checkbox"]');
        if (!input) return;
        const lock = toggle.querySelector('.perm-lock');
        const on = input.checked;
        toggle.classList.toggle('is-on', on);
        toggle.classList.toggle('is-off', !on);
        if (lock) {
            lock.className = 'perm-lock fas ' + (on ? 'fa-lock-open' : 'fa-lock');
        }
    }

    function updateBarrier() {
        if (!root) return;
        const n = document.querySelectorAll('.privacy-list .perm-toggle input:checked').length;
        root.classList.toggle('barrier-lit', n > 0);
    }

    document.querySelectorAll('.privacy-list .perm-toggle').forEach((toggle) => {
        const input = toggle.querySelector('input');
        if (input) {
            input.addEventListener('change', () => {
                syncPermToggle(toggle);
                updateBarrier();
            });
            syncPermToggle(toggle);
        }
    });
    updateBarrier();

    if (btnExport && plushWrap && exportToast) {
        btnExport.addEventListener('click', () => {
            if (plushWrap.classList.contains('delivering')) return;
            plushWrap.classList.add('delivering');
            exportToast.classList.remove('show');
            window.setTimeout(() => {
                exportToast.classList.add('show');
            }, 950);
            window.setTimeout(() => {
                plushWrap.classList.remove('delivering');
            }, 2800);
            window.setTimeout(() => {
                exportToast.classList.remove('show');
            }, 5200);
        });
    }

    /* ---------------- 个性化定制（本地示意：CSS 变量 + localStorage） ---------------- */
    const LS = {
        theme: 'cabin_theme',
        plushHue: 'cabin_plush_hue',
        bad: 'cabin_bad_logs',
        good: 'cabin_good_logs'
    };

    function applyTheme(key) {
        const map = {
            warm: { sceneTint: '0deg' },
            lavender: { sceneTint: '18deg' },
            ocean: { sceneTint: '-14deg' }
        };
        const v = map[key] || map.warm;
        document.documentElement.style.setProperty('--scene-tint', v.sceneTint);
        try { localStorage.setItem(LS.theme, key); } catch (_) {}
        if (customGrid) {
            customGrid.querySelectorAll('.chip-btn[data-theme]').forEach((b) => {
                b.classList.toggle('is-active', b.getAttribute('data-theme') === key);
            });
        }
    }

    function applyPlushHue(deg) {
        const v = String(Number(deg) || 0) + 'deg';
        document.documentElement.style.setProperty('--plush-hue', v);
        try { localStorage.setItem(LS.plushHue, String(Number(deg) || 0)); } catch (_) {}
        if (customGrid) {
            customGrid.querySelectorAll('.chip-btn[data-plush]').forEach((b) => {
                b.classList.toggle('is-active', b.getAttribute('data-plush') === String(Number(deg) || 0));
            });
        }
    }

    if (customGrid) {
        customGrid.querySelectorAll('.chip-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                const plushHue = btn.getAttribute('data-plush');
                if (theme) applyTheme(theme);
                if (plushHue !== null && plushHue !== undefined) applyPlushHue(plushHue);
            });
        });
    }

    // 恢复本地选择
    try {
        applyTheme(localStorage.getItem(LS.theme) || 'warm');
        applyPlushHue(localStorage.getItem(LS.plushHue) || '0');
    } catch (_) {}

    /* ---------------- 情绪收纳：垃圾桶 & 宝箱 ---------------- */
    function readLogs(key) {
        try {
            const raw = localStorage.getItem(key);
            const v = raw ? JSON.parse(raw) : [];
            return Array.isArray(v) ? v : [];
        } catch (_) {
            return [];
        }
    }

    function writeLogs(key, arr) {
        try { localStorage.setItem(key, JSON.stringify(arr.slice(0, 80))); } catch (_) {}
    }

    function fmt(ts) {
        try {
            const d = new Date(ts);
            return d.toLocaleString();
        } catch (_) {
            return '';
        }
    }

    function renderList(ul, items) {
        if (!ul) return;
        ul.innerHTML = '';
        (items || []).slice(0, 20).forEach((it) => {
            const li = document.createElement('li');
            li.className = 'emotion-item';
            li.textContent = it.text || '';
            const meta = document.createElement('div');
            meta.className = 'emotion-meta';
            meta.textContent = fmt(it.ts);
            li.appendChild(meta);
            ul.appendChild(li);
        });
    }

    function flashScene(mode) {
        if (!root) return;
        root.classList.remove('cabin--vent', 'cabin--joy');
        void root.offsetWidth;
        root.classList.add(mode);
        window.setTimeout(() => root.classList.remove(mode), 4200);
    }

    function addLog(kind) {
        const t = (emotionInput && emotionInput.value || '').trim();
        if (!t) return;
        const entry = { ts: Date.now(), text: t };
        if (kind === 'bad') {
            const arr = [entry, ...readLogs(LS.bad)];
            writeLogs(LS.bad, arr);
            renderList(badList, arr);
            flashScene('cabin--vent');
        } else {
            const arr = [entry, ...readLogs(LS.good)];
            writeLogs(LS.good, arr);
            renderList(goodList, arr);
            flashScene('cabin--joy');
        }
        if (emotionInput) emotionInput.value = '';
        if (plush) {
            plush.classList.remove('stretching');
            void plush.offsetWidth;
            plush.classList.add('stretching');
            window.setTimeout(() => plush.classList.remove('stretching'), 1150);
        }
    }

    renderList(badList, readLogs(LS.bad));
    renderList(goodList, readLogs(LS.good));

    if (btnDropBad) btnDropBad.addEventListener('click', () => addLog('bad'));
    if (btnStoreGood) btnStoreGood.addEventListener('click', () => addLog('good'));
    if (btnClearInput && emotionInput) btnClearInput.addEventListener('click', () => { emotionInput.value = ''; });

    // 语音输入（转文字）：SpeechRecognition 兼容 webkitSpeechRecognition
    if (btnVoice && emotionInput) {
        btnVoice.addEventListener('click', () => {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) {
                emotionInput.value = (emotionInput.value || '') + (emotionInput.value ? '\n' : '') + '（当前浏览器不支持语音转文字）';
                return;
            }
            const rec = new SR();
            rec.lang = 'zh-CN';
            rec.interimResults = false;
            rec.maxAlternatives = 1;
            btnVoice.disabled = true;
            btnVoice.innerHTML = '<i class="fas fa-microphone"></i> 识别中…';
            rec.onresult = (ev) => {
                const text = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : '';
                emotionInput.value = (emotionInput.value || '') + (emotionInput.value ? '\n' : '') + text;
            };
            rec.onerror = () => {};
            rec.onend = () => {
                btnVoice.disabled = false;
                btnVoice.innerHTML = '<i class="fas fa-microphone"></i> 语音输入';
            };
            try { rec.start(); } catch (_) {
                btnVoice.disabled = false;
                btnVoice.innerHTML = '<i class="fas fa-microphone"></i> 语音输入';
            }
        });
    }
})();
