import type { Pet } from '../../types/pets/pet';

export interface WeightRecord {
  id: number;
  petId: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  date: Date;
  notes?: string;
  source: 'manual' | 'vet' | 'auto';
}

export interface WeightTrend {
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // kg/week or lbs/week
  totalChange: number;
  period: number; // days
  isHealthy: boolean;
}

export interface WeightAlert {
  id: string;
  petId: number;
  type: 'sudden_change' | 'trend_warning' | 'health_range' | 'maintenance_needed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  date: Date;
  isAcknowledged: boolean;
  recommendedAction?: string;
}

export interface WeightHealthRange {
  minWeight: number;
  maxWeight: number;
  idealWeight: number;
  unit: 'kg' | 'lbs';
  source: 'breed_standard' | 'vet_recommendation' | 'historical_data';
}

export class WeightMonitoringService {
  private static readonly SUDDEN_CHANGE_THRESHOLD = 0.1; // 10% change in one week
  private static readonly TREND_WARNING_THRESHOLD = 0.05; // 5% change per week over 4 weeks
  private static readonly MIN_RECORDS_FOR_TREND = 3;
  
  /**
   * Calculate weight trend from historical data
   */
  static calculateWeightTrend(records: WeightRecord[]): WeightTrend | null {
    if (records.length < this.MIN_RECORDS_FOR_TREND) {
      return null;
    }
    
    // Sort records by date
    const sortedRecords = [...records].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate total change and period
    const firstRecord = sortedRecords[0];
    const lastRecord = sortedRecords[sortedRecords.length - 1];
    const totalChange = lastRecord.weight - firstRecord.weight;
    const period = (lastRecord.date.getTime() - firstRecord.date.getTime()) / (1000 * 60 * 60 * 24);
    
    // Calculate change rate (per week)
    const changeRate = (totalChange / period) * 7;
    
    // Determine direction
    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(changeRate) < 0.01) {
      direction = 'stable';
    } else if (changeRate > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }
    
    // Determine if trend is healthy
    const isHealthy = Math.abs(changeRate) <= this.TREND_WARNING_THRESHOLD;
    
    return {
      direction,
      changeRate: Math.abs(changeRate),
      totalChange,
      period,
      isHealthy
    };
  }
  
  /**
   * Detect sudden weight changes
   */
  static detectSuddenChanges(records: WeightRecord[], t?: (key: string) => string): WeightAlert[] {
    if (records.length < 2) return [];
    
    const alerts: WeightAlert[] = [];
    const sortedRecords = [...records].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    for (let i = 1; i < sortedRecords.length; i++) {
      const current = sortedRecords[i];
      const previous = sortedRecords[i - 1];
      
      // Calculate percentage change
      const changePercent = Math.abs(current.weight - previous.weight) / previous.weight;
      
      if (changePercent >= this.SUDDEN_CHANGE_THRESHOLD) {
        const alert: WeightAlert = {
          id: `sudden_change_${current.id}`,
          petId: current.petId,
          type: 'sudden_change',
          severity: changePercent >= 0.2 ? 'critical' : changePercent >= 0.15 ? 'high' : 'medium',
          message: t ? t('weight.suddenChange') : `Sudden weight ${current.weight > previous.weight ? 'gain' : 'loss'} of ${(changePercent * 100).toFixed(1)}% detected`,
          date: current.date,
          isAcknowledged: false,
          recommendedAction: t ? t('weight.consultVetNutrition') : 'Please consult with your veterinarian to rule out underlying health issues.'
        };
        
        alerts.push(alert);
      }
    }
    
    return alerts;
  }
  
  /**
   * Detect unhealthy weight trends
   */
  static detectTrendWarnings(records: WeightRecord[], t?: (key: string) => string): WeightAlert[] {
    const trend = this.calculateWeightTrend(records);
    if (!trend || trend.isHealthy) return [];
    
    const alert: WeightAlert = {
      id: `trend_warning_${records[0].petId}`,
      petId: records[0].petId,
      type: 'trend_warning',
      severity: trend.changeRate >= 0.1 ? 'high' : 'medium',
      message: t ? t('weight.trendWarning') : `Sustained weight ${trend.direction} trend detected: ${trend.changeRate.toFixed(2)} ${records[0].weightUnit}/week over ${Math.round(trend.period)} days`,
      date: new Date(),
      isAcknowledged: false,
      recommendedAction: t ? t('weight.consultVetNutrition') : `Monitor your pet's eating habits and activity level. Consider consulting your veterinarian if the trend continues.`
    };
    
    return [alert];
  }
  
  /**
   * Check if weight is within healthy range
   */
  static checkHealthRange(records: WeightRecord[], healthRange: WeightHealthRange, t?: (key: string) => string): WeightAlert[] {
    if (records.length === 0) return [];
    
    const latestRecord = records[records.length - 1];
    const alerts: WeightAlert[] = [];
    
    // Check if weight is below minimum
    if (latestRecord.weight < healthRange.minWeight) {
      alerts.push({
        id: `underweight_${latestRecord.petId}`,
        petId: latestRecord.petId,
        type: 'health_range',
        severity: 'high',
        message: t ? t('weight.weightOutsideRange').replace('{weight}', `${latestRecord.weight}`).replace('{unit}', latestRecord.weightUnit).replace('{range}', `${healthRange.minWeight}-${healthRange.maxWeight} ${latestRecord.weightUnit}`) : `Weight (${latestRecord.weight} ${latestRecord.weightUnit}) is below healthy minimum (${healthRange.minWeight} ${healthRange.weightUnit})`,
        date: new Date(),
        isAcknowledged: false,
        recommendedAction: t ? t('weight.consultVetNutrition') : 'Consult your veterinarian about proper nutrition and feeding schedule.'
      });
    }
    
    // Check if weight is above maximum
    if (latestRecord.weight > healthRange.maxWeight) {
      alerts.push({
        id: `overweight_${latestRecord.petId}`,
        petId: latestRecord.petId,
        type: 'health_range',
        severity: 'medium',
        message: t ? t('weight.weightOutsideRange').replace('{weight}', `${latestRecord.weight}`).replace('{unit}', latestRecord.weightUnit).replace('{range}', `${healthRange.minWeight}-${healthRange.maxWeight} ${latestRecord.weightUnit}`) : `Weight (${latestRecord.weight} ${latestRecord.weightUnit}) is above healthy maximum (${healthRange.maxWeight} ${latestRecord.weightUnit})`,
        date: new Date(),
        isAcknowledged: false,
        recommendedAction: t ? t('weight.considerDietExercise') : 'Consider adjusting diet and increasing exercise. Consult your veterinarian for a weight management plan.'
      });
    }
    
    return alerts;
  }
  
  /**
   * Generate maintenance reminders
   */
  static generateMaintenanceReminders(records: WeightRecord[]): WeightAlert[] {
    if (records.length === 0) return [];
    
    const alerts: WeightAlert[] = [];
    const latestRecord = records[records.length - 1];
    const daysSinceLastRecord = (new Date().getTime() - latestRecord.date.getTime()) / (1000 * 60 * 60 * 24);
    
    // Remind to weigh pet if it's been more than 30 days
    if (daysSinceLastRecord > 30) {
      alerts.push({
        id: `maintenance_${latestRecord.petId}`,
        petId: latestRecord.petId,
        type: 'maintenance_needed',
        severity: 'low',
        message: `It's been ${Math.round(daysSinceLastRecord)} days since the last weight measurement`,
        date: new Date(),
        isAcknowledged: false,
        recommendedAction: 'Regular weight monitoring helps track your pet\'s health. Consider weighing your pet monthly.'
      });
    }
    
    return alerts;
  }
  
  /**
   * Get all weight alerts for a pet
   */
  static getAllWeightAlerts(records: WeightRecord[], healthRange?: WeightHealthRange, t?: (key: string) => string): WeightAlert[] {
    const alerts: WeightAlert[] = [];
    
    // Detect sudden changes
    alerts.push(...this.detectSuddenChanges(records, t));
    
    // Detect trend warnings
    alerts.push(...this.detectTrendWarnings(records, t));
    
    // Check health range if provided
    if (healthRange) {
      alerts.push(...this.checkHealthRange(records, healthRange, t));
    }
    
    // Generate maintenance reminders
    alerts.push(...this.generateMaintenanceReminders(records));
    
    // Sort by severity and date
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      
      if (severityDiff !== 0) return severityDiff;
      
      return b.date.getTime() - a.date.getTime();
    });
  }
  
  /**
   * Get weight statistics
   */
  static getWeightStatistics(records: WeightRecord[]) {
    if (records.length === 0) return null;
    
    const weights = records.map(r => r.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const currentWeight = weights[weights.length - 1];
    
    // Calculate average weight
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const averageWeight = totalWeight / weights.length;
    
    // Calculate weight change from first to last record
    const firstWeight = weights[0];
    const weightChange = currentWeight - firstWeight;
    const weightChangePercent = (weightChange / firstWeight) * 100;
    
    return {
      currentWeight,
      minWeight,
      maxWeight,
      averageWeight,
      weightChange,
      weightChangePercent,
      totalRecords: records.length,
      firstRecordDate: records[0].date,
      lastRecordDate: records[records.length - 1].date
    };
  }
  
  /**
   * Convert weight between units
   */
  static convertWeight(weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number {
    if (fromUnit === toUnit) return weight;
    
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return weight * 2.20462;
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
      return weight / 2.20462;
    }
    
    return weight;
  }
  
  /**
   * Estimate ideal weight based on breed standards (simplified)
   */
  static estimateIdealWeight(petType: string, breed?: string): WeightHealthRange | null {
    // This is a simplified estimation - in a real app, you'd have breed-specific data
    let minWeight: number;
    let maxWeight: number;
    let idealWeight: number;
    
    if (petType === 'dog') {
      if (breed?.toLowerCase().includes('chihuahua') || breed?.toLowerCase().includes('toy')) {
        minWeight = 1.5;
        maxWeight = 3.5;
        idealWeight = 2.5;
      } else if (breed?.toLowerCase().includes('labrador') || breed?.toLowerCase().includes('golden')) {
        minWeight = 25;
        maxWeight = 35;
        idealWeight = 30;
      } else if (breed?.toLowerCase().includes('french bulldog')) {
        minWeight = 8;
        maxWeight = 14;
        idealWeight = 11;
      } else if (breed?.toLowerCase().includes('german shepherd')) {
        minWeight = 22;
        maxWeight = 40;
        idealWeight = 31;
      } else {
        // Default medium dog
        minWeight = 15;
        maxWeight = 25;
        idealWeight = 20;
      }
    } else if (petType === 'cat') {
      if (breed?.toLowerCase().includes('maine coon')) {
        minWeight = 4.5;
        maxWeight = 8;
        idealWeight = 6;
      } else if (breed?.toLowerCase().includes('russian blue')) {
        minWeight = 3.5;
        maxWeight = 5.5;
        idealWeight = 4.5;
      } else {
        // Default cat
        minWeight = 3.5;
        maxWeight = 5.5;
        idealWeight = 4.5;
      }
    } else {
      return null;
    }
    
    return {
      minWeight,
      maxWeight,
      idealWeight,
      unit: 'kg',
      source: 'breed_standard'
    };
  }

  /**
   * Check if pet weight is outside healthy range and generate warnings
   */
  static getWeightWarnings(currentWeight: number, healthRange: WeightHealthRange, petName: string, t?: (key: string) => string, petAge?: number): WeightAlert[] {
    const warnings: WeightAlert[] = [];
    const { minWeight, maxWeight, unit } = healthRange;
    
    // Skip weight warnings for pets under 1 year old
    if (petAge !== undefined && petAge < 1) {
      return warnings;
    }
    
    // Calculate 20% thresholds
    const belowThreshold = minWeight * 0.8; // 20% below min weight
    const aboveThreshold = maxWeight * 1.2; // 20% above max weight
    
    if (currentWeight < belowThreshold) {
      warnings.push({
        id: `underweight_${petName}`,
        petId: 0, // Will be set by caller
        type: 'health_range',
        severity: 'high',
        message: t ? t('weight.belowAverageWeightMessage') : `${petName} seems to be below the average weight for its breed`,
        date: new Date(),
        isAcknowledged: false,
        recommendedAction: t ? t('weight.consultVetNutrition') : 'Please consult your veterinarian about proper nutrition and feeding schedule.'
      });
    } else if (currentWeight > aboveThreshold) {
      warnings.push({
        id: `overweight_${petName}`,
        petId: 0, // Will be set by caller
        type: 'health_range',
        severity: 'medium',
        message: t ? t('weight.aboveAverageWeightMessage') : `${petName} seems to be above the average weight for its breed`,
        date: new Date(),
        isAcknowledged: false,
        recommendedAction: t ? t('weight.considerDietExercise') : 'Consider adjusting diet and increasing exercise. Consult your veterinarian for a weight management plan.'
      });
    }
    
    return warnings;
  }
}

export default WeightMonitoringService;
