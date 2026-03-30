/**
 * AI心理多维分析中心 · 星光图书馆交互
 * 保留 #connect-btn / #stop-btn / #monitor-console 与 EventSource("/stream")
 */
(function () {
    'use strict';

    const root = document.getElementById('psychoLibrary');
    if (!root) return;

    const bookStage = document.getElementById('psyBookStage');
    const aiTextEl = document.getElementById('psyAiText');
    const ferret = document.getElementById('ferretSpirit');
    const jellyLayer = document.getElementById('jellyfishLayer');
    const chartModal = document.getElementById('plChartModal');
    const chartModalTitle = document.getElementById('plModalTitle');
    const chartModalBody = document.getElementById('plModalBody');

    let charts = {};
    let realtimeTimer = null;
    let currentRange = 'today';
    let detailMap = {};

    const glowColors = {
        primary: 'rgba(120, 200, 255, 0.85)',
        fill: 'rgba(100, 160, 255, 0.2)',
        grid: 'rgba(140, 180, 255, 0.12)'
    };

    function chartCommonOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#b8c8e8', font: { size: 10 } }
                }
            },
            scales: {}
        };
    }

    function destroyCharts() {
        Object.values(charts).forEach((c) => {
            try {
                c.destroy();
            } catch (_) {}
        });
        charts = {};
    }

    function sparkCard(key) {
        const card = root.querySelector('.magic-card[data-chart-key="' + key + '"]');
        if (!card) return;
        card.classList.remove('sparkle-burst');
        void card.offsetWidth;
        card.classList.add('sparkle-burst');
        window.setTimeout(() => card.classList.remove('sparkle-burst'), 900);
    }

    function buildCharts(data) {
        destroyCharts();
        if (typeof Chart === 'undefined') return;

        const doughnutOpts = {
            ...chartCommonOptions(),
            plugins: {
                legend: { position: 'bottom', labels: { color: '#b8c8e8', font: { size: 9 } } }
            }
        };

        const ringEl = document.getElementById('plChartRing');
        if (ringEl && data.ring) {
            charts.ring = new Chart(ringEl.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: data.ring.labels,
                    datasets: [{
                        data: data.ring.values,
                        backgroundColor: [
                            'rgba(255, 180, 220, 0.75)',
                            'rgba(160, 220, 255, 0.75)',
                            'rgba(255, 220, 160, 0.75)',
                            'rgba(180, 160, 255, 0.75)',
                            'rgba(255, 160, 160, 0.75)'
                        ],
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.25)'
                    }]
                },
                options: { ...doughnutOpts, cutout: '58%' }
            });
        }

        const radarEl = document.getElementById('plChartRadar');
        if (radarEl && data.radar) {
            charts.radar = new Chart(radarEl.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: data.radar.labels,
                    datasets: [{
                        label: '维度',
                        data: data.radar.values,
                        borderColor: glowColors.primary,
                        backgroundColor: 'rgba(100, 180, 255, 0.25)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(200, 230, 255, 0.9)'
                    }]
                },
                options: {
                    ...chartCommonOptions(),
                    scales: {
                        r: {
                            angleLines: { color: glowColors.grid },
                            grid: { color: glowColors.grid },
                            pointLabels: { color: '#a8b8d8', font: { size: 9 } },
                            ticks: { display: false, backdropColor: 'transparent' },
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    }
                }
            });
        }

        const waveEl = document.getElementById('plChartWave');
        if (waveEl && data.wave) {
            charts.wave = new Chart(waveEl.getContext('2d'), {
                type: 'line',
                data: {
                    labels: data.wave.labels,
                    datasets: [{
                        label: '波动',
                        data: data.wave.values,
                        borderColor: 'rgba(140, 220, 255, 0.9)',
                        backgroundColor: 'rgba(80, 160, 220, 0.15)',
                        fill: true,
                        tension: 0.45,
                        borderWidth: 2,
                        pointRadius: 2
                    }]
                },
                options: {
                    ...chartCommonOptions(),
                    scales: {
                        x: {
                            ticks: { color: '#8898b8', maxTicksLimit: 8 },
                            grid: { color: glowColors.grid }
                        },
                        y: {
                            ticks: { color: '#8898b8' },
                            grid: { color: glowColors.grid },
                            suggestedMin: 40,
                            suggestedMax: 100
                        }
                    }
                }
            });
        }

        const curveEl = document.getElementById('plChartCurve');
        if (curveEl && data.curve) {
            charts.curve = new Chart(curveEl.getContext('2d'), {
                type: 'line',
                data: {
                    labels: data.curve.labels,
                    datasets: [{
                        label: '趋势',
                        data: data.curve.values,
                        borderColor: 'rgba(200, 180, 255, 0.95)',
                        backgroundColor: 'rgba(160, 120, 255, 0.08)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2
                    }]
                },
                options: {
                    ...chartCommonOptions(),
                    scales: {
                        x: { ticks: { color: '#8898b8' }, grid: { color: glowColors.grid } },
                        y: {
                            ticks: { color: '#8898b8' },
                            grid: { color: glowColors.grid },
                            suggestedMin: 45,
                            suggestedMax: 100
                        }
                    }
                }
            });
        }

        const barsEl = document.getElementById('plChartBars');
        if (barsEl && data.bars) {
            charts.bars = new Chart(barsEl.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: data.bars.labels,
                    datasets: [{
                        label: '生理',
                        data: data.bars.values,
                        backgroundColor: data.bars.values.map((_, i) =>
                            'rgba(' + (120 + i * 15) + ', ' + (180 + i * 8) + ', 255, 0.55)'
                        ),
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1
                    }]
                },
                options: {
                    ...chartCommonOptions(),
                    scales: {
                        x: { ticks: { color: '#8898b8' }, grid: { display: false } },
                        y: {
                            ticks: { color: '#8898b8' },
                            grid: { color: glowColors.grid },
                            suggestedMin: 30,
                            suggestedMax: 100
                        }
                    }
                }
            });
        }

        const polarEl = document.getElementById('plChartPolar');
        if (polarEl && data.polar) {
            charts.polar = new Chart(polarEl.getContext('2d'), {
                type: 'polarArea',
                data: {
                    labels: data.polar.labels,
                    datasets: [{
                        data: data.polar.values,
                        backgroundColor: [
                            'rgba(255, 200, 220, 0.55)',
                            'rgba(180, 220, 255, 0.55)',
                            'rgba(200, 255, 200, 0.5)',
                            'rgba(255, 220, 180, 0.55)',
                            'rgba(220, 200, 255, 0.55)'
                        ],
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                    }]
                },
                options: {
                    ...chartCommonOptions(),
                    scales: {
                        r: {
                            ticks: { display: false, backdropColor: 'transparent' },
                            grid: { color: glowColors.grid },
                            angleLines: { color: glowColors.grid },
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    }
                }
            });
        }

        ['ring', 'radar', 'wave', 'curve', 'bars', 'polar'].forEach((k) => sparkCard(k));
    }

    function typeAiText(text) {
        if (!aiTextEl) return;
        aiTextEl.innerHTML = '';
        if (!text) return;
        const chars = text.split('');
        let i = 0;
        function addChar() {
            if (i >= chars.length) return;
            const span = document.createElement('span');
            span.className = 'char-glow';
            span.textContent = chars[i];
            aiTextEl.appendChild(span);
            i++;
            window.setTimeout(addChar, 7);
        }
        addChar();
    }

    function openModal(title, body) {
        if (!chartModal) return;
        if (chartModalTitle) chartModalTitle.textContent = title || '';
        if (chartModalBody) chartModalBody.textContent = body || '';
        chartModal.classList.add('is-open');
        chartModal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        if (!chartModal) return;
        chartModal.classList.remove('is-open');
        chartModal.setAttribute('aria-hidden', 'true');
    }

    function loadData(range) {
        currentRange = range || 'today';
        return fetch('/api/psych-analysis?range=' + encodeURIComponent(currentRange), {
            credentials: 'same-origin'
        })
            .then((r) => r.json())
            .then((data) => {
                detailMap = data.details || {};
                buildCharts(data);
                typeAiText(data.ai_text || '');
                return data;
            })
            .catch(() => {});
    }

    root.querySelectorAll('.time-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
            const range = btn.getAttribute('data-range');
            root.querySelectorAll('.time-tab').forEach((b) => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            if (bookStage) {
                bookStage.classList.add('book-flip');
                window.setTimeout(() => bookStage.classList.remove('book-flip'), 520);
            }
            if (realtimeTimer) {
                clearInterval(realtimeTimer);
                realtimeTimer = null;
            }
            loadData(range).then(() => {
                if (range === 'realtime') {
                    realtimeTimer = window.setInterval(() => {
                        loadData('realtime');
                    }, 4000);
                }
            });
        });
    });

    root.querySelectorAll('.magic-card').forEach((card) => {
        card.addEventListener('click', () => {
            const key = card.getAttribute('data-chart-key');
            const titles = {
                ring: '情绪环形分布',
                radar: '六维心理雷达',
                wave: '心理能量波浪',
                curve: '周趋势曲线',
                bars: '生理代理指标',
                polar: '五维平衡极区'
            };
            const t = titles[key] || '图表';
            openModal(t, detailMap[key] || '暂无说明');
        });
    });

    if (aiTextEl) {
        aiTextEl.addEventListener('click', () => {
            const t = aiTextEl.textContent || '';
            if (!t.trim() || !window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(t);
            u.lang = 'zh-CN';
            u.rate = 0.95;
            window.speechSynthesis.speak(u);
            if (ferret) {
                ferret.classList.add('ferret-reading');
                window.setTimeout(() => ferret.classList.remove('ferret-reading'), Math.min(t.length * 80, 12000));
            }
        });
    }

    if (chartModal) {
        chartModal.querySelectorAll('.pl-modal-bg, .pl-modal-close').forEach((el) => {
            el.addEventListener('click', closeModal);
        });
    }

    root.addEventListener('pointermove', (e) => {
        const rect = root.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        root.style.setProperty('--pl-mx', (nx * 24).toFixed(3));
        root.style.setProperty('--pl-my', (ny * 18).toFixed(3));
    });

    function spawnJellies(n) {
        if (!jellyLayer) return;
        for (let i = 0; i < n; i++) {
            const j = document.createElement('div');
            j.className = 'jelly';
            j.innerHTML = '<div class="jelly-cap"></div><div class="jelly-tentacles"></div>';
            j.style.left = (10 + Math.random() * 80) + '%';
            j.style.top = (15 + Math.random() * 55) + '%';
            jellyLayer.appendChild(j);
            j.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const lr = jellyLayer.getBoundingClientRect();
                j.style.position = 'absolute';
                j.style.left = ev.clientX - lr.left - 28 + 'px';
                j.style.top = ev.clientY - lr.top - 36 + 'px';
                j.style.opacity = '0.85';
                window.setTimeout(() => {
                    j.style.left = (10 + Math.random() * 80) + '%';
                    j.style.top = (15 + Math.random() * 55) + '%';
                    j.style.opacity = '';
                }, 3200);
            });
            driftJelly(j);
        }
    }

    function driftJelly(el) {
        const step = () => {
            if (!el.isConnected) return;
            const sl = el.style.left || '';
            if (!sl.includes('%')) {
                window.setTimeout(step, 500);
                return;
            }
            let x = parseFloat(sl) || 40;
            let y = parseFloat(el.style.top) || 30;
            x += (Math.random() - 0.5) * 1.2;
            y += (Math.random() - 0.5) * 0.7;
            x = Math.max(5, Math.min(92, x));
            y = Math.max(10, Math.min(78, y));
            el.style.left = x + '%';
            el.style.top = y + '%';
            window.setTimeout(step, 900 + Math.random() * 700);
        };
        window.setTimeout(step, 600);
    }

    spawnJellies(5);

    root.querySelectorAll('.time-tab').forEach((b) => b.classList.remove('is-active'));
    const todayBtn = root.querySelector('.time-tab[data-range="today"]');
    if (todayBtn) todayBtn.classList.add('is-active');
    loadData('today');

    const connectBtn = document.getElementById('connect-btn');
    const stopBtn = document.getElementById('stop-btn');
    const consoleBox = document.getElementById('monitor-console');
    let eventSource = null;

    if (connectBtn && consoleBox) {
        connectBtn.onclick = function () {
            consoleBox.innerHTML = '正在建立连接...\n';
            eventSource = new EventSource('/stream');
            eventSource.onmessage = function (event) {
                const newLog = document.createElement('div');
                newLog.textContent = event.data;
                consoleBox.appendChild(newLog);
                consoleBox.scrollTop = consoleBox.scrollHeight;
            };
            eventSource.onerror = function () {
                consoleBox.innerHTML += '连接已断开或发生错误。\n';
                if (eventSource) eventSource.close();
            };
        };
    }

    if (stopBtn && consoleBox) {
        stopBtn.onclick = function () {
            if (eventSource) {
                eventSource.close();
                consoleBox.innerHTML += '--- 监测已手动停止 ---\n';
            }
        };
    }
})();
