// MelodyBox 桌面外壳
// 只负责注册插件，所有业务逻辑都在前端 js/ 里
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        // Windows SMTC：系统媒体卡片、蓝牙耳机线控、媒体键
        .plugin(tauri_plugin_media::init())
        // 保留现有的「引用本地文件夹」能力
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running MelodyBox");
}
