use std::path::PathBuf;
use std::fs;
use dirs::data_local_dir;

pub fn get_app_root() -> Option<PathBuf> {
    // This logic mimics how Tauri resolves the local data directory on Windows.
    // It's usually %LOCALAPPDATA%/com.pot-app.desktop
    if let Some(mut data_dir) = data_local_dir() {
        data_dir.push("com.pot-app.desktop");
        return Some(data_dir);
    }
    None
}

pub fn check_and_clear_cache() {
    if let Some(app_root) = get_app_root() {
        let flag_file = app_root.join(".clear_webview_cache");
        if flag_file.exists() {
            println!("Cache clear flag found. Clearing WebView2 data...");
            let webview_dir = app_root.join("EBWebView");
            if webview_dir.exists() {
                if let Err(e) = fs::remove_dir_all(&webview_dir) {
                    eprintln!("Failed to remove WebView2 data: {}", e);
                } else {
                    println!("WebView2 data cleared successfully.");
                }
            }
            let _ = fs::remove_file(flag_file);
        }
    }
}

pub fn set_clear_cache_flag() -> Result<(), String> {
    if let Some(app_root) = get_app_root() {
        if !app_root.exists() {
             let _ = fs::create_dir_all(&app_root);
        }
        let flag_file = app_root.join(".clear_webview_cache");
        if let Err(e) = fs::write(&flag_file, "") {
            return Err(format!("Failed to write flag file: {}", e));
        }
        Ok(())
    } else {
        Err("Could not determine app root".to_string())
    }
}
