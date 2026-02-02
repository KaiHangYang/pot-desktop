async function tts(text, _lang, options = {}) {
    const { config, utils } = options;
    const { http } = utils;
    const { fetch, Body } = http;

    let { requestPath, apiKey, model, voice, speed } = config;

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
    if (!apiKey) {
        throw "apiKey is required";
    }
    if (!model) {
        model = "tts-1";
    }
    if (!voice) {
        voice = "alloy";
    }
    if (!speed) {
        speed = 1.0;
    }
    console.log(`TTS Plugin: Requesting ${requestPath} with speed ${speed}`);
    
    if (options.onData) {
        try {
            let res;
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

            if (utils.streamFetch) {
                console.log("TTS Plugin: Using streamFetch");
                res = await utils.streamFetch(requestPath, {
                    method: "POST",
                    headers,
                    body
                });
            } else if (utils.fetch) {
                console.log("TTS Plugin: Using browser fetch");
                res = await utils.fetch(requestPath, {
                    method: "POST",
                    headers,
                    body
                });
            }

            if (res && res.ok) {
                console.log("TTS Plugin: Response OK, starting stream");
                const reader = res.body.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            console.log("TTS Plugin: Stream done");
                            break;
                        }
                        if (options.onData) {
                            options.onData(value);
                        }
                    }
                } catch (e) {
                    console.error("TTS Plugin: Stream Error", e);
                    throw e; 
                }
                return [];
            } else if (res) {
                 console.error("TTS Plugin: Response NOT OK", res.status);
                 throw `Http Request Error\nHttp Status: ${res.status}`;
            }
        } catch (fetchErr) {
             console.error("TTS Plugin: Fetch Error, falling back to non-streaming", fetchErr);
             // Do not throw, allow fallback to Tauri HTTP client below
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