(function () {
    'use strict';

    const root = document.getElementById('cabinRoot');
    const lampBtn = document.getElementById('lampHotspot');
    const plush = document.getElementById('plushSpirit');
    const plushWrap = document.getElementById('plushWrap');
    const btnExport = document.getElementById('btnExport');
    const exportToast = document.getElementById('exportToast');

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
})();
