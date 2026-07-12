"""
Firebase Admin Service for Push Notifications
Handles sending push notifications via Firebase Cloud Messaging
"""
import os
import json
import time
from typing import Optional, Dict, Any
from firebase_admin import initialize_app, messaging, credentials
from firebase_admin.exceptions import FirebaseError
import logging

logger = logging.getLogger(__name__)

class FirebaseAdminService:
    """Firebase Admin service for sending push notifications"""
    
    def __init__(self):
        self.app = None
        self.is_initialized = False
        
    def initialize(self) -> bool:
        """Initialize Firebase Admin SDK from backend environment variables."""
        if self.is_initialized:
            return True
            
        try:
            firebase_credentials = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            
            if not firebase_credentials:
                logger.warning("FIREBASE_SERVICE_ACCOUNT_JSON is not configured, push notifications disabled")
                return False
                
            # Parse credentials
            try:
                cred_dict = json.loads(firebase_credentials)
                cred = credentials.Certificate(cred_dict)
            except json.JSONDecodeError:
                logger.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON format")
                return False
                
            # Initialize Firebase Admin
            self.app = initialize_app(cred, name='pawfectpal-messaging')
            self.is_initialized = True
            
            logger.info("Firebase Admin SDK initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
            return False
            
    def send_chat_notification(
        self,
        fcm_token: str,
        service_request_id: int,
        sender_username: str,
        message_preview: str,
        notification_type: str = "new_message"
    ) -> bool:
        """Send a chat notification to a specific user"""
        
        if not self.is_initialized:
            logger.warning("Firebase Admin not initialized")
            return False
            
        try:
            # Create notification payload
            notification = messaging.Notification(
                title=f"New message from {sender_username}",
                body=message_preview[:100] + "..." if len(message_preview) > 100 else message_preview
            )
            
            # Create data payload
            data = {
                'type': notification_type,
                'service_request_id': str(service_request_id),
                'sender_username': sender_username,
                'message_preview': message_preview,
                'timestamp': str(int(time.time()))
            }
            
            # Create message
            message = messaging.Message(
                notification=notification,
                data=data,
                token=fcm_token,
                android=messaging.AndroidConfig(
                    notification=messaging.AndroidNotification(
                        icon='ic_notification',
                        color='#FF6B6B',
                        sound='default',
                        channel_id='chat_messages'
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default',
                            badge=1
                        )
                    )
                )
            )
            
            # Send message
            response = messaging.send(message)
            logger.info(f"Push notification sent successfully: {response}")
            return True
            
        except FirebaseError as e:
            logger.error(f"Firebase error sending notification: {e}")
            return False
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
            return False
            
    def send_multicast_notification(
        self,
        fcm_tokens: list[str],
        service_request_id: int,
        sender_username: str,
        message_preview: str,
        notification_type: str = "new_message"
    ) -> Dict[str, Any]:
        """Send notification to multiple users"""
        
        if not self.is_initialized:
            logger.warning("Firebase Admin not initialized")
            return {"success": False, "error": "Not initialized"}
            
        try:
            # Create notification payload
            notification = messaging.Notification(
                title=f"New message from {sender_username}",
                body=message_preview[:100] + "..." if len(message_preview) > 100 else message_preview
            )
            
            # Create data payload
            data = {
                'type': notification_type,
                'service_request_id': str(service_request_id),
                'sender_username': sender_username,
                'message_preview': message_preview,
                'timestamp': str(int(time.time()))
            }
            
            # Create multicast message
            message = messaging.MulticastMessage(
                notification=notification,
                data=data,
                tokens=fcm_tokens,
                android=messaging.AndroidConfig(
                    notification=messaging.AndroidNotification(
                        icon='ic_notification',
                        color='#FF6B6B',
                        sound='default',
                        channel_id='chat_messages'
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default',
                            badge=1
                        )
                    )
                )
            )
            
            # Send multicast message
            response = messaging.send_multicast(message)
            
            result = {
                "success": True,
                "success_count": response.success_count,
                "failure_count": response.failure_count,
                "responses": []
            }
            
            # Process individual responses
            for i, resp in enumerate(response.responses):
                if resp.success:
                    result["responses"].append({
                        "token": fcm_tokens[i],
                        "success": True,
                        "message_id": resp.message_id
                    })
                else:
                    result["responses"].append({
                        "token": fcm_tokens[i],
                        "success": False,
                        "error": resp.exception.code if resp.exception else "Unknown error"
                    })
                    
            logger.info(f"Multicast notification sent: {result['success_count']} success, {result['failure_count']} failures")
            return result
            
        except FirebaseError as e:
            logger.error(f"Firebase error sending multicast notification: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Error sending multicast notification: {e}")
            return {"success": False, "error": str(e)}

# Global instance
firebase_admin_service = FirebaseAdminService()

# Initialize on import
firebase_admin_service.initialize()
