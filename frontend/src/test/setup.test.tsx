import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Simple test component
const TestComponent = () => (
  <div>
    <h1>Test Component</h1>
    <p>This is a test</p>
  </div>
);

describe('Test Setup', () => {
  it('should render a simple component', () => {
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
    expect(screen.getByText('This is a test')).toBeInTheDocument();
  });

  it('should have localStorage mock', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value');
  });
});
