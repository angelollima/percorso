// lib.rs - Optimized Rust Backend for Tauri Application
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use serde::de::{self, Deserializer};
use tauri_plugin_store::StoreExt;
use tauri::{AppHandle, Emitter};
use serde_json::{json, Value, Map};
use chrono::{DateTime, Utc, Duration};

/// Represents user profile data
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProfileUser {
    full_name: String,
    username: String,
    email: String,
    created_at: DateTime<Utc>,
}

/// Represents user progress data
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Progress {
    current_streak: u32,
    longest_streak: u32,
    daily_goal: u32,
}

/// Represents application metadata
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct AppMeta {
    version: String,
    platform: String,
    last_opened: DateTime<Utc>,
}

/// Combined profile data structure
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProfileData {
    profile_user: ProfileUser,
    progress: Progress,
    app_meta: AppMeta,
}

/// Constants for profile keys
const PROFILE_USER_KEY: &str = "profileUser";
const PROGRESS_KEY: &str = "progress";
const APP_META_KEY: &str = "appMeta";

/// Creates or updates user profile data
#[tauri::command(rename_all = "camelCase")]
fn create_or_update_profile(
    app: AppHandle,
    full_name: String,
    username: String,
    email: String,
) -> PreferenceResult<()> {
    // Validate input
    if full_name.trim().is_empty() || username.trim().is_empty() || email.trim().is_empty() {
        return Err("All profile fields are required".into());
    }

    let store = get_store(&app)?;

    // Check if profile already exists
    let existing_profile = store.get(PROFILE_USER_KEY);
    let created_at = match existing_profile {
        Some(profile_value) => {
            // Try to parse existing created_at, fallback to now if it fails
            if let Ok(existing_profile) = serde_json::from_value::<ProfileUser>(profile_value) {
                existing_profile.created_at
            } else {
                Utc::now()
            }
        }
        None => Utc::now(),
    };

    let profile = ProfileUser {
        full_name,
        username,
        email,
        created_at,
    };

    let profile_json = serde_json::to_value(&profile)
        .map_err(|e| format!("Failed to serialize profile: {}", e))?;

    save_preference(app, PROFILE_USER_KEY.to_string(), profile_json)
}

/// Retrieves user profile data
#[tauri::command(rename_all = "camelCase")]
fn get_profile_data(app: AppHandle) -> PreferenceResult<ProfileData> {
    let store = get_store(&app)?;

    // Get profile user data
    let profile_user_value = store.get(PROFILE_USER_KEY)
        .ok_or_else(|| "Profile user data not found".to_string())?;

    let profile_user: ProfileUser = serde_json::from_value(profile_user_value)
        .map_err(|e| format!("Failed to deserialize profile user: {}", e))?;

    // Get progress data or create default
    let progress = match store.get(PROGRESS_KEY) {
        Some(progress_value) => {
            serde_json::from_value(progress_value)
                .unwrap_or_else(|_| Progress {
                    current_streak: 0,
                    longest_streak: 0,
                    daily_goal: 10,
                })
        }
        None => Progress {
            current_streak: 0,
            longest_streak: 0,
            daily_goal: 10,
        },
    };

    // Get app meta data or create default
    let app_meta = match store.get(APP_META_KEY) {
        Some(meta_value) => {
            serde_json::from_value(meta_value)
                .unwrap_or_else(|_| AppMeta {
                    version: "1.0.0".to_string(),
                    platform: get_platform_name(),
                    last_opened: Utc::now(),
                })
        }
        None => AppMeta {
            version: "1.0.0".to_string(),
            platform: get_platform_name(),
            last_opened: Utc::now(),
        },
    };

    Ok(ProfileData {
        profile_user,
        progress,
        app_meta,
    })
}

/// Updates user progress (streak, daily goal, etc.)
#[tauri::command(rename_all = "camelCase")]
fn update_progress(
    app: AppHandle,
    current_streak: Option<u32>,
    longest_streak: Option<u32>,
    daily_goal: Option<u32>,
) -> PreferenceResult<()> {
    let store = get_store(&app)?;

    // Get existing progress or create default
    let mut progress = match store.get(PROGRESS_KEY) {
        Some(progress_value) => {
            serde_json::from_value(progress_value)
                .unwrap_or_else(|_| Progress {
                    current_streak: 0,
                    longest_streak: 0,
                    daily_goal: 10,
                })
        }
        None => Progress {
            current_streak: 0,
            longest_streak: 0,
            daily_goal: 10,
        },
    };

    // Update fields if provided
    if let Some(current) = current_streak {
        progress.current_streak = current;
        // Update longest streak if current is higher
        if current > progress.longest_streak {
            progress.longest_streak = current;
        }
    }

    if let Some(longest) = longest_streak {
        progress.longest_streak = longest;
    }

    if let Some(goal) = daily_goal {
        progress.daily_goal = goal;
    }

    let progress_json = serde_json::to_value(&progress)
        .map_err(|e| format!("Failed to serialize progress: {}", e))?;

    save_preference(app, PROGRESS_KEY.to_string(), progress_json)
}

/// Updates app metadata (last opened, etc.)
#[tauri::command(rename_all = "camelCase")]
fn update_app_meta(app: AppHandle) -> PreferenceResult<()> {
    let app_meta = AppMeta {
        version: "1.0.0".to_string(),
        platform: get_platform_name(),
        last_opened: Utc::now(),
    };

    let meta_json = serde_json::to_value(&app_meta)
        .map_err(|e| format!("Failed to serialize app meta: {}", e))?;

    save_preference(app, APP_META_KEY.to_string(), meta_json)
}

/// Increments current streak and updates last opened
#[tauri::command(rename_all = "camelCase")]
fn increment_streak(app: AppHandle) -> PreferenceResult<()> {
    let store = get_store(&app)?;

    // Get current progress
    let mut progress = match store.get(PROGRESS_KEY) {
        Some(progress_value) => {
            serde_json::from_value(progress_value)
                .unwrap_or_else(|_| Progress {
                    current_streak: 0,
                    longest_streak: 0,
                    daily_goal: 10,
                })
        }
        None => Progress {
            current_streak: 0,
            longest_streak: 0,
            daily_goal: 10,
        },
    };

    // Increment streak
    progress.current_streak += 1;

    // Update longest streak if needed
    if progress.current_streak > progress.longest_streak {
        progress.longest_streak = progress.current_streak;
    }

    // Save progress
    let progress_json = serde_json::to_value(&progress)
        .map_err(|e| format!("Failed to serialize progress: {}", e))?;

    save_preference(app.clone(), PROGRESS_KEY.to_string(), progress_json)?;

    // Update app meta
    update_app_meta(app)
}

/// Helper function to get platform name
fn get_platform_name() -> String {
    #[cfg(target_os = "windows")]
    return "tauri-windows".to_string();

    #[cfg(target_os = "macos")]
    return "tauri-macos".to_string();

    #[cfg(target_os = "linux")]
    return "tauri-linux".to_string();

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    return "tauri-unknown".to_string();
}

/// Calculates days since profile creation
#[tauri::command(rename_all = "camelCase")]
fn get_days_since_creation(app: AppHandle) -> PreferenceResult<u32> {
    let store = get_store(&app)?;

    let profile_user_value = store.get(PROFILE_USER_KEY)
        .ok_or_else(|| "Profile user data not found".to_string())?;

    let profile_user: ProfileUser = serde_json::from_value(profile_user_value)
        .map_err(|e| format!("Failed to deserialize profile user: {}", e))?;

    let now = Utc::now();
    let duration = now.signed_duration_since(profile_user.created_at);
    let days = duration.num_days().max(0) as u32;

    Ok(days)
}

/// Represents the YAML frontmatter structure for vocabulary entries
#[derive(Debug, Deserialize, Serialize)]
struct VocabularyEntryHeader {
    #[serde(deserialize_with = "deserialize_italian_word")]
    Italian: String,
    English: Vec<String>,
}

/// Represents information about a directory entry (file or folder)
#[derive(Serialize, Clone)]
pub struct DirectoryEntryInfo {
    name: String,
    is_directory: bool,
    is_file: bool,
    full_path: Option<String>,
}

/// Represents vocabulary learning progress data
#[derive(Debug, Serialize, Deserialize)]
struct VocabularyProgress {
    current_index: u32,
    total_cards: u32,
    directory_path: String,
    #[serde(with = "chrono::serde::ts_seconds")]
    last_updated: DateTime<Utc>,
}

/// Result type for preference operations
type PreferenceResult<T> = Result<T, String>;

/// Constants for store configuration
const STORE_FILE_NAME: &str = "store.json";
const VOCABULARY_PROGRESS_KEY: &str = "vocabulary_progress";

impl DirectoryEntryInfo {
    /// Creates a new directory entry information structure
    fn new(name: String, is_directory: bool, is_file: bool, full_path: Option<String>) -> Self {
        Self {
            name,
            is_directory,
            is_file,
            full_path,
        }
    }
}

impl VocabularyProgress {
    /// Creates a new vocabulary progress instance
    fn new(current_index: u32, total_cards: u32, directory_path: String) -> Self {
        Self {
            current_index,
            total_cards,
            directory_path,
            last_updated: Utc::now(),
        }
    }
}

/// Custom deserializer that handles both string and sequence values for Italian words
fn deserialize_italian_word<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let value: serde_yaml::Value = Deserialize::deserialize(deserializer)?;

    match value {
        serde_yaml::Value::String(italian_word) => Ok(italian_word),
        serde_yaml::Value::Sequence(word_sequence) => {
            if let Some(serde_yaml::Value::String(first_word)) = word_sequence.get(0) {
                Ok(first_word.clone())
            } else {
                Err(de::Error::custom("Expected a list of strings or single string in Italian field"))
            }
        }
        _ => Err(de::Error::custom("Invalid type for Italian field")),
    }
}

/// Helper function to get store instance with proper error handling
fn get_store(app: &AppHandle) -> PreferenceResult<Arc<tauri_plugin_store::Store<tauri::Wry>>> {
    app.store(STORE_FILE_NAME)
        .map_err(|e| format!("Failed to access store '{}': {}", STORE_FILE_NAME, e))
}

/// Helper function to save store with proper error handling
fn save_store(store: &Arc<tauri_plugin_store::Store<tauri::Wry>>) -> PreferenceResult<()> {
    store.save()
        .map_err(|e| format!("Failed to save store to disk: {}", e))
}

/// Helper function to emit events to frontend with error handling
fn emit_to_frontend(app: &AppHandle, event: &str, payload: Value) -> PreferenceResult<()> {
    app.emit_to(tauri::EventTarget::app(), event, payload)
        .map_err(|e| format!("Failed to emit event '{}' to frontend: {}", event, e))
}

/// Extracts vocabulary fields from a markdown file with YAML frontmatter
#[tauri::command(rename_all = "camelCase")]
fn extract_vocabulary_fields(file_path: String) -> PreferenceResult<VocabularyEntryHeader> {
    let file_content = fs::read_to_string(&file_path)
        .map_err(|error| format!("Failed to read file '{}': {}", file_path, error))?;

    // Split content between YAML frontmatter and markdown body
    let content_parts: Vec<&str> = file_content.splitn(3, "---").collect();

    if content_parts.len() < 3 {
        return Err("Invalid format: YAML frontmatter delimited by '---' not found".into());
    }

    let yaml_frontmatter = content_parts[1];

    let vocabulary_header: VocabularyEntryHeader = serde_yaml::from_str(yaml_frontmatter)
        .map_err(|error| format!("Failed to parse YAML frontmatter: {}", error))?;

    Ok(vocabulary_header)
}

/// Lists directory contents and sorts them (directories first, then files alphabetically)
#[tauri::command(rename_all = "camelCase")]
fn list_directory_contents(directory_path: String) -> PreferenceResult<Vec<DirectoryEntryInfo>> {
    // Validate directory path
    let path = PathBuf::from(&directory_path);
    if !path.exists() {
        return Err(format!("Directory '{}' does not exist", directory_path));
    }

    if !path.is_dir() {
        return Err(format!("Path '{}' is not a directory", directory_path));
    }

    // Read the directory contents
    let directory_entries = fs::read_dir(path)
        .map_err(|error| format!("Failed to read directory '{}': {}", directory_path, error))?;

    // Process entries and collect them into a vector
    let mut processed_entries: Vec<DirectoryEntryInfo> = directory_entries
        .filter_map(|entry_result| {
            match entry_result {
                Ok(directory_entry) => {
                    // Get file type information
                    let entry_file_type = directory_entry.file_type().ok()?;
                    let entry_path = directory_entry.path();
                    let full_path_string = entry_path.to_string_lossy().to_string();
                    let entry_name = directory_entry.file_name().to_string_lossy().into_owned();

                    Some(DirectoryEntryInfo::new(
                        entry_name,
                        entry_file_type.is_dir(),
                        entry_file_type.is_file(),
                        Some(full_path_string),
                    ))
                }
                Err(_) => None, // Skip entries with errors
            }
        })
        .collect();

    // Sort entries: directories first, then files (both alphabetically)
    processed_entries.sort_by(|entry_a, entry_b| {
        match (entry_a.is_directory, entry_b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,    // Directory before file
            (false, true) => std::cmp::Ordering::Greater, // File after directory
            _ => entry_a.name.to_lowercase().cmp(&entry_b.name.to_lowercase()), // Same type: alphabetical order
        }
    });

    Ok(processed_entries)
}

/// Saves or updates a single preference in the JSON store
#[tauri::command(rename_all = "camelCase")]
fn save_preference(app: AppHandle, key: String, value: Value) -> PreferenceResult<()> {
    // Validate input parameters
    if key.trim().is_empty() {
        return Err("Preference key cannot be empty".into());
    }

    let store = get_store(&app)?;

    // Set the preference value
    store.set(&key, value.clone());

    // Save to disk
    save_store(&store)?;

    // Emit update event to frontend
    let payload = json!({
        "key": key,
        "value": value
    });
    emit_to_frontend(&app, "preference-updated", payload)?;

    Ok(())
}

/// Saves or updates all preferences in the JSON store (bulk operation)
#[tauri::command(rename_all = "camelCase")]
fn save_all_preferences(app: AppHandle, preferences: Map<String, Value>) -> PreferenceResult<()> {
    let store = get_store(&app)?;

    // Clear existing preferences
    store.clear();

    // Set all new preferences
    for (key, value) in preferences.iter() {
        store.set(key, value.clone());
    }

    // Save to disk
    save_store(&store)?;

    // Emit update event to frontend
    emit_to_frontend(&app, "preferences-updated", Value::Object(preferences))?;

    Ok(())
}

/// Retrieves a specific preference from the JSON store
#[tauri::command(rename_all = "camelCase")]
fn get_preference(app: AppHandle, key: String) -> PreferenceResult<Value> {
    if key.trim().is_empty() {
        return Err("Preference key cannot be empty".into());
    }

    let store = get_store(&app)?;
    let value = store.get(&key).unwrap_or(Value::Null);

    Ok(value)
}

/// Deletes a specific preference from the JSON store
#[tauri::command(rename_all = "camelCase")]
fn delete_preference(app: AppHandle, key: String) -> PreferenceResult<()> {
    if key.trim().is_empty() {
        return Err("Preference key cannot be empty".into());
    }

    let store = get_store(&app)?;

    // Check if preference exists before deletion
    if !store.has(&key) {
        return Err(format!("Preference with key '{}' does not exist", key));
    }

    store.delete(&key);
    save_store(&store)?;

    // Emit deletion event to frontend
    let payload = json!({
        "key": key
    });
    emit_to_frontend(&app, "preference-deleted", payload)?;

    Ok(())
}

/// Retrieves all preferences from the JSON store
#[tauri::command(rename_all = "camelCase")]
fn get_all_preferences(app: AppHandle) -> PreferenceResult<Value> {
    let store = get_store(&app)?;
    let keys = store.keys();

    let mut preferences = Map::new();

    for key in keys {
        let value = store.get(&key).unwrap_or(Value::Null);
        preferences.insert(key, value);
    }

    Ok(Value::Object(preferences))
}

/// Clears all preferences from the JSON store
#[tauri::command(rename_all = "camelCase")]
fn clear_all_preferences(app: AppHandle) -> PreferenceResult<()> {
    let store = get_store(&app)?;

    store.clear();
    save_store(&store)?;

    // Emit clear event to frontend
    emit_to_frontend(&app, "preferences-cleared", Value::Null)?;

    Ok(())
}

/// Checks if a specific preference exists in the JSON store
#[tauri::command(rename_all = "camelCase")]
fn has_preference(app: AppHandle, key: String) -> PreferenceResult<bool> {
    if key.trim().is_empty() {
        return Err("Preference key cannot be empty".into());
    }

    let store = get_store(&app)?;
    let exists = store.has(&key);

    Ok(exists)
}

/// Saves vocabulary learning progress with validation
#[tauri::command(rename_all = "camelCase")]
fn save_vocabulary_progress(
    app: AppHandle,
    current_index: u32,
    total_cards: u32,
    directory_path: String,
) -> PreferenceResult<()> {
    // Validate input parameters
    if directory_path.trim().is_empty() {
        return Err("Directory path cannot be empty".into());
    }

    if current_index > total_cards {
        return Err("Current index cannot be greater than total cards".into());
    }

    let progress = VocabularyProgress::new(current_index, total_cards, directory_path);

    // Serialize progress to JSON
    let progress_json = serde_json::to_value(&progress)
        .map_err(|e| format!("Failed to serialize vocabulary progress: {}", e))?;

    // Save using the existing preference system
    save_preference(app, VOCABULARY_PROGRESS_KEY.to_string(), progress_json)
}

/// Retrieves vocabulary learning progress
#[tauri::command(rename_all = "camelCase")]
fn get_vocabulary_progress(app: AppHandle) -> PreferenceResult<Value> {
    get_preference(app, VOCABULARY_PROGRESS_KEY.to_string())
}

/// Validates and exports preferences to a JSON file
#[tauri::command(rename_all = "camelCase")]
fn export_preferences(app: AppHandle, file_path: String) -> PreferenceResult<()> {
    if file_path.trim().is_empty() {
        return Err("Export file path cannot be empty".into());
    }

    let preferences = get_all_preferences(app)?;

    // Write preferences to file
    let json_string = serde_json::to_string_pretty(&preferences)
        .map_err(|e| format!("Failed to serialize preferences: {}", e))?;

    fs::write(&file_path, json_string)
        .map_err(|e| format!("Failed to write preferences to file '{}': {}", file_path, e))?;

    Ok(())
}

/// Imports preferences from a JSON file with validation
#[tauri::command(rename_all = "camelCase")]
fn import_preferences(app: AppHandle, file_path: String) -> PreferenceResult<()> {
    if file_path.trim().is_empty() {
        return Err("Import file path cannot be empty".into());
    }

    // Read and parse JSON file
    let file_content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read preferences file '{}': {}", file_path, e))?;

    let preferences: Map<String, Value> = serde_json::from_str(&file_content)
        .map_err(|e| format!("Failed to parse JSON from file '{}': {}", file_path, e))?;

    // Import preferences using bulk save
    save_all_preferences(app, preferences)
}

/// Initializes the store and loads initial data
fn initialize_store(app: &AppHandle) -> PreferenceResult<()> {
    let store = get_store(app)?;

    // Load user data (if exists)
    let user_data = store.get("user-data").unwrap_or(Value::Null);
    emit_to_frontend(app, "user-data-loaded", user_data)?;

    // Load all preferences and send to frontend
    let keys = store.keys();
    let mut all_preferences = Map::new();

    for key in keys {
        let value = store.get(&key).unwrap_or(Value::Null);
        all_preferences.insert(key, value);
    }

    emit_to_frontend(app, "preferences-loaded", Value::Object(all_preferences))?;

    Ok(())
}

/// Main function that configures and runs the Tauri application
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            // Initialize store and load initial data
            if let Err(e) = initialize_store(&app.handle()) {
                eprintln!("Failed to initialize store: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Profile management
            create_or_update_profile,
            get_profile_data,
            update_progress,
            update_app_meta,
            increment_streak,
            get_days_since_creation,

            // Directory and file operations
            list_directory_contents,
            extract_vocabulary_fields,

            // Preference management
            save_preference,
            save_all_preferences,
            get_preference,
            delete_preference,
            get_all_preferences,
            clear_all_preferences,
            has_preference,

            // Vocabulary progress
            save_vocabulary_progress,
            get_vocabulary_progress,

            // Import/Export functionality
            export_preferences,
            import_preferences
        ])
        .run(tauri::generate_context!())
        .expect("Failed to run Tauri application");
}
