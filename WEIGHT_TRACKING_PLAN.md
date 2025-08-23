# 🏥 Weight Tracking System - Implementation Plan

## **📊 Overview**
Enhanced weight tracking system with historical data, trend analysis, and health warnings for pets.

## **🎯 Features to Implement**

### **1. Historical Weight Records**
- Store multiple weight entries with timestamps
- Track weight changes over time
- Support different measurement units (kg/lb)
- Associate weights with age/growth phases

### **2. Weight Analysis & Trends**
- Calculate weight gain/loss trends
- Identify rapid weight changes
- Growth curve analysis for young pets
- Seasonal weight pattern detection

### **3. Health Warnings & Alerts**
- **Rapid Weight Loss**: >10% in 2 weeks
- **Rapid Weight Gain**: >15% in 1 month  
- **Underweight Alert**: Below breed standard
- **Overweight Alert**: Above healthy range
- **Senior Pet Monitoring**: Enhanced tracking for older pets

### **4. Breed-Based Standards**
- Import breed-specific weight ranges
- Age-appropriate weight guidelines
- Size category standards (XS, S, M, L, XL)
- Gender-based variations

### **5. Visual Dashboard**
- Weight trend charts (line graphs)
- BMI/body condition indicators
- Growth percentile charts for puppies/kittens
- Comparison with breed standards

## **🔧 Technical Implementation**

### **Backend Models**

```python
class WeightRecordORM(Base):
    __tablename__ = "weight_records"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pet_id: Mapped[int] = mapped_column(Integer, ForeignKey("pets.id"))
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    weight_unit: Mapped[str] = mapped_column(String, default="kg")
    recorded_date: Mapped[date] = mapped_column(Date, nullable=False)
    recorded_by: Mapped[str] = mapped_column(String, nullable=True)  # user, vet, auto
    measurement_type: Mapped[str] = mapped_column(String, default="manual")  # manual, vet, smart_scale
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_condition_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-9 scale
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    pet: Mapped["PetORM"] = relationship("PetORM", back_populates="weight_records")

class WeightAlertORM(Base):
    __tablename__ = "weight_alerts"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pet_id: Mapped[int] = mapped_column(Integer, ForeignKey("pets.id"))
    alert_type: Mapped[str] = mapped_column(String, nullable=False)  # rapid_loss, rapid_gain, underweight, overweight
    severity: Mapped[str] = mapped_column(String, default="medium")  # low, medium, high, critical
    message: Mapped[str] = mapped_column(Text, nullable=False)
    triggered_date: Mapped[date] = mapped_column(Date, nullable=False)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    pet: Mapped["PetORM"] = relationship("PetORM", back_populates="weight_alerts")
```

### **API Endpoints**

```
POST   /pets/{pet_id}/weight-records    # Add new weight record
GET    /pets/{pet_id}/weight-records    # Get weight history with pagination
PUT    /weight-records/{record_id}      # Update weight record
DELETE /weight-records/{record_id}      # Delete weight record
GET    /pets/{pet_id}/weight-analysis   # Get weight analysis & trends
GET    /pets/{pet_id}/weight-alerts     # Get active weight alerts
POST   /weight-alerts/{alert_id}/acknowledge  # Acknowledge alert
```

### **Frontend Components**

```typescript
// Types
interface WeightRecord {
  id?: number;
  petId: number;
  weightKg: number;
  weightUnit: 'kg' | 'lb';
  recordedDate: string;
  recordedBy?: string;
  measurementType: 'manual' | 'vet' | 'smart_scale';
  notes?: string;
  bodyConditionScore?: number;
  createdAt?: string;
}

interface WeightAnalysis {
  petId: number;
  currentWeight: number;
  previousWeight?: number;
  weightChange: number;
  weightChangePercent: number;
  trend: 'stable' | 'increasing' | 'decreasing';
  healthStatus: 'underweight' | 'healthy' | 'overweight' | 'obese';
  breedStandardRange: { min: number; max: number };
  recommendations: string[];
}

interface WeightAlert {
  id: number;
  petId: number;
  alertType: 'rapid_loss' | 'rapid_gain' | 'underweight' | 'overweight';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  triggeredDate: string;
  acknowledged: boolean;
}
```

### **Weight Analysis Logic**

```typescript
// Calculate weight change percentage
const calculateWeightChange = (current: number, previous: number): number => {
  return ((current - previous) / previous) * 100;
};

// Determine health status based on breed standards
const determineHealthStatus = (
  weight: number, 
  breedRange: { min: number; max: number }
): 'underweight' | 'healthy' | 'overweight' | 'obese' => {
  const ratio = weight / breedRange.max;
  
  if (weight < breedRange.min * 0.85) return 'underweight';
  if (weight > breedRange.max * 1.3) return 'obese';
  if (weight > breedRange.max * 1.15) return 'overweight';
  return 'healthy';
};

// Generate health recommendations
const generateRecommendations = (
  analysis: WeightAnalysis, 
  pet: Pet
): string[] => {
  const recommendations: string[] = [];
  
  if (analysis.healthStatus === 'overweight') {
    recommendations.push('Consider reducing portion sizes by 10-15%');
    recommendations.push('Increase daily exercise by 10-15 minutes');
    recommendations.push('Consult your veterinarian about a weight management plan');
  }
  
  if (Math.abs(analysis.weightChangePercent) > 10) {
    recommendations.push('Schedule a veterinary checkup for rapid weight change');
  }
  
  return recommendations;
};
```

## **📅 Implementation Phases**

### **Phase 1: Basic Weight Records (Week 1)**
- [x] Create WeightRecord model and API
- [x] Add weight recording form component
- [x] Weight history display with basic chart
- [x] CRUD operations for weight records

### **Phase 2: Analysis & Alerts (Week 2)**
- [ ] Implement weight analysis algorithms
- [ ] Create alert system and models
- [ ] Build weight trend visualization
- [ ] Add health status indicators

### **Phase 3: Advanced Features (Week 3)**
- [ ] Breed-specific weight standards
- [ ] Body condition scoring
- [ ] Export weight reports
- [ ] Smart scale integration prep

### **Phase 4: Integration & Polish (Week 4)**
- [ ] Integrate with medical records
- [ ] Notification system integration
- [ ] Mobile app optimization
- [ ] Performance optimization

## **🎨 UI/UX Mockups**

### **Weight Tracking Dashboard**
```
┌─────────────────────────────────────────────────────────┐
│ Max's Weight Tracking                    [+ Add Weight] │
├─────────────────────────────────────────────────────────┤
│ Current: 28.5 kg    Previous: 27.2 kg    Change: +4.8% │
│ Status: ⚠️ Slight Overweight                            │
├─────────────────────────────────────────────────────────┤
│                Weight Trend Chart                       │
│   30kg ┌────────────────────────────────────────┐     │
│        │    ·─────·─────·─────·─────·─────·     │     │
│   25kg │                                        │     │
│        │                                        │     │
│   20kg └────────────────────────────────────────┘     │
│         Jan   Feb   Mar   Apr   May   Jun              │
├─────────────────────────────────────────────────────────┤
│ 🚨 Active Alerts                                        │
│ • Rapid weight gain detected (+4.8% in 2 weeks)        │
│                                                         │
│ 💡 Recommendations                                      │
│ • Reduce portion size by 10%                           │
│ • Schedule vet checkup                                  │
└─────────────────────────────────────────────────────────┘
```

## **⚠️ Health Alert Thresholds**

| Alert Type | Threshold | Severity |
|------------|-----------|----------|
| Rapid Loss | >10% in 2 weeks | High |
| Rapid Gain | >15% in 1 month | Medium |
| Severe Loss | >20% in 1 month | Critical |
| Underweight | <85% of breed min | Medium |
| Overweight | >115% of breed max | Medium |
| Obese | >130% of breed max | High |

## **🏁 Success Metrics**

1. **Data Accuracy**: Precise weight tracking with trend analysis
2. **Early Detection**: Alert system catches health issues early
3. **User Engagement**: Regular weight recording by pet owners
4. **Health Outcomes**: Improved pet health through monitoring
5. **Veterinary Integration**: Seamless data sharing with vets

---

**Status**: 📋 Planning Complete - Ready for Implementation
**Priority**: High - Critical for comprehensive pet health management

