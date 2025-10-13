import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Fab,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  ViewList,
  ViewModule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { marketplaceService } from '../../../services/marketplace/marketplaceService';
import { MarketplacePostCard } from '../../../components/marketplace/MarketplacePostCard';
import { MarketplacePostForm } from '../../../components/marketplace/MarketplacePostForm';
import type { MarketplacePostSummary } from '../../../types/services/marketplacePost';

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
  const navigate = useNavigate();
  const { t } = useLocalization();
  
  const [posts, setPosts] = useState<MarketplacePostSummary[]>([]);
  const [myPosts, setMyPosts] = useState<MarketplacePostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<Array<{ id: number; name: string; description?: string }>>([]);
  
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
      const [postsData, serviceTypesData] = await Promise.all([
        marketplaceService.getPosts(),
        marketplaceService.getServiceTypes(),
      ]);
      
      setPosts(postsData);
      setServiceTypes(serviceTypesData);
      
      // Load user's own posts
      try {
        const myPostsData = await marketplaceService.getMyPosts();
        setMyPosts(myPostsData);
      } catch (error) {
        // User might not be logged in or have posts
        console.log('Could not load user posts:', error);
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
      post.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesServiceType = !selectedServiceType || post.service_type === selectedServiceType;
    const matchesLocation = !selectedLocation || 
      (post.location && post.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    const matchesUrgent = !urgentOnly || post.is_urgent;
    
    return matchesSearch && matchesServiceType && matchesLocation && matchesUrgent;
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateSuccess = (post: any) => {
    setShowCreateForm(false);
    loadData(); // Refresh the data
  };

  const handleViewDetails = (post: MarketplacePostSummary) => {
    navigate(`/marketplace/posts/${post.id}`);
  };

  const handleContact = (post: MarketplacePostSummary) => {
    // Navigate to chat or contact form
    navigate(`/marketplace/posts/${post.id}/contact`);
  };

  const handleEdit = (post: MarketplacePostSummary) => {
    navigate(`/marketplace/posts/${post.id}/edit`);
  };

  const handleDelete = (post: MarketplacePostSummary) => {
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
          {t('marketplace.title') || 'Marketplace'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('marketplace.subtitle') || 'Find service providers or post your needs'}
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
      {showCreateForm && (
        <MarketplacePostForm
          pets={[]} // TODO: Load user's pets
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

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
