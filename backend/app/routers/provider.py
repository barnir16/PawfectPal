from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import UserORM
from app.schemas import UserRead
from app.dependencies.db import get_db

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/{provider_id}", response_model=UserRead)
def get_provider_by_id(provider_id: int, db: Session = Depends(get_db)):
    provider = (
        db.query(UserORM).filter(UserORM.id == provider_id, UserORM.is_provider).first()
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Flatten provider fields
    user_data = UserRead.model_validate(provider).model_dump()
    if provider.provider_profile:
        try:
            # Safely get services
            services = []
            if provider.provider_profile.services:
                services = [service.name for service in provider.provider_profile.services]
            
            user_data.update(
                {
                    "provider_services": services,
                    "provider_bio": provider.provider_profile.bio,
                    "provider_hourly_rate": provider.provider_profile.hourly_rate,
                    "provider_rating": provider.provider_profile.rating,
                    "provider_rating_count": provider.provider_profile.rating_count or 0,
                }
            )
        except Exception as e:
            print(f"Error processing provider {provider.id}: {e}")
            # Add default values if there's an error
            user_data.update(
                {
                    "provider_services": [],
                    "provider_bio": None,
                    "provider_hourly_rate": None,
                    "provider_rating": None,
                    "provider_rating_count": 0,
                }
            )
    return user_data


@router.get("/", response_model=List[UserRead])
def get_providers(
    filter: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    print("🔍 DEBUG: Starting get_providers endpoint")
    print(f"🔍 DEBUG: Filter parameter: {filter}")
    
    try:
        print("🔍 DEBUG: Creating query...")
        query = db.query(UserORM).filter(UserORM.is_provider)
        print("🔍 DEBUG: Query created successfully")

        print("🔍 DEBUG: Executing query...")
        providers = query.all()
        print(f"🔍 DEBUG: Found {len(providers)} providers")
        
        if not providers:
            print("🔍 DEBUG: No providers found, returning empty list")
            return []

        print("🔍 DEBUG: Processing providers...")
        results = []
        for i, p in enumerate(providers):
            print(f"🔍 DEBUG: Processing provider {i+1}/{len(providers)}: ID={p.id}, Username={p.username}, IsProvider={p.is_provider}")
            
            try:
                print(f"🔍 DEBUG: Validating provider {p.id} with UserRead...")
                user_data = UserRead.model_validate(p).model_dump()
                print(f"🔍 DEBUG: Provider {p.id} validated successfully")
                
                # Check if provider has profile
                if hasattr(p, 'provider_profile') and p.provider_profile:
                    print(f"🔍 DEBUG: Provider {p.id} has provider_profile")
                    print(f"🔍 DEBUG: Provider {p.id} profile bio: {p.provider_profile.bio}")
                    print(f"🔍 DEBUG: Provider {p.id} profile rating: {p.provider_profile.rating}")
                    print(f"🔍 DEBUG: Provider {p.id} profile rating_count: {p.provider_profile.rating_count}")
                    
                    try:
                        # Safely get services
                        services = []
                        if hasattr(p.provider_profile, 'services') and p.provider_profile.services:
                            print(f"🔍 DEBUG: Provider {p.id} has services relationship")
                            services = [service.name for service in p.provider_profile.services]
                            print(f"🔍 DEBUG: Provider {p.id} services: {services}")
                        else:
                            print(f"🔍 DEBUG: Provider {p.id} has no services")
                        
                        user_data.update(
                            {
                                "provider_services": services,
                                "provider_bio": p.provider_profile.bio,
                                "provider_hourly_rate": p.provider_profile.hourly_rate,
                                "provider_rating": p.provider_profile.rating,
                                "provider_rating_count": p.provider_profile.rating_count or 0,
                            }
                        )
                        print(f"🔍 DEBUG: Provider {p.id} profile data added successfully")
                    except Exception as profile_error:
                        print(f"❌ DEBUG: Error processing provider {p.id} profile: {profile_error}")
                        print(f"❌ DEBUG: Profile error type: {type(profile_error)}")
                        # Add default values if there's an error
                        user_data.update(
                            {
                                "provider_services": [],
                                "provider_bio": None,
                                "provider_hourly_rate": None,
                                "provider_rating": None,
                                "provider_rating_count": 0,
                            }
                        )
                else:
                    print(f"🔍 DEBUG: Provider {p.id} has no provider_profile")
                
                results.append(user_data)
                print(f"🔍 DEBUG: Provider {p.id} added to results successfully")
                
            except Exception as e:
                print(f"❌ DEBUG: Error processing provider {p.id}: {e}")
                print(f"❌ DEBUG: Error type: {type(e)}")
                print(f"❌ DEBUG: Error details: {str(e)}")
                continue
        
        print(f"🔍 DEBUG: Returning {len(results)} providers")
        print(f"🔍 DEBUG: Results: {results}")
        return results
        
    except Exception as e:
        print(f"❌ DEBUG: Critical error in get_providers: {e}")
        print(f"❌ DEBUG: Error type: {type(e)}")
        print(f"❌ DEBUG: Error details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
