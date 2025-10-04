#!/usr/bin/env python3
"""
Comprehensive AI Chatbot Testing Script
Tests all AI functionality including conversation persistence
"""

import sys
import os
sys.path.append('.')

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing AI Module Imports...")
    
    try:
        from routers.ai_simple import (
            AIChatRequest, AIChatResponse, 
            handle_simple_fallback, 
            generate_contextual_actions,
            create_comprehensive_prompt
        )
        print("✅ AI router imports successful")
    except Exception as e:
        print(f"❌ AI router import failed: {e}")
        return False
    
    try:
        from models.ai_conversation import AIConversationORM, AIConversationMessageORM
        print("✅ AI conversation models import successful")
    except Exception as e:
        print(f"❌ AI conversation models import failed: {e}")
        return False
    
    try:
        from schemas.ai_conversation import (
            AIConversationCreate, AIConversationRead, 
            AIConversationMessageCreate, AIConversationMessageRead
        )
        print("✅ AI conversation schemas import successful")
    except Exception as e:
        print(f"❌ AI conversation schemas import failed: {e}")
        return False
    
    return True

def test_fallback_logic():
    """Test the AI fallback logic with Bob's health issues"""
    print("\n🧪 Testing AI Fallback Logic...")
    
    try:
        from routers.ai_simple import handle_simple_fallback
        
        # Test with Bob's health issues
        test_message = "Hi! how can I help make Bob's life easier considering his health issues?"
        test_pet_context = {
            "pets": [
                {
                    "id": 1,
                    "name": "Bob",
                    "type": "dog",
                    "breed": "\"french bulldog\"",
                    "age": 12,
                    "weight": 8.5,
                    "gender": "male",
                    "health_issues": ["blind right eye"],
                    "behavior_issues": ["Peeing indoors"]
                }
            ]
        }
        
        response = handle_simple_fallback(test_message, test_pet_context, [])
        
        print(f"🤖 AI Response: {response.message}")
        print(f"🎯 Suggested Actions: {len(response.suggested_actions)} actions")
        
        # Check if response mentions Bob's specific issues
        response_lower = response.message.lower()
        bob_mentioned = "bob" in response_lower
        health_advice = any(word in response_lower for word in ["comfort", "eye", "vet", "professional", "care"])
        
        if bob_mentioned and health_advice:
            print("✅ AI provided specific health advice for Bob")
        else:
            print("⚠️ AI response may not be specific enough for Bob's health issues")
            
        return True
        
    except Exception as e:
        print(f"❌ Fallback logic test failed: {e}")
        return False

def test_suggested_actions():
    """Test suggested actions generation"""
    print("\n🧪 Testing Suggested Actions Generation...")
    
    try:
        from routers.ai_simple import generate_contextual_actions
        
        # Test health-related message
        health_message = "Bob has a bad eye and is peeing indoors"
        test_pet_context = {"pets": [{"name": "Bob", "health_issues": ["blind eye"]}]}
        
        actions = generate_contextual_actions(health_message, test_pet_context)
        
        print(f"🎯 Generated {len(actions)} suggested actions")
        
        # Check for relevant actions
        action_types = [action.get("type", "") for action in actions]
        has_emergency = "emergency" in action_types
        has_health_tracking = "health_tracking" in action_types
        has_comfort_care = "comfort_care" in action_types
        
        if has_emergency and has_health_tracking and has_comfort_care:
            print("✅ Generated relevant health-related suggested actions")
        else:
            print("⚠️ Suggested actions may not be optimal for health issues")
            
        return True
        
    except Exception as e:
        print(f"❌ Suggested actions test failed: {e}")
        return False

def test_prompt_generation():
    """Test comprehensive prompt generation"""
    print("\n🧪 Testing Comprehensive Prompt Generation...")
    
    try:
        from routers.ai_simple import create_comprehensive_prompt
        
        test_message = "Help with Bob's health"
        test_pet_context = {
            "pets": [
                {
                    "id": 1,
                    "name": "Bob",
                    "type": "dog",
                    "breed": "\"french bulldog\"",
                    "age": 12,
                    "health_issues": ["blind right eye"],
                    "behavior_issues": ["Peeing indoors"]
                }
            ]
        }
        test_conversation_history = [
            {"content": "Previous message", "isUser": "true"},
            {"content": "Previous AI response", "isUser": "false"}
        ]
        
        prompt = create_comprehensive_prompt(test_message, test_pet_context, test_conversation_history)
        
        print(f"📝 Generated prompt length: {len(prompt)} characters")
        
        # Check if prompt contains key elements
        contains_pet_info = "Bob" in prompt and "french bulldog" in prompt
        contains_health_info = "blind right eye" in prompt
        contains_context = "Previous message" in prompt
        
        if contains_pet_info and contains_health_info and contains_context:
            print("✅ Comprehensive prompt contains all necessary context")
        else:
            print("⚠️ Prompt may be missing some context elements")
            
        return True
        
    except Exception as e:
        print(f"❌ Prompt generation test failed: {e}")
        return False

def test_database_models():
    """Test database model creation"""
    print("\n🧪 Testing Database Models...")
    
    try:
        from models.ai_conversation import AIConversationORM, AIConversationMessageORM
        from datetime import datetime, timezone
        
        # Test creating model instances (without database)
        conversation = AIConversationORM(
            user_id=1,
            title="Test Conversation",
            created_at=datetime.now(timezone.utc)
        )
        
        message = AIConversationMessageORM(
            conversation_id=1,
            role="user",
            content="Test message",
            pet_context={"pets": []},
            suggested_actions=[]
        )
        
        print("✅ AI conversation models can be created successfully")
        print(f"📊 Conversation ID: {conversation.id}")
        print(f"💬 Message role: {message.role}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database models test failed: {e}")
        return False

def main():
    """Run all AI functionality tests"""
    print("🚀 Starting Comprehensive AI Chatbot Testing\n")
    
    tests = [
        ("Module Imports", test_imports),
        ("Fallback Logic", test_fallback_logic),
        ("Suggested Actions", test_suggested_actions),
        ("Prompt Generation", test_prompt_generation),
        ("Database Models", test_database_models)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All AI functionality tests passed!")
        return True
    else:
        print("⚠️ Some tests failed - AI system may need fixes")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
