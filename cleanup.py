import os
import shutil

# Folders that are completely unneeded in the root
unwanted_dirs = [
    'frontend-new',
    'node_modules',  # The real one is inside /frontend
]

# Random prototype files and logs in the root
unwanted_files = [
    'package.json',  # The real one is inside /frontend
    'package-lock.json',
    'fetch_repo.py',
    'generate_medisync_pdf.py',
    'generate_pdf.py',
    'test_groq.py',
    'test_market_research.txt',
    'replace_urls.py'
]

print("Starting cleanup...")

for d in unwanted_dirs:
    if os.path.exists(d):
        try:
            shutil.rmtree(d, ignore_errors=True)
            print(f"Removed directory: {d}")
        except Exception as e:
            print(f"Failed to remove {d}: {e}")

for f in unwanted_files:
    if os.path.exists(f):
        try:
            os.remove(f)
            print(f"Removed file: {f}")
        except Exception as e:
            print(f"Failed to remove {f}: {e}")

print("Cleanup completely finished! Your repository is now clean.")
