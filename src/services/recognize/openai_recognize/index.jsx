import { fetch } from '@tauri-apps/api/http';

export async function recognize(base64, language, options = {}) {
    const { config } = options;
    let { model = "gpt-4o", apiKey, requestPath, customPrompt } = config;

    if (!requestPath) {
        requestPath = "https://api.openai.com";
    }
    if (!/https?:\/\/.+/.test(requestPath)) {
        requestPath = `https://${requestPath}`;
    }
    if (requestPath.endsWith('/')) {
        requestPath = requestPath.slice(0, -1);
    }
    if (!requestPath.endsWith('/chat/completions')) {
        requestPath += '/v1/chat/completions';
    }
    
    if (!customPrompt) {
        customPrompt = "Just recognize the text in the image. Do not offer unnecessary explanations.";
    } else {
         // Assuming lang is the target language name, but info.ts maps enum to string names.
         // Ideally we pass the code map, but for now exact replacement or just append.
         // Plugin logic replaced $lang
         customPrompt = customPrompt.replaceAll("$lang", language);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    }

    const body = {
        model,
        messages: [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": customPrompt
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": `data:image/png;base64,${base64}`,
                            "detail": "high"
                        },
                    },
                ],
            }
        ],
    }
    
    // Using tauri http fetch to respect system proxy if configured, 
    // but note that tauri http client might have issues with some proxies as noticed before.
    // However, recognize is usually short request. If streaming needed, we might use stream_fetch too but here we wait full response.
    const res = await fetch(requestPath, {
        method: 'POST',
        headers: headers,
        body: {
            type: "Json",
            payload: body
        }
    });

    if (res.ok) {
        let result = res.data;
        return result.choices[0].message.content;
    } else {
         throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}

export * from './Config';
export * from './info';
