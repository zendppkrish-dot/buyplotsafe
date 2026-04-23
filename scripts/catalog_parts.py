import os
import json

def catalog_fbx():
    base_dir = r'c:\Users\SANDHEEP\.antigravity\buyplotsafe\frontend\public\assets\house_parts'
    catalog = []
    
    if not os.path.exists(base_dir):
        print(f"Directory not found: {base_dir}")
        return

    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith('.fbx'):
                # Calculate relative path from public folder for the frontend to use
                full_path = os.path.join(root, file)
                rel_to_public = os.path.relpath(full_path, r'c:\Users\SANDHEEP\.antigravity\buyplotsafe\frontend\public')
                
                # Use the filename (without extension) as label
                label = os.path.splitext(file)[0].replace('_', ' ').title()
                
                catalog.append({
                    "id": file.replace('.', '_'),
                    "label": label,
                    "path": rel_to_public.replace('\\', '/')
                })

    output_path = r'c:\Users\SANDHEEP\.antigravity\buyplotsafe\frontend\src\assets_catalog.json'
    with open(output_path, 'w') as f:
        json.dump(catalog, f, indent=4)
    
    print(f"Catalog generated with {len(catalog)} parts at {output_path}")

if __name__ == "__main__":
    catalog_fbx()
