#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod fs;
mod sidecar;
mod watcher;

use sidecar::{SharedSidecar, SidecarManager};
use std::sync::Mutex;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(SidecarManager::new()) as SharedSidecar)
        .invoke_handler(tauri::generate_handler![
            commands::list_dir,
            commands::read_file,
            commands::write_file,
            commands::get_workspace_path,
            commands::start_harness,
            commands::send_to_harness,
            commands::stop_harness,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            #[cfg(debug_assertions)]
            window.open_devtools();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
