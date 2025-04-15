use tauri_plugin_dialog;
use tauri_plugin_log::Builder as LogPluginBuilder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            LogPluginBuilder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .setup(|_app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
