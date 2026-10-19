/* =========================================================
   preloader.js - تحميل مسبق للأصوات والصور
   ========================================================= */

(function() {
    'use strict';

    const preloader = document.getElementById('projectPreloader');
    const bar = document.getElementById('preloaderBar');
    const percentText = document.getElementById('preloaderPercent');

    if (!preloader || !bar || !percentText) return;

    // ⬇️ رابط jsDelivr الأساسي الخاص بك
    const BASE_URL = 'https://cdn.jsdelivr.net/gh/drmunthermohammed-prog/Medical-Physics-2027@main/';

    // عدد الطلاب الذين تريد تحميل صورهم مسبقاً (30 = بداية سريعة)
    // إذا أردت تحميل الكل، اجعلها 126 (لكنها ستستغرق وقتاً أطول)
    const STUDENTS_TO_PRELOAD = 30;

    // القائمة الأساسية (أصوات)
    const assets = [
        { type: 'audio', url: BASE_URL + 'music/welcome.mp3' },
        { type: 'audio', url: BASE_URL + 'music/envelope.mp3' },
        { type: 'audio', url: BASE_URL + 'music/zaghareet.mp3' },
        { type: 'audio', url: BASE_URL + 'music/book.mp3' },
        { type: 'audio', url: BASE_URL + 'music/book2.mp3' },
        { type: 'audio', url: BASE_URL + 'music/book3.mp3' }
    ];

    // إضافة صور الطلاب
    if (typeof students !== 'undefined' && Array.isArray(students)) {
        const limit = Math.min(students.length, STUDENTS_TO_PRELOAD);
        
        for (let i = 0; i < limit; i++) {
            const student = students[i];
            if (student.childImg) {
                assets.push({ type: 'image', url: student.childImg });
            }
            if (student.adultImg) {
                assets.push({ type: 'image', url: student.adultImg });
            }
        }
    }

    let loadedCount = 0;
    const totalAssets = assets.length;

    if (totalAssets === 0) {
        finishPreloader();
        return;
    }

    // تحديث شريط التقدم
    function updateProgress() {
        loadedCount++;
        const percent = Math.round((loadedCount / totalAssets) * 100);
        
        if (bar) bar.style.width = percent + '%';
        if (percentText) percentText.textContent = percent + '%';
        
        if (loadedCount >= totalAssets) {
            setTimeout(finishPreloader, 500);
        }
    }

    // تحميل الصور
    function preloadImage(url) {
        const img = new Image();
        img.onload = img.onerror = updateProgress;
        img.src = url;
    }

    // تحميل الأصوات
    function preloadAudio(url) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.oncanplaythrough = audio.onerror = updateProgress;
        audio.src = url;
        audio.load();
    }

    // إخفاء الشاشة والدخول للموقع
    function finishPreloader() {
        preloader.classList.add('hidden');
        setTimeout(() => {
            preloader.style.display = 'none';
            // إذا كانت شاشة المفاجأة مخفية، أظهرها
            const surprise = document.getElementById('surpriseScreen');
            if (surprise && surprise.style.display !== 'none') {
                document.body.classList.add('surprise-active');
            }
        }, 800);
    }

    // بدء التحميل
    assets.forEach(asset => {
        if (asset.type === 'image') {
            preloadImage(asset.url);
        } else if (asset.type === 'audio') {
            preloadAudio(asset.url);
        }
    });

    // مهلة احتياطية (إذا تأخر التحميل جداً، ادخل بعد 20 ثانية)
    setTimeout(() => {
        if (!preloader.classList.contains('hidden')) {
            console.warn('⚠️ تحميل بطيء - الدخول القسري');
            finishPreloader();
        }
    }, 20000);

    console.log(`📦 preloader.js: تحميل ${totalAssets} ملف...`);
})();