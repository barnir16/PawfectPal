import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
  Chip,
} from '@mui/material';
import {
  AccessTime,
  AttachMoney,
  Delete,
  Edit,
  LocationOn,
  Message,
  Person,
  Visibility,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { marketplaceService } from '../../services/marketplace/marketplaceService';
import type { MarketplacePostSummary } from '../../types/services/marketplacePost';

interface MarketplacePostCardProps {
  post: MarketplacePostSummary;
  onViewDetails?: (post: MarketplacePostSummary) => void;
  onContact?: (post: MarketplacePostSummary) => void;
  onError?: (message: string) => void;
  onEdit?: (post: MarketplacePostSummary) => void;
  onDelete?: (post: MarketplacePostSummary) => void;
  isOwner?: boolean;
  compact?: boolean;
}

export const MarketplacePostCard: React.FC<MarketplacePostCardProps> = ({
  post,
  onViewDetails,
  onContact,
  onError,
  onEdit,
  onDelete,
  isOwner = false,
  compact = false,
}) => {
  const { t, currentLanguage } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const currencyFormatter = new Intl.NumberFormat(
    currentLanguage === 'he' ? 'he-IL' : 'en-US',
    {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(
      currentLanguage === 'he' ? 'he-IL' : 'en-US'
    );

  const formatBudget = () => {
    // Treat 0/0 as "not specified" too — legacy posts stored zeros instead
    // of leaving the field empty, which rendered as a nonsensical "0 - 0".
    const hasMin = post.budget_min !== undefined && post.budget_min > 0;
    const hasMax = post.budget_max !== undefined && post.budget_max > 0;

    if (hasMin && hasMax) {
      return `${currencyFormatter.format(post.budget_min!)} - ${currencyFormatter.format(post.budget_max!)}`;
    }

    if (hasMin) {
      return `${currencyFormatter.format(post.budget_min!)}+`;
    }

    if (hasMax) {
      return currencyFormatter.format(post.budget_max!);
    }

    return t('marketplace.budgetNotSpecified');
  };

  const handleRespond = async () => {
    if (isOwner) {
      return;
    }

    setLoading(true);
    try {
      await marketplaceService.respondToPost(post.id);
      onContact?.(post);
    } catch (error: any) {
      console.error('Failed to respond to post:', error);
      const status = error?.status;
      const message =
        status === 409
          ? t('marketplace.alreadyResponded')
          : status === 400
            ? t('marketplace.cannotRespondOwnPost')
            : t('marketplace.respondFailed');
      onError?.(message);
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1, gap: 1 }}>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              {post.title}
            </Typography>
            {post.is_urgent && (
              <Chip label={t('marketplace.urgent')} color="error" size="small" />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            {post.description.length > 110
              ? `${post.description.substring(0, 110)}...`
              : post.description}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip label={post.service_type} size="small" color="primary" />
            {post.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {post.location}
                </Typography>
              </Box>
            )}
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {formatBudget()}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {post.views_count} {t('marketplace.views')} • {post.responses_count} {t('marketplace.responses')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(post.created_at)}
            </Typography>
          </Box>
        </CardContent>

        <CardActions>
          <Button size="small" startIcon={<Visibility />} onClick={() => onViewDetails?.(post)}>
            {t('common.view')}
          </Button>
          {!isOwner && (
            <Button
              size="small"
              variant="contained"
              startIcon={<Message />}
              onClick={handleRespond}
              disabled={loading}
            >
              {t('marketplace.contact')}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, gap: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" gutterBottom>
                {post.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={post.service_type} color="primary" />
                {post.is_urgent && <Chip label={t('marketplace.urgent')} color="error" />}
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

          <Typography variant="body1" paragraph>
            {post.description}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            {post.location && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="action" />
                  <Typography variant="body2">{post.location}</Typography>
                </Box>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="action" />
                <Typography variant="body2">{formatBudget()}</Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="action" />
                <Typography variant="body2">
                  {t('marketplace.posted')} {formatDate(post.created_at)}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility color="action" />
                <Typography variant="body2">
                  {post.views_count} {t('marketplace.views')} • {post.responses_count} {t('marketplace.responses')}
                </Typography>
              </Box>
            </Grid>
          </Grid>

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
          <Button startIcon={<Visibility />} onClick={() => onViewDetails?.(post)}>
            {t('common.details')}
          </Button>

          {!isOwner && (
            <Button
              variant="contained"
              startIcon={<Message />}
              onClick={handleRespond}
              disabled={loading}
            >
              {t('marketplace.contact')}
            </Button>
          )}
        </CardActions>
      </Card>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('marketplace.deletePost')}</DialogTitle>
        <DialogContent>
          <Typography>{t('marketplace.deleteConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
