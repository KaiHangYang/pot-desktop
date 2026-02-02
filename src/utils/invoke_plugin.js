import { appCacheDir, appConfigDir, join } from "@tauri-apps/api/path";
import { listen } from "@tauri-apps/api/event";
import { readBinaryFile, readTextFile } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import Database from "tauri-plugin-sql-api";
import { http } from "@tauri-apps/api";
import CryptoJS from "crypto-js";
import { osType } from "./env";

export async function invoke_plugin(pluginType, pluginName) {
    let configDir = await appConfigDir();
    let cacheDir = await appCacheDir();
    let pluginDir = await join(configDir, "plugins", pluginType, pluginName);
    let entryFile = await join(pluginDir, "main.js");
    let script = await readTextFile(entryFile);
    async function run(cmdName, args) {
        return await invoke("run_binary", {
            pluginType,
            pluginName,
            cmdName,
            args
        });
    }
    async function streamFetch(url, options = {}) {
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
    const utils = {
        tauriFetch: http.fetch,
        streamFetch,
        http,
        readBinaryFile,
        readTextFile,
        Database,
        CryptoJS,
        run,
        cacheDir, // String
        pluginDir, // String
        osType,// "Windows_NT", "Darwin", "Linux"
    }
    return [eval(`${script} ${pluginType}`), utils];
}