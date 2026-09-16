// ============================================================
// 轻量 ID3v2 解析器
// 读取 mp3 文件的 ID3v2 头部，提取：标题 / 艺术家 / 专辑 / 封面
// ============================================================
const ID3 = {
    // 异步读取一个 File/Blob 的 ID3 标签
    async read(file) {
        try {
            const headerBuf = await file.slice(0, 10).arrayBuffer();
            const header = new Uint8Array(headerBuf);
            if (header[0] !== 0x49 || header[1] !== 0x44 || header[2] !== 0x33) {
                return null; // 不是 "ID3"
            }
            const majorVersion = header[3];
            if (majorVersion < 2 || majorVersion > 4) return null;

            // tag 大小（synchsafe integer）
            const size = (header[6] & 0x7f) << 21 |
                         (header[7] & 0x7f) << 14 |
                         (header[8] & 0x7f) << 7 |
                         (header[9] & 0x7f);
            if (size <= 0 || size > 16 * 1024 * 1024) return null;

            const tagBuf = await file.slice(10, 10 + size).arrayBuffer();
            const tag = new Uint8Array(tagBuf);

            return this.parseFrames(tag, majorVersion);
        } catch (e) {
            return null;
        }
    },

    parseFrames(data, majorVersion) {
        const result = { title: '', artist: '', album: '', picture: null };
        let offset = 0;
        const frameHeaderSize = majorVersion === 2 ? 6 : 10;
        let fallbackPicture = null;

        while (offset + frameHeaderSize <= data.length) {
            let frameId, frameSize;

            if (majorVersion === 2) {
                frameId = this.readString(data, offset, 3);
                frameSize = (data[offset + 3] << 16) | (data[offset + 4] << 8) | data[offset + 5];
                offset += 6;
            } else {
                frameId = this.readString(data, offset, 4);
                if (majorVersion === 4) {
                    frameSize = (data[offset + 4] & 0x7f) << 21 |
                                (data[offset + 5] & 0x7f) << 14 |
                                (data[offset + 6] & 0x7f) << 7 |
                                (data[offset + 7] & 0x7f);
                } else {
                    frameSize = (data[offset + 4] << 24) | (data[offset + 5] << 16) | (data[offset + 6] << 8) | data[offset + 7];
                }
                offset += 10;
            }

            // 帧 ID 必须是 3~4 位大写字母或数字；否则视为填充/非法，停止解析
            if (!frameId || !/^[A-Z0-9]{3,4}$/.test(frameId)) break;

            if (frameSize <= 0 || offset + frameSize > data.length) break;

            const frameData = data.slice(offset, offset + frameSize);
            offset += frameSize;

            // APIC / PIC = 封面图
            if (frameId === 'APIC' || frameId === 'PIC') {
                try {
                    const pic = this.readPictureFrame(frameData, frameId === 'PIC');
                    if (pic && pic.blob) {
                        // 优先取 Front Cover（图片类型字节 = 0x03）
                        if (pic.isFrontCover) {
                            result.picture = { mime: pic.mime, blob: pic.blob };
                        } else if (!fallbackPicture) {
                            fallbackPicture = { mime: pic.mime, blob: pic.blob };
                        }
                    }
                } catch (e) {}
                continue;
            }

            // 文本帧
            let target = null;
            if (frameId === 'TIT2' || frameId === 'TT2') target = 'title';
            else if (frameId === 'TPE1' || frameId === 'TP1') target = 'artist';
            else if (frameId === 'TALB' || frameId === 'TAL') target = 'album';
            if (!target) continue;

            const text = this.readTextFrame(frameData);
            if (text) result[target] = text;
        }

        // 没有 Front Cover 时用第一个 APIC 兜底
        if (!result.picture && fallbackPicture) result.picture = fallbackPicture;

        return result;
    },

    // 文本帧：第 1 字节是编码，后面是文本
    readTextFrame(data) {
        if (data.length < 2) return '';
        const encoding = data[0];
        const body = data.slice(1);
        let raw = '';
        try {
            if (encoding === 0) {
                raw = this.decodeLatin1(body);
            } else if (encoding === 1) {
                raw = this.decodeUTF16(body);
            } else if (encoding === 2) {
                raw = this._decodeUTF16BE(body);
            } else if (encoding === 3) {
                raw = this.decodeUTF8(body);
            } else {
                raw = this.decodeLatin1(body);
            }
        } catch (e) {
            return '';
        }
        // 多值帧：以 \0 分隔，取第一个非空段；并去掉尾部 \0
        const first = raw.split('\0')[0] || '';
        return first.replace(/\uFEFF/g, '').trim();
    },

    // APIC 帧结构：
    // [编码(1)] [MIME 字符串(\0 结尾)] [图片类型(1)] [描述(编码相关，终止符结尾)] [图片二进制]
    // PIC（v2.2）： [编码(1)] [图片格式(3 字节，"JPG"/"PNG")] [图片类型(1)] [描述(终止符结尾)] [图片二进制]
    //
    // 修复点：描述字段的对齐在不同编码器下不一致，且 UTF-16 描述可能不是 2 字节对齐。
    // 这里不再严格解析描述，改为从描述区起点向后扫描第一个图片 magic number 来定位图片起点。
    readPictureFrame(data, isV22) {
        if (data.length < 4) return null;
        const encoding = data[0];
        let offset = 1;

        // 跳过 MIME 或 3 字节格式
        if (isV22) {
            offset += 3;
        } else {
            let mimeEnd = offset;
            while (mimeEnd < data.length && data[mimeEnd] !== 0) mimeEnd++;
            offset = mimeEnd + 1;
        }

        // 跳过图片类型（1 字节）
        if (offset >= data.length) return null;
        const pictureType = data[offset];
        offset += 1;

        // 描述字段可能包含任何字节，不再逐字节解析，直接扫描图片 magic
        const imgStart = this.findImageStart(data, offset);
        if (imgStart === -1) return null;

        const imgBytes = data.slice(imgStart);
        if (imgBytes.length < 16) return null;

        const realMime = this.detectImageType(imgBytes) || 'image/jpeg';
        const blob = new Blob([imgBytes], { type: realMime });
        return {
            mime: realMime,
            blob,
            isFrontCover: pictureType === 0x03
        };
    },

    // 从 start 开始扫描第一个图片 magic number
    findImageStart(data, start) {
        for (let i = start; i < data.length - 3; i++) {
            // JPEG: FF D8 FF
            if (data[i] === 0xFF && data[i + 1] === 0xD8 && data[i + 2] === 0xFF) return i;
            // PNG: 89 50 4E 47
            if (data[i] === 0x89 && data[i + 1] === 0x50 && data[i + 2] === 0x4E && data[i + 3] === 0x47) return i;
            // GIF: 47 49 46
            if (data[i] === 0x47 && data[i + 1] === 0x49 && data[i + 2] === 0x46) return i;
            // WEBP: RIFF....WEBP
            if (data[i] === 0x52 && data[i + 1] === 0x49 && data[i + 2] === 0x46 && data[i + 3] === 0x46 &&
                i + 11 < data.length &&
                data[i + 8] === 0x57 && data[i + 9] === 0x45 && data[i + 10] === 0x42 && data[i + 11] === 0x50) {
                return i;
            }
        }
        return -1;
    },

    detectImageType(bytes) {
        if (bytes.length < 4) return null;
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg';
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
            bytes.length >= 12 &&
            bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
            return 'image/webp';
        }
        return null;
    },

    readString(data, offset, length) {
        let s = '';
        for (let i = 0; i < length; i++) {
            const c = data[offset + i];
            if (c === 0) break;
            s += String.fromCharCode(c);
        }
        return s;
    },

    decodeLatin1(bytes) {
        let s = '';
        for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return s;
    },

    decodeUTF8(bytes) {
        try {
            return new TextDecoder('utf-8').decode(bytes);
        } catch (e) {
            return this.decodeLatin1(bytes);
        }
    },

    decodeUTF16(bytes) {
        if (bytes.length < 2) return '';
        const bom1 = bytes[0], bom2 = bytes[1];
        if (bom1 === 0xFF && bom2 === 0xFE) {
            return this._decodeUTF16LE(bytes.slice(2));
        } else if (bom1 === 0xFE && bom2 === 0xFF) {
            return this._decodeUTF16BE(bytes.slice(2));
        }
        return this._decodeUTF16LE(bytes);
    },

    _decodeUTF16LE(bytes) {
        let s = '';
        for (let i = 0; i + 1 < bytes.length; i += 2) {
            const code = bytes[i] | (bytes[i + 1] << 8);
            if (code === 0) break;
            s += String.fromCharCode(code);
        }
        return s;
    },

    _decodeUTF16BE(bytes) {
        // 兼容错误地带上 BOM 的 UTF-16BE
        if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
            bytes = bytes.slice(2);
        }
        let s = '';
        for (let i = 0; i + 1 < bytes.length; i += 2) {
            const code = (bytes[i] << 8) | bytes[i + 1];
            if (code === 0) break;
            s += String.fromCharCode(code);
        }
        return s;
    }
};