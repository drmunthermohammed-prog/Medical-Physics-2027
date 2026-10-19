/* =========================================================
   preloader.js - شاشة تحميل ذكية (10 ثوانٍ + تحميل متوازي)
   ========================================================= */

(function() {
    'use strict';

    const preloader = document.getElementById('projectPreloader');
    const bar = document.getElementById('preloadBar');
    const percentText = document.getElementById('preloadPercent');
    const statusText = document.getElementById('preloadStatus');

    if (!preloader || !bar || !percentText) return;

    // ===== الإعدادات =====
    const MIN_DURATION = 10000;   // 10 ثوانٍ حد أدنى (المدة المطلوبة)
    const MAX_DURATION = 15000;   // 15 ثانية طوارئ (حماية)
    const BASE_URL = 'https://cdn.jsdelivr.net/gh/drmunthermohammed-prog/Medical-Physics-2027@main/';

    // ===== الملفات المطلوبة =====
    const assets = [
        { type: 'audio', url: BASE_URL + 'music/welcome.mp3' },
        { type: 'audio', url: BASE_URL + 'music/envelope.mp3' },
        { type: 'audio', url: BASE_URL + 'music/zaghareet.mp3' },
        { type: 'audio', url: BASE_URL + 'music/book.mp3' },
        { type: 'audio', url: BASE_URL + 'music/book2.mp3' },
        { type: 'audio', url: BASE_URL + 'music/book3.mp3' }
    ];

    // صور أول 15 طالباً فقط (للسرعة - الباقي يُحمّل lazy)
    const STUDENTS_TO_PRELOAD = 15;
    if (typeof students !== 'undefined' && Array.isArray(students)) {
        const limit = Math.min(students.length, STUDENTS_TO_PRELOAD);
        for (let i = 0; i < limit; i++) {
            const s = students[i];
            if (s.childImg) assets.push({ type: 'image', url: s.childImg });
            if (s.adultImg) assets.push({ type: 'image', url: s.adultImg });
        }
    }

    // ===== الحالة =====
    let loadedCount = 0;
    const totalAssets = assets.length;
    let realProgress = 0;
    let isFinished = false;
    const startTime = Date.now();

    // ===== تحديث الشريط =====
    function updateBar(percent) {
        const p = Math.round(percent);
        bar.style.width = p + '%';
        percentText.textContent = p + '%';
    }

    // ===== عند اكتمال تحميل ملف =====
    function onAssetLoaded() {
        loadedCount++;
        realProgress = Math.round((loadedCount / totalAssets) * 100);
    }

    function preloadImage(url) {
        const img = new Image();
        img.onload = img.onerror = onAssetLoaded;
        img.src = url;
    }

    function preloadAudio(url) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.oncanplaythrough = audio.onerror = onAssetLoaded;
        audio.src = url;
        audio.load();
    }

    // ===== إغلاق الشاشة =====
    function closePreloader() {
        if (isFinished) return;
        isFinished = true;

        updateBar(100);

        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800);
        }, 300);

        console.log('✅ Preloader: اكتمل - فتح المشروع');
    }

    // ===== الحلقة الرئيسية =====
    function tick() {
        if (isFinished) return;

        const elapsed = Date.now() - startTime;
        const timeProgress = Math.min((elapsed / MIN_DURATION) * 100, 100);
        let displayProgress;

        // مرحلة 1: 0-10 ثوانٍ (الشريط يتقدم مع الوقت)
        if (elapsed < MIN_DURATION) {
            // لا يصل لـ 100% قبل الوقت المحدد
            displayProgress = Math.min(timeProgress, 95);
        }
        // مرحلة 2: بعد 10 ثوانٍ (هل اكتمل التحميل؟)
        else if (elapsed < MAX_DURATION) {
            if (realProgress >= 80) {
                // ملفات كافية → أنجز
                displayProgress = 100;
            } else {
                // ملفات لا تزال تُحمّل → "لحظات أخيرة"
                displayProgress = Math.min(95, 95 + (elapsed - MIN_DURATION) / MAX_DURATION * 4);
                if (statusText && !statusText.dataset.extended) {
                    statusText.dataset.extended = 'true';
                    statusText.innerHTML = '<span class="preload-status-icon">⏳</span>لحظات أخيرة...';
                }
            }
        }
        // مرحلة 3: طوارئ (15 ثانية)
        else {
            displayProgress = 100;
        }

        updateBar(displayProgress);

        if (displayProgress >= 100) {
            closePreloader();
            return;
        }

        requestAnimationFrame(tick);
    }

    // ===== بدء التحميل الفعلي =====
    assets.forEach(asset => {
        if (asset.type === 'image') preloadImage(asset.url);
        else if (asset.type === 'audio') preloadAudio(asset.url);
    });

    console.log(`📦 Preloader: ${totalAssets} ملف - ${MIN_DURATION / 1000} ثانية حد أدنى`);

    // ===== بدء العد =====
    tick();
})();
