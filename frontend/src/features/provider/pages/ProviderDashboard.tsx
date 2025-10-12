import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from "@mui/material";
import {
  Business,
  Message,
  AttachMoney,
  Star,
  Schedule,
  TrendingUp,
  People,
  Pets,
  CheckCircle,
  AccessTime,
  Warning,
} from "@mui/icons-material";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { useNavigate } from "react-router-dom";
import { chatService } from "../../../services/chat/chatService";
import type { ChatConversation } from "../../../types/services/chat";

interface ProviderStats {
  totalServices: number;
  activeServices: number;
  completedServices: number;
  totalEarnings: number;
  averageRating: number;
  totalClients: number;
  responseTime: number;
}

interface RecentActivity {
  id: string;
  type: 'message' | 'service_request' | 'rating';
  title: string;
  description: string;
  timestamp: string;
  status?: 'new' | 'pending' | 'completed';
}

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<ProviderStats>({
    totalServices: 0,
    activeServices: 0,
    completedServices: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalClients: 0,
    responseTime: 0,
  });
  
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch conversations for provider
        const conversationsData = await chatService.getMyConversations();
        setConversations(conversationsData);

        // Mock stats for now - in a real app, these would come from API
        setStats({
          totalServices: 24,
          activeServices: 3,
          completedServices: 21,
          totalEarnings: 2450,
          averageRating: 4.8,
          totalClients: 18,
          responseTime: 2.5, // minutes
        });

        // Mock recent activity
        setRecentActivity([
          {
            id: '1',
            type: 'message',
            title: 'New message from Sarah',
            description: 'Dog walking service request',
            timestamp: '2 minutes ago',
            status: 'new',
          },
          {
            id: '2',
            type: 'service_request',
            title: 'Pet sitting request',
            description: 'Weekend pet sitting for Max',
            timestamp: '1 hour ago',
            status: 'pending',
          },
          {
            id: '3',
            type: 'rating',
            title: '5-star rating received',
            description: 'Excellent service for Luna',
            timestamp: '3 hours ago',
            status: 'completed',
          },
        ]);

      } catch (err: any) {
        console.error('Failed to fetch provider dashboard data:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'new': return 'error';
      case 'pending': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return <Message />;
      case 'service_request': return <Pets />;
      case 'rating': return <Star />;
      default: return <AccessTime />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Business sx={{ mr: 2, verticalAlign: 'middle' }} />
          Provider Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.full_name || user?.username}! Here's your business overview.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Services
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalServices}
                  </Typography>
                </Box>
                <Pets sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Services
                  </Typography>
                  <Typography variant="h4" component="div" color="primary.main">
                    {stats.activeServices}
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Earnings
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    ${stats.totalEarnings}
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Average Rating
                  </Typography>
                  <Typography variant="h4" component="div" color="warning.main">
                    {stats.averageRating}
                  </Typography>
                </Box>
                <Star sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Conversations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Recent Conversations
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/chat-list')}
              >
                View All
              </Button>
            </Box>
            
            {conversations.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 3 }}>
                No conversations yet
              </Typography>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {conversations.slice(0, 5).map((conversation, index) => (
                  <React.Fragment key={conversation.service_request_id}>
                    <ListItem 
                      button 
                      onClick={() => navigate(`/chat/${conversation.service_request_id}`)}
                      sx={{ borderRadius: 1, mb: 1 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Message />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`Service Request #${conversation.service_request_id}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {conversation.messages.length > 0 
                                ? conversation.messages[conversation.messages.length - 1].message.substring(0, 50) + '...'
                                : 'No messages yet'
                              }
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {conversation.messages.length} messages
                              </Typography>
                              {conversation.unread_count > 0 && (
                                <Chip 
                                  label={conversation.unread_count} 
                                  size="small" 
                                  color="primary"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < conversations.slice(0, 5).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Recent Activity
            </Typography>
            
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem sx={{ borderRadius: 1, mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'grey.100' }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {activity.title}
                          </Typography>
                          {activity.status && (
                            <Chip 
                              label={activity.status} 
                              size="small" 
                              color={getStatusColor(activity.status)}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.timestamp}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Quick Actions
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button 
            variant="contained" 
            startIcon={<Message />}
            onClick={() => navigate('/chat-list')}
          >
            View Messages
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Pets />}
            onClick={() => navigate('/service-requests')}
          >
            Browse Services
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Schedule />}
            onClick={() => navigate('/schedule')}
          >
            Manage Schedule
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<TrendingUp />}
            onClick={() => navigate('/analytics')}
          >
            View Analytics
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
