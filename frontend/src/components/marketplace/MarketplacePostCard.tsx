import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  Message,
  LocationOn,
  AccessTime,
  AttachMoney,
  Person,
  Pets,
  Schedule,
  Star,
  MoreVert,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { marketplaceService } from '../../services/marketplace/marketplaceService';
import type { MarketplacePostSummary } from '../../types/services/marketplacePost';

interface MarketplacePostCardProps {
  post: MarketplacePostSummary;
  onViewDetails?: (post: MarketplacePostSummary) => void;
  onContact?: (post: MarketplacePostSummary) => void;
  onEdit?: (post: MarketplacePostSummary) => void;
  onDelete?: (post: MarketplacePostSummary) => void;
  isOwner?: boolean;
  compact?: boolean;
}

export const MarketplacePostCard: React.FC<MarketplacePostCardProps> = ({
  post,
  onViewDetails,
  onContact,
  onEdit,
  onDelete,
  isOwner = false,
  compact = false,
}) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatBudget = () => {
    if (post.budget_min && post.budget_max) {
      return `${post.budget_min} - ${post.budget_max}`;
    } else if (post.budget_min) {
      return `${post.budget_min}+`;
    } else if (post.budget_max) {
      return `Up to ${post.budget_max}`;
    }
    return t('marketplace.budgetNotSpecified') || 'Budget not specified';
  };

  const handleRespond = async () => {
    if (isOwner) return;
    
    setLoading(true);
    try {
      await marketplaceService.respondToPost(post.id);
      onContact?.(post);
    } catch (error) {
      console.error('Failed to respond to post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await marketplaceService.deletePost(post.id);
      onDelete?.(post);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, mr: 1 }}>
              {post.title}
            </Typography>
            {post.is_urgent && (
              <Chip 
                label={t('marketplace.urgent') || 'Urgent'} 
                color="error" 
                size="small" 
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            {post.description.length > 100 
              ? `${post.description.substring(0, 100)}...`
              : post.description
            }
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip label={post.service_type} size="small" color="primary" />
            {post.location && (
              <>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {post.location}
                </Typography>
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {post.views_count} {t('marketplace.views') || 'views'} • {post.responses_count} {t('marketplace.responses') || 'responses'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(post.created_at)}
            </Typography>
          </Box>
        </CardContent>

        <CardActions>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => onViewDetails?.(post)}
          >
            {t('common.view') || 'View'}
          </Button>
          {!isOwner && (
            <Button
              size="small"
              variant="contained"
              startIcon={<Message />}
              onClick={handleRespond}
              disabled={loading}
            >
              {t('marketplace.contact') || 'Contact'}
            </Button>
          )}
        </CardActions>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" gutterBottom>
                {post.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label={post.service_type} color="primary" />
                {post.is_urgent && (
                  <Chip label={t('marketplace.urgent') || 'Urgent'} color="error" />
                )}
              </Box>
            </Box>
            
            {isOwner && (
              <Box>
                <IconButton onClick={() => onEdit?.(post)}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => setDeleteDialogOpen(true)}>
                  <Delete />
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Description */}
          <Typography variant="body1" paragraph>
            {post.description}
          </Typography>

          {/* Details Grid */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {post.location && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="action" />
                  <Typography variant="body2">
                    {post.location}
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="action" />
                <Typography variant="body2">
                  {formatBudget()}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="action" />
                <Typography variant="body2">
                  {t('marketplace.posted') || 'Posted'} {formatDate(post.created_at)}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility color="action" />
                <Typography variant="body2">
                  {post.views_count} {t('marketplace.views') || 'views'} • {post.responses_count} {t('marketplace.responses') || 'responses'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* User Info */}
          {post.user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                <Person />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {post.user.full_name || post.user.username}
              </Typography>
            </Box>
          )}
        </CardContent>

        <Divider />

        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            startIcon={<Visibility />}
            onClick={() => onViewDetails?.(post)}
          >
            {t('common.viewDetails') || 'View Details'}
          </Button>
          
          {!isOwner && (
            <Button
              variant="contained"
              startIcon={<Message />}
              onClick={handleRespond}
              disabled={loading}
            >
              {t('marketplace.contact') || 'Contact User'}
            </Button>
          )}
        </CardActions>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          {t('marketplace.deletePost') || 'Delete Post'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('marketplace.deleteConfirm') || 'Are you sure you want to delete this marketplace post? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {t('common.delete') || 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
