#!/usr/bin/env python3
"""
Generate fake service providers for PawfectPal demo
Creates realistic provider data with names, images, and service types
"""

import json
import random
from typing import List, Dict, Any

# Service types matching backend enum
SERVICE_TYPES = ['walking', 'sitting', 'boarding', 'grooming', 'veterinary']

# Hebrew and English names for realistic providers
HEBREW_NAMES = [
    "דוד כהן", "שרה לוי", "מיכל אברהם", "יוסי ישראלי", "רחל גולדברג",
    "אבי רוזן", "מיכל שטרן", "דני כץ", "נועה ברק", "אלון דוד",
    "מיכל זוהר", "יונתן כהן", "שירה לוי", "אוריאל אברהם", "מיכל ישראלי"
]

ENGLISH_NAMES = [
    "David Cohen", "Sarah Levy", "Michal Abraham", "Yossi Israeli", "Rachel Goldberg",
    "Avi Rosen", "Michal Stern", "Danny Katz", "Noa Barak", "Alon David",
    "Michal Zohar", "Yonatan Cohen", "Shira Levy", "Uriel Abraham", "Michal Israeli"
]

# Realistic profile images from Unsplash (free to use)
PROFILE_IMAGES = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
]

# Service-specific bios in Hebrew and English
SERVICE_BIOS = {
    'walking': {
        'he': [
            "מטפל מנוסה בהליכות כלבים עם 5+ שנות ניסיון. אוהב בעלי חיים ומבין את הצרכים שלהם.",
            "מקצועי בהליכות כלבים, מתמחה בכלבים גדולים וקטנים. זמין בבוקר ובערב.",
            "מטפל מסור עם ניסיון רב בהליכות כלבים. מבטיח פעילות גופנית מספקת לכלב שלך."
        ],
        'en': [
            "Experienced dog walker with 5+ years of experience. Loves animals and understands their needs.",
            "Professional dog walker, specializes in both large and small dogs. Available mornings and evenings.",
            "Dedicated caregiver with extensive dog walking experience. Ensures your dog gets proper exercise."
        ]
    },
    'sitting': {
        'he': [
            "מטפלת מקצועית בשמירה על חיות מחמד. ניסיון עם כלבים, חתולים ובעלי חיים אחרים.",
            "מטפלת מסורה עם 3+ שנות ניסיון. מבטיחה טיפול אוהב ומקצועי לחיית המחמד שלך.",
            "מטפלת מנוסה בשמירה על חיות מחמד. זמינה 24/7 לטיפול בחיות מחמד."
        ],
        'en': [
            "Professional pet sitter with experience caring for dogs, cats, and other animals.",
            "Dedicated caregiver with 3+ years of experience. Ensures loving and professional care for your pet.",
            "Experienced pet sitter. Available 24/7 for pet care services."
        ]
    },
    'boarding': {
        'he': [
            "מפעיל פנסיון מקצועי עם מתקנים מודרניים. ניסיון של 7+ שנים בטיפול בחיות מחמד.",
            "פנסיון ביתי חם ומסור. מבטיח טיפול אישי ונוח לכל חיית מחמד.",
            "מפעיל פנסיון מנוסה עם צוות מקצועי. מתמחה בכלבים וחתולים."
        ],
        'en': [
            "Professional boarding facility operator with modern facilities. 7+ years of pet care experience.",
            "Warm and dedicated home boarding. Ensures personal and comfortable care for every pet.",
            "Experienced boarding operator with professional staff. Specializes in dogs and cats."
        ]
    },
    'grooming': {
        'he': [
            "מטפלת מקצועית בטיפוח חיות מחמד עם 6+ שנות ניסיון. מתמחה בכל הגזעים.",
            "מטפלת מנוסה בטיפוח כלבים וחתולים. מבטיחה טיפול עדין ומקצועי.",
            "מטפלת מקצועית בטיפוח עם ציוד מודרני. ניסיון עם כל סוגי הפרווה."
        ],
        'en': [
            "Professional pet groomer with 6+ years of experience. Specializes in all breeds.",
            "Experienced groomer for dogs and cats. Ensures gentle and professional care.",
            "Professional groomer with modern equipment. Experience with all coat types."
        ]
    },
    'veterinary': {
        'he': [
            "וטרינר מנוסה עם 10+ שנות ניסיון. מתמחה ברפואה פנימית וניתוחים.",
            "דוקטור וטרינר מקצועי עם ניסיון רב. מבטיח טיפול רפואי מעולה.",
            "וטרינר מנוסה עם התמחות בבעלי חיים קטנים. זמין לטיפולים דחופים."
        ],
        'en': [
            "Experienced veterinarian with 10+ years of experience. Specializes in internal medicine and surgery.",
            "Professional veterinarian doctor with extensive experience. Ensures excellent medical care.",
            "Experienced veterinarian specializing in small animals. Available for emergency treatments."
        ]
    }
}

def generate_provider(provider_id: int, service_type: str, name_index: int) -> Dict[str, Any]:
    """Generate a single fake provider"""
    hebrew_name = HEBREW_NAMES[name_index]
    english_name = ENGLISH_NAMES[name_index]
    profile_image = PROFILE_IMAGES[name_index % len(PROFILE_IMAGES)]
    
    # Generate service-specific data
    bio_options = SERVICE_BIOS[service_type]['he']
    bio = random.choice(bio_options)
    
    # Generate realistic pricing based on service type
    base_prices = {
        'walking': (30, 60),      # 30-60 NIS per hour
        'sitting': (50, 100),     # 50-100 NIS per hour
        'boarding': (80, 150),    # 80-150 NIS per day
        'grooming': (100, 200),   # 100-200 NIS per session
        'veterinary': (200, 500)  # 200-500 NIS per consultation
    }
    
    min_price, max_price = base_prices[service_type]
    hourly_rate = random.randint(min_price, max_price)
    
    # Generate rating (4.0-5.0 for good providers)
    rating = round(random.uniform(4.0, 5.0), 1)
    
    # Generate experience years (1-10 years)
    experience_years = random.randint(1, 10)
    
    # Generate completed bookings
    completed_bookings = random.randint(10, 200)
    
    # Generate response time (5-60 minutes)
    response_time_minutes = random.randint(5, 60)
    
    # Generate location (Israeli cities)
    cities = ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'אשדוד', 'פתח תקווה', 'נתניה', 'ראשון לציון']
    city = random.choice(cities)
    
    return {
        "id": provider_id,
        "username": f"{english_name.lower().replace(' ', '_')}_{provider_id}",
        "full_name": hebrew_name,
        "email": f"{english_name.lower().replace(' ', '.')}@example.com",
        "phone": f"05{random.randint(10000000, 99999999)}",
        "profile_image": profile_image,
        "is_provider": True,
        "provider_services": [service_type],
        "provider_rating": rating,
        "provider_bio": bio,
        "provider_hourly_rate": hourly_rate,
        "address": f"רחוב {random.choice(['הרצל', 'בן גוריון', 'רוטשילד', 'דיזנגוף'])} {random.randint(1, 200)}, {city}",
        "city": city,
        "state": "ישראל",
        "country": "ישראל",
        "postal_code": f"{random.randint(10000, 99999)}",
        # Additional fields for frontend
        "location": {
            "latitude": round(random.uniform(31.0, 33.0), 6),
            "longitude": round(random.uniform(34.0, 35.5), 6)
        },
        "distance_km": round(random.uniform(0.5, 15.0), 1),
        "is_available": random.choice([True, True, True, False]),  # 75% available
        "languages": random.choice([["עברית"], ["עברית", "אנגלית"], ["עברית", "אנגלית", "רוסית"]]),
        "experience_years": experience_years,
        "response_time_minutes": response_time_minutes,
        "completed_bookings": completed_bookings,
        "last_online": "2024-01-15T10:30:00Z",
        "verified": random.choice([True, True, True, False]),  # 75% verified
        "reviews_count": random.randint(5, 50),
        "average_rating": rating
    }

def generate_all_providers() -> List[Dict[str, Any]]:
    """Generate 3 providers for each service type (15 total)"""
    providers = []
    provider_id = 1
    
    for service_type in SERVICE_TYPES:
        for i in range(3):  # 3 providers per service type
            name_index = (provider_id - 1) % len(HEBREW_NAMES)
            provider = generate_provider(provider_id, service_type, name_index)
            providers.append(provider)
            provider_id += 1
    
    return providers

def main():
    """Generate and save fake providers data"""
    print("🐾 Generating fake service providers for PawfectPal demo...")
    
    providers = generate_all_providers()
    
    # Save to JSON file
    with open('fake_providers.json', 'w', encoding='utf-8') as f:
        json.dump(providers, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Generated {len(providers)} fake providers")
    print("📁 Saved to: fake_providers.json")
    
    # Print summary
    print("\n📊 Summary by service type:")
    for service_type in SERVICE_TYPES:
        count = len([p for p in providers if service_type in p['provider_services']])
        print(f"  {service_type}: {count} providers")
    
    print("\n🎯 Sample provider:")
    sample = providers[0]
    print(f"  Name: {sample['full_name']}")
    print(f"  Service: {sample['provider_services'][0]}")
    print(f"  Rating: {sample['provider_rating']}/5.0")
    print(f"  Hourly Rate: ₪{sample['provider_hourly_rate']}")
    print(f"  Bio: {sample['provider_bio'][:50]}...")

if __name__ == "__main__":
    main()
