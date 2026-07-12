import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Fab,
  Tabs,
  Tab,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  ViewList,
  ViewModule,
} from '@mui/icons-material';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { marketplaceService } from '../../../services/marketplace/marketplaceService';
import { MarketplacePostCard } from '../../../components/marketplace/MarketplacePostCard';
import { MarketplacePostForm } from '../../../components/marketplace/MarketplacePostForm';
import type { MarketplacePostSummary } from '../../../types/services/marketplacePost';
import type { Pet } from '../../../types/pets/pet';
import { getPets } from '../../../services/pets/petService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`marketplace-tabpanel-${index}`}
      aria-labelledby={`marketplace-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const MarketplacePostsPage: React.FC = () => {
  const { t } = useLocalization();
  
  const [posts, setPosts] = useState<MarketplacePostSummary[]>([]);
  const [myPosts, setMyPosts] = useState<MarketplacePostSummary[]>([]);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<Array<{ id: number; name: string; description?: string }>>([]);
  const [selectedPost, setSelectedPost] = useState<MarketplacePostSummary | null>(null);
  const [editingPost, setEditingPost] = useState<MarketplacePostSummary | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  
  // UI State
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [postsData, serviceTypesData, petsData] = await Promise.all([
        marketplaceService.getPosts(),
        marketplaceService.getServiceTypes(),
        getPets().catch(() => []),
      ]);
      
      setPosts(postsData);
      setServiceTypes(serviceTypesData);
      setUserPets(petsData);
      
      // Load user's own posts
      try {
        const myPostsData = await marketplaceService.getMyPosts();
        setMyPosts(myPostsData);
      } catch {
        setMyPosts([]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load marketplace posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesServiceType = !selectedServiceType || post.service_type === selectedServiceType;
    const matchesLocation = !selectedLocation || 
      (post.location && post.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    const matchesUrgent = !urgentOnly || post.is_urgent;
    
    return matchesSearch && matchesServiceType && matchesLocation && matchesUrgent;
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setEditingPost(null);
    setFeedbackMessage(t('marketplace.postSaved') || 'Marketplace post saved successfully');
    loadData(); // Refresh the data
  };

  const handleViewDetails = (post: MarketplacePostSummary) => {
    setSelectedPost(post);
  };

  const handleContact = (post: MarketplacePostSummary) => {
    setSelectedPost(post);
    setFeedbackMessage(
      t('marketplace.contactRecorded') ||
        'Response recorded. Direct marketplace messaging is still being finalized.'
    );
  };

  const handleEdit = (post: MarketplacePostSummary) => {
    setEditingPost(post);
    setShowCreateForm(false);
  };

  const handleDelete = () => {
    setSelectedPost(null);
    setEditingPost(null);
    setFeedbackMessage(t('marketplace.postDeleted') || 'Marketplace post deleted');
    loadData(); // Refresh the data
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('marketplace.requestBoard') || 'Request Board'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('marketplace.subtitle') || 'Post what you need so providers can discover and respond to it'}
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="marketplace tabs">
          <Tab label={t('marketplace.allPosts') || 'All Posts'} />
          <Tab label={t('marketplace.myPosts') || 'My Posts'} />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label={t('common.search') || 'Search'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('marketplace.serviceType') || 'Service Type'}</InputLabel>
              <Select
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
              >
                <MenuItem value="">{t('common.all') || 'All'}</MenuItem>
                {serviceTypes.map((type) => (
                  <MenuItem key={type.id} value={type.name}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label={t('marketplace.location') || 'Location'}
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant={urgentOnly ? 'contained' : 'outlined'}
              onClick={() => setUrgentOnly(!urgentOnly)}
              startIcon={<FilterList />}
            >
              {t('marketplace.urgentOnly') || 'Urgent Only'}
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('grid')}
                startIcon={<ViewModule />}
              >
                {t('common.grid') || 'Grid'}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('list')}
                startIcon={<ViewList />}
              >
                {t('common.list') || 'List'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      <TabPanel value={tabValue} index={0}>
        {filteredPosts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {t('marketplace.noPostsFound') || 'No posts found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('marketplace.noPostsDescription') || 'Try adjusting your filters or create a new post'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateForm(true)}
            >
              {t('marketplace.createPost') || 'Create Post'}
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredPosts.map((post) => (
              <Grid item xs={12} sm={6} md={viewMode === 'grid' ? 4 : 12} key={post.id}>
                <MarketplacePostCard
                  post={post}
                  onViewDetails={handleViewDetails}
                  onContact={handleContact}
                  compact={viewMode === 'list'}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {myPosts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {t('marketplace.noMyPosts') || 'You haven\'t created any posts yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('marketplace.createFirstPost') || 'Create your first marketplace post to get started'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateForm(true)}
            >
              {t('marketplace.createPost') || 'Create Post'}
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {myPosts.map((post) => (
              <Grid item xs={12} sm={6} md={viewMode === 'grid' ? 4 : 12} key={post.id}>
                <MarketplacePostCard
                  post={post}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isOwner={true}
                  compact={viewMode === 'list'}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Create Post Form */}
      {(showCreateForm || editingPost) && (
        <MarketplacePostForm
          pets={userPets}
          postId={editingPost?.id}
          initialData={
            editingPost
              ? {
                  title: editingPost.title,
                  description: editingPost.description,
                  service_type: editingPost.service_type,
                  location: editingPost.location,
                  budget_min: editingPost.budget_min,
                  budget_max: editingPost.budget_max,
                  is_urgent: editingPost.is_urgent,
                  pet_ids: editingPost.pets?.map((pet) => pet.id) || [],
                }
              : undefined
          }
          onSuccess={handleCreateSuccess}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingPost(null);
          }}
        />
      )}

      <Dialog
        open={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedPost && (
          <>
            <DialogTitle>{selectedPost.title}</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Typography variant="body1">
                  {selectedPost.description}
                </Typography>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  {t('marketplace.serviceType') || 'Service Type'}: {selectedPost.service_type}
                </Typography>
                {selectedPost.location && (
                  <Typography variant="body2" color="text.secondary">
                    {t('marketplace.location') || 'Location'}: {selectedPost.location}
                  </Typography>
                )}
                {(selectedPost.budget_min || selectedPost.budget_max) && (
                  <Typography variant="body2" color="text.secondary">
                    {t('marketplace.budget') || 'Budget'}:{' '}
                    {selectedPost.budget_min ?? 0} - {selectedPost.budget_max ?? (t('marketplace.notSpecified') || 'Not specified')}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {t('marketplace.views') || 'Views'}: {selectedPost.views_count} • {t('marketplace.responses') || 'Responses'}: {selectedPost.responses_count}
                </Typography>
                {selectedPost.user && (
                  <Typography variant="body2" color="text.secondary">
                    {t('marketplace.postedBy') || 'Posted by'}:{' '}
                    {selectedPost.user.full_name || selectedPost.user.username}
                  </Typography>
                )}
                {selectedPost.pets && selectedPost.pets.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('marketplace.pets') || 'Pets'}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {selectedPost.pets.map((pet) => (
                        <Alert key={pet.id} severity="info" sx={{ py: 0 }}>
                          {pet.name}{pet.breed ? ` • ${pet.breed}` : ''}
                        </Alert>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPost(null)}>
                {t('common.close') || 'Close'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={Boolean(feedbackMessage)}
        autoHideDuration={4000}
        onClose={() => setFeedbackMessage(null)}
        message={feedbackMessage}
      />

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowCreateForm(true)}
      >
        <Add />
      </Fab>
    </Container>
  );
};
