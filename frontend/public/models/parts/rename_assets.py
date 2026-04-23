import os

root_dir = './' 

def recursive_rename():
    print("Starting Deep Rename Process (GLB & FBX)...")
    items_found = 0
    
    for root, dirs, files in os.walk(root_dir):
        for filename in files:
            # Check for both GLB and FBX
            if filename.lower().endswith((".glb", ".fbx")):
                items_found += 1
                ext = os.path.splitext(filename)[1].lower()
                
                # 1. Clean the name
                clean_name = os.path.splitext(filename)[0].lower().replace(" ", "_").replace("-", "_")
                if not clean_name.startswith("part_"):
                    clean_name = "part_" + clean_name
                
                final_filename = clean_name + ext
                
                # 2. Rename the actual file
                old_path = os.path.join(root, filename)
                new_path = os.path.join(root, final_filename)
                os.rename(old_path, new_path)
                
                # 3. Format path for React
                relative_path = os.path.relpath(new_path, root_dir).replace("\\", "/")
                react_path = f"/models/parts/{relative_path}"
                
                # 4. Print for Catalog
                obj_id = clean_name
                display_name = clean_name.replace('part_', '').replace('_', ' ').title()
                
                # We add a 'format' key so React knows which loader to use
                print(f"{{ id: '{obj_id}', name: '{display_name}', glb_url: '{react_path}', type: 'part', format: '{ext[1:]}' }},")
    
    if items_found == 0:
        print("No files found. Check your folder path!")
    else:
        print(f"\nDone! Found {items_found} items.")

if __name__ == "__main__":
    recursive_rename()