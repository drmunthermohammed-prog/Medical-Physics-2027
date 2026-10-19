/* =========================================================
   book.js - صفحة سيرة الخريج
   ========================================================= */

(function() {
    'use strict';
    
    if (typeof students === 'undefined' || !Array.isArray(students) || students.length === 0) {
        console.error('❌ students.js غير محمّلة');
        return;
    }
    
    const TOTAL = students.length;
    const state = {
        currentIndex: 0,
        filteredList: [...students]
    };
    
    const $ = id => document.getElementById(id);
    
    const mainPhoto = $('bioMainPhoto');
    const childPhoto = $('bioChildPhotoImg');
    const nameEl = $('bioName');
    const jobEl = $('bioJob');
    const storyEl = $('bioStoryContent');
    
    const currentIdxEl = $('bioCurrentIndex');
    const totalEl = $('bioTotal');
    
    const prevBtn = $('bioPrevBtn');
    const nextBtn = $('bioNextBtn');
    const firstBtn = $('bioFirstBtn');
    const lastBtn = $('bioLastBtn');
    const jumpInput = $('bioJumpInput');
    const jumpBtn = $('bioJumpBtn');
    
    const searchInput = $('bioSearchInput');
    const musicBtn = $('bioMusicBtn');
    const musicPanel = $('bioMusicPanel');
    const musicOverlay = $('bioMusicOverlay');
    const musicListEl = $('bioMusicList');
    const musicPanelClose = $('bioMusicPanelClose');
    const toast = $('bioToast');
    
    // =========================================================
    // عرض طالب
    // =========================================================
    function showStudent(index, direction = 0) {
        const list = state.filteredList;
        if (list.length === 0) return;
        
        index = Math.max(0, Math.min(list.length - 1, index));
        const student = list[index];
        if (!student) return;
        
        const card = document.querySelector('.bio-card');
        const isFirstLoad = !card.dataset.loaded;
        
        const updateContent = () => {
            state.currentIndex = index;
            
            // الصور
            mainPhoto.src = student.adultImg || student.childImg || '';
            mainPhoto.onerror = () => {
                mainPhoto.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect fill="%23f5ecd5" width="300" height="400"/><text x="150" y="220" font-size="60" fill="%23b8860b" text-anchor="middle">⚛</text></svg>';
            };
            
            childPhoto.src = student.childImg || '';
            childPhoto.onerror = () => {
                childPhoto.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f5ecd5" width="100" height="100"/><text x="50" y="60" font-size="30" fill="%23b8860b" text-anchor="middle">?</text></svg>';
            };
            
            // النصوص الأساسية
            nameEl.textContent = student.name || '';
            jobEl.textContent = student.jobTitle || 'خريج فيزياء طبية';
            
            // السيرة
            const bio = (student.bio || '').trim();
            storyEl.textContent = bio;
            storyEl.classList.toggle('empty', !bio);
            
            // العداد
            currentIdxEl.textContent = index + 1;
            
            // التنقل
            if (prevBtn) prevBtn.disabled = index === 0;
            if (nextBtn) nextBtn.disabled = index === list.length - 1;
        };
        
        if (isFirstLoad) {
            updateContent();
            if (card) card.dataset.loaded = 'true';
            return;
        }
        
        if (card) {
            card.classList.remove('switching-in', 'reverse');
            if (direction < 0) card.classList.add('reverse');
            card.classList.add('switching-out');
            
            setTimeout(() => {
                updateContent();
                card.classList.remove('switching-out');
                card.classList.add('switching-in');
                
                setTimeout(() => {
                    card.classList.remove('switching-in', 'reverse');
                }, 400);
            }, 350);
        } else {
            updateContent();
        }
    }
    
    // =========================================================
    // التنقل
    // =========================================================
    function goPrev() {
        if (state.currentIndex > 0) showStudent(state.currentIndex - 1, -1);
    }
    
    function goNext() {
        if (state.currentIndex < state.filteredList.length - 1) showStudent(state.currentIndex + 1, 1);
    }
    
    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);
    if (firstBtn) firstBtn.addEventListener('click', () => showStudent(0, -1));
    if (lastBtn) lastBtn.addEventListener('click', () => showStudent(state.filteredList.length - 1, 1));
    
    if (jumpBtn) {
        jumpBtn.addEventListener('click', () => {
            const val = parseInt(jumpInput.value, 10);
            if (isNaN(val) || val < 1 || val > state.filteredList.length) {
                showToast(`⚠️ أدخل رقماً بين 1 و ${state.filteredList.length}`);
                return;
            }
            showStudent(val - 1, val - 1 > state.currentIndex ? 1 : -1);
            jumpInput.value = '';
        });
    }
    
    if (jumpInput) {
        jumpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') jumpBtn.click();
        });
    }
    
    // =========================================================
    // البحث
    // =========================================================
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                const q = searchInput.value.trim().toLowerCase();
                
                if (!q) {
                    state.filteredList = [...students];
                } else {
                    state.filteredList = students.filter(s => 
                        s.name.toLowerCase().includes(q)
                    );
                }
                
                if (state.filteredList.length > 0) {
                    showStudent(0, -1);
                } else {
                    showToast('🔍 لا يوجد طالب بهذا الاسم');
                }
            }, 200);
        });
    }
    
    // =========================================================
    // لوحة المفاتيح
    // =========================================================
    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea')) return;
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
        else if (e.key === 'Home') { e.preventDefault(); showStudent(0, -1); }
        else if (e.key === 'End') { e.preventDefault(); showStudent(state.filteredList.length - 1, 1); }
    });
    
    // =========================================================
    // السحب (Swipe)
    // =========================================================
    (function initSwipe() {
        const card = document.querySelector('.bio-card');
        if (!card) return;
        
        let startX = 0, startY = 0, endX = 0, endY = 0, swiping = false;
        
        card.addEventListener('touchstart', (e) => {
            startX = e.changedTouches[0].screenX;
            startY = e.changedTouches[0].screenY;
            swiping = false;
        }, { passive: true });
        
        card.addEventListener('touchmove', (e) => {
            if (!startX) return;
            endX = e.changedTouches[0].screenX;
            endY = e.changedTouches[0].screenY;
            const dx = endX - startX;
            const dy = endY - startY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) swiping = true;
        }, { passive: true });
        
        card.addEventListener('touchend', () => {
            if (!swiping || !startX) {
                startX = 0;
                return;
            }
            const dx = endX - startX;
            const dy = endY - startY;
            
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0) goPrev();
                else goNext();
            }
            
            startX = 0;
            endX = 0;
        }, { passive: true });
    })();
    
 // =========================================================
// 🎵 موسيقى الكتاب (مستقلة تماماً)
// =========================================================
const BOOK_TRACKS = [
    { file: 'https://cdn.jsdelivr.net/gh/drmunthermohammed-prog/Medical-Physics-2027@main/music/book.mp3',   name: 'ألحان الكتاب',    icon: '🎵' },
    { file: 'https://cdn.jsdelivr.net/gh/drmunthermohammed-prog/Medical-Physics-2027@main/music/track1.mp3',   name: 'ألحان هادئة',  icon: '🎵' }
];

const bookAudio = new Audio();
bookAudio.preload = 'none';
bookAudio.loop = false;
bookAudio.volume = 0.5;

let bookTrackIndex = 0;
let bookMusicPlaying = false;

// الانتقال التلقائي للمقطع التالي
bookAudio.addEventListener('ended', () => {
    bookTrackIndex = (bookTrackIndex + 1) % BOOK_TRACKS.length;
    loadBookTrack(bookTrackIndex);
    if (bookMusicPlaying) {
        bookAudio.play().catch(() => {});
    }
    renderMusicList();
});

function loadBookTrack(index) {
    const track = BOOK_TRACKS[index];
    if (!track) return;
    bookAudio.src = track.file;
}

function updateMusicUI() {
    if (!musicBtn) return;
    musicBtn.classList.toggle('playing', bookMusicPlaying);
    musicBtn.textContent = bookMusicPlaying ? '🔊' : '🎵';
}

function renderMusicList() {
    if (!musicListEl) return;
    
    musicListEl.innerHTML = '';
    BOOK_TRACKS.forEach((track, i) => {
        const isActive = i === bookTrackIndex;
        const status = isActive && bookMusicPlaying ? '🔊' : (isActive ? '⏸' : '▶');
        
        const item = document.createElement('div');
        item.className = 'bio-music-item' + (isActive ? ' active' : '');
        item.innerHTML = `
            <div class="bio-music-item-icon">${track.icon}</div>
            <div class="bio-music-item-name">${track.name}</div>
            <div class="bio-music-item-status">${status}</div>
        `;
        
        item.addEventListener('click', () => {
            if (i === bookTrackIndex) {
                // نفس الأغنية → تشغيل/إيقاف
                if (bookMusicPlaying) {
                    bookAudio.pause();
                    bookMusicPlaying = false;
                } else {
                    bookAudio.play().then(() => {
                        bookMusicPlaying = true;
                        updateMusicUI();
                    }).catch(() => {});
                }
            } else {
                // أغنية مختلفة → تشغيل
                bookTrackIndex = i;
                loadBookTrack(i);
                bookAudio.play().then(() => {
                    bookMusicPlaying = true;
                    updateMusicUI();
                }).catch(() => {});
            }
            renderMusicList();
        });
        
        musicListEl.appendChild(item);
    });
}

function openMusicPanel() {
    if (!musicPanel || !musicOverlay) return;
    renderMusicList();
    musicPanel.classList.add('active');
    musicOverlay.classList.add('active');
}

function closeMusicPanel() {
    if (!musicPanel || !musicOverlay) return;
    musicPanel.classList.remove('active');
    musicOverlay.classList.remove('active');
}

if (musicBtn) musicBtn.addEventListener('click', openMusicPanel);
if (musicPanelClose) musicPanelClose.addEventListener('click', closeMusicPanel);
if (musicOverlay) musicOverlay.addEventListener('click', closeMusicPanel);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && musicPanel && musicPanel.classList.contains('active')) {
        closeMusicPanel();
    }
});

// إيقاف عند مغادرة الصفحة
window.addEventListener('beforeunload', () => {
    bookAudio.pause();
});

updateMusicUI();
    
    console.log(`✅ book.js: جاهز (${TOTAL} طالب)`);
})();
