import { useCallback } from 'react';
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let source = null;

export const useVoice = () => {
    const playOrStop = useCallback((data) => {
        if (source) {
            try {
                source.stop();
                source.disconnect();
            } catch (e) {
                console.error(e);
            }
            source = null;
        } else {
            audioContext.decodeAudioData(new Uint8Array(data).buffer, (buffer) => {
                source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start();
                source.onended = () => {
                    source.disconnect();
                    source = null;
                };
            });
        }
    }, []);

    const playStream = useCallback(() => {
        if (source) {
            try {
                source.stop();
                source.disconnect();
            } catch (e) {
                console.error(e);
            }
            source = null;
        }

        const mediaSource = new MediaSource();
        const audio = new Audio();
        audio.src = URL.createObjectURL(mediaSource);
        audio.play().catch(e => console.error("Audio playback failed", e));
        
        let sourceBuffer = null;
        const queue = [];
        let isAppending = false;

        const processQueue = () => {
            if (queue.length > 0 && sourceBuffer && !isAppending && !sourceBuffer.updating) {
                isAppending = true;
                try {
                    const chunk = queue.shift();
                    sourceBuffer.appendBuffer(chunk);
                } catch (e) {
                    console.error("Append buffer error", e);
                    isAppending = false;
                }
            }
        };

        mediaSource.addEventListener('sourceopen', () => {
            if (MediaSource.isTypeSupported('audio/mpeg')) {
                sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
                sourceBuffer.addEventListener('updateend', () => {
                    isAppending = false;
                    processQueue();
                });
            } else {
                console.error("audio/mpeg not supported by MediaSource");
            }
        });

        return {
            append: (chunk) => {
                queue.push(chunk);
                if (sourceBuffer && !sourceBuffer.updating) {
                     processQueue();
                }
            },
            end: () => {
                 const checkEnd = () => {
                     if (!isAppending && queue.length === 0 && mediaSource.readyState === 'open') {
                        try {
                            mediaSource.endOfStream();
                        } catch(e) { console.error(e); }
                     } else {
                         setTimeout(checkEnd, 100);
                     }
                 }
                 checkEnd();
            }
        };
    }, []);

    return { speak: playOrStop, playStream };
};
