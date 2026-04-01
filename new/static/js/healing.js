(function () {
    'use strict';

    const scene = document.getElementById('healingScene');
<<<<<<< HEAD
    const pet = document.getElementById('healingPet');
    const petProjection = document.getElementById('petProjection');
=======
    const angel = document.getElementById('healingAngel');
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
    const seaweedRoot = document.getElementById('seaweedContainer');
    const particleRoot = document.getElementById('calmingParticles');
    const speechMount = document.getElementById('speechBubbles');
    const functionPanels = document.getElementById('functionPanels');
    const panelBackdrop = document.getElementById('panelBackdrop');
    const breathingGuide = document.getElementById('breathingGuide');

    const ambient = document.getElementById('ambientMusic');
<<<<<<< HEAD
    const meditationAudio = document.getElementById('meditationAudio');
    const rainAudio = document.getElementById('rainAudio');
    const wavesAudio = document.getElementById('wavesAudio');
    const windAudio = document.getElementById('windAudio');
    const fireAudio = document.getElementById('fireAudio');
=======
    const breathingAudio = document.getElementById('breathingAudio');
    const rainAudio = document.getElementById('rainAudio');
    const wavesAudio = document.getElementById('wavesAudio');
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194

    const BREATH = { inhale: 4000, hold: 2000, exhale: 4000 };
    const panelMap = {
        meditation: document.getElementById('meditationPanel'),
        whitenoise: document.getElementById('whitenoisePanel'),
        'ai-chat': document.getElementById('aichatPanel'),
        relaxation: document.getElementById('relaxationPanel')
    };

    let parallaxX = 0;
    let parallaxY = 0;
    let dragPtr = null;
    let longPressTimer = null;
    let audioPulseOn = false;
    let healingAccum = 0;
    let breathePhase = 'inhale';
    let breathePhaseTimer = null;
    let syncTaps = 0;
<<<<<<< HEAD
=======
    let noiseCtx = null;
    let windNode = null;
    let fireNode = null;
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194

    function setParallax(dx, dy) {
        parallaxX = Math.max(-55, Math.min(55, parallaxX + dx));
        parallaxY = Math.max(-40, Math.min(40, parallaxY + dy));
        scene.style.setProperty('--px', String(parallaxX));
        scene.style.setProperty('--py', String(parallaxY));
    }

    function hideTips() {
        scene.classList.add('tips-hidden');
    }

    function addRipple(clientX, clientY) {
        const r = document.createElement('div');
        r.className = 'ripple-hit';
        const rect = scene.getBoundingClientRect();
        r.style.left = clientX - rect.left + 'px';
        r.style.top = clientY - rect.top + 'px';
        r.style.width = r.style.height = '32px';
        scene.appendChild(r);
        r.addEventListener('animationend', () => r.remove());
        hideTips();
    }

    function spawnSeaweedRing(cx, cy) {
        const rect = scene.getBoundingClientRect();
        const px = cx - rect.left;
        const py = cy - rect.top;
        const count = 10;
        for (let i = 0; i < count; i++) {
            const stem = document.createElement('div');
            stem.className = 'seaweed-stem';
            const ang = (Math.PI * 2 * i) / count;
            const dist = 28 + Math.random() * 18;
            stem.style.left = px + Math.cos(ang) * dist + 'px';
            stem.style.top = py + Math.sin(ang) * dist + 'px';
            stem.style.transform = `rotate(${ang * (180 / Math.PI) + 90}deg)`;
            seaweedRoot.appendChild(stem);
            stem.addEventListener('animationend', () => stem.remove());
        }
        hideTips();
    }

    function isOverlayTarget(el) {
        return el.closest('.entrance') || el.closest('.panel') || el.closest('.back-to-dashboard') ||
            el.closest('.breathing-guide') || el.closest('a') || el.closest('button') || el.closest('input');
    }

    scene.addEventListener('click', (e) => {
        if (isOverlayTarget(e.target)) return;
        addRipple(e.clientX, e.clientY);
    });

    scene.addEventListener('pointerdown', (e) => {
        if (isOverlayTarget(e.target)) return;
        dragPtr = { id: e.pointerId, x: e.clientX, y: e.clientY };
        longPressTimer = window.setTimeout(() => {
            spawnSeaweedRing(e.clientX, e.clientY);
            longPressTimer = null;
        }, 550);
    });

    scene.addEventListener('pointermove', (e) => {
        if (!dragPtr || dragPtr.id !== e.pointerId) return;
        const dx = e.clientX - dragPtr.x;
        const dy = e.clientY - dragPtr.y;
        if (Math.hypot(dx, dy) > 8 && longPressTimer) {
            window.clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        setParallax(dx * 0.06, dy * 0.06);
        dragPtr.x = e.clientX;
        dragPtr.y = e.clientY;
        hideTips();
    });

    function endPointer(e) {
        if (dragPtr && e.pointerId === dragPtr.id) {
            dragPtr = null;
        }
        if (longPressTimer) {
            window.clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }
    scene.addEventListener('pointerup', endPointer);
    scene.addEventListener('pointercancel', endPointer);

    /** 呼吸引导与精灵点头 */
    function setBreathLabels() {
        const ind = document.querySelector('.breath-indicator');
        if (!ind) return;
        ind.querySelectorAll('div').forEach((d) => d.classList.remove('active'));
        const map = { inhale: '.breath-in', hold: '.breath-hold', exhale: '.breath-out' };
        const el = ind.querySelector(map[breathePhase]);
        if (el) el.classList.add('active');
    }

    function runBreathCycle() {
        const phases = [
            ['inhale', BREATH.inhale],
            ['hold', BREATH.hold],
            ['exhale', BREATH.exhale]
        ];
        let i = 0;
        const next = () => {
            breathePhase = phases[i][0];
            setBreathLabels();
            if (breathePhase === 'inhale' && syncTaps >= 2) {
<<<<<<< HEAD
                if (pet) {
                    pet.classList.remove('pet--nod');
                    void pet.offsetWidth;
                    pet.classList.add('pet--nod');
                    setTimeout(() => pet.classList.remove('pet--nod'), 900);
                }
=======
                angel.classList.remove('angel--nod');
                void angel.offsetWidth;
                angel.classList.add('angel--nod');
                setTimeout(() => angel.classList.remove('angel--nod'), 900);
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
                syncTaps = 0;
            }
            const ms = phases[i][1];
            i = (i + 1) % phases.length;
            breathePhaseTimer = window.setTimeout(next, ms);
        };
        next();
    }

    if (breathingGuide) {
        breathingGuide.addEventListener('click', () => {
            if (breathePhase === 'inhale') syncTaps++;
            hideTips();
        });
    }

    /** 面板 · 花瓣展开 */
    function closeAllPanels() {
        Object.values(panelMap).forEach((p) => {
            if (p) {
                p.classList.remove('is-open');
                p.setAttribute('aria-hidden', 'true');
            }
        });
        if (functionPanels) functionPanels.classList.remove('has-open');
    }

    document.querySelectorAll('.entrance').forEach((ent) => {
        ent.addEventListener('click', () => {
            const key = ent.getAttribute('data-function');
            const panel = panelMap[key];
            if (!panel) return;
            const wasOpen = panel.classList.contains('is-open');
            closeAllPanels();
            if (!wasOpen) {
                functionPanels.classList.add('has-open');
                panel.setAttribute('aria-hidden', 'false');
                void panel.offsetWidth;
                panel.classList.add('is-open');
            }
            hideTips();
        });
    });

    document.querySelectorAll('.close-panel').forEach((btn) => {
        btn.addEventListener('click', () => {
            closeAllPanels();
        });
    });

    if (panelBackdrop) {
        panelBackdrop.addEventListener('click', closeAllPanels);
    }

    /** 音频节奏：水母与光点 */
    function updateAudioPulse() {
<<<<<<< HEAD
        const playing = [ambient, meditationAudio, rainAudio, wavesAudio, windAudio, fireAudio].some((a) => a && !a.paused);
=======
        const playing = [ambient, breathingAudio, rainAudio, wavesAudio].some((a) => a && !a.paused);
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
        scene.classList.toggle('scene--audio-pulse', playing);
        audioPulseOn = playing;
    }

<<<<<<< HEAD
    [ambient, meditationAudio, rainAudio, wavesAudio, windAudio, fireAudio].forEach((a) => {
=======
    [ambient, breathingAudio, rainAudio, wavesAudio].forEach((a) => {
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
        if (!a) return;
        a.addEventListener('play', updateAudioPulse);
        a.addEventListener('pause', updateAudioPulse);
        a.addEventListener('ended', updateAudioPulse);
    });

    /** 冥想面板 */
<<<<<<< HEAD
    const progressBar = document.querySelector('.meditation-panel .progress-bar');
    const progressFill = document.querySelector('.meditation-panel .progress-fill');
    const playPauseBtn = document.querySelector('.meditation-panel .play-pause-btn');
    const nextBtn = document.querySelector('.meditation-panel .next-btn');
    const prevBtn = document.querySelector('.meditation-panel .prev-btn');
    const audioItems = Array.from(document.querySelectorAll('.meditation-panel .audio-item'));
    let currentTrackIndex = -1;

    function setPlayPauseIcon(isPlaying) {
        if (!playPauseBtn) return;
        const icon = playPauseBtn.querySelector('i');
        if (icon) icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }

    function setTrackIcons(activeIdx, isPlaying) {
        audioItems.forEach((item, idx) => {
            const icon = item.querySelector('.play-btn i');
            if (icon) icon.className = (idx === activeIdx && isPlaying) ? 'fas fa-pause' : 'fas fa-play';
            item.classList.toggle('is-playing', idx === activeIdx && isPlaying);
        });
    }

    function loadTrack(index, autoPlay) {
        if (!meditationAudio || !audioItems.length) return;
        const len = audioItems.length;
        const idx = ((index % len) + len) % len;
        const item = audioItems[idx];
        const src = item.getAttribute('data-src');
        if (!src) return;
        currentTrackIndex = idx;
        if (meditationAudio.getAttribute('src') !== src) {
            meditationAudio.setAttribute('src', src);
            meditationAudio.load();
        }
        if (autoPlay) meditationAudio.play().catch(() => {});
        setTrackIcons(currentTrackIndex, !meditationAudio.paused);
    }

    audioItems.forEach((item, idx) => {
        const btn = item.querySelector('.play-btn');
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!meditationAudio) return;
            if (currentTrackIndex === idx && !meditationAudio.paused) {
                meditationAudio.pause();
            } else {
                loadTrack(idx, true);
            }
=======
    let meditationPlaying = false;
    const progressFill = document.querySelector('.progress-fill');
    const playPauseBtn = document.querySelector('.play-pause-btn');

    function setMedProgress(t) {
        if (progressFill) progressFill.style.width = Math.min(100, t) + '%';
    }

    document.querySelectorAll('.audio-item .play-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.audio-item');
            const id = item && item.getAttribute('data-audio');
            if (breathingAudio) {
                try {
                    breathingAudio.currentTime = 0;
                    breathingAudio.play().catch(() => {});
                } catch (_) {}
            }
            meditationPlaying = true;
            updateAudioPulse();
            let p = 0;
            const iv = window.setInterval(() => {
                p += 1.2;
                setMedProgress(p);
                if (p >= 100) window.clearInterval(iv);
            }, 300);
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
        });
    });

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
<<<<<<< HEAD
            if (!meditationAudio || !audioItems.length) return;
            if (currentTrackIndex < 0) {
                loadTrack(0, true);
                return;
            }
            if (meditationAudio.paused) meditationAudio.play().catch(() => {});
            else meditationAudio.pause();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!audioItems.length) return;
            loadTrack(currentTrackIndex < 0 ? 0 : currentTrackIndex + 1, true);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (!audioItems.length) return;
            loadTrack(currentTrackIndex < 0 ? 0 : currentTrackIndex - 1, true);
        });
    }

    if (meditationAudio) {
        meditationAudio.addEventListener('play', () => {
            setPlayPauseIcon(true);
            setTrackIcons(currentTrackIndex, true);
        });
        meditationAudio.addEventListener('pause', () => {
            setPlayPauseIcon(false);
            setTrackIcons(currentTrackIndex, false);
        });
        meditationAudio.addEventListener('ended', () => {
            if (!audioItems.length) return;
            loadTrack(currentTrackIndex + 1, true);
        });
        meditationAudio.addEventListener('timeupdate', () => {
            if (!progressFill || !meditationAudio.duration) return;
            const p = (meditationAudio.currentTime / meditationAudio.duration) * 100;
            progressFill.style.width = Math.max(0, Math.min(100, p)) + '%';
        });
    }

    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (!meditationAudio || !meditationAudio.duration) return;
            const rect = progressBar.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            meditationAudio.currentTime = meditationAudio.duration * ratio;
        });
    }

    /** 身体放松倒计时 */
    const relaxDurations = {
        neck: 120,      // 2 min
        shoulder: 60,   // 1 min
        breath: 60      // 1 min
    };
    const relaxTimers = new WeakMap();

    function formatMMSS(seconds) {
        const mm = Math.floor(seconds / 60);
        const ss = seconds % 60;
        return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
    }

    document.querySelectorAll('.relaxation-panel .exercise-item').forEach((item) => {
        const key = item.getAttribute('data-exercise');
        const duration = relaxDurations[key];
        const btn = item.querySelector('.start-btn');
        const durationEl = item.querySelector('.exercise-duration');
        if (!btn || !durationEl || !duration) return;

        // 初始化展示
        durationEl.textContent = key === 'neck' ? '2分钟' : '1分钟';

        btn.addEventListener('click', () => {
            const old = relaxTimers.get(item);
            // 已在计时中：点击“进行中”即停止并恢复
            if (old) {
                clearInterval(old);
                relaxTimers.delete(item);
                durationEl.textContent = key === 'neck' ? '2分钟' : '1分钟';
                btn.textContent = '开始';
                return;
            }

            let left = duration;
            btn.textContent = '进行中';
            durationEl.textContent = formatMMSS(left);

            const timer = window.setInterval(() => {
                left -= 1;
                if (left <= 0) {
                    clearInterval(timer);
                    relaxTimers.delete(item);
                    durationEl.textContent = key === 'neck' ? '2分钟' : '1分钟';
                    btn.textContent = '开始';
                    return;
                }
                durationEl.textContent = formatMMSS(left);
            }, 1000);

            relaxTimers.set(item, timer);
        });
    });

    /** 白噪音（4 条本地音轨 + slider 实时音量） */
    const noiseTracks = {
        rain: rainAudio,
        waves: wavesAudio,
        wind: windAudio,
        fire: fireAudio
    };

=======
            if (!breathingAudio) return;
            if (breathingAudio.paused) {
                breathingAudio.play().catch(() => {});
                playPauseBtn.querySelector('i').className = 'fas fa-pause';
            } else {
                breathingAudio.pause();
                playPauseBtn.querySelector('i').className = 'fas fa-play';
            }
            updateAudioPulse();
        });
    }

    /** 白噪音 */
    const noiseGain = { rain: 0.5, waves: 0.5, wind: 0, fire: 0 };

    function ensureNoiseCtx() {
        if (!noiseCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            noiseCtx = new AC();
        }
        return noiseCtx;
    }

    function makeWind() {
        const ctx = ensureNoiseCtx();
        if (!ctx) return;
        if (windNode) return;
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(0);
        windNode = { src, gain };
    }

    function makeFire() {
        const ctx = ensureNoiseCtx();
        if (!ctx) return;
        if (fireNode) return;
        const count = 3;
        const oscs = [];
        const gain = ctx.createGain();
        gain.gain.value = 0;
        for (let i = 0; i < count; i++) {
            const o = ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.value = 40 + i * 18 + Math.random() * 8;
            const g = ctx.createGain();
            g.gain.value = 0.02;
            o.connect(g);
            g.connect(gain);
            o.start(0);
            oscs.push(o);
        }
        gain.connect(ctx.destination);
        fireNode = { oscs, gain };
    }

>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
    document.querySelectorAll('.noise-item').forEach((item) => {
        const type = item.getAttribute('data-noise');
        const slider = item.querySelector('.volume-slider');
        if (!slider) return;
<<<<<<< HEAD
        const audio = noiseTracks[type];
        if (!audio) return;
        // 初始值
        audio.volume = Number(slider.value) / 100;
        slider.addEventListener('input', () => {
            const v = Number(slider.value) / 100;
            audio.volume = v;
            if (v > 0.02) audio.play().catch(() => {});
            else audio.pause();
=======
        slider.addEventListener('input', () => {
            const v = Number(slider.value) / 100;
            if (type === 'rain') {
                noiseGain.rain = v;
                if (rainAudio) {
                    rainAudio.volume = v;
                    if (v > 0.02) rainAudio.play().catch(() => {});
                    else rainAudio.pause();
                }
            } else if (type === 'waves') {
                noiseGain.waves = v;
                if (wavesAudio) {
                    wavesAudio.volume = v;
                    if (v > 0.02) wavesAudio.play().catch(() => {});
                    else wavesAudio.pause();
                }
            } else if (type === 'wind') {
                noiseGain.wind = v;
                makeWind();
                if (windNode && noiseCtx) {
                    if (noiseCtx.state === 'suspended') noiseCtx.resume();
                    windNode.gain.gain.value = v * 0.35;
                }
            } else if (type === 'fire') {
                noiseGain.fire = v;
                makeFire();
                if (fireNode && noiseCtx) {
                    if (noiseCtx.state === 'suspended') noiseCtx.resume();
                    fireNode.gain.gain.value = v * 0.08;
                }
            }
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
            updateAudioPulse();
        });
    });

    /** AI 对话：气泡 + 精灵开口 */
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessage');

    const fairyReplies = [
        '我在这里陪着你，慢慢呼吸就好。',
        '你的感受都很珍贵，不用着急。',
        '月光会像毯子一样轻轻盖在海面上，你也值得被这样温柔对待。',
        '我们一起数三次呼吸，会好一点的。',
        '身体会记得放松的感觉，你已经做得很好了。'
    ];

    function pushChat(role, text) {
        const wrap = document.createElement('div');
        wrap.className = role === 'user' ? 'message user-message' : 'message ai-message';
        const b = document.createElement('div');
        b.className = 'message-bubble';
        b.textContent = text;
        wrap.appendChild(b);
        chatMessages.appendChild(wrap);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showFairyBubble(text) {
        speechMount.innerHTML = '';
        const b = document.createElement('div');
        b.className = 'fairy-bubble';
        b.textContent = text;
        speechMount.appendChild(b);
        window.setTimeout(() => {
            b.style.opacity = '0';
            b.style.transition = 'opacity 1.2s ease';
        }, 5200);
        window.setTimeout(() => { speechMount.innerHTML = ''; }, 6800);
    }

    function fairySpeak(text) {
<<<<<<< HEAD
        if (pet) pet.classList.add('pet--speaking');
        showFairyBubble(text);
        window.setTimeout(() => { if (pet) pet.classList.remove('pet--speaking'); }, Math.min(4500, text.length * 120));
=======
        angel.classList.add('angel--speaking');
        showFairyBubble(text);
        window.setTimeout(() => angel.classList.remove('angel--speaking'), Math.min(4500, text.length * 120));
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
    }

    function sendChat() {
        const t = (chatInput && chatInput.value || '').trim();
        if (!t) return;
        pushChat('user', t);
        chatInput.value = '';
<<<<<<< HEAD
        fetch('/api/ai-chat', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: t })
        })
            .then((r) => r.json())
            .then((d) => {
                const reply = (d && d.reply) ? d.reply : (d && d.error === 'subscription_required'
                    ? 'AI 对话需要订阅解锁。你可以先在「付费订阅」里开启演示开关。'
                    : fairyReplies[Math.floor(Math.random() * fairyReplies.length)]);
                pushChat('ai', reply);
                fairySpeak(reply);
            })
            .catch(() => {
                const reply = fairyReplies[Math.floor(Math.random() * fairyReplies.length)];
                pushChat('ai', reply);
                fairySpeak(reply);
            });
=======
        window.setTimeout(() => {
            const reply = fairyReplies[Math.floor(Math.random() * fairyReplies.length)];
            pushChat('ai', reply);
            fairySpeak(reply);
        }, 600);
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
    }

    if (sendBtn) sendBtn.addEventListener('click', sendChat);
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendChat();
        });
    }

    /** 睡莲绽放 & 整体柔光 */
    function tickHealing(dt) {
        const panelOpen = document.querySelector('.panel.is-open');
        const activeAudio = audioPulseOn;
        if (panelOpen || activeAudio) {
            healingAccum += dt * 0.000012;
        }
        const bloom = Math.min(0.95, 0.14 + healingAccum);
        scene.style.setProperty('--lily-bloom', bloom.toFixed(3));
        scene.classList.toggle('scene--healing-progress', bloom > 0.35);
    }

    let lastTs = performance.now();
    function frame(ts) {
        const dt = ts - lastTs;
        lastTs = ts;
        tickHealing(dt);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /** 安抚粒子 */
    function spawnParticles(count, starRatio) {
        const rect = scene.getBoundingClientRect();
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            const star = Math.random() < starRatio;
            p.className = star ? 'calm-particle star-flake' : 'calm-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (12 + Math.random() * 10) + 's';
            p.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
            p.style.setProperty('--sx', (Math.random() * 60 - 30) + 'px');
            p.style.animationDelay = '-' + Math.random() * 8 + 's';
            particleRoot.appendChild(p);
        }
    }
    spawnParticles(36, 0.12);

    /** 生理异常：极柔深海安抚（无警报） */
    function enterSoothe(isFirst) {
        scene.classList.add('scene--soothe');
        if (isFirst) {
            spawnParticles(28, 0.55);
<<<<<<< HEAD
            if (pet) {
                pet.classList.add('pet--speaking');
                window.setTimeout(() => pet.classList.remove('pet--speaking'), 400);
            }
            // 自动播放更柔和的环境音（可能受浏览器手势限制）
            if (ambient && ambient.paused) ambient.play().catch(() => {});
=======
            angel.classList.add('angel--speaking');
            window.setTimeout(() => angel.classList.remove('angel--speaking'), 400);
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
            fairySpeak('我在这里，我们一起把呼吸放慢一点。你是安全的。');
        }
    }

    function leaveSootheSoft() {
        scene.classList.remove('scene--soothe');
    }

    async function pollVitals() {
        try {
<<<<<<< HEAD
            const r = await fetch('/api/vitals-live', { credentials: 'same-origin' });
            if (!r.ok) return;
            const data = await r.json();
            // 压力投射：形状（圆角）+ 颜色（渐变）
            if (petProjection) {
                const stress = Number(data.stress || 0);
                const shape = Math.max(18, Math.min(46, 46 - stress * 22));
                petProjection.style.borderRadius = shape + '%';
                if (stress > 0.72 || data.abnormal) {
                    petProjection.style.background = 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45), rgba(255,170,120,0.35))';
                    petProjection.style.boxShadow = '0 0 46px rgba(255, 160, 110, 0.35)';
                } else if (stress > 0.52) {
                    petProjection.style.background = 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45), rgba(200,160,255,0.28))';
                    petProjection.style.boxShadow = '0 0 42px rgba(200, 160, 255, 0.28)';
                } else {
                    petProjection.style.background = 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5), rgba(160,220,255,0.22))';
                    petProjection.style.boxShadow = '0 0 38px rgba(160, 220, 255, 0.3)';
                }
            }

            if (data.abnormal || Number(data.stress || 0) > 0.78) {
=======
            const r = await fetch('/api/healing-vitals', { credentials: 'same-origin' });
            if (!r.ok) return;
            const data = await r.json();
            if (data.abnormal) {
>>>>>>> 58f242db85bb6e87a08ad5101ae2c58d00259194
                enterSoothe(!scene.classList.contains('scene--soothe'));
            } else {
                leaveSootheSoft();
            }
        } catch (_) {}
    }

    window.setInterval(pollVitals, 20000);
    pollVitals();

    runBreathCycle();

    window.addEventListener('beforeunload', () => {
        if (breathePhaseTimer) clearTimeout(breathePhaseTimer);
    });
})();
