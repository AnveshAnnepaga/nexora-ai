import os
import re

def update_urls(directory):
    count = 0
    pattern1 = r"'http://127\.0\.0\.1:8000/api"
    pattern2 = r'"http://127\.0\.0\.1:8000/api'
    pattern3 = r"`http://127\.0\.0\.1:8000/api"
    
    rep1 = r"`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api"
    rep2 = r"`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api"
    rep3 = r"`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api"

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = re.sub(pattern1, rep1, content)
                new_content = re.sub(pattern2, rep2, new_content)
                new_content = re.sub(pattern3, rep3, new_content)
                
                # Fix trailing quotes if we replaced ' or " with `
                new_content = re.sub(r"(/api[^'\"]*)'", r"\1`", new_content)
                new_content = re.sub(r'(/api[^"\']*)["\']', r'\1`', new_content)
                # Wait, the previous regex might be too greedy. A safer approach:
                
                if new_content != content:
                    pass # We will use a more robust regex below.

def precise_update(directory):
    count = 0
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                
                # Replace 'http://127.0.0.1:8000/...' with `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/...`
                # Case 1: single quotes
                content = re.sub(r"'http://127\.0\.0\.1:8000([^']+)'", r"`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}\1`", content)
                # Case 2: double quotes
                content = re.sub(r'"http://127\.0\.0\.1:8000([^"]+)"', r"`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}\1`", content)
                # Case 3: backticks
                content = re.sub(r"`http://127\.0\.0\.1:8000([^`]+)`", r"`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}\1`", content)

                if content != original:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated {filepath}")
                    count += 1
    print(f"Total files updated: {count}")

if __name__ == '__main__':
    precise_update('frontend/app')
    precise_update('frontend/components')
