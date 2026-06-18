import os
import urllib.request
import zipfile

repo_url = "https://github.com/BCSAKETH/impactsim/archive/refs/heads/main.zip"
target_dir = r"d:\Tekworks\startup-idea-validator\startup\impactsim_analysis"

os.makedirs(target_dir, exist_ok=True)
zip_path = os.path.join(target_dir, "repo.zip")

print("Downloading repo...")
urllib.request.urlretrieve(repo_url, zip_path)

print("Extracting repo...")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(target_dir)

print("Done. Extracted to:", target_dir)
