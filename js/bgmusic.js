/* =========================================================
   bgmusic.js - مدير الموسيقى الخلفية المركزي
   ========================================================= */

(function() {
    'use strict';
    
    const STORAGE_KEY = 'bg_music_v1';
    
    // ===== قائمة الأغاني (3) =====
    const TRACKS = [
        { file: 'https://cdn.jsdelivr.net/gh/drmunthermohammed-prog/Medical-Physics-2027@main/music/welcome.mp3', name: 'الحفل الرسمي', icon: '🎓' },
        { file: 'https://cdn.jsdelivr.net/gh/drmunthermohammed-prog/Medical-Physics-2027@main/music/book.mp3',    name: 'ألحان هادئة',  icon: '🎵' },
        { file: 'https://cdn.jsdelivr.net/gh/drmunthermohammed-prog/Medical-Physics-2027@main/music/book2.mp3',   name: 'ذكريات',       icon: '🎶' }
    ];
    
    // ===== الحالة =====
    let audio = new Audio();
    let state = {
        wasPlaying: false,     // هل أراد المستخدم التشغيل؟
        trackIndex: 0,
        currentTime: 0,
        volume: 0.5,
        muted: false
    };
    
    let duckedForMedia = false;
    let lastSaveTime = 0;
    let listeners = [];
    
    // ===== تحميل الحالة المحفوظة =====
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) Object.assign(state, JSON.parse(saved));
    } catch(e) {}
    
    // ===== حفظ الحالة =====
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                wasPlaying: state.wasPlaying,
                trackIndex: state.trackIndex,
                currentTime: audio.currentTime || 0,
                volume: state.volume,
                muted: state.muted
            }));
        } catch(e) {}
    }
    
    // ===== حفظ دوري =====
    audio.addEventListener('timeupdate', () => {
        const now = Date.now();
        if (now - lastSaveTime > 1000) {
            lastSaveTime = now;
            state.currentTime = audio.currentTime;
            save();
        }
    });
    
    // ===== الانتقال للأغنية التالية =====
    audio.addEventListener('ended', () => {
        state.trackIndex = (state.trackIndex + 1) % TRACKS.length;
        loadTrack(state.trackIndex);
        audio.currentTime = 0;
        if (state.wasPlaying) audio.play().catch(() => {});
        notify();
    });
    
    // ===== تحميل أغنية =====
    function loadTrack(index) {
        const track = TRACKS[index];
        if (!track) return;
        state.trackIndex = index;
        audio.src = track.file;
        audio.load();
    }
    
    // ===== تشغيل =====
    function play() {
        if (!audio.src) loadTrack(state.trackIndex);
        state.wasPlaying = true;
        
        audio.play().then(() => {
            notify();
            save();
        }).catch(err => {
            console.log('🎵 سيتم التشغيل عند أول تفاعل');
            save();
        });
    }
    
    // ===== إيقاف =====
    function pause() {
        state.wasPlaying = false;
        audio.pause();
        notify();
        save();
    }
    
    // ===== تبديل =====
    function toggle() {
        if (audio.paused || !state.wasPlaying) play();
        else pause();
    }
    
    // ===== تغيير الأغنية =====
    function setTrack(index) {
        if (index < 0 || index >= TRACKS.length) return;
        const wasPlaying = state.wasPlaying;
        
        loadTrack(index);
        audio.currentTime = 0;
        
        if (wasPlaying) {
            audio.play().catch(() => {});
        }
        notify();
        save();
    }
    
    // ===== إعلام المستمعين =====
    function notify() {
        listeners.forEach(fn => {
            try { fn(); } catch(e) {}
        });
        window.dispatchEvent(new CustomEvent('bgmusic:change'));
    }
    
    // ===== استئناف عند تحميل الصفحة =====
    function tryResume() {
        if (!state.wasPlaying) return;
        
        loadTrack(state.trackIndex);
        
        const attemptPlay = () => {
            audio.currentTime = state.currentTime || 0;
            audio.play().then(() => {
                console.log('🎵 استُئنفت الموسيقى');
                notify();
            }).catch(() => {
                console.log('🎵 في انتظار تفاعل المستخدم');
                // في انتظار نقرة
                const handler = () => {
                    document.removeEventListener('click', handler);
                    document.removeEventListener('touchstart', handler);
                    document.removeEventListener('keydown', handler);
                    if (state.wasPlaying) audio.play().catch(() => {});
                };
                document.addEventListener('click', handler, { once: true });
                document.addEventListener('touchstart', handler, { once: true });
                document.addEventListener('keydown', handler, { once: true });
            });
        };
        
        if (audio.readyState >= 2) {
            attemptPlay();
        } else {
            audio.addEventListener('loadedmetadata', attemptPlay, { once: true });
            setTimeout(() => {
                if (audio.readyState < 2) attemptPlay();
            }, 500);
        }
    }
    
    // ===== كتم تلقائي عند تشغيل فيديو/صوت آخر =====
    document.addEventListener('play', (e) => {
        if (e.target === audio) return;
        if (e.target.tagName !== 'VIDEO' && e.target.tagName !== 'AUDIO') return;
        
        if (!audio.paused) {
            audio.pause();
            duckedForMedia = true;
        }
    }, true);
    
    document.addEventListener('pause', (e) => {
        if (e.target === audio) return;
        if (e.target.tagName !== 'VIDEO' && e.target.tagName !== 'AUDIO') return;
        
        setTimeout(() => {
            const stillPlaying = [...document.querySelectorAll('video, audio')]
                .some(m => m !== audio && !m.paused && !m.ended && m.currentTime > 0);
            
            if (!stillPlaying && duckedForMedia && state.wasPlaying) {
                duckedForMedia = false;
                audio.play().catch(() => {});
            }
        }, 300);
    }, true);
    
    // ===== الإعدادات الأولية =====
    audio.volume = state.volume;
    audio.muted = state.muted;
    
    // ===== API عام =====
    window.BgMusic = {
        play,
        pause,
        toggle,
        setTrack,
        next: () => setTrack((state.trackIndex + 1) % TRACKS.length),
        prev: () => setTrack((state.trackIndex - 1 + TRACKS.length) % TRACKS.length),
        isPlaying: () => !audio.paused && !!audio.src,
        wasPlaying: () => state.wasPlaying,
        getTrackIndex: () => state.trackIndex,
        getTracks: () => TRACKS,
        getCurrentTrack: () => TRACKS[state.trackIndex],
        onChange: (fn) => {
            listeners.push(fn);
            return () => {
                const i = listeners.indexOf(fn);
                if (i > -1) listeners.splice(i, 1);
            };
        },
        setVolume: (v) => {
            state.volume = v;
            audio.volume = v;
            save();
        },
        toggleMute: () => {
            state.muted = !state.muted;
            audio.muted = state.muted;
            save();
            notify();
        }
    };
    
    // ===== بدء الاستئناف =====
    setTimeout(tryResume, 100);
    
    // ===== حفظ قبل مغادرة الصفحة =====
    window.addEventListener('beforeunload', save);
    
    console.log('🎵 bgmusic.js: جاهز');
})();
