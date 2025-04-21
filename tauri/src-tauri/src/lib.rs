// src-tauri/src/lib.rs

use std::fs;
use std::path::PathBuf;
use tauri::Manager;

// Estrutura para enviar as entradas de diretório ao frontend
#[derive(serde::Serialize)]
struct DirEntryInfo {
  name: String,
  is_dir: bool,
  is_file: bool,
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<DirEntryInfo>, String> {
  let mut entries = Vec::new();
  let rd = fs::read_dir(PathBuf::from(path))
    .map_err(|e| e.to_string())?;  // lê o diretório :contentReference[oaicite:2]{index=2}

  for entry in rd {
    let entry = entry.map_err(|e| e.to_string())?;
    let file_type = entry.file_type().map_err(|e| e.to_string())?;
    entries.push(DirEntryInfo {
      name: entry.file_name().to_string_lossy().into_owned(),
      is_dir: file_type.is_dir(),
      is_file: file_type.is_file(),
    });
  }
  Ok(entries)
}

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![list_dir])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
