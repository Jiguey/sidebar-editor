use crate::fs::{FileEntry, list_directory, read_file_contents, write_file_contents};
use crate::sidecar::SharedSidecar;
use std::env;
use tauri::{AppHandle, State};

#[tauri::command]
pub fn list_dir(path: &str) -> Result<Vec<FileEntry>, String> {
    list_directory(path)
}

#[tauri::command]
pub fn read_file(path: &str) -> Result<String, String> {
    read_file_contents(path)
}

#[tauri::command]
pub fn write_file(path: &str, contents: &str) -> Result<(), String> {
    write_file_contents(path, contents)
}

#[tauri::command]
pub fn get_workspace_path() -> Result<String, String> {
    env::current_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_harness(
    app_handle: AppHandle,
    sidecar: State<'_, SharedSidecar>,
) -> Result<(), String> {
    let mut manager = sidecar.lock().map_err(|e| e.to_string())?;
    
    // Get the sidecar path relative to the app
    let sidecar_path = get_sidecar_path()?;
    
    manager.start(&sidecar_path, app_handle)
}

#[tauri::command]
pub fn send_to_harness(
    method: &str,
    params: serde_json::Value,
    sidecar: State<'_, SharedSidecar>,
) -> Result<u64, String> {
    let mut manager = sidecar.lock().map_err(|e| e.to_string())?;
    manager.send(method, params)
}

#[tauri::command]
pub fn stop_harness(sidecar: State<'_, SharedSidecar>) -> Result<(), String> {
    let mut manager = sidecar.lock().map_err(|e| e.to_string())?;
    manager.stop();
    Ok(())
}

fn get_sidecar_path() -> Result<String, String> {
    // In development, use the relative path to the sidecar
    let cwd = env::current_dir().map_err(|e| e.to_string())?;
    let sidecar_path = cwd.join("sidecar").join("dist").join("index.js");
    
    if sidecar_path.exists() {
        return Ok(sidecar_path.to_string_lossy().to_string());
    }
    
    // Try parent directory (when running from src-tauri)
    let parent_path = cwd
        .parent()
        .map(|p| p.join("sidecar").join("dist").join("index.js"))
        .unwrap_or_default();
    
    if parent_path.exists() {
        return Ok(parent_path.to_string_lossy().to_string());
    }
    
    Err("Sidecar not found. Run 'npm run build' in the sidecar directory.".to_string())
}
