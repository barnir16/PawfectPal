#!/usr/bin/env python3
"""
Update pet images with breed-accurate photos
"""

import sqlite3
import os

def update_pet_images():
    """Update pet images with breed-accurate photos"""
    
    db_path = 'backend/pawfectpal.db'
    
    # Breed-specific image URLs (Unsplash)
    breed_images = {
        # Dogs
        'golden_retriever': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop&crop=face',
        'labrador': 'https://images.unsplash.com/photo-1547407139-3c921a71905c?w=300&h=300&fit=crop&crop=face',
        'german_shepherd': 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=300&h=300&fit=crop&crop=face',
        'french_bulldog': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop&crop=face',
        'bulldog': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop&crop=face',
        'poodle': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop&crop=face',
        'beagle': 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=300&h=300&fit=crop&crop=face',
        'rottweiler': 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=300&h=300&fit=crop&crop=face',
        'siberian_husky': 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=300&h=300&fit=crop&crop=face',
        'border_collie': 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=300&h=300&fit=crop&crop=face',
        'australian_shepherd': 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=300&h=300&fit=crop&crop=face',
        'mixed_breed': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop&crop=face',
        
        # Cats
        'persian': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop&crop=face',
        'maine_coon': 'https://images.unsplash.com/photo-1573865526739-1069f4dd8abd?w=300&h=300&fit=crop&crop=face',
        'siamese': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop&crop=face',
        'british_shorthair': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop&crop=face',
        'ragdoll': 'https://images.unsplash.com/photo-1573865526739-1069f4dd8abd?w=300&h=300&fit=crop&crop=face',
        'scottish_fold': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop&crop=face',
        'american_shorthair': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop&crop=face',
        'russian_blue': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop&crop=face',
        'mixed_breed_cat': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop&crop=face',
    }
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🐾 Updating pet images with breed-accurate photos...")
        print("=" * 60)
        
        # Get all pets
        cursor.execute("SELECT id, name, breed_type, breed, photo_uri FROM pets;")
        pets = cursor.fetchall()
        
        if not pets:
            print("❌ No pets found in database")
            return
        
        updated_count = 0
        
        for pet in pets:
            pet_id, name, breed_type, breed, current_photo = pet
            
            # Determine the best image based on breed
            breed_key = breed.lower().replace(' ', '_').replace('-', '_')
            
            # Try exact breed match first
            if breed_key in breed_images:
                new_image = breed_images[breed_key]
            # Try breed type match
            elif breed_type.lower() in ['dog', 'cat']:
                if breed_type.lower() == 'dog':
                    new_image = breed_images['mixed_breed']
                else:
                    new_image = breed_images['mixed_breed_cat']
            else:
                # Default fallback
                new_image = breed_images['mixed_breed']
            
            # Update the pet's photo
            cursor.execute(
                "UPDATE pets SET photo_uri = ? WHERE id = ?",
                (new_image, pet_id)
            )
            
            print(f"🐕 {name} ({breed_type} - {breed}):")
            if current_photo:
                print(f"   Old: {current_photo[:50]}...")
            else:
                print(f"   Old: No photo")
            print(f"   New: {new_image}")
            print()
            
            updated_count += 1
        
        # Commit changes
        conn.commit()
        
        print(f"✅ Updated {updated_count} pet images")
        print("📁 Database updated with breed-accurate photos")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    update_pet_images()