# Testing Guide for PawfectPal

This document outlines the testing framework and guidelines for PawfectPal.

## 🧪 Testing Framework

### Frontend Testing (React + TypeScript)
- **Framework**: Vitest + React Testing Library
- **Location**: `frontend/src/__tests__/` and `frontend/src/components/__tests__/`
- **Configuration**: `frontend/vitest.config.ts`

### Backend Testing (FastAPI + Python)
- **Framework**: pytest + httpx
- **Location**: `backend/tests/`
- **Configuration**: `backend/pytest.ini`

## 🚀 Running Tests

### Frontend Tests
```bash
cd frontend
npm install  # Install test dependencies
npm run test          # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
```

### Backend Tests
```bash
cd backend
pip install -r requirements.txt  # Install test dependencies
python run_tests.py             # Run all tests with coverage
# Or directly with pytest:
pytest tests/ -v --cov=. --cov-report=html
```

## 📋 Test Structure

### Frontend Test Structure
```
frontend/src/
├── __tests__/           # Service tests
│   └── chatService.test.ts
├── components/
│   └── __tests__/       # Component tests
│       └── ProtectedRoute.test.tsx
└── test/
    └── setup.ts         # Test setup and configuration
```

### Backend Test Structure
```
backend/tests/
├── conftest.py          # Pytest configuration and fixtures
├── test_chat.py         # Chat API tests
├── test_ai.py           # AI endpoint tests
└── test_auth.py         # Authentication tests (to be added)
```

## 🎯 Test Categories

### Unit Tests
- Test individual functions and components in isolation
- Mock external dependencies
- Fast execution (< 1 second per test)

### Integration Tests
- Test API endpoints with database
- Test component interactions
- Medium execution time (1-10 seconds per test)

### End-to-End Tests
- Test complete user workflows
- Test with real browser/API
- Slower execution (> 10 seconds per test)

## 📊 Coverage Requirements

- **Frontend**: Minimum 80% code coverage
- **Backend**: Minimum 80% code coverage
- **Critical paths**: 100% coverage (auth, payments, data persistence)

## 🔧 Test Utilities

### Frontend Test Helpers
```typescript
// Test wrapper for React components
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={createTheme()}>
      <LocalizationProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </BrowserRouter>
)

// Mock authentication
const mockUseAuth = vi.fn()
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))
```

### Backend Test Fixtures
```python
@pytest.fixture
def test_user():
    return UserORM(
        username="testuser",
        email="test@example.com",
        is_provider=False
    )

@pytest.fixture
def test_db():
    # Create test database
    Base.metadata.create_all(bind=engine)
    yield
    # Clean up
    Base.metadata.drop_all(bind=engine)
```

## 📝 Writing Tests

### Frontend Component Tests
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(
      <TestWrapper>
        <ComponentName />
      </TestWrapper>
    )
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
  
  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    render(<TestWrapper><ComponentName /></TestWrapper>)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Updated Text')).toBeInTheDocument()
  })
})
```

### Backend API Tests
```python
def test_endpoint_success(test_user, test_db):
    """Test API endpoint with valid data"""
    headers = create_auth_headers(test_user)
    
    with patch('dependencies.auth.get_current_user', return_value=test_user):
        response = client.post("/api/endpoint", json=data, headers=headers)
    
    assert response.status_code == 200
    assert response.json()["field"] == "expected_value"
```

## 🚨 Test Best Practices

### Do's ✅
- Write tests before or alongside code (TDD)
- Use descriptive test names
- Test both success and failure cases
- Mock external dependencies
- Keep tests independent and isolated
- Use meaningful assertions

### Don'ts ❌
- Don't test implementation details
- Don't write tests that depend on other tests
- Don't use real external services in unit tests
- Don't ignore failing tests
- Don't write tests that are too complex

## 🔍 Debugging Tests

### Frontend Test Debugging
```typescript
// Add debug output
screen.debug()  // Print current DOM
console.log(screen.getByRole('button'))  // Log specific elements

// Use testing-library queries
screen.getByRole('button', { name: /submit/i })
screen.getByTestId('submit-button')
screen.getByLabelText('Email Address')
```

### Backend Test Debugging
```python
# Add debug output
print(response.json())  # Print response data
print(response.status_code)  # Print status code

# Use pytest debugging
pytest tests/test_file.py::test_function -v -s  # Run specific test with output
```

## 📈 Continuous Integration

Tests are automatically run on:
- Pull request creation
- Code push to main branch
- Scheduled nightly runs

### CI Configuration
- Frontend: Tests run with `npm run test:coverage`
- Backend: Tests run with `python run_tests.py`
- Coverage reports uploaded to code coverage service
- Failed tests block deployment

## 🎉 Test Examples

See the following files for complete test examples:
- `frontend/src/components/__tests__/ProtectedRoute.test.tsx`
- `frontend/src/services/__tests__/chatService.test.ts`
- `backend/tests/test_chat.py`
- `backend/tests/test_ai.py`

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
