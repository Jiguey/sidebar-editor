#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod modules;

use modules::commands::{
    delete_entry, find_files, get_workspace_path, git_commit, git_current_branch, git_diff,
    git_log, git_stage, git_status, git_unstage, grep_workspace, list_dir, list_dir_tree,
    open_settings_window, path_exists, pick_workspace_folder, read_file, read_system_prompt,
    rename_entry, run_shell, web_fetch, write_file, write_system_prompt,
};
use modules::pty::{pty_close, pty_create, pty_resize, pty_write, PtyManager};
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(PtyManager::default())
        .invoke_handler(tauri::generate_handler![
            list_dir,
            read_file,
            write_file,
            rename_entry,
            delete_entry,
            path_exists,
            find_files,
            list_dir_tree,
            web_fetch,
            get_workspace_path,
            pick_workspace_folder,
            open_settings_window,
            git_current_branch,
            git_status,
            git_diff,
            git_stage,
            git_unstage,
            git_commit,
            git_log,
            pty_create,
            pty_write,
            pty_resize,
            pty_close,
            grep_workspace,
            run_shell,
            read_system_prompt,
            write_system_prompt,
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
