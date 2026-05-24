use flate2::read::GzDecoder;
use std::fs;
use std::io::{copy, Cursor, Read};
use std::path::{Path, PathBuf};
use zip::ZipArchive;

const VSCONS_MARKETPLACE_URL: &str =
    "https://marketplace.visualstudio.com/_apis/public/gallery/publishers/yusifaliyevpro/vsextensions/vscicons/1.1.4/vspackage";

fn icon_pack_root() -> Result<PathBuf, String> {
    let base = dirs::data_dir().ok_or("Could not resolve app data directory")?;
    Ok(base.join("tiny-llama").join("icon-packs").join("vscode-icons"))
}

pub fn icon_pack_dir() -> Option<String> {
    let root = icon_pack_root().ok()?;
    let manifest = root.join("manifest.json");
    if manifest.is_file() {
        Some(root.to_string_lossy().into_owned())
    } else {
        None
    }
}

fn write_icon_pack_from_zip<R: Read + std::io::Seek>(reader: R, dest: &Path) -> Result<(), String> {
    let mut archive = ZipArchive::new(reader).map_err(|e| format!("Invalid VSIX archive: {e}"))?;
    fs::create_dir_all(dest).map_err(|e| e.to_string())?;

    let icons_dir = dest.join("icons");
    if icons_dir.exists() {
        fs::remove_dir_all(&icons_dir).map_err(|e| e.to_string())?;
    }
    fs::create_dir_all(&icons_dir).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = file.name().to_string();
        if name == "extension/icons.json" {
            let mut out = fs::File::create(dest.join("manifest.json")).map_err(|e| e.to_string())?;
            copy(&mut file, &mut out).map_err(|e| e.to_string())?;
        } else if name.starts_with("extension/icons/") && name.ends_with(".svg") {
            let file_name = name.trim_start_matches("extension/icons/");
            if file_name.is_empty() || file_name.contains('/') {
                continue;
            }
            let out_path = icons_dir.join(file_name);
            let mut out = fs::File::create(out_path).map_err(|e| e.to_string())?;
            copy(&mut file, &mut out).map_err(|e| e.to_string())?;
        }
    }

    let manifest = dest.join("manifest.json");
    if !manifest.is_file() {
        return Err("Downloaded pack is missing manifest.json".to_string());
    }
    Ok(())
}

pub fn refresh_vscode_icons_pack() -> Result<String, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;

    let bytes = client
        .get(VSCONS_MARKETPLACE_URL)
        .send()
        .map_err(|e| format!("Download failed: {e}"))?
        .bytes()
        .map_err(|e| e.to_string())?;

    let dest = icon_pack_root()?;
    let tmp = dest.with_extension("tmp");
    if tmp.exists() {
        fs::remove_dir_all(&tmp).map_err(|e| e.to_string())?;
    }
    fs::create_dir_all(&tmp).map_err(|e| e.to_string())?;

    let mut decoder = GzDecoder::new(bytes.as_ref());
    let mut vsix_bytes = Vec::new();
    decoder
        .read_to_end(&mut vsix_bytes)
        .map_err(|e| format!("Failed to decompress VSIX: {e}"))?;
    write_icon_pack_from_zip(Cursor::new(vsix_bytes), &tmp)?;

    if dest.exists() {
        fs::remove_dir_all(&dest).map_err(|e| e.to_string())?;
    }
    fs::rename(&tmp, &dest).map_err(|e| e.to_string())?;

    Ok(dest.to_string_lossy().into_owned())
}
