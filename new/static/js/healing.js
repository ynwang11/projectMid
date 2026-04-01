(function () {
    "use strict";

    const panelMap = {
        meditation: document.getElementById("meditationPanel"),
        whitenoise: document.getElementById("whitenoisePanel"),
        "ai-chat": document.getElementById("aichatPanel"),
        relaxation: document.getElementById("relaxationPanel"),
    };

    const entrances = Array.from(document.querySelectorAll(".entrance"));
    const closeBtns = Array.from(document.querySelectorAll(".close-panel"));

    function closeAllPanels() {
        Object.values(panelMap).forEach((p) => p && p.classList.remove("is-open"));
    }

    entrances.forEach((ent) => {
        ent.addEventListener("click", () => {
            const key = ent.getAttribute("data-function");
            const panel = panelMap[key];
            if (!panel) return;
            const willOpen = !panel.classList.contains("is-open");
            closeAllPanels();
            if (willOpen) panel.classList.add("is-open");
        });
    });

    closeBtns.forEach((btn) => btn.addEventListener("click", closeAllPanels));

    const meditationAudio = document.getElementById("meditationAudio");
    const audioItems = Array.from(document.querySelectorAll(".meditation-panel .audio-item"));
    const progressBar = document.querySelector(".meditation-panel .progress-bar");
    const progressFill = document.querySelector(".meditation-panel .progress-fill");
    const playPauseBtn = document.querySelector(".meditation-panel .play-pause-btn");
    const nextBtn = document.querySelector(".meditation-panel .next-btn");
    const prevBtn = document.querySelector(".meditation-panel .prev-btn");

    let currentIndex = -1;

    function setPlayPauseIcon(isPlaying) {
        if (!playPauseBtn) return;
        const icon = playPauseBtn.querySelector("i");
        if (!icon) return;
        icon.className = isPlaying ? "fas fa-pause" : "fas fa-play";
    }

    function setRowIcons(activeIndex, isPlaying) {
        audioItems.forEach((item, idx) => {
            const icon = item.querySelector(".play-btn i");
            if (icon) icon.className = idx === activeIndex && isPlaying ? "fas fa-pause" : "fas fa-play";
            item.classList.toggle("is-playing", idx === activeIndex && isPlaying);
        });
    }

    function loadTrack(index, autoPlay) {
        if (!meditationAudio || !audioItems.length) return;
        const len = audioItems.length;
        const i = ((index % len) + len) % len;
        const item = audioItems[i];
        const src = item.getAttribute("data-src");
        if (!src) return;

        currentIndex = i;
        if (meditationAudio.getAttribute("src") !== src) {
            meditationAudio.setAttribute("src", src);
            meditationAudio.load();
        }
        if (autoPlay) {
            meditationAudio.play().catch(() => {});
        }
        setRowIcons(currentIndex, !meditationAudio.paused);
    }

    audioItems.forEach((item, idx) => {
        const btn = item.querySelector(".play-btn");
        if (!btn) return;
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!meditationAudio) return;
            if (currentIndex === idx && !meditationAudio.paused) {
                meditationAudio.pause();
                return;
            }
            loadTrack(idx, true);
        });
    });

    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            if (!meditationAudio || !audioItems.length) return;
            if (currentIndex < 0) {
                loadTrack(0, true);
                return;
            }
            if (meditationAudio.paused) meditationAudio.play().catch(() => {});
            else meditationAudio.pause();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (!audioItems.length) return;
            loadTrack(currentIndex < 0 ? 0 : currentIndex + 1, true);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (!audioItems.length) return;
            loadTrack(currentIndex < 0 ? 0 : currentIndex - 1, true);
        });
    }

    if (meditationAudio) {
        meditationAudio.addEventListener("play", () => {
            setPlayPauseIcon(true);
            setRowIcons(currentIndex, true);
        });
        meditationAudio.addEventListener("pause", () => {
            setPlayPauseIcon(false);
            setRowIcons(currentIndex, false);
        });
        meditationAudio.addEventListener("ended", () => {
            if (!audioItems.length) return;
            loadTrack(currentIndex + 1, true);
        });
        meditationAudio.addEventListener("timeupdate", () => {
            if (!progressFill || !meditationAudio.duration) return;
            const p = (meditationAudio.currentTime / meditationAudio.duration) * 100;
            progressFill.style.width = `${Math.max(0, Math.min(100, p))}%`;
        });
    }

    if (progressBar) {
        progressBar.addEventListener("click", (e) => {
            if (!meditationAudio || !meditationAudio.duration) return;
            const rect = progressBar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, x / rect.width));
            meditationAudio.currentTime = meditationAudio.duration * ratio;
        });
    }
})();

