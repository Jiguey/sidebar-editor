use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileEntry>>,
}

fn load_simple_gitignore_names(workspace_root: &Path) -> HashSet<String> {
    let mut out = HashSet::new();
    let p = workspace_root.join(".gitignore");
    let Ok(raw) = fs::read_to_string(p) else {
        return out;
    };
    for line in raw.lines() {
        let t = line.trim();
        if t.is_empty() || t.starts_with('#') {
            continue;
        }
        if t.contains('/') || t.contains('*') || t.contains('?') || t.starts_with('!') {
            continue;
        }
        out.insert(t.to_string());
    }
    out
}

fn find_workspace_root_for_path(path: &Path) -> PathBuf {
    let mut cur = path.to_path_buf();
    loop {
        if cur.join(".git").is_dir() {
            return cur;
        }
        if !cur.pop() {
            break;
        }
    }
    path.to_path_buf()
}

pub fn list_directory(path: &str) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(path);

    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }

    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", path.display()));
    }

    let ws = find_workspace_root_for_path(path);
    let gitignore_names = load_simple_gitignore_names(&ws);

    let mut entries: Vec<FileEntry> = Vec::new();

    let read_dir = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name().to_string_lossy().to_string();

        if file_name.starts_with('.')
            || file_name == "node_modules"
            || file_name == "target"
            || file_name == "dist"
            || gitignore_names.contains(&file_name)
        {
            continue;
        }

        let file_path = entry.path();
        let is_dir = file_path.is_dir();

        entries.push(FileEntry {
            name: file_name,
            path: file_path.to_string_lossy().to_string(),
            is_dir,
            children: None,
        });
    }

    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

pub fn read_file_contents(path: &str) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

pub fn write_file_contents(path: &str, contents: &str) -> Result<(), String> {
    fs::write(path, contents).map_err(|e| e.to_string())
}

pub fn rename_path(from: &str, to: &str) -> Result<(), String> {
    fs::rename(from, to).map_err(|e| e.to_string())
}

pub fn delete_path(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| e.to_string())
    } else {
        fs::remove_file(p).map_err(|e| e.to_string())
    }
}

pub fn path_exists(path: &str) -> Result<bool, String> {
    Ok(Path::new(path).exists())
}

fn should_skip_dir_name(name: &str, gitignore_names: &HashSet<String>) -> bool {
    name.starts_with('.')
        || name == "node_modules"
        || name == "target"
        || name == "dist"
        || gitignore_names.contains(name)
}

pub fn find_files(
    workspace_path: &str,
    glob_pattern: &str,
    max_results: usize,
) -> Result<Vec<String>, String> {
    let root = Path::new(workspace_path);
    if !root.is_dir() {
        return Err(format!("Workspace path is not a directory: {workspace_path}"));
    }
    let ws = find_workspace_root_for_path(root);
    let gitignore_names = load_simple_gitignore_names(&ws);
    let pattern = glob_pattern.trim();
    let mut out: Vec<String> = Vec::new();
    let limit = max_results.max(1).min(500);

    for entry in walkdir::WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if out.len() >= limit {
            break;
        }
        let p = entry.path();
        if p.is_dir() {
            if let Some(name) = p.file_name().and_then(|n| n.to_str()) {
                if should_skip_dir_name(name, &gitignore_names) {
                    continue;
                }
            }
            continue;
        }
        let Some(name) = p.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        let rel = p
            .strip_prefix(root)
            .map(|r| r.to_string_lossy().to_string())
            .unwrap_or_else(|_| p.to_string_lossy().to_string());
        let matches = if pattern.contains('*') {
            glob_match_simple(pattern, name) || glob_match_simple(pattern, &rel)
        } else {
            name.contains(pattern) || rel.contains(pattern)
        };
        if matches {
            out.push(rel);
        }
    }
    out.sort();
    Ok(out)
}

fn glob_match_simple(pattern: &str, text: &str) -> bool {
    if pattern == "*" || pattern == "*.*" {
        return true;
    }
    if let Some(rest) = pattern.strip_prefix("*.") {
        return text.ends_with(&format!(".{rest}"));
    }
    if let Some(rest) = pattern.strip_suffix("*") {
        return text.starts_with(rest);
    }
    text.contains(pattern)
}

pub fn list_dir_tree(
    path: &str,
    max_depth: usize,
    max_entries: usize,
) -> Result<Vec<FileEntry>, String> {
    let root = Path::new(path);
    if !root.is_dir() {
        return Err(format!("Path is not a directory: {}", root.display()));
    }
    let ws = find_workspace_root_for_path(root);
    let gitignore_names = load_simple_gitignore_names(&ws);
    let mut count = 0usize;
    let limit = max_entries.max(1).min(2000);
    let depth_limit = max_depth.max(1).min(8);

    fn walk(
        dir: &Path,
        gitignore_names: &HashSet<String>,
        depth: usize,
        depth_limit: usize,
        count: &mut usize,
        limit: usize,
    ) -> Result<Vec<FileEntry>, String> {
        if *count >= limit || depth > depth_limit {
            return Ok(vec![]);
        }
        let read_dir = fs::read_dir(dir).map_err(|e| e.to_string())?;
        let mut entries: Vec<FileEntry> = Vec::new();
        for entry in read_dir {
            if *count >= limit {
                break;
            }
            let entry = entry.map_err(|e| e.to_string())?;
            let file_name = entry.file_name().to_string_lossy().to_string();
            if should_skip_dir_name(&file_name, gitignore_names) {
                continue;
            }
            let file_path = entry.path();
            let is_dir = file_path.is_dir();
            *count += 1;
            let mut node = FileEntry {
                name: file_name,
                path: file_path.to_string_lossy().to_string(),
                is_dir,
                children: None,
            };
            if is_dir && depth < depth_limit {
                node.children = Some(walk(
                    &file_path,
                    gitignore_names,
                    depth + 1,
                    depth_limit,
                    count,
                    limit,
                )?);
            }
            entries.push(node);
        }
        entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        });
        Ok(entries)
    }

    walk(root, &gitignore_names, 0, depth_limit, &mut count, limit)
}

pub fn web_fetch(url: &str, allowed_hosts: &[String], max_bytes: usize) -> Result<String, String> {
    let parsed = reqwest::Url::parse(url).map_err(|e| format!("Invalid URL: {e}"))?;
    let host = parsed.host_str().unwrap_or("").to_lowercase();
    if host.is_empty() {
        return Err("URL must include a host".to_string());
    }
    let allowed = allowed_hosts.iter().any(|h| h.to_lowercase() == host);
    if !allowed {
        return Err(format!(
            "Host '{host}' is not in the web fetch allowlist. Add it in Settings."
        ));
    }
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return Err("Only http and https URLs are allowed".to_string());
    }

    let limit = max_bytes.max(1024).min(512_000);
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())?;
    let response = client
        .get(parsed)
        .send()
        .map_err(|e| format!("Fetch failed: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status()));
    }
    let bytes = response
        .bytes()
        .map_err(|e| e.to_string())?
        .iter()
        .take(limit)
        .copied()
        .collect::<Vec<u8>>();
    let text = String::from_utf8_lossy(&bytes).to_string();
    Ok(text)
}
