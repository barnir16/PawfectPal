import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { WeightMonitoringService, type WeightAlert, type WeightRecord } from '../../services/weight/weightMonitoringService';
import { useLocalization } from '../../contexts/LocalizationContext';

interface WeightAlertsProps {
  petId: number;
  weightRecords: WeightRecord[];
  onAcknowledgeAlert?: (alertId: string) => void;
  onViewDetails?: (alert: WeightAlert) => void;
}

export const WeightAlerts: React.FC<WeightAlertsProps> = ({
  petId,
  weightRecords,
  onAcknowledgeAlert,
  onViewDetails,
}) => {
  const { t } = useLocalization();
  const [alerts, setAlerts] = useState<WeightAlert[]>([]);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [selectedAlert, setSelectedAlert] = useState<WeightAlert | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Get all weight alerts for this pet
    const weightAlerts = WeightMonitoringService.getAllWeightAlerts(weightRecords, undefined, t);
    setAlerts(weightAlerts);
  }, [weightRecords, t]);

  const handleAlertToggle = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    if (onAcknowledgeAlert) {
      onAcknowledgeAlert(alertId);
    }
    // Update local state
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isAcknowledged: true } : alert
    ));
  };

  const handleViewDetails = (alert: WeightAlert) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
  };

  const getSeverityIcon = (severity: WeightAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: WeightAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAlertTypeLabel = (type: WeightAlert['type']) => {
    switch (type) {
      case 'sudden_change':
        return t('weight.suddenChange');
      case 'trend_warning':
        return t('weight.trendWarning');
      case 'health_range':
        return t('weight.healthRange');
      case 'maintenance_needed':
        return t('weight.maintenanceNeeded');
      default:
        return type;
    }
  };

  const getAlertTypeColor = (type: WeightAlert['type']) => {
    switch (type) {
      case 'sudden_change':
        return 'error';
      case 'trend_warning':
        return 'warning';
      case 'health_range':
        return 'warning';
      case 'maintenance_needed':
        return 'info';
      default:
        return 'default';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="body2" color="text.secondary">
              {t('weight.noAlerts')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Group alerts by severity
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

  const sortedAlerts = [...criticalAlerts, ...highAlerts, ...mediumAlerts, ...lowAlerts];

  return (
    <Box>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              <Typography variant="h6">
                {t('weight.weightAlerts')} ({alerts.length})
              </Typography>
            </Box>
          }
          subheader={t('weight.monitoringHealth')}
        />
        <CardContent>
          <List>
            {sortedAlerts.map((alert) => (
              <ListItem
                key={alert.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: alert.isAcknowledged ? 'action.hover' : 'background.paper',
                  opacity: alert.isAcknowledged ? 0.7 : 1,
                }}
              >
                <ListItemIcon>
                  {getSeverityIcon(alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {alert.message}
                      </Typography>
                      <Chip
                        label={getAlertTypeLabel(alert.type)}
                        size="small"
                        color={getAlertTypeColor(alert.type)}
                        variant="outlined"
                      />
                      <Chip
                        label={alert.severity}
                        size="small"
                        color={getSeverityColor(alert.severity)}
                      />
                      {alert.isAcknowledged && (
                        <Chip
                          label={t('weight.acknowledged')}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {alert.date.toLocaleDateString()} • {alert.date.toLocaleTimeString()}
                      </Typography>
                      
                      <Collapse in={expandedAlerts.has(alert.id)}>
                        <Box sx={{ mt: 1 }}>
                          {alert.recommendedAction && (
                            <Alert severity="info" sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                <strong>{t('weight.recommendedAction')}:</strong> {alert.recommendedAction}
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleAlertToggle(alert.id)}
                  >
                    {expandedAlerts.has(alert.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                  
                  {!alert.isAcknowledged && onAcknowledgeAlert && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                    >
                      {t('weight.acknowledge')}
                    </Button>
                  )}
                  
                  {onViewDetails && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDetails(alert)}
                    >
                      {t('common.details')}
                    </Button>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedAlert && getSeverityIcon(selectedAlert.severity)}
            <Typography variant="h6">
              {t('weight.alertDetails')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAlert.message}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('weight.alertType')}: {getAlertTypeLabel(selectedAlert.type)}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('weight.severity')}: {selectedAlert.severity}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('weight.date')}: {selectedAlert.date.toLocaleDateString()} {selectedAlert.date.toLocaleTimeString()}
                </Typography>
              </Box>
              
              {selectedAlert.recommendedAction && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{t('weight.recommendedAction')}:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedAlert.recommendedAction}
                  </Typography>
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary">
                {t('weight.alertDescription')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeightAlerts;
