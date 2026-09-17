// ============================================================
// 音乐播放器（IndexedDB + HTMLAudioElement + ID3）
// 注意：为兼容 file:// 直接打开的场景，封面和音频均以 data URL 存储
// 导入时会读取音频时长（duration）并存库
// 曲目数量上限：MUSIC_MAX_COUNT
// 支持拖拽排序：reorderTracks
// 支持导出全部为 ZIP：exportAllTracksAsZip（依赖 fflate）
// ============================================================

const MUSIC_DB_NAME = 'tetrisMusicDB';
const MUSIC_DB_VERSION = 4;
const MUSIC_STORE = 'tracks';
const MUSIC_MAX_SIZE = 25 * 1024 * 1024;
const MUSIC_MAX_COUNT = 150;

// 把 Blob 转成 data URL（file:// 下唯一可用的方式）
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

// 读取音频时长（秒），失败返回 0
function readAudioDuration(src) {
    return new Promise((resolve) => {
        const a = new Audio();
        a.preload = 'metadata';
        let done = false;
        const finish = (v) => { if (!done) { done = true; resolve(v); } };
        a.addEventListener('loadedmetadata', () => {
            const d = isFinite(a.duration) ? a.duration : 0;
            finish(d);
        });
        a.addEventListener('error', () => finish(0));
        setTimeout(() => finish(0), 5000);
        a.src = src;
    });
}

class MusicDB {
    constructor() { this.db = null; }

    isSupported() { return typeof indexedDB !== 'undefined'; }

    open() {
        return new Promise((resolve, reject) => {
            if (!this.isSupported()) { reject(new Error('IndexedDB not supported')); return; }
            const req = indexedDB.open(MUSIC_DB_NAME, MUSIC_DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (db.objectStoreNames.contains(MUSIC_STORE)) {
                    db.deleteObjectStore(MUSIC_STORE);
                }
                db.createObjectStore(MUSIC_STORE, { keyPath: 'id' });
            };
            req.onsuccess = (e) => { this.db = e.target.result; resolve(this.db); };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    add(track) {
        return new Promise((resolve, reject) => {
            if (!this.db) { reject(new Error('DB not open')); return; }
            const tx = this.db.transaction(MUSIC_STORE, 'readwrite');
            const store = tx.objectStore(MUSIC_STORE);
            const req = store.put(track);
            req.onsuccess = () => resolve(track);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    getAll() {
        return new Promise((resolve, reject) => {
            if (!this.db) { reject(new Error('DB not open')); return; }
            const tx = this.db.transaction(MUSIC_STORE, 'readonly');
            const store = tx.objectStore(MUSIC_STORE);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) { reject(new Error('DB not open')); return; }
            const tx = this.db.transaction(MUSIC_STORE, 'readwrite');
            const store = tx.objectStore(MUSIC_STORE);
            const req = store.delete(id);
            req.onsuccess = () => resolve(true);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    clear() {
        return new Promise((resolve, reject) => {
            if (!this.db) { reject(new Error('DB not open')); return; }
            const tx = this.db.transaction(MUSIC_STORE, 'readwrite');
            const store = tx.objectStore(MUSIC_STORE);
            const req = store.clear();
            req.onsuccess = () => resolve(true);
            req.onerror = (e) => reject(e.target.error);
        });
    }
}

class MusicPlayer {
    constructor() {
        this.db = new MusicDB();
        this.tracks = [];
        this.currentIndex = -1;
        this.audio = new Audio();
        this.isPlaying = false;
        this.volume = 0.7;
        this._seekDragging = false;
        this._onTracksChange = [];
        this._onPlayStateChange = [];
        this._onTimeUpdate = [];
    }

    async init() {
        if (!this.db.isSupported()) { this.supported = false; return false; }
        this.supported = true;
        try {
            await this.db.open();
            this.tracks = await this.db.getAll();
            // 先按保存的顺序恢复
            let restored = false;
            try {
                const savedOrder = JSON.parse(localStorage.getItem('tetrisMusicOrder') || '[]');
                if (savedOrder.length > 0) {
                    const orderMap = new Map(savedOrder.map((id, i) => [id, i]));
                    this.tracks.sort((a, b) => {
                        const ai = orderMap.has(a.id) ? orderMap.get(a.id) : 9999;
                        const bi = orderMap.has(b.id) ? orderMap.get(b.id) : 9999;
                        if (ai !== bi) return ai - bi;
                        return (a.addedAt || 0) - (b.addedAt || 0);
                    });
                    restored = true;
                }
            } catch (e) {}
            // 没保存顺序的按添加时间排
            if (!restored) {
                this.tracks.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
            }
            this.bindAudioEvents();
            this.audio.volume = this.volume;
            return true;
        } catch (e) {
            console.warn('[player] init failed:', e);
            this.supported = false;
            return false;
        }
    }

    bindAudioEvents() {
        this.audio.addEventListener('ended', () => {
            if (this.tracks.length === 0) return;
            const nextIdx = (this.currentIndex + 1) % this.tracks.length;
            this.playIndex(nextIdx);
        });
        this.audio.addEventListener('play', () => { this.isPlaying = true; this._notifyPlayState(); });
        this.audio.addEventListener('pause', () => { this.isPlaying = false; this._notifyPlayState(); });
        this.audio.addEventListener('timeupdate', () => { if (!this._seekDragging) this._notifyTimeUpdate(); });
        this.audio.addEventListener('loadedmetadata', () => { this._notifyTimeUpdate(); });
    }

    onTracksChange(cb) { this._onTracksChange.push(cb); }
    onPlayStateChange(cb) { this._onPlayStateChange.push(cb); }
    onTimeUpdate(cb) { this._onTimeUpdate.push(cb); }

    _notifyTracksChange() { this._onTracksChange.forEach(cb => cb(this.tracks)); }
    _notifyPlayState() { this._onPlayStateChange.forEach(cb => cb(this.isPlaying, this.getCurrentTrack())); }
    _notifyTimeUpdate() {
        this._onTimeUpdate.forEach(cb => cb({
            current: this.audio.currentTime || 0,
            duration: this.audio.duration || 0
        }));
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        if (this.audio) this.audio.volume = this.volume;
    }

    async importFiles(fileList, onProgress = null) {
        if (!this.supported) return { ok: 0, tooBig: 0, failed: 0, skipped: 0, maxReached: false };
        let ok = 0, tooBig = 0, failed = 0, skipped = 0;
        let maxReached = false;
        const filesArr = Array.from(fileList);
        const total = filesArr.length;
        let index = 0;

        for (const file of filesArr) {
            index++;

            // ===== 曲目数上限检查 =====
            if (this.tracks.length >= MUSIC_MAX_COUNT) {
                maxReached = true;
                if (onProgress) onProgress(index, total, { maxReached: 1, name: file.name });
                continue;
            }

            // ===== 重复检查 ①：文件名 + 文件大小 =====
            if (this.tracks.some(t => t.fileName === file.name && t.size === file.size)) {
                skipped++;
                if (onProgress) onProgress(index, total, { skipped: 1, name: file.name });
                continue;
            }

            if (!file.type.startsWith('audio/')) {
                failed++;
                if (onProgress) onProgress(index, total);
                continue;
            }
            if (file.size > MUSIC_MAX_SIZE) {
                tooBig++;
                if (onProgress) onProgress(index, total);
                continue;
            }

            try {
                const id = 'trk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

                // 读 ID3
                let meta = null;
                if (file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3')) {
                    try { meta = await ID3.read(file); } catch (e) {}
                }
                const fallbackName = file.name.replace(/\.[^.]+$/, '');
                const displayName = (meta && meta.title) ? meta.title : fallbackName;
                const artist = (meta && meta.artist) ? meta.artist : '';
                const album = (meta && meta.album) ? meta.album : '';

                // ===== 重复检查 ②：标题 + 艺术家 =====
                if (displayName && artist) {
                    if (this.tracks.some(t => t.name === displayName && t.artist === artist)) {
                        skipped++;
                        if (onProgress) onProgress(index, total, { skipped: 1, name: displayName });
                        continue;
                    }
                }

                // 封面：Blob → data URL
                let picture = null;
                if (meta && meta.picture && meta.picture.blob) {
                    try {
                        picture = {
                            mime: meta.picture.mime || 'image/jpeg',
                            dataUrl: await blobToDataURL(meta.picture.blob)
                        };
                    } catch (e) { picture = null; }
                }

                // 音频：Blob → data URL
                let audioDataUrl = null;
                try {
                    audioDataUrl = await blobToDataURL(file);
                } catch (e) {
                    failed++;
                    if (onProgress) onProgress(index, total);
                    continue;
                }

                // 读取音频时长
                let duration = 0;
                try { duration = await readAudioDuration(audioDataUrl); } catch (e) { duration = 0; }

                const track = {
                    id,
                    name: displayName,
                    artist,
                    album,
                    picture,
                    audioDataUrl,
                    duration,
                    size: file.size,
                    type: file.type,
                    fileName: file.name,
                    addedAt: Date.now()
                };
                await this.db.add(track);
                this.tracks.push(track);
                ok++;
            } catch (e) {
                console.warn('[player] import failed:', e);
                failed++;
            }
            if (onProgress) onProgress(index, total);
        }
        this._notifyTracksChange();
        this.savePlaylistOrder();
        return { ok, tooBig, failed, skipped, maxReached };
    }

    async removeTrack(id) {
        try { await this.db.delete(id); } catch (e) {}
        const idx = this.tracks.findIndex(t => t.id === id);
        if (idx === -1) return;
        const wasCurrent = idx === this.currentIndex;
        this.tracks.splice(idx, 1);
        if (wasCurrent) {
            this.stop();
            if (this.tracks.length > 0) this.currentIndex = Math.min(idx, this.tracks.length - 1);
            else this.currentIndex = -1;
        } else if (idx < this.currentIndex) {
            this.currentIndex--;
        }
        this._notifyTracksChange();
        this.savePlaylistOrder();
    }

    // ===== 拖拽排序 =====
    reorderTracks(fromIndex, toIndex) {
        if (fromIndex === toIndex) return false;
        if (fromIndex < 0 || fromIndex >= this.tracks.length) return false;
        if (toIndex < 0 || toIndex >= this.tracks.length) return false;

        const track = this.tracks.splice(fromIndex, 1)[0];
        this.tracks.splice(toIndex, 0, track);

        // 修正 currentIndex
        if (this.currentIndex === fromIndex) {
            this.currentIndex = toIndex;
        } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
            this.currentIndex--;
        } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
            this.currentIndex++;
        }

        this._notifyTracksChange();
        this.savePlaylistOrder();
        return true;
    }

    playIndex(index) {
        if (index < 0 || index >= this.tracks.length) return;
        if (this.currentIndex === index && this.isPlaying) return;
        this.currentIndex = index;
        const track = this.tracks[index];
        if (!track.audioDataUrl) return;

        this.audio.src = track.audioDataUrl;
        this.audio.load();
        this.audio.volume = this.volume;
        const p = this.audio.play();
        if (p !== undefined) p.catch(() => {});
        if (typeof bgmManager !== 'undefined' && bgmManager.isPlaying) {
            bgmManager.pause();
            this._bgmPausedByPlayer = true;
        }
    }

    togglePlay() {
        if (this.tracks.length === 0) return;
        if (this.currentIndex === -1) { this.playIndex(0); return; }
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            if (this.audio.src) {
                this.audio.volume = this.volume;
                const p = this.audio.play();
                if (p !== undefined) p.catch(() => {});
                if (typeof bgmManager !== 'undefined' && bgmManager.isPlaying) {
                    bgmManager.pause();
                    this._bgmPausedByPlayer = true;
                }
            } else {
                this.playIndex(this.currentIndex);
            }
        }
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this._notifyPlayState();
        if (this._bgmPausedByPlayer && typeof bgmManager !== 'undefined') {
            bgmManager.resume();
            this._bgmPausedByPlayer = false;
        }
    }

    seekTo(seconds) {
        if (!this.audio.duration) return;
        const t = Math.max(0, Math.min(this.audio.duration, seconds));
        this.audio.currentTime = t;
    }

    getCurrentTrack() {
        if (this.currentIndex < 0 || this.currentIndex >= this.tracks.length) return null;
        return this.tracks[this.currentIndex];
    }

    savePlaylistOrder() {
        try { localStorage.setItem('tetrisMusicOrder', JSON.stringify(this.tracks.map(t => t.id))); } catch (e) {}
    }
}

const musicPlayer = new MusicPlayer();

// ============================================================
// 音乐导出（ZIP 打包，依赖 fflate）
// ============================================================

// dataURL → Uint8Array
function dataURLToUint8(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const bin = atob(base64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

// 触发浏览器下载
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 清洗文件名
function sanitizeFilename(name) {
    return String(name || 'track').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80).trim() || 'track';
}

// 根据 type / fileName 推断扩展名
function guessExt(track) {
    const t = (track.type || '').toLowerCase();
    const fn = (track.fileName || '').toLowerCase();
    if (t.includes('mpeg') || t.includes('mp3') || fn.endsWith('.mp3')) return 'mp3';
    if (t.includes('wav') || fn.endsWith('.wav')) return 'wav';
    if (t.includes('ogg') || fn.endsWith('.ogg')) return 'ogg';
    if (t.includes('flac') || fn.endsWith('.flac')) return 'flac';
    if (t.includes('m4a') || t.includes('mp4') || fn.endsWith('.m4a')) return 'm4a';
    if (t.includes('aac') || fn.endsWith('.aac')) return 'aac';
    if (t.includes('webm') || fn.endsWith('.webm')) return 'webm';
    return 'mp3';
}

// 生成带日期的 zip 文件名
function getExportZipName() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `tetris-music-${y}${m}${day}.zip`;
}

// 导出全部为 ZIP
// onProgress(current, total, trackName)
async function exportAllTracksAsZip(tracks, onProgress) {
    const list = Array.isArray(tracks) ? tracks.slice() : [];
    const total = list.length;
    if (total === 0) {
        return { ok: 0, failed: 0, total: 0, blob: null };
    }
    if (typeof fflate === 'undefined' || !fflate.zipSync) {
        console.warn('[export] fflate not loaded');
        return { ok: 0, failed: total, total, blob: null };
    }

    const files = {};
    let ok = 0, failed = 0;

    for (let i = 0; i < total; i++) {
        const t = list[i];
        let name = sanitizeFilename(t.name + (t.artist ? ` - ${t.artist}` : '')) + '.' + guessExt(t);

        // 防重名
        if (files[name]) {
            const base = name.replace(/\.[^.]+$/, '');
            const ext = name.split('.').pop();
            let n = 1;
            while (files[`${base} (${n}).${ext}`]) n++;
            name = `${base} (${n}).${ext}`;
        }

        try {
            if (t.audioDataUrl) {
                files[name] = dataURLToUint8(t.audioDataUrl);
                ok++;
            } else {
                failed++;
            }
        } catch (e) {
            console.warn('[export] decode failed:', t.name, e);
            failed++;
        }

        if (typeof onProgress === 'function') {
            try { onProgress(i + 1, total, t.name || ''); } catch (e) {}
        }
        // 让 UI 有机会刷新
        if (i < total - 1) await new Promise(r => setTimeout(r, 0));
    }

    let blob = null;
    try {
        // level: 0 = STORE，音频本来就是压缩格式，不重复压缩
        const zipped = fflate.zipSync(files, { level: 0 });
        blob = new Blob([zipped], { type: 'application/zip' });
        downloadBlob(blob, getExportZipName());
    } catch (e) {
        console.warn('[export] zip failed:', e);
        return { ok: 0, failed: total, total, blob: null };
    }

    return { ok, failed, total, blob };
}