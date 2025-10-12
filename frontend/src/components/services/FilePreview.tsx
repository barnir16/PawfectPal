import React, { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Download,
  OpenInNew,
  Close,
  Image,
  InsertDriveFile,
  VideoFile,
  AudioFile,
  Description,
  PictureAsPdf,
  Code,
  Archive,
  CloudDownload,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { MediaAttachment } from '../../types/services/chat';

interface FilePreviewProps {
  attachment: MediaAttachment;
  onDownload?: (attachment: MediaAttachment) => void;
  onOpen?: (attachment: MediaAttachment) => void;
  compact?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  attachment,
  onDownload,
  onOpen,
  compact = false,
}) => {
  const { t } = useLocalization();
  const [imageError, setImageError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image />;
    if (fileType.startsWith('video/')) return <VideoFile />;
    if (fileType.startsWith('audio/')) return <AudioFile />;
    if (fileType === 'application/pdf') return <PictureAsPdf />;
    if (fileType.includes('word') || fileType.includes('document')) return <Description />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive />;
    if (fileType.includes('text') || fileType.includes('code')) return <Code />;
    return <InsertDriveFile />;
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'success';
    if (fileType.startsWith('video/')) return 'warning';
    if (fileType.startsWith('audio/')) return 'info';
    if (fileType === 'application/pdf') return 'error';
    return 'default';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = attachment.file_type.startsWith('image/');
  const isVideo = attachment.file_type.startsWith('video/');
  const isAudio = attachment.file_type.startsWith('audio/');

  const handlePreview = () => {
    console.log('🖼️ FilePreview clicked:', {
      fileName: attachment.file_name,
      fileType: attachment.file_type,
      fileUrl: attachment.file_url,
      isImage,
      isVideo
    });
    
    if (isImage || isVideo) {
      setPreviewOpen(true);
    } else {
      onOpen?.(attachment);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(attachment);
  };

  if (compact) {
    return (
      <Card
        sx={{
          maxWidth: 200,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: 4,
          },
        }}
        onClick={handlePreview}
      >
        {isImage && !imageError ? (
          <CardMedia
            component="img"
            height="120"
            image={attachment.file_url}
            alt={attachment.file_name}
            onError={() => setImageError(true)}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'grey.100',
            }}
          >
            {getFileIcon(attachment.file_type)}
          </Box>
        )}
        
        <CardContent sx={{ p: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
            }}
          >
            {attachment.file_name}
          </Typography>
          
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
            <Chip
              label={attachment.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
              size="small"
              color={getFileTypeColor(attachment.file_type)}
              sx={{ fontSize: '0.6rem', height: 16 }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(attachment.file_size)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        sx={{
          maxWidth: 300,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: 4,
          },
        }}
        onClick={handlePreview}
      >
        {isImage && !imageError ? (
          <CardMedia
            component="img"
            height="200"
            image={attachment.file_url}
            alt={attachment.file_name}
            onError={() => setImageError(true)}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'grey.100',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {getFileIcon(attachment.file_type)}
            <Typography variant="body2" color="text.secondary">
              {attachment.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
            </Typography>
          </Box>
        )}
        
        <CardContent>
          <Typography
            variant="subtitle2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              mb: 1,
            }}
          >
            {attachment.file_name}
          </Typography>
          
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Chip
              label={attachment.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
              size="small"
              color={getFileTypeColor(attachment.file_type)}
            />
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(attachment.file_size)}
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Tooltip title={t('chat.download') || 'Download'}>
              <IconButton
                size="small"
                onClick={handleDownload}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={t('chat.open') || 'Open'}>
              <IconButton
                size="small"
                onClick={handlePreview}
                sx={{
                  backgroundColor: 'secondary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                  },
                }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      {/* Full Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.7)',
              },
            }}
          >
            <Close />
          </IconButton>
          
          {isImage && (
            <Box
              component="img"
              src={attachment.file_url}
              alt={attachment.file_name}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
          )}
          
          {isVideo && (
            <Box
              component="video"
              src={attachment.file_url}
              controls
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
              }}
            />
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            {t('chat.close') || 'Close'}
          </Button>
          <Button
            onClick={() => {
              onDownload?.(attachment);
              setPreviewOpen(false);
            }}
            variant="contained"
            startIcon={<CloudDownload />}
          >
            {t('chat.download') || 'Download'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
