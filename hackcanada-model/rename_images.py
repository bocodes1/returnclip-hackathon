#!/usr/bin/env python3
"""
Auto-rename script for sofa images.
Renames all images in data/raw/{CLEAN,LIGHT_DAMAGE,HEAVY_DAMAGE}/ folders
to format: [CLASS]_[SOURCE]_[DATE]_[DAMAGE]_[NUM].jpg
"""

import os
from pathlib import Path
from datetime import datetime

# Image extensions to look for
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}

def rename_images_in_folder(folder_path, class_name):
    """Rename all images in a folder to standard format."""
    folder = Path(folder_path)
    
    if not folder.exists():
        print(f"❌ Folder not found: {folder_path}")
        return 0
    
    # Get today's date in YYYYMMDD format
    today = datetime.now().strftime('%Y%m%d')
    
    # Find all image files
    image_files = []
    for ext in IMAGE_EXTENSIONS:
        image_files.extend(folder.glob(f'*{ext}'))
        image_files.extend(folder.glob(f'*{ext.upper()}'))
    
    # Remove duplicates
    image_files = list(set(image_files))
    image_files.sort()
    
    if not image_files:
        print(f"⚠️  No images found in {class_name} folder")
        return 0
    
    # Rename each image
    damage_type = "none" if class_name == "CLEAN" else "damage"
    renamed_count = 0
    
    for idx, image_path in enumerate(image_files, 1):
        # Skip if already has correct naming pattern
        if image_path.stem.count('_') >= 4:
            print(f"⏭️  Already formatted: {image_path.name}")
            continue
        
        # Create new filename
        new_name = f"{class_name}_web_{today}_{damage_type}_{idx:03d}{image_path.suffix.lower()}"
        new_path = image_path.parent / new_name
        
        # Handle naming conflicts
        counter = 1
        while new_path.exists() and new_path != image_path:
            new_name = f"{class_name}_web_{today}_{damage_type}_{idx:03d}_v{counter}{image_path.suffix.lower()}"
            new_path = image_path.parent / new_name
            counter += 1
        
        # Rename file
        try:
            image_path.rename(new_path)
            print(f"✅ {image_path.name} → {new_name}")
            renamed_count += 1
        except Exception as e:
            print(f"❌ Error renaming {image_path.name}: {e}")
    
    return renamed_count

def main():
    """Main function."""
    root_path = Path("data/raw")
    
    if not root_path.exists():
        print("❌ data/raw folder not found!")
        return
    
    print("🔄 Starting image rename process...\n")
    
    total_renamed = 0
    
    # Process each class folder
    for class_name in ["CLEAN", "LIGHT_DAMAGE", "HEAVY_DAMAGE"]:
        folder_path = root_path / class_name
        print(f"\n📁 Processing {class_name} folder:")
        renamed = rename_images_in_folder(folder_path, class_name)
        total_renamed += renamed
        print(f"   → Renamed {renamed} images")
    
    print(f"\n✅ Complete! Total renamed: {total_renamed} images")
    print("\n📝 Naming format: [CLASS]_web_YYYYMMDD_[damage_type]_[NUM].jpg")
    print("   Examples:")
    print("   - CLEAN_web_20250307_none_001.jpg")
    print("   - LIGHT_DAMAGE_web_20250307_damage_001.jpg")
    print("   - HEAVY_DAMAGE_web_20250307_damage_001.jpg")

if __name__ == "__main__":
    main()
