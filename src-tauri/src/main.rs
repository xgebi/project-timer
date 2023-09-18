// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql;
use std::env;

#[tauri::command]
fn get_environment_variable (name: &str) -> String {
    for (key, value) in env::vars() {
        println!("{key}: {value}");
    }
    env::var(name).unwrap_or_else(|_| "".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![get_environment_variable])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
