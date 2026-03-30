(function () {
    'use strict';

    const root = document.getElementById('islandVitals');
    if (!root) return;

    const earFox = document.getElementById('earFox');
    const emotionOrb = document.getElementById('emotionOrb');
    const guideArrows = document.getElementById('guideArrows');
    const healingFab = document.getElementById('healingFab');
    const vitalModal = document.getElementById('vitalModal');
    const modalTitle = document.getElementById('vitalModalTitle');
    const modalCanvas = document.getElementById('vitalModalCanvas');

    const METRICS = [
        { key: 'hr', label: '心率', unit: ' bpm', color: '#3d8fd0' },
        { key: 'resp', label: '呼吸', unit: ' 次/分', color: '#5ac8a8' },
        { key: 'eda', label: '皮电', unit: '', color: '#c090e0' },
        { key: 'hrv', label: 'HRV', unit: ' ms', color: '#7090ff' },
        { key: 'temp', label: '体温', unit: ' °C', color: '#ff9a8b' }
    ];

    const tips = {
        hr: '心率在静息与活动之间波动是正常的；若持续偏高，可尝试放慢呼吸与放松肩颈。',
        resp: '呼吸节律若不稳，可能与紧张或姿势有关，试着延长呼气。',
        eda: '皮电反映皮肤导电度，常与唤醒水平相关，不必过度解读单次数值。',
        hrv: 'HRV 越高通常表示自主神经弹性越好；睡眠与规律运动有助于改善。',
        temp: '体温轻微波动常见；若不适请结合体感与医疗建议。'
    };

    let pollTimer = null;
    let longPressTimer = null;
    let modalMetricKey = 'hr';

    function sizeCanvas(cv) {
        if (!cv) return;
        var r = window.devicePixelRatio || 1;
        var w = cv.clientWidth || 280;
        var h = cv.clientHeight || 44;
        cv.width = Math.floor(w * r);
        cv.height = Math.floor(h * r);
        var ctx = cv.getContext('2d');
        if (ctx) ctx.setTransform(r, 0, 0, r, 0, 0);
    }

    function drawSparkline(canvas, values, color) {
        if (!canvas || !values || !values.length) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.clientWidth || canvas.width;
        const h = canvas.clientHeight || canvas.height;
        ctx.clearRect(0, 0, w, h);
        const min = Math.min.apply(null, values);
        const max = Math.max.apply(null, values);
        const range = max - min || 1;
        const pad = 4;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        values.forEach(function (v, i) {
            const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
            const y = h - pad - ((v - min) / range) * (h - pad * 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function setFoxState(d) {
        if (!earFox) return;
        earFox.classList.remove('state-calm', 'state-worry', 'state-nuzzle', 'state-abnormal');
        if (d.abnormal) {
            earFox.classList.add('state-abnormal');
            return;
        }
        if (d.stress > 0.65) {
            earFox.classList.add('state-nuzzle');
            return;
        }
        if (!d.resp_stable) {
            earFox.classList.add('state-worry');
            return;
        }
        if (d.hr_stable) {
            earFox.classList.add('state-calm');
        }
    }

    function setEmotionOrb(emotion) {
        if (!emotionOrb) return;
        emotionOrb.classList.remove('emotion-calm', 'emotion-relaxed', 'emotion-anxious');
        emotionOrb.classList.add(
            emotion === 'relaxed' ? 'emotion-relaxed' : emotion === 'anxious' ? 'emotion-anxious' : 'emotion-calm'
        );
    }

    function setAbnormalUi(show) {
        if (guideArrows) guideArrows.classList.toggle('is-visible', show);
        if (healingFab) healingFab.classList.toggle('is-visible', show);
    }

    function updateCards(d) {
        METRICS.forEach(function (m) {
            const card = root.querySelector('.vital-card[data-metric="' + m.key + '"]');
            if (!card) return;
            const numEl = card.querySelector('.vital-num');
            const series = (d.series && d.series[m.key]) || [];
            let val = d[m.key];
            if (numEl && val !== undefined && val !== null) {
                if (m.key === 'eda') numEl.textContent = Number(val).toFixed(2);
                else if (m.key === 'resp' || m.key === 'temp') numEl.textContent = Number(val).toFixed(1);
                else numEl.textContent = String(Math.round(Number(val)));
            }
            const cv = card.querySelector('.spark-canvas');
            if (cv && series.length) {
                sizeCanvas(cv);
                drawSparkline(cv, series, m.color);
            }
        });
    }

    function openModal(key) {
        modalMetricKey = key;
        const m = METRICS.find(function (x) { return x.key === key; });
        if (!vitalModal || !modalTitle || !modalCanvas || !m) return;
        modalTitle.textContent = m.label + ' · 魔法纹路';
        vitalModal.classList.add('is-open');
        vitalModal.setAttribute('aria-hidden', 'false');
        sizeCanvas(modalCanvas);
        window._lastVitals && drawSparkline(modalCanvas, window._lastVitals.series[key] || [], m.color);
    }

    function closeModal() {
        if (!vitalModal) return;
        vitalModal.classList.remove('is-open');
        vitalModal.setAttribute('aria-hidden', 'true');
    }

    function applyVitals(d) {
        window._lastVitals = d;
        updateCards(d);
        setEmotionOrb(d.emotion);
        setFoxState(d);
        setAbnormalUi(!!d.abnormal);
        if (vitalModal && vitalModal.classList.contains('is-open')) {
            const m = METRICS.find(function (x) { return x.key === modalMetricKey; });
            if (m && modalCanvas) {
                sizeCanvas(modalCanvas);
                drawSparkline(modalCanvas, (d.series && d.series[modalMetricKey]) || [], m.color);
            }
        }
    }

    function poll() {
        fetch('/api/vitals-live', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(applyVitals)
            .catch(function () {});
    }

    root.querySelectorAll('.vital-card').forEach(function (card) {
        const key = card.getAttribute('data-metric');
        card.addEventListener('click', function () {
            if (card._longFired) {
                card._longFired = false;
                return;
            }
            openModal(key);
        });
        card.addEventListener('pointerdown', function () {
            card._longFired = false;
            if (longPressTimer) clearTimeout(longPressTimer);
            longPressTimer = window.setTimeout(function () {
                card._longFired = true;
                if (window.speechSynthesis && tips[key]) {
                    window.speechSynthesis.cancel();
                    var u = new SpeechSynthesisUtterance(tips[key]);
                    u.lang = 'zh-CN';
                    window.speechSynthesis.speak(u);
                }
            }, 520);
        });
        card.addEventListener('pointerup', function () {
            if (longPressTimer) clearTimeout(longPressTimer);
        });
        card.addEventListener('pointerleave', function () {
            if (longPressTimer) clearTimeout(longPressTimer);
        });
    });

    if (vitalModal) {
        vitalModal.querySelectorAll('.vital-modal-bg, .vital-modal-close').forEach(function (el) {
            el.addEventListener('click', closeModal);
        });
    }

    if (earFox) {
        earFox.addEventListener('click', function () {
            earFox.classList.remove('poke-a', 'poke-b');
            void earFox.offsetWidth;
            earFox.classList.add(Math.random() > 0.5 ? 'poke-a' : 'poke-b');
            window.setTimeout(function () {
                earFox.classList.remove('poke-a', 'poke-b');
            }, 600);
        });
    }

    root.addEventListener('pointermove', function (e) {
        var rect = root.getBoundingClientRect();
        var nx = (e.clientX - rect.left) / rect.width - 0.5;
        var ny = (e.clientY - rect.top) / rect.height - 0.5;
        root.style.setProperty('--is-mx', (nx * 24).toFixed(3));
        root.style.setProperty('--is-my', (ny * 18).toFixed(3));
    });

    function decorateScene() {
        var grass = root.querySelector('.grass-layer');
        var hearts = root.querySelector('.hearts-layer');
        var particles = root.querySelector('.particles-layer');
        if (grass) {
            for (var i = 0; i < 40; i++) {
                var g = document.createElement('div');
                g.className = 'grass-blade';
                g.style.left = Math.random() * 100 + '%';
                g.style.height = 16 + Math.random() * 18 + 'px';
                g.style.animationDelay = Math.random() * 2 + 's';
                grass.appendChild(g);
            }
        }
        if (hearts) {
            for (var h = 0; h < 12; h++) {
                var el = document.createElement('div');
                el.className = 'heart-leaf';
                el.style.left = Math.random() * 96 + '%';
                el.style.animationDelay = Math.random() * 3 + 's';
                hearts.appendChild(el);
            }
        }
        if (particles) {
            for (var p = 0; p < 18; p++) {
                var d = document.createElement('div');
                d.className = 'rise-dot';
                d.style.left = Math.random() * 100 + '%';
                d.style.animationDelay = Math.random() * 5 + 's';
                d.style.animationDuration = 4 + Math.random() * 3 + 's';
                particles.appendChild(d);
            }
        }
    }

    decorateScene();
    poll();
    pollTimer = window.setInterval(poll, 1200);

    window.addEventListener('resize', function () {
        root.querySelectorAll('.spark-canvas').forEach(function (cv) {
            sizeCanvas(cv);
        });
        if (window._lastVitals) updateCards(window._lastVitals);
    });
})();
