import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { fetch, Body } from '@tauri-apps/api/http';

export async function streamFetch(url, options = {}) {
    const eventName = await invoke("stream_fetch", {
        url,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body
    });

    const stream = new ReadableStream({
        start(controller) {
            const unlistenData = listen(eventName, (event) => {
                const uint8Array = new Uint8Array(event.payload);
                controller.enqueue(uint8Array);
            });
            const unlistenEnd = listen(eventName + "-end", () => {
                controller.close();
                unlistenData.then(f => f());
                unlistenEnd.then(f => f());
                unlistenError.then(f => f());
            });
            const unlistenError = listen(eventName + "-error", (event) => {
                controller.error(event.payload);
                unlistenData.then(f => f());
                unlistenEnd.then(f => f());
                unlistenError.then(f => f());
            });
        }
    });

    return {
        ok: true,
        status: 200,
        body: stream
    };
}


export async function tts(text, lang, options = {}) {
    const { config, onData } = options;
    let { requestPath, apiKey, model = "tts-1", voice = "alloy", speed = 1.0 } = config;

    if (!requestPath) {
        requestPath = "https://api.openai.com";
    }
    if (!/https?:\/\/.+/.test(requestPath)) {
        requestPath = `https://${requestPath}`;
    }
    if (requestPath.endsWith('/')) {
        requestPath = requestPath.slice(0, -1);
    }
    if (!requestPath.endsWith('/audio/speech')) {
        requestPath += '/v1/audio/speech';
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };
    const body = JSON.stringify({
        model,
        voice,
        speed: parseFloat(speed),
        input: text,
    });

    if (onData) {
        // Try streaming first
        try {
            console.log("OpenAI TTS Service: Using streamFetch");
            const res = await streamFetch(requestPath, {
                method: "POST",
                headers,
                body
            });

            if (res && res.ok) {
                console.log("OpenAI TTS Service: Response OK, starting stream");
                const reader = res.body.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            console.log("OpenAI TTS Service: Stream done");
                            break;
                        }
                        if (onData) {
                            onData(value);
                        }
                    }
                } catch (e) {
                    console.error("OpenAI TTS Service: Stream Error", e);
                    throw e; 
                }
                return [];
            }
        } catch (fetchErr) {
             console.error("OpenAI TTS Service: Fetch Error, falling back to non-streaming", fetchErr);
        }
    }

    // Fallback to Tauri HTTP Client
    const res = await fetch(requestPath, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: Body.json({
            model,
            voice,
            speed: parseFloat(speed),
            input: text,
        })
        , responseType: 3
    });

    if (res.ok) {
        let result = res.data;
        if (result) {
            return result;
        } else {
            throw JSON.stringify(result);
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}

export * from './Config';
export * from './info';
