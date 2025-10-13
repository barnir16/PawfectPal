from sqlalchemy.orm import Session
from app.models.provider_profile import ProviderProfileORM
from app.models.service_type import ServiceTypeORM
from app.models.marketplace_post import MarketplacePostORM
from typing import List, Optional

class ServiceMatchingService:
    """Service for validating service matching between users and providers"""
    
    @staticmethod
    def validate_service_request(
        db: Session, 
        user_id: int, 
        provider_id: int, 
        service_type: str
    ) -> bool:
        """
        Validate that a provider offers the requested service type
        
        Args:
            db: Database session
            user_id: ID of the user making the request
            provider_id: ID of the provider being requested
            service_type: Type of service being requested
            
        Returns:
            bool: True if the provider offers this service type
        """
        
        # Get provider profile
        provider = db.query(ProviderProfileORM).filter(
            ProviderProfileORM.id == provider_id
        ).first()
        
        if not provider:
            return False
        
        # Check if provider offers this service type
        service_type_obj = db.query(ServiceTypeORM).filter(
            ServiceTypeORM.name == service_type
        ).first()
        
        if not service_type_obj:
            return False
        
        # Check if provider has this service type in their services
        provider_services = [service.name for service in provider.services]
        
        return service_type in provider_services
    
    @staticmethod
    def get_providers_for_service(
        db: Session, 
        service_type: str,
        location: Optional[str] = None,
        is_available: bool = True
    ) -> List[ProviderProfileORM]:
        """
        Get all providers that offer a specific service type
        
        Args:
            db: Database session
            service_type: Type of service to find providers for
            location: Optional location filter
            is_available: Filter by availability
            
        Returns:
            List of provider profiles that offer the service
        """
        
        # Get service type
        service_type_obj = db.query(ServiceTypeORM).filter(
            ServiceTypeORM.name == service_type
        ).first()
        
        if not service_type_obj:
            return []
        
        # Query providers that offer this service
        query = db.query(ProviderProfileORM).join(
            ProviderProfileORM.services
        ).filter(
            ServiceTypeORM.id == service_type_obj.id
        )
        
        if is_available:
            query = query.filter(ProviderProfileORM.is_available == True)
        
        # Note: Location filtering would require geospatial queries
        # For now, we'll skip location-based filtering
        
        return query.all()
    
    @staticmethod
    def get_available_services_for_provider(
        db: Session, 
        provider_id: int
    ) -> List[str]:
        """
        Get all service types that a provider offers
        
        Args:
            db: Database session
            provider_id: ID of the provider
            
        Returns:
            List of service type names
        """
        
        provider = db.query(ProviderProfileORM).filter(
            ProviderProfileORM.id == provider_id
        ).first()
        
        if not provider:
            return []
        
        return [service.name for service in provider.services]
    
    @staticmethod
    def validate_marketplace_post_service(
        db: Session, 
        service_type: str
    ) -> bool:
        """
        Validate that a service type exists in the system
        
        Args:
            db: Database session
            service_type: Type of service to validate
            
        Returns:
            bool: True if the service type exists
        """
        
        service_type_obj = db.query(ServiceTypeORM).filter(
            ServiceTypeORM.name == service_type
        ).first()
        
        return service_type_obj is not None
    
    @staticmethod
    def get_service_type_suggestions(
        db: Session, 
        query: str
    ) -> List[str]:
        """
        Get service type suggestions based on a search query
        
        Args:
            db: Database session
            query: Search query string
            
        Returns:
            List of matching service type names
        """
        
        service_types = db.query(ServiceTypeORM).filter(
            ServiceTypeORM.name.ilike(f"%{query}%")
        ).limit(10).all()
        
        return [service.name for service in service_types]
