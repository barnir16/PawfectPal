import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ServiceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Service Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center', m: 2 }}>
          <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="error">
            Service Error
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Something went wrong while loading the service features.
          </Typography>
          <Button variant="contained" onClick={this.handleRetry}>
            Try Again
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

