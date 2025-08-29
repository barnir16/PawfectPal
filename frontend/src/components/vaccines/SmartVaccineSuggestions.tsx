import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Vaccines as VaccinesIcon,
  PriorityHigh as PriorityHighIcon,
  PriorityMedium as PriorityMediumIcon,
  PriorityLow as PriorityLowIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { SmartVaccineService, type VaccineSuggestion } from '../../services/vaccines/smartVaccineService';
import { WeightMonitoringService, type WeightHealthRange } from '../../services/weight/weightMonitoringService';
import type { Pet } from '../../types/pets/pet';
import { useLocalization } from '../../contexts/LocalizationContext';
import vaccineLocalization from '../../locales/vaccines';

interface SmartVaccineSuggestionsProps {
  pet: Pet;
  onScheduleVaccine?: (suggestion: VaccineSuggestion) => void;
  onViewDetails?: (suggestion: VaccineSuggestion) => void;
}

export const SmartVaccineSuggestions: React.FC<SmartVaccineSuggestionsProps> = ({
  pet,
  onScheduleVaccine,
  onViewDetails,
}) => {
  const { t, currentLanguage } = useLocalization();
  const [suggestions, setSuggestions] = useState<VaccineSuggestion[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [weightHealthRange, setWeightHealthRange] = useState<WeightHealthRange | null>(null);

  useEffect(() => {
    // Get vaccine suggestions for this pet
    const vaccineSuggestions = SmartVaccineService.getVaccineSuggestions(pet);
    setSuggestions(vaccineSuggestions);

    // Get weight health range for this pet
    const healthRange = WeightMonitoringService.estimateIdealWeight(pet.type, pet.breed);
    setWeightHealthRange(healthRange);
  }, [pet]);

  const handleCategoryToggle = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <PriorityHighIcon color="error" />;
      case 'medium':
        return <PriorityMediumIcon color="warning" />;
      case 'low':
        return <PriorityLowIcon color="info" />;
      default:
        return <PriorityLowIcon />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
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

  const getCategoryLabel = (category: string) => {
    const vaccineT = vaccineLocalization[currentLanguage as keyof typeof vaccineLocalization];
    switch (category) {
      case 'mandatory':
        return vaccineT.mandatory;
      case 'recommended':
        return vaccineT.recommended;
      case 'preventative':
        return vaccineT.preventativeTreatments;
      default:
        return category;
    }
  };

  const getVaccineLocalizedName = (vaccineName: string) => {
    const vaccineT = vaccineLocalization[currentLanguage as keyof typeof vaccineLocalization];
    
    // Map vaccine names to localized versions
    const nameMap: Record<string, string> = {
      'Rabies': vaccineT.rabies,
      'Quadrivalent Vaccine': vaccineT.quadrivalentVaccine,
      'Feline Leukemia Virus (FeLV)': vaccineT.felineLeukemiaVirus,
      'Hexavalent Vaccine': vaccineT.hexavalentVaccine,
      'Spirocerca Lupi (Park Worm) Prevention': vaccineT.spirocercaLupi,
      'Fleas & Ticks Prevention': vaccineT.fleasAndTicks,
      'Internal Parasites': vaccineT.internalParasites,
    };
    
    return nameMap[vaccineName] || vaccineName;
  };

  const getVaccineDescription = (vaccineName: string) => {
    const vaccineT = vaccineLocalization[currentLanguage as keyof typeof vaccineLocalization];
    
    // Map vaccine names to localized descriptions
    const descMap: Record<string, string> = {
      'Rabies': vaccineT.rabiesDescription,
      'Quadrivalent Vaccine': vaccineT.quadrivalentDescription,
      'Feline Leukemia Virus (FeLV)': vaccineT.felvDescription,
      'Hexavalent Vaccine': vaccineT.hexavalentDescription,
      'Spirocerca Lupi (Park Worm) Prevention': vaccineT.spirocercaDescription,
      'Fleas & Ticks Prevention': pet.type === 'dog' ? vaccineT.fleasTicksDogDescription : vaccineT.fleasTicksDescription,
      'Internal Parasites': vaccineT.internalParasitesDescription,
    };
    
    return descMap[vaccineName] || '';
  };

  const groupSuggestionsByCategory = () => {
    const grouped: Record<string, VaccineSuggestion[]> = {};
    suggestions.forEach(suggestion => {
      if (!grouped[suggestion.category]) {
        grouped[suggestion.category] = [];
      }
      grouped[suggestion.category].push(suggestion);
    });
    return grouped;
  };

  const groupedSuggestions = groupSuggestionsByCategory();

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            {t('vaccines.noSuggestions')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VaccinesIcon color="primary" />
              <Typography variant="h6">
                {vaccineLocalization[currentLanguage as keyof typeof vaccineLocalization].smartSuggestions}
              </Typography>
            </Box>
          }
          subheader={`${t('vaccines.basedOnAge')} • ${t('vaccines.basedOnLifestyle')}`}
        />
        <CardContent>
          {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  p: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => handleCategoryToggle(category)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {getCategoryLabel(category)}
                  </Typography>
                  <Chip
                    label={categorySuggestions.length}
                    size="small"
                    color={getPriorityColor(categorySuggestions[0]?.priority || 'low')}
                  />
                </Box>
                <IconButton size="small">
                  {expandedCategories.has(category) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedCategories.has(category)}>
                <List dense>
                  {categorySuggestions.map((suggestion, index) => (
                    <ListItem
                      key={`${suggestion.vaccine.name}-${index}`}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: suggestion.isOverdue ? 'error.light' : 'background.paper',
                      }}
                    >
                      <ListItemIcon>
                        {getPriorityIcon(suggestion.priority)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {getVaccineLocalizedName(suggestion.vaccine.name)}
                            </Typography>
                            {suggestion.isOverdue && (
                              <Chip
                                label={vaccineLocalization[currentLanguage as keyof typeof vaccineLocalization].overdue}
                                size="small"
                                color="error"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {getVaccineDescription(suggestion.vaccine.name)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Chip
                                label={suggestion.vaccine.frequency}
                                size="small"
                                variant="outlined"
                              />
                              {suggestion.dueDate && (
                                <Chip
                                  label={`${vaccineLocalization[currentLanguage as keyof typeof vaccineLocalization].nextDueDate}: ${suggestion.dueDate.toLocaleDateString()}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {suggestion.reason}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {onScheduleVaccine && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<ScheduleIcon />}
                            onClick={() => onScheduleVaccine(suggestion)}
                          >
                            {vaccineLocalization[currentLanguage as keyof typeof vaccineLocalization].createReminder}
                          </Button>
                        )}
                        {onViewDetails && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<InfoIcon />}
                            onClick={() => onViewDetails(suggestion)}
                          >
                            {t('common.details')}
                          </Button>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}

          {weightHealthRange && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>{t('vaccines.weightHealthInfo')}:</strong> {t('vaccines.idealWeightRange')}: {weightHealthRange.minWeight}-{weightHealthRange.maxWeight} {weightHealthRange.unit}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SmartVaccineSuggestions;
