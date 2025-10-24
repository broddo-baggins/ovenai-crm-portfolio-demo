# Dashboard Refactoring Plan

## Overview
The dashboard components have accumulated technical debt with deprecated components, oversized files, and duplicated functionality. This plan outlines the refactoring strategy.

## Deprecated Components to Remove

### 1. StatCard.tsx & StatsCard.tsx
- **Status**: Marked as @deprecated
- **Action**: Replace all usages with `MetricCard` from `@/components/shared`
- **Files using these**:
  - Search for imports and replace with MetricCard
  - Update props to match MetricCard interface

### 2. Backup/Old Components
- **Files to delete**:
  - `NewCRMDashboard.backup.tsx`
  - `WorkingDashboard.tsx`
  - `SimpleDashboard.tsx`

## Components Requiring Major Refactoring

### 1. EnhancedDashboardExample.tsx (792 lines)
**Issues**:
- Too large and complex
- Mixes concerns (data fetching, UI, state management)
- Contains disabled legacy metrics

**Refactoring Strategy**:
```typescript
// Split into:
- EnhancedDashboard.tsx (main container)
- hooks/useDashboardMetrics.ts (data fetching logic)
- hooks/useDashboardWidgets.ts (widget management)
- components/DashboardMetricsGrid.tsx (metrics display)
- components/DashboardToolbar.tsx (controls)
```

### 2. GridDashboard.tsx
**Issues**:
- Missing proper TypeScript types
- Using old toolbar component

**Actions**:
- Add proper type definitions
- Integrate with new toolbar
- Improve resize logic

## New Architecture

```
src/components/dashboard/
├── core/
│   ├── DashboardContainer.tsx      # Main container
│   ├── DashboardProvider.tsx       # Context provider
│   └── DashboardLayout.tsx         # Layout wrapper
├── widgets/
│   ├── MetricCard.tsx              # Unified metric display
│   ├── ChartWidget.tsx             # Chart wrapper
│   └── ActivityWidget.tsx          # Activity feed
├── sections/
│   ├── StatsSection.tsx            # Stats grid
│   ├── ChartsSection.tsx           # Charts area
│   └── InsightsSection.tsx         # AI insights
├── mobile/
│   ├── MobileDashboard.tsx         # Mobile layout
│   └── SpringboardView.tsx         # iOS-style view
└── hooks/
    ├── useDashboardData.ts         # Data fetching
    ├── useWidgetManager.ts         # Widget state
    └── useAutoSave.ts              # Auto-save logic
```

## Implementation Steps

### Phase 1: Clean Up (Week 1)
1. Remove deprecated components
2. Update imports in existing files
3. Create MetricCard migration guide

### Phase 2: Refactor Core (Week 2)
1. Split EnhancedDashboardExample
2. Create new hooks for data/state
3. Implement proper TypeScript types

### Phase 3: Enhance Features (Week 3)
1. Add new widget types
2. Improve mobile experience
3. Add performance optimizations

### Phase 4: Testing & Documentation (Week 4)
1. Write comprehensive tests
2. Update documentation
3. Create migration guide

## Widget Standardization

### Standard Widget Interface
```typescript
interface BaseWidget {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  gridLayout: GridLayout;
  refreshInterval?: number;
  settings?: WidgetSettings;
}

interface MetricWidget extends BaseWidget {
  type: 'metric';
  value: number | string;
  trend?: TrendData;
  icon?: IconType;
}

interface ChartWidget extends BaseWidget {
  type: 'chart';
  chartType: 'line' | 'bar' | 'pie' | 'area';
  data: ChartData;
}
```

## Performance Optimizations

1. **Lazy Loading**: Load widgets on demand
2. **Memoization**: Use React.memo for widgets
3. **Virtual Scrolling**: For large widget lists
4. **Debounced Updates**: Batch layout changes

## Migration Guide

### For Developers
1. Replace StatCard/StatsCard imports:
   ```typescript
   // Before
   import { StatCard } from './StatCard';
   
   // After
   import { MetricCard } from '@/components/shared/MetricCard';
   ```

2. Update widget creation:
   ```typescript
   // Before
   <StatCard title="Total Leads" value={142} />
   
   // After
   <MetricCard 
     title="Total Leads" 
     value={142}
     variant="default"
   />
   ```

## Success Metrics
- [ ] All deprecated components removed
- [ ] EnhancedDashboard < 200 lines
- [ ] 100% TypeScript coverage
- [ ] Load time < 2 seconds
- [ ] Mobile experience rating > 4.5/5

## Timeline
- **Week 1**: Cleanup and preparation
- **Week 2**: Core refactoring
- **Week 3**: Feature enhancements
- **Week 4**: Testing and deployment

## Notes
- Maintain backward compatibility during migration
- Keep existing widget data structure
- Ensure mobile-first approach
- Focus on performance and accessibility 