// lib.rs - Optimized Rust Backend for Tauri Application
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use serde::de::{self, Deserializer};

/// Represents the YAML frontmatter structure for vocabulary entries
#[derive(Debug, Deserialize, Serialize)]
struct VocabularyEntryHeader {
    #[serde(deserialize_with = "deserialize_italian_word")]
    Italian: String,
    English: Vec<String>,
}

/// Represents information about a directory entry (file or folder)
#[derive(serde::Serialize, Clone)]
pub struct DirectoryEntryInfo {
    name: String,
    is_directory: bool,
    is_file: bool,
    full_path: Option<String>,
}

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
                Err(de::Error::custom("Expected a list of strings or single string in parola_it"))
            }
        }
        _ => Err(de::Error::custom("Invalid type for parola_it field")),
    }
}

/// Extracts vocabulary fields from a markdown file with YAML frontmatter
#[tauri::command(rename_all = "camelCase")]
fn extract_vocabulary_fields(file_path: String) -> Result<VocabularyEntryHeader, String> {
    let file_content = std::fs::read_to_string(&file_path)
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
fn list_directory_contents(directory_path: String) -> Result<Vec<DirectoryEntryInfo>, String> {
    // Read the directory contents
    let directory_entries = fs::read_dir(PathBuf::from(&directory_path))
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

/// Main function that configures and runs the Tauri application
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init()) // System dialog plugin
        .invoke_handler(tauri::generate_handler![
            list_directory_contents,     // Directory listing command
            extract_vocabulary_fields    // Vocabulary extraction command
        ])
        .run(tauri::generate_context!())
        .expect("Failed to run Tauri application");
}
