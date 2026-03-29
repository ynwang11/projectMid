// 启动页面交互脚本 - 简化版
document.addEventListener('DOMContentLoaded', function() {
    // 获取主要元素
    const forestScene = document.getElementById('forestScene');
    const interactiveLights = document.getElementById('interactiveLights');
    const interactionHint = document.getElementById('interactionHint');
    
    // 音频元素
    const ambientSound = document.getElementById('ambientSound');
    
    // 状态变量
    let mouseX = 0;
    let mouseY = 0;
    let lightParticles = [];
    
    // 初始化环境
    function initEnvironment() {
        // 创建交互光点
        createLightParticles(30);
        
        // 设置环境音效
        ambientSound.volume = 0.2;
        
        // 尝试播放环境音效（需要用户交互）
        forestScene.addEventListener('click', function initAudio() {
            ambientSound.play().catch(e => console.log('音频播放需要用户交互'));
            forestScene.removeEventListener('click', initAudio);
        });
        
        // 鼠标移动跟踪
        document.addEventListener('mousemove', handleMouseMove);
        
        // 树木交互
        setupTreeInteractions();
        
        // 开始动画循环
        animate();
    }
    
    // 创建交互光点
    function createLightParticles(count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'light-particle';
            
            // 随机位置
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;
            
            // 随机大小和透明度
            const size = 2 + Math.random() * 4;
            const opacity = 0.2 + Math.random() * 0.4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.opacity = opacity;
            
            // 随机动画延迟
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            interactiveLights.appendChild(particle);
            lightParticles.push({
                element: particle,
                x, y,
                baseX: x,
                baseY: y,
                speed: 0.02 + Math.random() * 0.03,
                angle: Math.random() * Math.PI * 2
            });
        }
    }
    
    // 处理鼠标移动
    function handleMouseMove(event) {
        mouseX = event.clientX / window.innerWidth;
        mouseY = event.clientY / window.innerHeight;
        
        // 光点跟随
        updateLightParticles();
    }
    
    // 更新光点位置
    function updateLightParticles() {
        lightParticles.forEach(particle => {
            // 计算到鼠标的距离
            const dx = mouseX * 100 - particle.x;
            const dy = mouseY * 100 - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果距离足够近，光点会被吸引
            if (distance < 25) {
                const force = (25 - distance) / 25;
                particle.x += dx * force * 0.08;
                particle.y += dy * force * 0.08;
            } else {
                // 否则进行随机浮动
                particle.angle += particle.speed;
                particle.x = particle.baseX + Math.cos(particle.angle) * 8;
                particle.y = particle.baseY + Math.sin(particle.angle) * 5;
            }
            
            // 更新位置
            particle.element.style.left = `${particle.x}%`;
            particle.element.style.top = `${particle.y}%`;
        });
    }
    
    // 设置树木交互
    function setupTreeInteractions() {
        const trees = document.querySelectorAll('[data-interactive="true"]');
        
        trees.forEach(tree => {
            tree.addEventListener('mouseenter', () => {
                // 随机摇晃
                const shakeX = (Math.random() - 0.5) * 8;
                const shakeY = (Math.random() - 0.5) * 4;
                
                tree.style.transform = `translate(${shakeX}px, ${shakeY}px) rotate(${shakeX * 0.15}deg)`;
                
                // 创建叶子飘落效果
                createFallingLeaves(tree);
            });
            
            tree.addEventListener('mouseleave', () => {
                tree.style.transform = '';
            });
        });
    }
    
    // 创建飘落的叶子
    function createFallingLeaves(tree) {
        const rect = tree.getBoundingClientRect();
        
        for (let i = 0; i < 2; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'falling-leaf';
            leaf.style.cssText = `
                position: fixed;
                width: 12px;
                height: 12px;
                background: linear-gradient(135deg, #8bc34a 0%, #7cb342 100%);
                border-radius: 50% 0 50% 0;
                pointer-events: none;
                z-index: 5;
                top: ${rect.top + Math.random() * rect.height}px;
                left: ${rect.left + rect.width / 2}px;
                opacity: 0.6;
                transform: rotate(${Math.random() * 360}deg);
            `;
            
            document.body.appendChild(leaf);
            
            // 动画
            const duration = 1 + Math.random() * 1.5;
            const endX = (Math.random() - 0.5) * 150;
            const endY = 80 + Math.random() * 80;
            
            leaf.animate([
                { 
                    transform: `translate(0, 0) rotate(0deg)`,
                    opacity: 0.6 
                },
                { 
                    transform: `translate(${endX}px, ${endY}px) rotate(${360 + Math.random() * 180}deg)`,
                    opacity: 0 
                }
            ], {
                duration: duration * 1000,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }).onfinish = () => leaf.remove();
        }
    }
    
    // 动画循环
    function animate() {
        // 继续动画循环
        requestAnimationFrame(animate);
    }
    
    // 窗口大小调整
    window.addEventListener('resize', () => {
        // 重新计算光点位置
        lightParticles.forEach(particle => {
            particle.baseX = Math.random() * 100;
            particle.baseY = Math.random() * 100;
        });
    });
    
    // 初始化
    initEnvironment();
    
    // 控制台欢迎信息
    console.log('%c🌿 欢迎来到心语森林 🌿', 'color: #8bc34a; font-size: 18px; font-weight: bold;');
    console.log('%c点击中央门户进入心灵花园', 'color: #7cb342; font-size: 14px;');
});