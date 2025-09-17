#!/usr/bin/env python3
"""
Generate corrected fake service providers with proper gender matching
"""

import json
import random

# Service types matching backend enum
SERVICE_TYPES = ['walking', 'sitting', 'boarding', 'grooming', 'veterinary']

# Corrected names with proper gender matching
MALE_NAMES = [
    "דוד כהן", "יוסי ישראלי", "אבי רוזן", "דני כץ", "אלון דוד",
    "יונתן כהן", "אוריאל אברהם"
]

FEMALE_NAMES = [
    "שרה לוי", "מיכל אברהם", "רחל גולדברג", "מיכל שטרן", "נועה ברק",
    "מיכל זוהר", "שירה לוי", "מיכל ישראלי"
]

# Male profile images
MALE_IMAGES = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face"
]

# Female profile images
FEMALE_IMAGES = [
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
]

# Service-specific bios in Hebrew
SERVICE_BIOS = {
    'walking': [
        "מקצועי בהליכות כלבים, מתמחה בכלבים גדולים וקטנים. זמין בבוקר ובערב.",
        "מטפל מנוסה בהליכות כלבים עם 5+ שנות ניסיון. אוהב בעלי חיים ומבין את הצרכים שלהם.",
        "מטפלת מסורה עם ניסיון רב בהליכות כלבים. מבטיחה פעילות גופנית מספקת לכלב שלך."
    ],
    'sitting': [
        "מטפלת מקצועית בשמירה על חיות מחמד. ניסיון עם כלבים, חתולים ובעלי חיים אחרים.",
        "מטפלת מסורה עם 3+ שנות ניסיון. מבטיחה טיפול אוהב ומקצועי לחיית המחמד שלך.",
        "מטפלת מנוסה בשמירה על חיות מחמד. זמינה 24/7 לטיפול בחיות מחמד."
    ],
    'boarding': [
        "מפעיל פנסיון מקצועי עם מתקנים מודרניים. ניסיון של 7+ שנים בטיפול בחיות מחמד.",
        "פנסיון ביתי חם ומסור. מבטיח טיפול אישי ונוח לכל חיית מחמד.",
        "מפעיל פנסיון מנוסה עם צוות מקצועי. מתמחה בכלבים וחתולים."
    ],
    'grooming': [
        "מטפלת מקצועית בטיפוח חיות מחמד עם 6+ שנות ניסיון. מתמחה בכל הגזעים.",
        "מטפלת מנוסה בטיפוח כלבים וחתולים. מבטיחה טיפול עדין ומקצועי.",
        "מטפלת מקצועית בטיפוח עם ציוד מודרני. ניסיון עם כל סוגי הפרווה."
    ],
    'veterinary': [
        "וטרינר מנוסה עם 10+ שנות ניסיון. מתמחה ברפואה פנימית וניתוחים.",
        "דוקטור וטרינר מקצועי עם ניסיון רב. מבטיח טיפול רפואי מעולה.",
        "וטרינר מנוסה עם התמחות בבעלי חיים קטנים. זמין לטיפולים דחופים."
    ]
}

def generate_corrected_provider(provider_id: int, service_type: str, is_male: bool) -> dict:
    """Generate a single corrected provider with proper gender matching"""
    
    if is_male:
        hebrew_name = random.choice(MALE_NAMES)
        profile_image = random.choice(MALE_IMAGES)
    else:
        hebrew_name = random.choice(FEMALE_NAMES)
        profile_image = random.choice(FEMALE_IMAGES)
    
    # Generate English name (simplified)
    english_name = hebrew_name.replace(' ', '_').lower()
    
    # Generate service-specific data
    bio_options = SERVICE_BIOS[service_type]
    bio = random.choice(bio_options)
    
    # Generate realistic pricing based on service type
    base_prices = {
        'walking': (30, 60),
        'sitting': (50, 100),
        'boarding': (80, 150),
        'grooming': (100, 200),
        'veterinary': (200, 500)
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
        "username": f"{english_name}_{provider_id}",
        "full_name": hebrew_name,
        "email": f"{english_name}@example.com",
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
        "location": {
            "latitude": round(random.uniform(31.0, 33.0), 6),
            "longitude": round(random.uniform(34.0, 35.5), 6)
        },
        "distance_km": round(random.uniform(0.5, 15.0), 1),
        "is_available": random.choice([True, True, True, False]),
        "languages": random.choice([["עברית"], ["עברית", "אנגלית"], ["עברית", "אנגלית", "רוסית"]]),
        "experience_years": experience_years,
        "response_time_minutes": response_time_minutes,
        "completed_bookings": completed_bookings,
        "last_online": "2024-01-15T10:30:00Z",
        "verified": random.choice([True, True, True, False]),
        "reviews_count": random.randint(5, 50),
        "average_rating": rating
    }

def generate_all_corrected_providers() -> list:
    """Generate 3 providers for each service type with proper gender matching"""
    providers = []
    provider_id = 1
    
    for service_type in SERVICE_TYPES:
        for i in range(3):
            # Alternate between male and female for each service type
            is_male = i % 2 == 0
            provider = generate_corrected_provider(provider_id, service_type, is_male)
            providers.append(provider)
            provider_id += 1
    
    return providers

def main():
    """Generate and save corrected fake providers data"""
    print("🐾 Generating corrected fake service providers...")
    
    providers = generate_all_corrected_providers()
    
    # Save to JSON file
    with open('corrected_fake_providers.json', 'w', encoding='utf-8') as f:
        json.dump(providers, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Generated {len(providers)} corrected providers")
    print("📁 Saved to: corrected_fake_providers.json")
    
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

if __name__ == "__main__":
    main()
