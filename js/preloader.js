/* =========================================================
   preloader.js - تحميل كامل للأصوات قبل فتح المشروع
   ========================================================= */

(function() {
    'use strict';

    const preloader = document.getElementById('projectPreloader');
    const bar = document.getElementById('preloadBar');
    const percentText = document.getElementById('preloadPercent');
    const statusText = document.getElementById('preloadStatus');

    if (!preloader || !bar || !percentText) return;

    const BASE_URL = 'https://cdn.jsdelivr.net/gh/drmunthermohammed-prog/Medical-Physics-2027@main/';
    
    // ============ الإعدادات ============
    // ⏱️ الحد الأقصى للانتظار (طوارئ)
    const MAX_TIMEOUT = 60000; // 60 ثانية

    // 🎵 الأصوات الحرجة (لا نفتح المشروع بدونها)
    const CRITICAL_AUDIO = [
        { url: BASE_URL + 'music/welcome.mp3',    name: 'الموسيقى الرئيسية' },
        { url: BASE_URL + 'music/envelope.mp3',   name: 'موسيقى الظرف' },
        { url: BASE_URL + 'music/zaghareet.mp3',  name: 'صوت الهلاهل' }
    ];

    // 🎼 أصوات ثانوية (يمكن تأجيلها)
    const OTHER_AUDIO = [
        BASE_URL + 'music/book.mp3',
        BASE_URL + 'music/book2.mp3',
        BASE_URL + 'music/book3.mp3'
    ];

    // 🖼️ صور الطلاب (15 فقط للبداية السريعة)
    const STUDENTS_TO_PRELOAD = 15;
    const studentImages = [];
    if (typeof students !== 'undefined' && Array.isArray(students)) {
        const limit = Math.min(students.length, STUDENTS_TO_PRELOAD);
        for (let i = 0; i < limit; i++) {
            const s = students[i];
            if (s.childImg) studentImages.push(s.childImg);
            if (s.adultImg) studentImages.push(s.adultImg);
        }
    }

    // ============ الحالة ============
    let criticalLoaded = 0;
    let otherLoaded = 0;
    const totalCritical = CRITICAL_AUDIO.length;
    const totalOther = OTHER_AUDIO.length + studentImages.length;
    const startTime = Date.now();
    let isFinished = false;
    let lastPercent = 0;

    // ============ تحديث الشريط ============
    function updateProgress() {
        if (isFinished) return;
        
        // ⚖️ وزن التحميل: 75% للأصوات الحرجة، 25% للثانوي
        const criticalPercent = (criticalLoaded / totalCritical) * 75;
        const otherPercent = totalOther > 0 ? (otherLoaded / totalOther) * 25 : 25;
        let totalPercent = Math.round(criticalPercent + otherPercent);
        
        // 🔒 لا نتجاوز 95% قبل اكتمال الأصوات الحرجة
        if (criticalLoaded < totalCritical) {
            totalPercent = Math.min(totalPercent, 95);
        }
        
        // ⬆️ الشريط لا يرجع للخلف أبداً
        if (totalPercent > lastPercent) {
            lastPercent = totalPercent;
            bar.style.width = totalPercent + '%';
            percentText.textContent = totalPercent + '%';
        }
        
        updateStatusText();
        
        // ✅ الإغلاق فقط عند اكتمال الأصوات الحرجة
        if (criticalLoaded >= totalCritical && !isFinished) {
            console.log('🎉 جميع الأصوات الحرجة جاهزة - فتح المشروع');
            setTimeout(closePreloader, 500);
        }
    }

    // ============ نص الحالة ============
    function updateStatusText() {
        if (!statusText) return;
        
        let icon = '📁';
        let text = 'جاري تجهيز الملفات...';
        
        if (criticalLoaded < totalCritical) {
            icon = '🎵';
            text = `جاري تحميل الأصوات (${criticalLoaded}/${totalCritical})`;
        } else if (otherLoaded < totalOther * 0.3) {
            icon = '🖼️';
            text = 'جاري تجهيز الصور...';
        } else if (otherLoaded < totalOther) {
            icon = '✨';
            text = 'لحظات أخيرة...';
        } else {
            icon = '✅';
            text = 'اكتمل التحميل';
        }
        
        statusText.innerHTML = `<span class="preload-status-icon">${icon}</span>${text}`;
    }

    // ============ تحميل صوت حرج ============
    function loadCriticalAudio(audioInfo) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = 0; // صامت أثناء التحميل
        
        let done = false;
        let checkInterval;
        
        const finish = () => {
            if (done) return;
            done = true;
            if (checkInterval) clearInterval(checkInterval);
            criticalLoaded++;
            console.log(`✅ محمّل بالكامل: ${audioInfo.name}`);
            updateProgress();
        };
        
        // 🎯 الحدث الرسمي: canplaythrough
        audio.addEventListener('canplaythrough', finish, { once: true });
        
        // 🎯 فحص readyState (4 = HAVE_ENOUGH_DATA)
        audio.addEventListener('progress', () => {
            if (audio.readyState >= 4) finish();
        });
        
        // 🛡️ فشل التحميل
        audio.addEventListener('error', () => {
            console.warn(`⚠️ فشل تحميل: ${audioInfo.name} - نتابع`);
            finish();
        }, { once: true });
        
        // 🔄 فحص دوري (أكثر أماناً)
        checkInterval = setInterval(() => {
            // readyState 4 = مكتمل التحميل
            if (audio.readyState === 4) {
                finish();
            }
            // readyState 3 = يكفي للتشغيل (احتياطي)
            else if (audio.readyState === 3 && audio.duration > 0) {
                // ننتظر ثانية إضافية للتأكد
                setTimeout(() => {
                    if (audio.readyState >= 3) finish();
                }, 1000);
                clearInterval(checkInterval);
            }
        }, 250);
        
        // 🛡️ حماية نهائية بعد 30 ثانية
        setTimeout(() => {
            if (!done) {
                console.warn(`⏰ مهلة ${audioInfo.name} - نتابع`);
                finish();
            }
        }, 30000);
        
        audio.src = audioInfo.url;
        audio.load();
    }

    // ============ تحميل صوت ثانوي ============
    function loadOtherAudio(url) {
        const audio = new Audio();
        audio.preload = 'auto';
        
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            otherLoaded++;
            updateProgress();
        };
        
        audio.addEventListener('canplaythrough', finish, { once: true });
        audio.addEventListener('error', finish, { once: true });
        setTimeout(finish, 25000);
        
        audio.src = url;
        audio.load();
    }

    // ============ تحميل صورة ============
    function loadImage(url) {
        const img = new Image();
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            otherLoaded++;
            updateProgress();
        };
        img.onload = finish;
        img.onerror = finish;
        setTimeout(finish, 20000);
        img.src = url;
    }

    // ============ إغلاق الشاشة ============
    function closePreloader() {
        if (isFinished) return;
        isFinished = true;
        
        bar.style.width = '100%';
        percentText.textContent = '100%';
        if (statusText) {
            statusText.innerHTML = '<span class="preload-status-icon">🎉</span>اكتمل! جاري فتح المشروع...';
        }
        
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800);
        }, 400);
        
        console.log('✅ Preloader: اكتمل - المشروع جاهز');
    }

    // ============ طوارئ: 60 ثانية ============
    setTimeout(() => {
        if (!isFinished) {
            console.warn('⏰ طوارئ: انتهت المهلة - فتح قسري');
            closePreloader();
        }
    }, MAX_TIMEOUT);

    // ============ بدء التحميل ============
    console.log(`📦 Preloader: ${totalCritical} صوت حرج + ${totalOther} ملف ثانوي`);
    console.log('🎵 جاري تحميل الأصوات الحرجة أولاً...');
    
    // الأصوات الحرجة (الأولوية)
    CRITICAL_AUDIO.forEach(loadCriticalAudio);
    
    // الأصوات الثانوية + الصور (بالتوازي)
    OTHER_AUDIO.forEach(loadOtherAudio);
    studentImages.forEach(loadImage);
    
    // عرض أولي
    updateStatusText();
})();
