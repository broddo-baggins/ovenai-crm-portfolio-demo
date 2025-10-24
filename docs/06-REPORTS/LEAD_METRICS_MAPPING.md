# Lead Metrics Mapping Documentation

## Overview
This document explains how the lead management system maps database fields to the requested metrics and statuses.

## Database Fields Used

### 1. Lead State Field (`state`)
The `state` field contains the following values:
- `new_lead`
- `contacted`
- `information_gathering`
- `demo_scheduled`
- `qualified`

### 2. Lead Status Field (`status`)
The `status` field contains the following values:
- `unqualified`
- `awareness`
- `consideration`
- `interest`
- `intent`
- `evaluation`
- `purchase_ready`

### 3. BANT Status Field (`bant_status`)
The `bant_status` field contains the following values:
- `no_bant`
- `budget_qualified`
- `authority_qualified`
- `need_qualified`
- `timing_qualified`
- `partially_qualified`
- `fully_qualified`

### 4. Confidence Score (`lead_metadata.ai_analysis.lead_qualification.confidence_score`)
A decimal value between 0 and 1 representing the AI's confidence in the lead quality.

## Status Mapping

### Requested Status → Database Field Mapping

| Requested Status | Database State/Status | Notes |
|-----------------|----------------------|-------|
| NEW | `state = 'new_lead'` | User hasn't responded |
| HOOK_SENT | `state = 'contacted'` | Initial message sent |
| ENGAGED | `status IN ('awareness', 'consideration')` | User in conversation |
| INTERESTED | `status = 'interest'` | User showing buying signals |
| WAITING_FOR_INFO | `state = 'information_gathering'` | User waiting for more info |
| QUALIFYING | `status IN ('intent', 'evaluation')` | User in qualifying state |
| MEETING_SET | `state = 'demo_scheduled'` | Meeting set |
| TALK_LATER | *Derived from metadata* | Not directly stored |
| UNINTERESTED | `status = 'unqualified'` | User uninterested |
| NOT_RESPONDING | *Calculated* | `interaction_count = 0 AND days_since_created > 7` |
| TALK_TO_SOMEONE_ELSE | *Derived from notes* | Not directly stored |
| DEAD | *Calculated* | `interaction_count = 0 AND days_since_created > 30` |
| CONVERTED | `state = 'qualified' OR status = 'purchase_ready'` | Successfully closed |

## Heat Level Mapping (Confidence Score)

The heat level is calculated from the `confidence_score` (0-1 range):

| Heat Level | Confidence Score Range | Emoji | Description |
|-----------|----------------------|-------|-------------|
| FROZEN | 0.00 - 0.10 | 🧊 | Dead leads, no engagement |
| ICE_COLD | 0.11 - 0.20 | ❄️ | Minimal interest |
| COLD | 0.21 - 0.35 | 🌨️ | Some engagement |
| COOL | 0.36 - 0.50 | 🌤️ | Moderate interest |
| WARM | 0.51 - 0.65 | 🌡️ | Good engagement |
| HOT | 0.66 - 0.80 | 🔥 | High interest |
| BURNING | 0.81 - 0.95 | 🌋 | Urgent opportunity |
| WHITE_HOT | 0.96 - 1.00 | ⚡ | Ready to close |

## Key Metrics Queries

### 1. Total Leads by State
```sql
SELECT state, COUNT(*) as count 
FROM leads 
WHERE current_project_id = :projectId
GROUP BY state;
```

### 2. Heat Distribution
```sql
SELECT 
  lead_metadata->'ai_analysis'->'lead_qualification'->>'confidence_score' as confidence,
  COUNT(*) as count
FROM leads
WHERE current_project_id = :projectId
GROUP BY confidence;
```

### 3. BANT Qualification Rate
```sql
SELECT 
  bant_status,
  COUNT(*) as count,
  (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()) as percentage
FROM leads
WHERE current_project_id = :projectId
GROUP BY bant_status;
```

### 4. Active Conversations
Leads with `interaction_count > 0` and `state != 'qualified'`

### 5. Meetings Set
Leads with `state = 'demo_scheduled'`

## Dashboard Implementation

The `LeadMetricsService` provides the following methods:

1. **getLeadMetrics()** - Returns all metrics in one call
2. **getStatusDistribution()** - Returns mapped status counts
3. **getHeatAnalytics()** - Returns heat level distribution and average confidence score
4. **getBANTQualificationRate()** - Returns BANT qualification percentage and distribution

## Missing Data Handling

Some requested statuses don't have direct database fields:

- **TALK_LATER**: Could be derived from follow-up date or notes
- **TALK_TO_SOMEONE_ELSE**: Could be extracted from conversation analysis
- **NOT_RESPONDING/DEAD**: Calculated based on interaction count and time since creation

These can be implemented through:
1. Additional metadata fields
2. Conversation analysis
3. Time-based calculations
4. Custom status flags in `state_status_metadata` 