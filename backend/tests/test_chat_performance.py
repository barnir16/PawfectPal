"""
Performance Tests for Large Conversations
Tests performance with large message volumes and concurrent users
"""
import pytest
import asyncio
import time
import json
from unittest.mock import Mock, patch
from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.main import app
from app.models import UserORM, ChatMessageORM, ServiceRequestORM
from app.routers.chat import send_message, get_conversation, _get_conversation_data
from app.websocket.connection_manager import manager
from app.schemas.chat_message import ChatMessageCreate

client = TestClient(app)

@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)

@pytest.fixture
def mock_user():
    """Mock user for testing"""
    user = Mock(spec=UserORM)
    user.id = 1
    user.username = "testuser"
    user.is_provider = False
    return user

@pytest.fixture
def mock_service_request():
    """Mock service request for testing"""
    sr = Mock(spec=ServiceRequestORM)
    sr.id = 1
    sr.user_id = 1
    sr.assigned_provider_id = 2
    sr.status = "in_progress"
    sr.responses_count = 0
    return sr

class TestLargeConversationPerformance:
    """Test performance with large conversations"""
    
    def test_large_message_count_performance(self, mock_db, mock_user, mock_service_request):
        """Test performance with large message count"""
        # Test with different message counts
        message_counts = [100, 1000, 10000, 50000]
        
        for count in message_counts:
            # Create mock messages
            messages = []
            for i in range(min(50, count)):  # Only load one page
                message = Mock(spec=ChatMessageORM)
                message.id = i + 1
                message.service_request_id = 1
                message.sender_id = 1
                message.message = f"Message {i + 1}"
                message.message_type = "text"
                message.delivery_status = "sent"
                message.is_read = False
                message.created_at = datetime.now(timezone.utc)
                message.read_at = None
                message.delivered_at = None
                messages.append(message)
            
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
            mock_db.query.return_value.filter.return_value.count.return_value = count
            mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages
            mock_db.commit = Mock()
            
            # Measure performance
            start_time = time.time()
            conversation = _get_conversation_data(1, mock_db, mock_user, limit=50, offset=0)
            end_time = time.time()
            
            # Verify results
            assert isinstance(conversation, ChatConversation)
            assert len(conversation.messages) == min(50, count)
            assert conversation.total_messages == count
            
            # Performance should be reasonable
            execution_time = end_time - start_time
            assert execution_time < 1.0, f"Performance test failed for {count} messages: {execution_time}s"
            
            print(f"✅ {count} messages: {execution_time:.3f}s")
    
    def test_pagination_performance(self, mock_db, mock_user, mock_service_request):
        """Test pagination performance with large datasets"""
        total_messages = 100000
        page_size = 50
        
        # Test different page offsets
        offsets = [0, 1000, 10000, 50000, 99950]
        
        for offset in offsets:
            # Create mock messages for this page
            messages = []
            for i in range(page_size):
                message = Mock(spec=ChatMessageORM)
                message.id = offset + i + 1
                message.service_request_id = 1
                message.sender_id = 1
                message.message = f"Message {offset + i + 1}"
                message.message_type = "text"
                message.delivery_status = "sent"
                message.is_read = False
                message.created_at = datetime.now(timezone.utc)
                message.read_at = None
                message.delivered_at = None
                messages.append(message)
            
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
            mock_db.query.return_value.filter.return_value.count.return_value = total_messages
            mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages
            mock_db.commit = Mock()
            
            # Measure performance
            start_time = time.time()
            conversation = _get_conversation_data(1, mock_db, mock_user, limit=page_size, offset=offset)
            end_time = time.time()
            
            # Verify results
            assert isinstance(conversation, ChatConversation)
            assert len(conversation.messages) == page_size
            assert conversation.total_messages == total_messages
            assert conversation.current_offset == offset
            
            # Performance should be consistent regardless of offset
            execution_time = end_time - start_time
            assert execution_time < 0.5, f"Pagination performance test failed for offset {offset}: {execution_time}s"
            
            print(f"✅ Offset {offset}: {execution_time:.3f}s")
    
    def test_message_search_performance(self, mock_db, mock_user, mock_service_request):
        """Test message search performance"""
        # Create messages with different content
        messages = []
        search_terms = ["urgent", "important", "schedule", "meeting", "payment"]
        
        for i in range(1000):
            message = Mock(spec=ChatMessageORM)
            message.id = i + 1
            message.service_request_id = 1
            message.sender_id = 1
            message.message = f"Message {i + 1} with {search_terms[i % len(search_terms)]} content"
            message.message_type = "text"
            message.delivery_status = "sent"
            message.is_read = False
            message.created_at = datetime.now(timezone.utc)
            message.read_at = None
            message.delivered_at = None
            messages.append(message)
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        mock_db.query.return_value.filter.return_value.count.return_value = 1000
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages
        mock_db.commit = Mock()
        
        # Test search performance
        search_terms_to_test = ["urgent", "important", "schedule"]
        
        for term in search_terms_to_test:
            start_time = time.time()
            conversation = _get_conversation_data(1, mock_db, mock_user, limit=50, offset=0)
            end_time = time.time()
            
            # Filter messages containing search term
            filtered_messages = [msg for msg in conversation.messages if term in msg.message]
            
            execution_time = end_time - start_time
            assert execution_time < 0.5, f"Search performance test failed for term '{term}': {execution_time}s"
            
            print(f"✅ Search '{term}': {execution_time:.3f}s, found {len(filtered_messages)} messages")

class TestConcurrentUserPerformance:
    """Test performance with concurrent users"""
    
    @pytest.mark.asyncio
    async def test_concurrent_message_sending(self, mock_db, mock_user, mock_service_request):
        """Test concurrent message sending performance"""
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Create multiple users
        users = []
        for i in range(10):
            user = Mock(spec=UserORM)
            user.id = i + 1
            user.username = f"user{i + 1}"
            user.is_provider = False
            users.append(user)
        
        # Test concurrent message sending
        async def send_message_async(user, message_text):
            message_data = ChatMessageCreate(
                service_request_id=1,
                message=message_text,
                message_type="text"
            )
            return await send_message(message_data, mock_db, user)
        
        # Send messages concurrently
        start_time = time.time()
        tasks = []
        for i, user in enumerate(users):
            task = send_message_async(user, f"Concurrent message {i + 1}")
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        end_time = time.time()
        
        # Verify results
        assert len(results) == 10
        for i, result in enumerate(results):
            assert result.message == f"Concurrent message {i + 1}"
        
        # Performance should be reasonable
        execution_time = end_time - start_time
        assert execution_time < 2.0, f"Concurrent sending test failed: {execution_time}s"
        
        print(f"✅ Concurrent sending (10 users): {execution_time:.3f}s")
    
    @pytest.mark.asyncio
    async def test_concurrent_websocket_connections(self):
        """Test concurrent WebSocket connections performance"""
        # Create mock WebSocket connections
        connections = []
        for i in range(100):
            mock_ws = Mock()
            mock_ws.send_text = Mock()
            connections.append(mock_ws)
        
        # Connect all users concurrently
        async def connect_user(ws, user_id):
            await manager.connect(ws, 1, user_id)
        
        start_time = time.time()
        tasks = []
        for i, ws in enumerate(connections):
            task = connect_user(ws, i + 1)
            tasks.append(task)
        
        await asyncio.gather(*tasks)
        end_time = time.time()
        
        # Verify connections
        assert len(manager.active_connections.get(1, {})) == 100
        
        # Performance should be reasonable
        execution_time = end_time - start_time
        assert execution_time < 1.0, f"Concurrent WebSocket connections test failed: {execution_time}s"
        
        print(f"✅ Concurrent WebSocket connections (100 users): {execution_time:.3f}s")
        
        # Clean up
        for i, ws in enumerate(connections):
            manager.disconnect(ws, 1, i + 1)
    
    @pytest.mark.asyncio
    async def test_concurrent_message_broadcasting(self):
        """Test concurrent message broadcasting performance"""
        # Create mock WebSocket connections
        connections = []
        for i in range(50):
            mock_ws = Mock()
            mock_ws.send_text = Mock()
            connections.append(mock_ws)
        
        # Connect all users
        for i, ws in enumerate(connections):
            await manager.connect(ws, 1, i + 1)
        
        # Test concurrent broadcasting
        async def broadcast_message(message_id):
            message_data = {
                "type": "new_message",
                "message": {
                    "id": message_id,
                    "service_request_id": 1,
                    "sender_id": 1,
                    "message": f"Broadcast message {message_id}",
                    "message_type": "text",
                    "created_at": datetime.now().isoformat(),
                    "delivery_status": "sent",
                    "is_read": False
                }
            }
            await manager.broadcast(1, message_data, exclude_user_id=1)
        
        start_time = time.time()
        tasks = []
        for i in range(20):  # Send 20 messages concurrently
            task = broadcast_message(i + 1)
            tasks.append(task)
        
        await asyncio.gather(*tasks)
        end_time = time.time()
        
        # Verify all connections received messages
        for ws in connections:
            assert ws.send_text.call_count == 20
        
        # Performance should be reasonable
        execution_time = end_time - start_time
        assert execution_time < 2.0, f"Concurrent broadcasting test failed: {execution_time}s"
        
        print(f"✅ Concurrent broadcasting (20 messages to 50 users): {execution_time:.3f}s")
        
        # Clean up
        for i, ws in enumerate(connections):
            manager.disconnect(ws, 1, i + 1)

class TestMemoryUsagePerformance:
    """Test memory usage performance"""
    
    def test_memory_usage_with_large_conversations(self, mock_db, mock_user, mock_service_request):
        """Test memory usage with large conversations"""
        import psutil
        import os
        
        # Get initial memory usage
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Create large conversation
        large_message_count = 50000
        messages = []
        
        for i in range(100):  # Load one page
            message = Mock(spec=ChatMessageORM)
            message.id = i + 1
            message.service_request_id = 1
            message.sender_id = 1
            message.message = f"Message {i + 1}" * 100  # Longer messages
            message.message_type = "text"
            message.delivery_status = "sent"
            message.is_read = False
            message.created_at = datetime.now(timezone.utc)
            message.read_at = None
            message.delivered_at = None
            messages.append(message)
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        mock_db.query.return_value.filter.return_value.count.return_value = large_message_count
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages
        mock_db.commit = Mock()
        
        # Load conversation multiple times
        for _ in range(10):
            conversation = _get_conversation_data(1, mock_db, mock_user, limit=100, offset=0)
            assert isinstance(conversation, ChatConversation)
        
        # Get final memory usage
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable
        assert memory_increase < 100, f"Memory usage test failed: {memory_increase:.2f}MB increase"
        
        print(f"✅ Memory usage test: {memory_increase:.2f}MB increase")
    
    def test_message_object_memory_efficiency(self, mock_db, mock_user, mock_service_request):
        """Test message object memory efficiency"""
        # Create messages with different sizes
        message_sizes = [100, 1000, 10000]  # Characters
        
        for size in message_sizes:
            messages = []
            for i in range(10):
                message = Mock(spec=ChatMessageORM)
                message.id = i + 1
                message.service_request_id = 1
                message.sender_id = 1
                message.message = "A" * size  # Message of specific size
                message.message_type = "text"
                message.delivery_status = "sent"
                message.is_read = False
                message.created_at = datetime.now(timezone.utc)
                message.read_at = None
                message.delivered_at = None
                messages.append(message)
            
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
            mock_db.query.return_value.filter.return_value.count.return_value = 10
            mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages
            mock_db.commit = Mock()
            
            # Measure performance
            start_time = time.time()
            conversation = _get_conversation_data(1, mock_db, mock_user, limit=10, offset=0)
            end_time = time.time()
            
            # Performance should be reasonable regardless of message size
            execution_time = end_time - start_time
            assert execution_time < 0.1, f"Message size test failed for {size} chars: {execution_time}s"
            
            print(f"✅ Message size {size} chars: {execution_time:.3f}s")

class TestDatabasePerformance:
    """Test database performance"""
    
    def test_database_query_performance(self, mock_db, mock_user, mock_service_request):
        """Test database query performance"""
        # Test different query patterns
        query_patterns = [
            {"limit": 10, "offset": 0},
            {"limit": 50, "offset": 0},
            {"limit": 100, "offset": 0},
            {"limit": 50, "offset": 1000},
            {"limit": 50, "offset": 10000},
        ]
        
        for pattern in query_patterns:
            # Create mock messages
            messages = []
            for i in range(pattern["limit"]):
                message = Mock(spec=ChatMessageORM)
                message.id = pattern["offset"] + i + 1
                message.service_request_id = 1
                message.sender_id = 1
                message.message = f"Message {pattern['offset'] + i + 1}"
                message.message_type = "text"
                message.delivery_status = "sent"
                message.is_read = False
                message.created_at = datetime.now(timezone.utc)
                message.read_at = None
                message.delivered_at = None
                messages.append(message)
            
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
            mock_db.query.return_value.filter.return_value.count.return_value = 100000
            mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages
            mock_db.commit = Mock()
            
            # Measure performance
            start_time = time.time()
            conversation = _get_conversation_data(
                1, mock_db, mock_user, 
                limit=pattern["limit"], 
                offset=pattern["offset"]
            )
            end_time = time.time()
            
            # Verify results
            assert isinstance(conversation, ChatConversation)
            assert len(conversation.messages) == pattern["limit"]
            assert conversation.current_offset == pattern["offset"]
            
            # Performance should be consistent
            execution_time = end_time - start_time
            assert execution_time < 0.5, f"Database query test failed for pattern {pattern}: {execution_time}s"
            
            print(f"✅ Query pattern {pattern}: {execution_time:.3f}s")
    
    def test_database_connection_pooling(self, mock_db, mock_user, mock_service_request):
        """Test database connection pooling performance"""
        # Simulate multiple concurrent database operations
        def simulate_db_operation(operation_id):
            messages = []
            for i in range(10):
                message = Mock(spec=ChatMessageORM)
                message.id = operation_id * 10 + i + 1
                message.service_request_id = 1
                message.sender_id = 1
                message.message = f"Operation {operation_id} Message {i + 1}"
                message.message_type = "text"
                message.delivery_status = "sent"
                message.is_read = False
                message.created_at = datetime.now(timezone.utc)
                message.read_at = None
                message.delivered_at = None
                messages.append(message)
            
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
            mock_db.query.return_value.filter.return_value.count.return_value = 1000
            mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages
            mock_db.commit = Mock()
            
            return _get_conversation_data(1, mock_db, mock_user, limit=10, offset=0)
        
        # Test concurrent operations
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(simulate_db_operation, i) for i in range(20)]
            results = [future.result() for future in futures]
        end_time = time.time()
        
        # Verify results
        assert len(results) == 20
        for result in results:
            assert isinstance(result, ChatConversation)
            assert len(result.messages) == 10
        
        # Performance should be reasonable
        execution_time = end_time - start_time
        assert execution_time < 2.0, f"Database connection pooling test failed: {execution_time}s"
        
        print(f"✅ Database connection pooling (20 concurrent operations): {execution_time:.3f}s")

class TestScalabilityTests:
    """Test scalability with increasing load"""
    
    def test_scalability_with_increasing_users(self, mock_db, mock_user, mock_service_request):
        """Test scalability with increasing number of users"""
        user_counts = [10, 50, 100, 200]
        
        for user_count in user_counts:
            # Create mock users
            users = []
            for i in range(user_count):
                user = Mock(spec=UserORM)
                user.id = i + 1
                user.username = f"user{i + 1}"
                user.is_provider = False
                users.append(user)
            
            # Create mock messages
            messages = []
            for i in range(50):
                message = Mock(spec=ChatMessageORM)
                message.id = i + 1
                message.service_request_id = 1
                message.sender_id = (i % user_count) + 1
                message.message = f"Message {i + 1}"
                message.message_type = "text"
                message.delivery_status = "sent"
                message.is_read = False
                message.created_at = datetime.now(timezone.utc)
                message.read_at = None
                message.delivered_at = None
                messages.append(message)
            
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
            mock_db.query.return_value.filter.return_value.count.return_value = 50
            mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages
            mock_db.commit = Mock()
            
            # Measure performance
            start_time = time.time()
            conversation = _get_conversation_data(1, mock_db, mock_user, limit=50, offset=0)
            end_time = time.time()
            
            # Verify results
            assert isinstance(conversation, ChatConversation)
            assert len(conversation.messages) == 50
            
            # Performance should scale reasonably
            execution_time = end_time - start_time
            assert execution_time < 1.0, f"Scalability test failed for {user_count} users: {execution_time}s"
            
            print(f"✅ Scalability test ({user_count} users): {execution_time:.3f}s")
    
    def test_scalability_with_increasing_messages(self, mock_db, mock_user, mock_service_request):
        """Test scalability with increasing number of messages"""
        message_counts = [100, 1000, 10000, 100000]
        
        for count in message_counts:
            # Create mock messages
            messages = []
            for i in range(min(50, count)):  # Only load one page
                message = Mock(spec=ChatMessageORM)
                message.id = i + 1
                message.service_request_id = 1
                message.sender_id = 1
                message.message = f"Message {i + 1}"
                message.message_type = "text"
                message.delivery_status = "sent"
                message.is_read = False
                message.created_at = datetime.now(timezone.utc)
                message.read_at = None
                message.delivered_at = None
                messages.append(message)
            
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
            mock_db.query.return_value.filter.return_value.count.return_value = count
            mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages
            mock_db.commit = Mock()
            
            # Measure performance
            start_time = time.time()
            conversation = _get_conversation_data(1, mock_db, mock_user, limit=50, offset=0)
            end_time = time.time()
            
            # Verify results
            assert isinstance(conversation, ChatConversation)
            assert len(conversation.messages) == min(50, count)
            assert conversation.total_messages == count
            
            # Performance should scale reasonably
            execution_time = end_time - start_time
            assert execution_time < 1.0, f"Message scalability test failed for {count} messages: {execution_time}s"
            
            print(f"✅ Message scalability test ({count} messages): {execution_time:.3f}s")

if __name__ == "__main__":
    pytest.main([__file__])

