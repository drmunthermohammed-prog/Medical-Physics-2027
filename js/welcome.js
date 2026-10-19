/* =========================================================
   welcome.js - المفاجأة: الظرف + الرحلة + الشهادة
   ========================================================= */

(function() {
    'use strict';
    
    const SPLASH_KEY = 'surprise_shown_v2';
    const SELECTED_KEY = 'selected_student_v1';
	
    
    const screen = document.getElementById('surpriseScreen');
    if (!screen) return;
    
    // هل تم عرض المفاجأة؟
    let alreadyShown = false;
    try {
        alreadyShown = sessionStorage.getItem(SPLASH_KEY) === 'true';
    } catch (e) {}
    
    if (alreadyShown) {
        screen.style.display = 'none';
        screen.classList.remove('active');
        document.body.classList.remove('surprise-active');
        // تأكد أن الموقع مرئي
        document.querySelectorAll('body > *:not(#surpriseScreen):not(script)').forEach(function(el) {
            el.style.display = '';
        });
        return;
    }
    
document.body.classList.add('surprise-active');

// ⬇️ إخفاء كل شيء في الصفحة ما عدا المفاجأة (بالجافاسكريبت)
document.querySelectorAll('body > *:not(#surpriseScreen):not(script)').forEach(function(el) {
    el.style.display = 'none';
});
    screen.classList.add('active');
    
    // ===== الحالة =====
    let selectedStudent = null;
    let envelopeSong = null;          // موسيقى الظرف
    let zaghareetSong = null;         // صوت الهلاهل
    let envelopeResumeTimeout = null; // مؤقت إعادة تشغيل موسيقى الظرف
    
    // ===== عناصر DOM =====
    const $ = id => document.getElementById(id);
    
    const stages = {
        name: $('spStageName'),
        envelope: $('spStageEnvelope'),
        message: $('spStageMessage'),
        journey: $('spStageJourney'),
        cert: $('spStageCert'),
        stars: $('spStageStars')
    };
    
    // ===== التنقل بين المراحل =====
    function goToStage(stageName) {
        Object.values(stages).forEach(s => s && s.classList.remove('active'));
        if (stages[stageName]) stages[stageName].classList.add('active');
    }
    
    // =========================================================
    // المرحلة 1: إدخال الاسم
    // =========================================================
    const nameInput = $('spNameInput');
    const suggestions = $('spSuggestions');
    const error = $('spError');
    const enterBtn = $('spEnterBtn');
    const skipBtn = $('spSkipBtn');
    
    function normalizeArabic(text) {
        return String(text)
            .replace(/[\u064B-\u065F\u0670]/g, '')
            .replace(/[أإآا]/g, 'ا')
            .replace(/[ىي]/g, 'ي')
            .replace(/[ةه]/g, 'ه')
            .replace(/[ؤو]/g, 'و')
            .replace(/[ئ]/g, 'ي')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }
    
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            const q = nameInput.value.trim();
            error.textContent = '';
            
            if (q.length < 2) {
                suggestions.classList.remove('active');
                return;
            }
            
            const norm = normalizeArabic(q);
            const matches = students
                .filter(s => normalizeArabic(s.name).includes(norm))
                .slice(0, 8);
            
            if (matches.length === 0) {
                suggestions.classList.remove('active');
                return;
            }
            
            suggestions.innerHTML = matches.map(s => 
                `<div class="sp-suggestion-item" data-name="${s.name}">${s.name}</div>`
            ).join('');
            suggestions.classList.add('active');
            
            suggestions.querySelectorAll('.sp-suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    nameInput.value = item.dataset.name;
                    suggestions.classList.remove('active');
                });
            });
        });
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') enterBtn.click();
        });
    }
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sp-input-wrapper')) {
            suggestions.classList.remove('active');
        }
    });
    
    // =========================================================
    // البحث عن الطالب
    // =========================================================
    function findStudent(name) {
        const norm = normalizeArabic(name);
        if (!norm) return null;
        
        let found = students.find(s => s.name === name);
        if (found) return found;
        
        found = students.find(s => normalizeArabic(s.name) === norm);
        if (found) return found;
        
        found = students.find(s => normalizeArabic(s.name).includes(norm));
        if (found) return found;
        
        return null;
    }
    
    // =========================================================
    // زر الدخول
    // =========================================================
    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            
            if (!name) {
                error.textContent = '⚠️ اكتب اسمك أولاً';
                return;
            }
            
            const student = findStudent(name);
            
            if (!student) {
                error.textContent = '❌ لم نجد اسمك. تأكد من كتابته';
                return;
            }
            
            selectedStudent = student;
            
            // حفظ للاستخدام لاحقاً
            try {
                localStorage.setItem(SELECTED_KEY, JSON.stringify({
                    id: student.id,
                    name: student.name
                }));
            } catch (e) {}
            
            // الانتقال للمرحلة 2
            const hint = $('spEnvelopeHint');
            const letterName = $('spLetterName');
            if (hint) hint.textContent = `لديك رسالة خاصة يا ${student.name.split(' ')[0]}`;
            if (letterName) letterName.textContent = student.name.split(' ')[0];
            
            goToStage('envelope');
            
            // إيقاف موسيقى الخلفية العامة (حتى لا تتداخل)
            if (window.BgMusic) window.BgMusic.pause();

            // تشغيل موسيقى الظرف الخاصة
            try {
                if (!envelopeSong) {
                    envelopeSong = new Audio('music/envelope.mp3');
                    envelopeSong.volume = 0.5;
                    envelopeSong.loop = true;
                }
                envelopeSong.currentTime = 0;
                envelopeSong.play().catch(e => console.log('ℹ️ music/envelope.mp3 غير متوفر'));
            } catch (err) {}
        });
    }
    
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            finishSurprise();
        });
    }
    
    // =========================================================
    // المرحلة 2: الظرف
    // =========================================================
    const envelope = $('spEnvelope');
    const openEnvelopeBtn = $('spOpenEnvelopeBtn');
    
if (openEnvelopeBtn) {
    openEnvelopeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        console.log('🎁 زر الظرف: تم النقر');
        
        if (!envelope) {
            console.error('❌ عنصر spEnvelope غير موجود');
            alert('حدث خطأ. حدّث الصفحة');
            return;
        }
        
        // فتح الظرف
        envelope.classList.add('opened');
        openEnvelopeBtn.disabled = true;
        openEnvelopeBtn.innerHTML = '<span>✉️</span> تُفتح...';
        
        // احتفال
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 50,
                spread: 80,
                origin: { x: 0.5, y: 0.5 },
                colors: ['#d4af37', '#fbbf24', '#38bdf8', '#ffffff'],
                scalar: 0.9
            });
        }
        
        // 🎵 إيقاف موسيقى الخلفية العامة
        if (window.BgMusic) {
            window.BgMusic.pause();
            console.log('⏸ BgMusic: توقفت');
        }

        // 1. إيقاف موسيقى الظرف مؤقتاً (إن كانت تعمل)
        if (envelopeSong && !envelopeSong.paused) {
            envelopeSong.pause();
            console.log('⏸ موسيقى الظرف: توقفت');
        }

        // 2. تشغيل صوت الهلاهل (زغاريد)
        try {
            if (!zaghareetSong) {
                zaghareetSong = new Audio('music/zaghareet.mp3');
                zaghareetSong.volume = 0.8;
                zaghareetSong.loop = false;
            }
            zaghareetSong.currentTime = 0;
            
            // دالة استئناف موسيقى الظرف
            const resumeEnvelopeMusic = () => {
                if (envelopeSong) {
                    envelopeSong.play().catch(e => {});
                    console.log('▶️ موسيقى الظرف: استؤنفت');
                }
            };

            zaghareetSong.play().then(() => {
                console.log('🎉 صوت الهلاهل: يعمل');
                // استئناف موسيقى الظرف بعد 3.5 ثانية
                if (envelopeResumeTimeout) clearTimeout(envelopeResumeTimeout);
                envelopeResumeTimeout = setTimeout(resumeEnvelopeMusic, 5800);
            }).catch(err => {
                console.log('ℹ️ ملف الهلاهل غير متوفر (music/zaghareet.mp3)');
                resumeEnvelopeMusic();
            });
        } catch (err) {
            console.warn('خطأ في تشغيل الهلاهل:', err);
        }
		
        // 3. الانتقال للمرحلة 3
        setTimeout(() => {
            const msgName = $('spMsgName');
            if (msgName && selectedStudent) msgName.textContent = selectedStudent.name;
            goToStage('message');
            console.log('✅ الانتقال للرسالة');
        }, 1800);
    });
    
    console.log('✅ زر الظرف: جاهز');
} else {
    console.error('❌ spOpenEnvelopeBtn غير موجود في HTML');
}
    // =========================================================
    // المرحلة 3: الرسالة
    // =========================================================
    const messageContinueBtn = $('spMessageContinueBtn');
    
    if (messageContinueBtn) {
        messageContinueBtn.addEventListener('click', () => {
            goToStage('journey');
            startJourney();
        });
    }
    
    // =========================================================
    // المرحلة 4: رحلة الصور
    // =========================================================
    let journeyTimers = [];
    
    function startJourney() {
        if (!selectedStudent) return;
        
        const childImg = $('spChildImg');
        const adultImg = $('spAdultImg');
        const journeyChild = $('spJourneyChild');
        const journeyAdult = $('spJourneyAdult');
        const journeyFinal = $('spJourneyFinal');
        const finalName = $('spFinalName');
        
        // تحميل الصور
        if (childImg) childImg.src = selectedStudent.childImg || '';
        if (adultImg) adultImg.src = selectedStudent.adultImg || selectedStudent.childImg || '';
        if (finalName) finalName.textContent = selectedStudent.name;
        
        // المرحلة 1: صورة الطفل
        journeyTimers.push(setTimeout(() => {
            if (journeyChild) journeyChild.classList.add('active');
        }, 300));
        
        // المرحلة 2: صورة الكبير
        journeyTimers.push(setTimeout(() => {
            if (journeyChild) journeyChild.classList.remove('active');
            if (journeyAdult) journeyAdult.classList.add('active');
        }, 4000));
        
        // المرحلة 3: النهاية
        journeyTimers.push(setTimeout(() => {
            if (journeyAdult) journeyAdult.classList.remove('active');
            if (journeyFinal) journeyFinal.classList.add('active');
            
            // احتفال
            if (typeof confetti === 'function') {
                fireJourneyConfetti();
            }
        }, 8000));
        
        // المرحلة 4: الشهادة
        journeyTimers.push(setTimeout(() => {
            prepareCertificate();
            goToStage('cert');
        }, 12000));
    }
    
    function fireJourneyConfetti() {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const colors = ['#d4af37', '#fbbf24', '#38bdf8', '#a855f7', '#ffffff'];
        const randomInRange = (min, max) => Math.random() * (max - min) + min;
        
        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 60 * (timeLeft / duration);
            
            confetti({
                particleCount,
                startVelocity: 35,
                spread: 360,
                ticks: 70,
                zIndex: 100000,
                colors,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                particleCount,
                startVelocity: 35,
                spread: 360,
                ticks: 70,
                zIndex: 100000,
                colors,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    }
    
    // =========================================================
    // المرحلة 5: الشهادة
    // =========================================================
    function prepareCertificate() {
        if (!selectedStudent) return;
        
        const certName = $('spCertName');
        const certPhoto = $('spCertPhoto');
        const certSerial = $('spCertSerial');
        
        if (certName) certName.textContent = selectedStudent.name;
        if (certPhoto) {
            certPhoto.src = selectedStudent.adultImg || selectedStudent.childImg || '';
        }
        if (certSerial) {
            const id = selectedStudent.id || 1;
            certSerial.textContent = `MP-2027-${String(id).padStart(3, '0')}`;
        }
    }
    
    // =========================================================
    // أزرار الشهادة (في الشاشة)
    // =========================================================
    const nextToStarsBtn = $('spNextToStarsBtn');
    const downloadCertBtn = $('spDownloadCertBtn');
    const shareCertBtn = $('spShareCertBtn');
    
    if (nextToStarsBtn) {
        nextToStarsBtn.addEventListener('click', () => {
            goToStage('stars');
            showStarsSky();
        });
    }
    
    if (downloadCertBtn) {
        downloadCertBtn.addEventListener('click', () => {
            downloadCertificate($('spCert'), 'شهادة_' + (selectedStudent?.name || '') + '_2027.png');
        });
    }
    
    if (shareCertBtn) {
        shareCertBtn.addEventListener('click', () => {
            shareCertificate(selectedStudent?.name || '');
        });
    }
    
    // =========================================================
    // إنهاء المفاجأة
    // =========================================================
    function finishSurprise() {
        try {
            sessionStorage.setItem(SPLASH_KEY, 'true');
        } catch (e) {}
        
        // مسح المؤقتات
        journeyTimers.forEach(t => clearTimeout(t));

        // 🎵 إيقاف كل الأصوات
        if (envelopeSong) {
            envelopeSong.pause();
            envelopeSong.currentTime = 0;
        }
        if (zaghareetSong) {
            zaghareetSong.pause();
            zaghareetSong.currentTime = 0;
        }
        if (envelopeResumeTimeout) {
            clearTimeout(envelopeResumeTimeout);
        }
        console.log('🎵 إيقاف كل الأصوات');
        
        
        screen.style.opacity = '0';
        screen.style.transition = 'opacity 0.6s ease';
        
setTimeout(() => {
    screen.style.display = 'none';
    screen.classList.remove('active');
    
    // ⬇️ الأهم: إزالة كلاس surprise-active من body
    document.body.classList.remove('surprise-active');
    
    // ⬇️ إعادة إظهار الموقع
    document.querySelectorAll('body > *:not(#surpriseScreen):not(script)').forEach(function(el) {
        el.style.display = '';
    });
    
    // 🎵 استئناف موسيقى الخلفية (welcome.mp3)
    if (window.BgMusic) {
        window.BgMusic.play();
        console.log('▶️ BgMusic: استؤنفت في الخلفية');
    }
    
    console.log('✅ المفاجأة انتهت - الموقع مرئي الآن');
}, 600);
    }
    // =========================================================
    // تحميل الشهادة كصورة
    // =========================================================
    async function downloadCertificate(certElement, filename) {
        if (!certElement) return;
        
        if (typeof html2canvas !== 'function') {
            alert('⚠️ ميزة التحميل غير متوفرة');
            return;
        }
        
        try {
            // إخفاء الأزرار مؤقتاً
            const originalScale = certElement.style.transform;
            certElement.style.transform = 'none';
            
            const canvas = await html2canvas(certElement, {
                scale: 2,
                backgroundColor: '#fdf6e3',
                useCORS: true,
                allowTaint: false,
                logging: false
            });
            
            certElement.style.transform = originalScale;
            
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/png');
            
        } catch (err) {
            console.error('خطأ في التحميل:', err);
            alert('⚠️ فشل التحميل. جرّب متصفحاً آخر.');
        }
    }
    
    // =========================================================
    // مشاركة الشهادة
    // =========================================================
    async function shareCertificate(studentName) {
        const text = `🎓 شهادة تخرج ${studentName}\nقسم الفيزياء الطبية — جامعة الهادي 2027`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'شهادة تخرجي',
                    text: text,
                    url: window.location.href
                });
            } catch (err) {
                if (err.name !== 'AbortError') fallbackCopy(text);
            }
        } else {
            fallbackCopy(text);
        }
        
        function fallbackCopy(txt) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(txt).then(() => {
                    alert('✅ تم نسخ نص الشهادة');
                }).catch(() => {
                    alert('⚠️ المشاركة غير مدعومة');
                });
            }
        }
    }
    
    // =========================================================
    // نافذة الشهادة من الموقع (زر عائم)
    // =========================================================
    // سيتم تشغيلها من main.js
    window.openCertFromModal = function() {
        const certModal = $('certModal');
        if (!certModal) return;
        
        // استعادة الطالب المختار
        let student = null;
        try {
            const saved = JSON.parse(localStorage.getItem(SELECTED_KEY) || 'null');
            if (saved) {
                student = students.find(s => s.id === saved.id);
            }
        } catch (e) {}
        
        if (!student) {
            alert('⚠️ يرجى إدخال اسمك أولاً في شاشة البداية');
            return;
        }
        
        // تعبئة الشهادة
        const certNameModal = $('spCertNameModal');
        const certPhotoModal = $('spCertPhotoModal');
        const certSerialModal = $('spCertSerialModal');
        
        if (certNameModal) certNameModal.textContent = student.name;
        if (certPhotoModal) certPhotoModal.src = student.adultImg || student.childImg || '';
        if (certSerialModal) {
            certSerialModal.textContent = `MP-2027-${String(student.id).padStart(3, '0')}`;
        }
        
        certModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // ربط أزرار النافذة
        const closeBtn = $('certModalClose');
        const downloadBtn = $('certModalDownload');
        const shareBtn = $('certModalShare');
        
        const closeModal = () => {
            certModal.classList.remove('active');
            document.body.style.overflow = '';
        };
        
        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        
        certModal.onclick = (e) => {
            if (e.target === certModal) closeModal();
        };
        
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                downloadCertificate($('certModalCert'), 'شهادة_' + student.name + '_2027.png');
            };
        }
        
        if (shareBtn) {
            shareBtn.onclick = () => {
                shareCertificate(student.name);
            };
        }
    };
	
function showStarsSky() {
    const sky = $('spStarsSky');
    if (!sky || !selectedStudent) return;
    
    sky.innerHTML = '';
    
    const total = students.length;
    if (total === 0) return;
    
    // ===== حساب الأبعاد الفعلية =====
    const skyRect = sky.getBoundingClientRect();
    const W = skyRect.width;
    const H = skyRect.height;
    
    // ===== حجم النجمة حسب العدد =====
    let starSize, starSizeMobile;
    if (total <= 20) {
        starSize = 32;
        starSizeMobile = 26;
    } else if (total <= 50) {
        starSize = 28;
        starSizeMobile = 22;
    } else if (total <= 80) {
        starSize = 24;
        starSizeMobile = 20;
    } else if (total <= 100) {
        starSize = 22;
        starSizeMobile = 18;
    } else {
        starSize = 20;
        starSizeMobile = 16;
    }
    
    // تعيين حجم النجوم كمتغير CSS
    document.documentElement.style.setProperty('--star-size', starSize + 'px');
    document.documentElement.style.setProperty('--star-size-mobile', starSizeMobile + 'px');
    
    // ===== توليد مواقع عشوائية حقيقية =====
    const positions = generateRandomPositions(total, W, H, starSize);
    
    // ===== خلط الطلاب =====
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    
    // ===== وضع المستخدم في منتصف الشاشة (مع انزياح عشوائي) =====
    const userIndex = shuffled.findIndex(s => s && s.id === selectedStudent.id);
    if (userIndex > -1) {
        // احتفظ بموقع مركزي لنجمة المستخدم
        const centerPos = {
            x: 50 + (Math.random() - 0.5) * 20,  // انزياح ±10%
            y: 50 + (Math.random() - 0.5) * 20
        };
        positions.unshift(centerPos);
        
        // انقل نجمة المستخدم للموقع الأول
        const user = shuffled.splice(userIndex, 1)[0];
        shuffled.unshift(user);
    }
    
    // ===== إنشاء النجوم =====
    shuffled.forEach((student, i) => {
        if (!student) return;
        
        const pos = positions[i] || { x: 50, y: 50 };
        const isUser = student.id === selectedStudent.id;
        
        const star = document.createElement('div');
        star.className = 'sp-star' + (isUser ? ' sp-star-you' : '');
        star.style.left = pos.x + '%';
        star.style.top = pos.y + '%';
        star.style.animationDelay = (i * 0.03) + 's';
        star.dataset.studentId = student.id;
        star.dataset.studentName = student.name;
        
        // إضافات نجمة المستخدم
        let extraElements = '';
        if (isUser) {
            extraElements = `
                <div class="sp-star-your-shine"></div>
                <div class="sp-star-your-crown">🎓</div>
                <div class="sp-star-your-name">${student.name.split(' ')[0]}</div>
            `;
        }
        
        star.innerHTML = `
            ${extraElements}
            <img src="${student.childImg}" alt="${student.name}" loading="lazy" 
                 onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%231e3a8a%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2258%22 font-size=%2240%22 fill=%22%237dd3fc%22 text-anchor=%22middle%22>⭐</text></svg>'">
        `;
        
        if (isUser) {
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                showStarZoom(student);
            });
        } else {
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                star.classList.add('sp-star-wrong');
                setTimeout(() => star.classList.remove('sp-star-wrong'), 400);
                
                const oldTip = star.querySelector('.sp-star-name-tip');
                if (oldTip) oldTip.remove();
                
                const tip = document.createElement('div');
                tip.className = 'sp-star-name-tip';
                tip.textContent = student.name.split(' ')[0] + ' ⭐';
                star.appendChild(tip);
                
                setTimeout(() => tip.remove(), 1800);
            });
        }
        
        sky.appendChild(star);
    });
    

    // ===== القمر =====
    const moon = document.createElement('div');
    moon.className = 'sp-moon';
    sky.parentElement.appendChild(moon);
    
    // ===== نجوم صغيرة في الخلفية =====
    const tinyStars = document.createElement('div');
    tinyStars.className = 'sp-tiny-stars';
    for (let i = 0; i < 50; i++) {
        const s = document.createElement('span');
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 100 + '%';
        s.style.animationDelay = (Math.random() * 3) + 's';
        s.style.animationDuration = (2 + Math.random() * 3) + 's';
        tinyStars.appendChild(s);
    }
    sky.parentElement.appendChild(tinyStars);
    
    const hint = $('spStarsHint');
    if (hint) {
        hint.innerHTML = 'ابحث عن <strong>نجمتك الذهبية</strong> في السماء';
    }
    
    // ===== ربط زر التخطي =====
    const skipBtn = $('spStarsSkipBtn');
    if (skipBtn) {
        skipBtn.onclick = () => {
            if (typeof finishSurprise === 'function') {
                finishSurprise();
            }
        };
    }
    
    console.log(`🌟 ${shuffled.length} نجمة + قمر`);
}


/* =========================================================
   ✨ عرض النجمة المكبرة (showStarZoom)
   ========================================================= */
function showStarZoom(student) {
    const zoom = $('spStarZoom');
    const zoomImg = $('spStarZoomImg');
    const zoomName = $('spStarZoomName');
    
    if (!zoom || !student) return;
    
    if (zoomImg) {
        zoomImg.src = student.childImg || student.adultImg || '';
        zoomImg.onerror = () => {
            zoomImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%231e3a8a" width="200" height="200"/><text x="100" y="115" font-size="80" fill="%237dd3fc" text-anchor="middle">⭐</text></svg>';
        };
    }
    if (zoomName) zoomName.textContent = student.name;
    
    zoom.classList.add('active');
    zoom.style.display = 'flex';
    
    fireStarConfetti();
    
    // ربط زر الدخول
    const enterBtn = $('spStarsEnterBtn');
    if (enterBtn) {
        // إزالة المستمعين السابقين
        const newBtn = enterBtn.cloneNode(true);
        enterBtn.parentNode.replaceChild(newBtn, enterBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            finishSurprise();
        });
    }
    
    console.log('✨ نجمة الخريج: معروضة');
}

/* =========================================================
   🎉 احتفال النجوم
   ========================================================= */
function fireStarConfetti() {
    if (typeof confetti !== 'function') return;
    
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#fbbf24', '#d4af37', '#38bdf8', '#ffffff', '#a855f7'];
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    
    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 60 * (timeLeft / duration);
        
        confetti({
            particleCount,
            startVelocity: 35,
            spread: 360,
            ticks: 70,
            zIndex: 100001,
            colors,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
            particleCount,
            startVelocity: 35,
            spread: 360,
            ticks: 70,
            zIndex: 100001,
            colors,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
    }, 250);
    
    // انفجار مركزي
    setTimeout(() => {
        confetti({
            particleCount: 150,
            spread: 160,
            startVelocity: 45,
            origin: { x: 0.5, y: 0.5 },
            colors,
            zIndex: 100001,
            scalar: 1.2
        });
    }, 300);
}
	
/* =========================================================
   توليد مواقع عشوائية حقيقية (بدون تداخل)
   ========================================================= */
function generateRandomPositions(count, W, H, starSize) {
    // المسافة الدنيا بين النجوم (بالنسبة المئوية)
    const minDistPx = starSize * 1.5;
    const minDistX = (minDistPx / W) * 100;
    const minDistY = (minDistPx / H) * 100;
    const minDist = Math.min(minDistX, minDistY);
    
    // حساب عدد الخلايا المطلوبة (شبكة ضيقة جداً كحد أدنى)
    const aspect = W / H;
    let cols = Math.max(3, Math.ceil(Math.sqrt(count * aspect)));
    let rows = Math.ceil(count / cols);
    
    // ضمان سعة كافية
    while (cols * rows < count) {
        cols++;
        rows = Math.ceil(count / cols);
    }
    
    // إنشاء كل الخلايا الممكنة
    const cells = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            cells.push({
                c, r,
                // موقع الخلية الأساسي (مركز الخلية)
                baseX: ((c + 0.5) / cols) * 100,
                baseY: ((r + 0.5) / rows) * 100,
                // حجم الخلية بالنسبة المئوية
                cellW: 100 / cols,
                cellH: 100 / rows
            });
        }
    }
    
    // خلط الخلايا (Fisher-Yates shuffle)
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    
    // اختيار عدد النجوم المطلوب مع إزاحة عشوائية
    const positions = [];
    for (let i = 0; i < count && i < cells.length; i++) {
        const cell = cells[i];
        
        // إزاحة عشوائية داخل الخلية (40% من حجم الخلية)
        const jitterX = (Math.random() - 0.5) * cell.cellW * 0.8;
        const jitterY = (Math.random() - 0.5) * cell.cellH * 0.8;
        
        positions.push({
            x: Math.max(2, Math.min(98, cell.baseX + jitterX)),
            y: Math.max(2, Math.min(98, cell.baseY + jitterY))
        });
    }
    
    return positions;
}
    
    console.log('🎁 welcome.js: جاهز للمفاجأة');
})();