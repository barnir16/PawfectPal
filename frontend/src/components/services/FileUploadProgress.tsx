import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  IconButton,
  Stack,
  Chip,
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Error,
  CloudUpload,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';

interface FileUploadProgressProps {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  onCancel?: () => void;
  onRetry?: () => void;
}

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  file,
  progress,
  status,
  error,
  onCancel,
  onRetry,
}) => {
  const { t } = useLocalization();

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <CloudUpload color="primary" />;
      case 'completed':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'primary';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'IMAGE';
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'VIDEO';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'AUDIO';
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return 'DOCUMENT';
      case 'zip':
      case 'rar':
        return 'ARCHIVE';
      default:
        return 'FILE';
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        {getStatusIcon()}
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {file.name}
            </Typography>
            
            <Chip
              label={getFileType(file.name)}
              size="small"
              color={getStatusColor()}
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
            
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(file.size)}
            </Typography>
          </Stack>
          
          {status === 'uploading' && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ mb: 0.5 }}
              />
              <Typography variant="caption" color="text.secondary">
                {Math.round(progress)}% {t('chat.uploading') || 'uploading...'}
              </Typography>
            </Box>
          )}
          
          {status === 'completed' && (
            <Typography variant="caption" color="success.main">
              {t('chat.uploadComplete') || 'Upload completed'}
            </Typography>
          )}
          
          {status === 'error' && (
            <Box>
              <Typography variant="caption" color="error.main">
                {error || t('chat.uploadError') || 'Upload failed'}
              </Typography>
              {onRetry && (
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ cursor: 'pointer', ml: 1 }}
                  onClick={onRetry}
                >
                  {t('chat.retry') || 'Retry'}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        
        {status === 'uploading' && onCancel && (
          <IconButton size="small" onClick={onCancel}>
            <Close />
          </IconButton>
        )}
      </Stack>
    </Box>
  );
};
