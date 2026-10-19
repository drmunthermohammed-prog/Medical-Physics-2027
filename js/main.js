/* =========================================================
   main.js - الوظائف الرئيسية (نسخة مُصلحة)
   ========================================================= */

// ===== عناصر DOM =====
const grid = document.getElementById('allPhotosGrid');           // ← الشبكة الآن داخل النافذة
const searchInput = document.getElementById('searchInput');       // ← البحث
const studentCountEl = document.getElementById('allPhotosCount'); // ← العداد
const modal = document.getElementById('studentModal');
const modalCard = document.getElementById('modalCard');
const closeModalBtn = document.getElementById('closeModal');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const studentCounter = document.getElementById('studentCounter');

const modalChildImg = document.getElementById('modalChildImg');
const modalAdultImg = document.getElementById('modalAdultImg');
const modalChildName = document.getElementById('modalChildName');
const modalAdultName = document.getElementById('modalAdultName');
const modalAdultJob = document.getElementById('modalAdultJob');
const modalAdultMessage = document.getElementById('modalAdultMessage');

// ===== حالة =====
let currentStudentIndex = 0;
let currentFilteredStudents = [...students];

// =========================================================
// رسم الشبكة (داخل نافذة الصور)
// =========================================================
function renderGrid(filterText = '') {
    if (!grid) {
        console.warn('⚠️ allPhotosGrid غير موجود');
        return;
    }
    
    grid.innerHTML = '';
    currentFilteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(filterText.toLowerCase())
    );

    if (studentCountEl) {
        studentCountEl.textContent = currentFilteredStudents.length;
    }

    if (currentFilteredStudents.length === 0) {
        grid.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#bae6fd;"><span style="font-size:3rem;display:block;margin-bottom:10px;">🔍</span>لا يوجد طالب بهذا الاسم</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    currentFilteredStudents.forEach((student, index) => {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.style.animationDelay = Math.min(index * 0.01, 1) + 's';
        item.innerHTML = `
            <div class="photo-wrap">
                <img src="${student.childImg}" alt="${student.name}" loading="lazy" 
                     onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%231e3a8a%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2258%22 font-size=%2235%22 fill=%22%237dd3fc%22 text-anchor=%22middle%22>?</text></svg>'">
                <div class="mini-number">${student.id}</div>
            </div>
            <div class="name-strip" title="${student.name}">${student.name}</div>
        `;
        
        // ⬇️ مهم: نقل حدث النقر مع e.stopPropagation()
        item.addEventListener('click', (e) => {
            e.stopPropagation();       // ← منع تسرب الحدث لنافذة الصور
            e.preventDefault();
            openModal(index);
        });
        
        fragment.appendChild(item);
    });
    grid.appendChild(fragment);
}

// =========================================================
// البحث (فقط إذا كان موجوداً)
// =========================================================
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        renderGrid(e.target.value.trim());
    });
    console.log('✅ حقل البحث: جاهز');
} else {
    console.warn('⚠️ searchInput غير موجود — البحث معطل');
}

// =========================================================
// فتح نافذة الطالب
// =========================================================
function openModal(index) {
    currentStudentIndex = index;
    const student = currentFilteredStudents[index];
    
    if (!student) {
        console.warn('⚠️ الطالب غير موجود في الفهرس:', index);
        return;
    }
    
    // ===== تحميل الصور مع حماية من الأخطاء =====
    modalChildImg.src = student.childImg || '';
    modalChildImg.onerror = function() {
        this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect fill="%231e3a8a" width="400" height="500"/><text x="200" y="260" font-size="100" fill="%237dd3fc" text-anchor="middle">?</text></svg>';
    };
    
    modalAdultImg.src = student.adultImg || '';
    modalAdultImg.onerror = function() {
        this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect fill="%231e3a8a" width="400" height="500"/><text x="200" y="260" font-size="100" fill="%237dd3fc" text-anchor="middle">?</text></svg>';
    };
    
    // ===== النصوص =====
    modalChildName.textContent = student.name;
    modalAdultName.textContent = student.name;
    modalAdultJob.textContent = student.jobTitle || 'خريج فيزياء طبية';
    modalAdultMessage.textContent = student.message || '';
    
    if (!student.message) {
        modalAdultMessage.style.display = 'none';
    } else {
        modalAdultMessage.style.display = 'block';
    }
    
    // ===== الجوائز =====
    const awardsContainer = document.getElementById('modalAdultAwards');
    if (awardsContainer) {
        if (student.awards && student.awards.length > 0) {
            awardsContainer.innerHTML = student.awards.map(a => 
                `<span class="modal-award-badge">${a}</span>`
            ).join('');
            awardsContainer.style.display = 'flex';
        } else {
            awardsContainer.innerHTML = '';
            awardsContainer.style.display = 'none';
        }
    }
    
    // ===== العداد وأزرار التنقل =====
    if (studentCounter) {
        studentCounter.textContent = `${index + 1} / ${currentFilteredStudents.length}`;
    }
    
    const showNav = currentFilteredStudents.length > 1;
    if (prevBtn) prevBtn.style.display = showNav ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = showNav ? 'flex' : 'none';
    
    // ===== إعادة البطاقة للوضع الأمامي =====
    if (modalCard) modalCard.classList.remove('is-flipped');
    
    // ===== فتح النافذة =====
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// =========================================================
// إغلاق نافذة الطالب
// =========================================================
function closeModal() {
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
}

if (modal) {
    modal.addEventListener('click', (e) => { 
        if (e.target === modal) closeModal(); 
    });
}

// =========================================================
// التنقل بين الطلاب
// =========================================================
function navigate(direction) {
    let newIndex = currentStudentIndex + direction;
    if (newIndex < 0) newIndex = currentFilteredStudents.length - 1;
    if (newIndex >= currentFilteredStudents.length) newIndex = 0;
    openModal(newIndex);
}

if (prevBtn) {
    prevBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        navigate(-1); 
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        navigate(1); 
    });
}

// =========================================================
// لوحة المفاتيح
// =========================================================
document.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('active')) return;
    if (e.key === 'ArrowRight') navigate(-1);
    if (e.key === 'ArrowLeft') navigate(1);
    if (e.key === 'Escape') closeModal();
    if (e.key === ' ' && modalCard) { 
        e.preventDefault(); 
        modalCard.classList.toggle('is-flipped'); 
    }
});

// =========================================================
// قلب البطاقة
// =========================================================
if (modalCard) {
    modalCard.addEventListener('click', (e) => {
        // منع القلب عند الضغط على أزرار التنقل أو الإغلاق
        if (e.target.closest('.nav-btn') || 
            e.target.closest('.close-btn') || 
            e.target.closest('.student-counter')) {
            return;
        }
        
        e.stopPropagation();
        modalCard.classList.toggle('is-flipped');
        
        if (modalCard.classList.contains('is-flipped')) {
            triggerConfetti();
        }
    });
}

// =========================================================
// زر العودة للأعلى
// =========================================================
if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) scrollTopBtn.classList.add('visible');
        else scrollTopBtn.classList.remove('visible');
    });
    
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// =========================================================
// الاحتفال (Confetti)
// =========================================================
function triggerConfetti() {
    if (typeof confetti !== 'function') return;
    
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const colors = ['#38bdf8', '#3b82f6', '#a855f7', '#fbbf24', '#ffffff'];
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000, colors };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 60 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// =========================================================
// 🆕 فتح نافذة "جميع الصور"
// =========================================================
const showAllPhotosBtn = document.getElementById('showAllPhotosBtn');
const allPhotosModal = document.getElementById('allPhotosModal');
const allPhotosClose = document.getElementById('allPhotosClose');

function openAllPhotosModal() {
    if (!allPhotosModal) {
        console.warn('⚠️ allPhotosModal غير موجود');
        return;
    }
    
    allPhotosModal.classList.add('active');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    // عرض الشبكة
    renderGrid();
    
    // تركيز على البحث
    setTimeout(() => {
        if (searchInput) searchInput.focus();
    }, 300);
}

function closeAllPhotosModal() {
    if (!allPhotosModal) return;
    allPhotosModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
}

if (showAllPhotosBtn) {
    showAllPhotosBtn.addEventListener('click', openAllPhotosModal);
    console.log('✅ زر جميع الصور: جاهز');
} else {
    console.warn('⚠️ showAllPhotosBtn غير موجود');
}

if (allPhotosClose) {
    allPhotosClose.addEventListener('click', closeAllPhotosModal);
}

if (allPhotosModal) {
    allPhotosModal.addEventListener('click', (e) => {
        if (e.target === allPhotosModal) closeAllPhotosModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && allPhotosModal.classList.contains('active')) {
            closeAllPhotosModal();
        }
    });
}

// =========================================================
// 🆕 فتح بطاقة طالب مباشرة (من إطار الفيديو)
// =========================================================
function openStudentModal(student) {
    const filteredIdx = currentFilteredStudents.findIndex(s => s.id === student.id);
    
    if (filteredIdx >= 0) {
        openModal(filteredIdx);
    } else {
        showModalStudentDirect(student);
    }
}

function showModalStudentDirect(student) {
    if (!student) return;
    
    modalChildImg.src = student.childImg;
    modalAdultImg.src = student.adultImg;
    modalChildName.textContent = student.name;
    modalAdultName.textContent = student.name;
    modalAdultJob.textContent = student.jobTitle || 'خريج فيزياء طبية';
    modalAdultMessage.textContent = student.message || '';
    
    if (!student.message) {
        modalAdultMessage.style.display = 'none';
    } else {
        modalAdultMessage.style.display = 'block';
    }
    
    const awardsContainer = document.getElementById('modalAdultAwards');
    if (awardsContainer) {
        if (student.awards && student.awards.length > 0) {
            awardsContainer.innerHTML = student.awards.map(a => 
                `<span class="modal-award-badge">${a}</span>`
            ).join('');
            awardsContainer.style.display = 'flex';
        } else {
            awardsContainer.innerHTML = '';
            awardsContainer.style.display = 'none';
        }
    }
    
    if (studentCounter) studentCounter.textContent = '';
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    
    if (modalCard) modalCard.classList.remove('is-flipped');
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// =========================================================
// 🆕 إطار الصور حول الفيديو
// =========================================================
function initVideoFrame() {
    const topRow = document.getElementById('vhTopRow');
    const leftCol = document.getElementById('vhLeftCol');
    const rightCol = document.getElementById('vhRightCol');
    
    if (!topRow) return;
    
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    let idx = 0;
    const available = shuffled.length;
    
    function makePhoto(student) {
        const div = document.createElement('div');
        div.className = 'vh-photo';
        div.title = student.name;
        div.innerHTML = `<img src="${student.childImg}" alt="${student.name}" loading="lazy">`;
        div.addEventListener('click', () => openStudentModal(student));
        return div;
    }
    
    // تنظيف
    if (topRow) topRow.innerHTML = '';
    if (leftCol) leftCol.innerHTML = '';
    if (rightCol) rightCol.innerHTML = '';
    
    // الصف العلوي: 8 صور
    for (let i = 0; i < 8 && idx < available; i++, idx++) {
        topRow.appendChild(makePhoto(shuffled[idx]));
    }
    
    // العمود الأيسر: 3 صور
    if (leftCol) {
        for (let i = 0; i < 3 && idx < available; i++, idx++) {
            leftCol.appendChild(makePhoto(shuffled[idx]));
        }
    }
    
    // العمود الأيمن: 3 صور
    if (rightCol) {
        for (let i = 0; i < 3 && idx < available; i++, idx++) {
            rightCol.appendChild(makePhoto(shuffled[idx]));
        }
    }
}

// =========================================================
// 🆕 زر "اقرأ المزيد"
// =========================================================
function initCongratsToggle() {
    const toggle = document.getElementById('congratsToggle');
    const message = document.getElementById('congratsMessage');
    
    if (!toggle || !message) return;
    
    toggle.addEventListener('click', () => {
        const expanded = message.classList.toggle('expanded');
        toggle.textContent = expanded ? 'إخفاء الرسالة ⌃' : 'اقرأ الرسالة كاملة ⌄';
    });
}

// =========================================================
// 🚀 التشغيل الأولي
// =========================================================
initCongratsToggle();
initVideoFrame();

// لا نرسم الشبكة عند التحميل — ستُرسم عند فتح النافذة

/* =========================================================
   🎬 قائمة الفيديوهات المتعددة
   ========================================================= */

const VIDEOS = [
    { file: 'video/1.mp4', title: 'الحفل الرسمي', icon: '🎓' },
    { file: 'video/2.mp4', title: 'لحظات التخرج', icon: '🎬' },
    { file: 'video/3.mp4', title: 'أجمل الذكريات', icon: '✨' },
	{ file: 'video/4.mp4', title: 'كلمة الوداع', icon: '💌' },
    // ⬇️ أضف المزيد هنا
    // { file: 'video/farewell.mp4', title: 'كلمة الوداع', icon: '💌' },
];

let currentVideoIndex = 0;

function initVideoPlaylist() {
    const playlist = document.getElementById('videoPlaylist');
    const mainVideo = document.getElementById('mainVideo');
    
    if (!playlist || !mainVideo) {
        console.warn('⚠️ عناصر قائمة الفيديوهات غير موجودة');
        return;
    }
    
    // بناء القائمة
    playlist.innerHTML = '';
    
    VIDEOS.forEach((video, index) => {
        const item = document.createElement('div');
        item.className = 'vpl-item' + (index === 0 ? ' active' : '');
        item.dataset.index = index;
        item.title = video.title;
        item.innerHTML = `
            <div class="vpl-icon">${video.icon}</div>
            <div class="vpl-title">${video.title}</div>
        `;
        item.addEventListener('click', () => switchVideo(index));
        playlist.appendChild(item);
    });
    
    // تشغيل أول فيديو
    switchVideo(0);
    
    console.log('✅ قائمة الفيديوهات: جاهزة (' + VIDEOS.length + ' فيديو)');
}

function switchVideo(index) {
    const mainVideo = document.getElementById('mainVideo');
    if (!mainVideo) return;
    
    const video = VIDEOS[index];
    if (!video) return;
    
    // إيقاف الفيديو الحالي
    mainVideo.pause();
    
    // تغيير المصدر
    mainVideo.src = video.file;
    mainVideo.load();
    
    // تحديث الحالة
    currentVideoIndex = index;
    
    document.querySelectorAll('.vpl-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    
    console.log(`🎬 تشغيل الفيديو: ${video.title}`);
}

// تشغيل
initVideoPlaylist();


// =========================================================
// 🎓 زر الشهادة العائم
// =========================================================
const certModalBtn = document.getElementById('certModalBtn');

if (certModalBtn) {
    certModalBtn.addEventListener('click', () => {
        if (typeof window.openCertFromModal === 'function') {
            window.openCertFromModal();
        } else {
            console.warn('⚠️ welcome.js لم يتم تحميله بعد');
        }
    });
}


// =========================================================
// 🎵 زر التحكم في موسيقى الخلفية
// =========================================================
const bgMusicToggle = document.getElementById('bgMusicToggle');
const bgMusicIcon = document.getElementById('bgMusicIcon');

function updateBgMusicButton() {
    if (!window.BgMusic || !bgMusicToggle) return;
    const isPlaying = window.BgMusic.isPlaying();
    bgMusicIcon.textContent = isPlaying ? '🔊' : '🔇';
    bgMusicToggle.classList.toggle('muted', !isPlaying);
}

if (bgMusicToggle) {
    bgMusicToggle.addEventListener('click', () => {
        if (!window.BgMusic) {
            console.warn('BgMusic غير محمّل');
            return;
        }
        window.BgMusic.toggle();
        updateBgMusicButton();
    });

    // تحديث الحالة كل ثانيتين
    setInterval(updateBgMusicButton, 2000);

    // تحديث فوري
    updateBgMusicButton();

    // الاستماع لتغييرات BgMusic
    if (window.BgMusic && typeof window.BgMusic.onChange === 'function') {
        window.BgMusic.onChange(updateBgMusicButton);
    }

    console.log('✅ زر الموسيقى: جاهز');
}

console.log('✅ main.js: جاهز');