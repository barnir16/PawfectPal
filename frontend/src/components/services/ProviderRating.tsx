import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import { Star, RateReview } from '@mui/icons-material';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../api';

interface ProviderRatingProps {
  providerId: number;
  currentRating?: number;
  reviewCount?: number;
  onRatingUpdate?: (rating: number, reviewCount: number) => void;
}

interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  service_type: string;
  reviewer_name: string;
  created_at: string;
}

export const ProviderRating: React.FC<ProviderRatingProps> = ({
  providerId,
  currentRating = 0,
  reviewCount = 0,
  onRatingUpdate,
}) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [rating, setRating] = useState(currentRating);
  const [reviewCountState, setReviewCountState] = useState(reviewCount);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [serviceType, setServiceType] = useState('');

  useEffect(() => {
    loadReviews();
  }, [providerId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/provider-reviews/provider/${providerId}`);
      setReviews(response.data);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (!reviewTitle.trim() || !reviewComment.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reviewData = {
        provider_id: providerId,
        rating: newRating,
        title: reviewTitle,
        comment: reviewComment,
        service_type: serviceType || 'general',
      };

      await api.post('/provider-reviews', reviewData);
      
      // Reload reviews and update rating
      await loadReviews();
      
      // Calculate new average rating
      const allReviews = [...reviews, {
        id: 0,
        rating: newRating,
        title: reviewTitle,
        comment: reviewComment,
        service_type: serviceType,
        reviewer_name: user.full_name || user.username,
        created_at: new Date().toISOString(),
      }];
      
      const newAverageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
      const newReviewCount = allReviews.length;
      
      setRating(newAverageRating);
      setReviewCountState(newReviewCount);
      
      if (onRatingUpdate) {
        onRatingUpdate(newAverageRating, newReviewCount);
      }

      // Reset form and close dialog
      setReviewTitle('');
      setReviewComment('');
      setServiceType('');
      setNewRating(5);
      setReviewDialogOpen(false);
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const getServiceTypeColor = (serviceType: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' } = {
      walking: 'primary',
      sitting: 'secondary',
      boarding: 'success',
      grooming: 'warning',
      veterinary: 'error',
      training: 'info',
      'אילוף': 'info',
      general: 'default',
    };
    return colors[serviceType] || 'default';
  };

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Star sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6">
              {t('services.rating') || 'Rating'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Rating value={rating} precision={0.1} readOnly size="large" />
            <Typography variant="h6" sx={{ ml: 2 }}>
              {rating.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({reviewCountState} {t('services.reviews') || 'reviews'})
            </Typography>
          </Box>

          {user && (
            <Button
              variant="outlined"
              startIcon={<RateReview />}
              onClick={() => setReviewDialogOpen(true)}
              sx={{ mb: 2 }}
            >
              {t('services.writeReview') || 'Write a Review'}
            </Button>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('services.reviews') || 'Reviews'}
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : reviews.length === 0 ? (
            <Typography color="text.secondary">
              {t('services.noReviews') || 'No reviews yet'}
            </Typography>
          ) : (
            <Box>
              {reviews.map((review) => (
                <Box key={review.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={review.rating} readOnly size="small" />
                    <Typography variant="subtitle2" sx={{ ml: 1 }}>
                      {review.title}
                    </Typography>
                    <Chip
                      label={t(`services.${review.service_type}`) || review.service_type}
                      color={getServiceTypeColor(review.service_type)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {review.comment}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('services.by') || 'by'} {review.reviewer_name} • {new Date(review.created_at).toLocaleDateString()}
                  </Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('services.writeReview') || 'Write a Review'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('services.rating') || 'Rating'}
            </Typography>
            <Rating
              value={newRating}
              onChange={(_, value) => setNewRating(value || 5)}
              size="large"
            />
            
            <TextField
              fullWidth
              label={t('services.reviewTitle') || 'Review Title'}
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label={t('services.reviewComment') || 'Your Review'}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label={t('services.serviceType') || 'Service Type (Optional)'}
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder={t('services.serviceTypePlaceholder') || 'e.g., Dog Walking, Pet Sitting'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : (t('services.submitReview') || 'Submit Review')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
