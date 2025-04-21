// src-tauri/src/lib.rs

use rand::seq::SliceRandom;
use rand::thread_rng;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(serde::Serialize, Clone)]  // adiciona Clone aqui
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

// novo comando
#[tauri::command]
fn random_file(path: String) -> Result<DirEntryInfo, String> {
  let mut entries: Vec<DirEntryInfo> = fs::read_dir(PathBuf::from(&path))
    .map_err(|e| e.to_string())?
    .filter_map(|res| res.ok())
    .filter_map(|entry| {
      let ft = entry.file_type().ok()?;
      Some(DirEntryInfo {
        name: entry.file_name().to_string_lossy().into_owned(),
        is_dir: ft.is_dir(),
        is_file: ft.is_file(),
      })
    })
    .collect();

  // Se quiser só arquivos:
  entries.retain(|e| e.is_file);

  // sorteia um elemento
  let mut rng = thread_rng();
  if let Some(choice) = entries.choose(&mut rng) {
    Ok(choice.clone())
  } else {
    Err("Diretório vazio".into())
  }
}

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![list_dir, random_file])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
