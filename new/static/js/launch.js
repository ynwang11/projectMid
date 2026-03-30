/**
 * 启动页 · 云端森林沉浸式交互
 */
document.addEventListener('DOMContentLoaded', function () {
    const forestScene = document.getElementById('forestScene');
    const interactiveLights = document.getElementById('interactiveLights');
    const interactionHint = document.getElementById('interactionHint');
    const launchFox = document.getElementById('launchFox');
    const launchFoxWrap = document.getElementById('launchFoxWrap');
    const foxTail = document.getElementById('foxTail');
    const magicCircle = document.getElementById('magicCircle');
    const softVeil = document.getElementById('softVeil');
    const mainInterface = document.getElementById('mainInterface');
    const cursorTrail = document.getElementById('cursorTrail');
    const ambientSound = document.getElementById('ambientSound');
    const magicSound = document.getElementById('magicSound');

    let mouseX = 0.5;
    let mouseY = 0.5;
    let lightParticles = [];
    let journeyStarted = false;
    let lastTrail = { x: 0, y: 0 };

    function initEnvironment() {
        createLightParticles(42);
        if (ambientSound) {
            ambientSound.volume = 0.18;
        }

        forestScene.addEventListener(
            'click',
            function initAudioOnce() {
                if (ambientSound) {
                    ambientSound.play().catch(function () {});
                }
                forestScene.removeEventListener('click', initAudioOnce);
            },
            { once: true }
        );

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: true });

        setupTreeInteractions();
        setupNearLeaves();
        setupJourneyClick();
        animate();
    }

    function onMouseMove(e) {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
        parallaxScene(e.clientX, e.clientY);
        updateFoxLook(e.clientX, e.clientY);
        updateLightParticles();
        spawnTrailMote(e.clientX, e.clientY);
    }

    function onTouchMove(e) {
        if (!e.touches[0]) return;
        const t = e.touches[0];
        mouseX = t.clientX / window.innerWidth;
        mouseY = t.clientY / window.innerHeight;
        parallaxScene(t.clientX, t.clientY);
        updateFoxLook(t.clientX, t.clientY);
        updateLightParticles();
    }

    function parallaxScene(cx, cy) {
        const nx = cx / window.innerWidth - 0.5;
        const ny = cy / window.innerHeight - 0.5;
        forestScene.style.setProperty('--bg-x', (nx * 2).toFixed(4));
        forestScene.style.setProperty('--bg-y', (ny * 2).toFixed(4));
    }

    function updateFoxLook(cx, cy) {
        if (!launchFox) return;
        const rect = launchFox.getBoundingClientRect();
        const hx = rect.left + rect.width * 0.5;
        const hy = rect.top + rect.height * 0.35;
        const lx = Math.max(-1, Math.min(1, ((cx - hx) / window.innerWidth) * 5));
        const ly = Math.max(-1, Math.min(1, ((cy - hy) / window.innerHeight) * 5));
        launchFox.style.setProperty('--look-x', lx.toFixed(3));
        launchFox.style.setProperty('--look-y', ly.toFixed(3));
    }

    function spawnTrailMote(x, y) {
        if (journeyStarted) return;
        const dx = x - lastTrail.x;
        const dy = y - lastTrail.y;
        if (dx * dx + dy * dy < 900) return;
        lastTrail = { x, y };
        const m = document.createElement('div');
        m.className = 'trail-mote';
        m.style.left = x + 'px';
        m.style.top = y + 'px';
        cursorTrail.appendChild(m);
        window.setTimeout(function () {
            m.remove();
        }, 900);
    }

    function createLightParticles(count) {
        if (!interactiveLights) return;
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'light-particle';
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            particle.style.left = x + '%';
            particle.style.top = y + '%';
            const size = 2 + Math.random() * 4;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.opacity = 0.15 + Math.random() * 0.45;
            particle.style.animationDelay = Math.random() * 5 + 's';
            interactiveLights.appendChild(particle);
            lightParticles.push({
                element: particle,
                x: x,
                y: y,
                baseX: x,
                baseY: y,
                speed: 0.015 + Math.random() * 0.025,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    function updateLightParticles() {
        const mx = mouseX * 100;
        const my = mouseY * 100;
        lightParticles.forEach(function (particle) {
            const dx = mx - particle.x;
            const dy = my - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 32) {
                const force = (32 - distance) / 32;
                particle.x += dx * force * 0.12;
                particle.y += dy * force * 0.12;
            } else {
                particle.angle += particle.speed;
                particle.x = particle.baseX + Math.cos(particle.angle) * 6;
                particle.y = particle.baseY + Math.sin(particle.angle) * 4;
            }
            particle.x += (particle.baseX - particle.x) * 0.02;
            particle.y += (particle.baseY - particle.y) * 0.02;
            particle.element.style.left = particle.x + '%';
            particle.element.style.top = particle.y + '%';
        });
    }

    function setupTreeInteractions() {
        document.querySelectorAll('[data-interactive="true"]').forEach(function (tree) {
            tree.addEventListener('mouseenter', function () {
                const shakeX = (Math.random() - 0.5) * 10;
                const shakeY = (Math.random() - 0.5) * 5;
                tree.style.transform = 'translate(' + shakeX + 'px,' + shakeY + 'px) rotate(' + shakeX * 0.12 + 'deg)';
                createFallingLeaves(tree);
            });
            tree.addEventListener('mouseleave', function () {
                tree.style.transform = '';
            });
        });
    }

    function setupNearLeaves() {
        const clusters = document.querySelectorAll('.leaf-cluster');
        const cooldown = {};
        document.addEventListener(
            'mousemove',
            function (e) {
                const now = Date.now();
                clusters.forEach(function (leaf, idx) {
                    const r = leaf.getBoundingClientRect();
                    const cx = r.left + r.width / 2;
                    const cy = r.top + r.height / 2;
                    const d = Math.hypot(e.clientX - cx, e.clientY - cy);
                    if (d < 88 && (!cooldown[idx] || now - cooldown[idx] > 600)) {
                        cooldown[idx] = now;
                        leaf.classList.add('shake');
                        window.setTimeout(function () {
                            leaf.classList.remove('shake');
                        }, 480);
                    }
                });
            },
            { passive: true }
        );
    }

    function createFallingLeaves(tree) {
        const rect = tree.getBoundingClientRect();
        for (let i = 0; i < 2; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'falling-leaf';
            leaf.style.cssText =
                'position:fixed;width:12px;height:12px;background:linear-gradient(135deg,#a8d8a0,#8bc4a0);border-radius:50% 0 50% 0;pointer-events:none;z-index:8;top:' +
                (rect.top + Math.random() * rect.height) +
                'px;left:' +
                (rect.left + rect.width / 2) +
                'px;opacity:0.55;';
            document.body.appendChild(leaf);
            const endX = (Math.random() - 0.5) * 120;
            const endY = 60 + Math.random() * 100;
            leaf.animate(
                [
                    { transform: 'translate(0,0) rotate(0deg)', opacity: 0.55 },
                    { transform: 'translate(' + endX + 'px,' + endY + 'px) rotate(240deg)', opacity: 0 }
                ],
                { duration: 1400, easing: 'cubic-bezier(0.4,0,0.2,1)' }
            ).onfinish = function () {
                leaf.remove();
            };
        }
    }

    function burstStarParticles() {
        if (!foxTail) return;
        const rect = foxTail.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        for (let i = 0; i < 28; i++) {
            const star = document.createElement('div');
            star.className = 'star-particle';
            star.style.position = 'fixed';
            star.style.left = cx + 'px';
            star.style.top = cy + 'px';
            star.style.zIndex = '15';
            const ang = (Math.PI * 2 * i) / 28;
            const dist = 40 + Math.random() * 80;
            document.body.appendChild(star);
            star.animate(
                [
                    { transform: 'translate(0,0) scale(1)', opacity: 1 },
                    {
                        transform:
                            'translate(' +
                            Math.cos(ang) * dist +
                            'px,' +
                            Math.sin(ang) * dist +
                            'px) scale(0.2)',
                        opacity: 0
                    }
                ],
                { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(0.2,0.8,0.2,1)' }
            ).onfinish = function () {
                star.remove();
            };
        }
    }

    function setupJourneyClick() {
        forestScene.addEventListener('click', function (e) {
            if (journeyStarted) return;
            if (e.target.closest('.main-interface.visible')) return;
            if (e.target.closest('a.enter-button')) return;

            journeyStarted = true;
            if (interactionHint) interactionHint.style.opacity = '0';

            if (magicSound) {
                magicSound.volume = 0.35;
                magicSound.play().catch(function () {});
            }

            launchFox.classList.add('fox-jump');
            window.setTimeout(function () {
                launchFox.classList.remove('fox-jump');
            }, 750);

            launchFox.classList.add('tail-burst');
            burstStarParticles();
            window.setTimeout(function () {
                launchFox.classList.remove('tail-burst');
            }, 900);

            magicCircle.classList.add('active');

            window.setTimeout(function () {
                if (softVeil) softVeil.classList.add('is-active');
            }, 200);

            window.setTimeout(function () {
                if (launchFoxWrap) launchFoxWrap.classList.add('fade-out');
            }, 800);

            window.setTimeout(function () {
                mainInterface.classList.add('visible');
            }, 1600);
        });
    }

    function animate() {
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', function () {
        lightParticles.forEach(function (particle) {
            particle.baseX = Math.random() * 100;
            particle.baseY = Math.random() * 100;
        });
    });

    initEnvironment();
});
