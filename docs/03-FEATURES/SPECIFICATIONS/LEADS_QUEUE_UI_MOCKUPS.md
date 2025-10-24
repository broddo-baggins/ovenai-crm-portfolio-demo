# 🎨 Leads Queue UI Mockups & Design Guide
**Visual Reference for Feature Implementation**

---

## 📱 Responsive Design Grid

```
Desktop (1920px)      Tablet (768px)       Mobile (375px)
┌─────────────────┐   ┌──────────────┐    ┌──────────┐
│  70%  │   30%   │   │     100%     │    │   100%   │
│ Queue │ Metrics │   │    Queue     │    │  Queue   │
│ List  │  Panel  │   │─────────────│    │──────────│
│       │         │   │   Metrics    │    │ Metrics  │
└───────┴─────────┘   └──────────────┘    └──────────┘
```

---

## 🖼️ Queue Management Dashboard Mockup

### **Desktop View (Light Mode)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🍞 Dashboard > Leads > Queue Management                          👤 Michal│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐
│ │ 📋 Queue Management                                      [ ? Help ]   │
│ │                                                                       │
│ │ Manage your WhatsApp message queue for automated lead outreach       │
│ └──────────────────────────────────────────────────────────────────────┘
│                                                                          │
│ ┌────────────────────────────────────────┬─────────────────────────────┐
│ │ Queue Controls                          │ Live Metrics                │
│ │ ┌─────────────┐ ┌──────────────┐       │ ┌───────────┐ ┌───────────┐ │
│ │ │ ▶ Start     │ │ ⏸ Pause      │       │ │    45     │ │    12     │ │
│ │ │ Processing  │ │ Processing   │       │ │ In Queue  │ │Processing │ │
│ │ └─────────────┘ └──────────────┘       │ └───────────┘ └───────────┘ │
│ │                                         │ ┌───────────┐ ┌───────────┐ │
│ │ ┌─────────────┐ ┌──────────────┐       │ │   156     │ │   95%     │ │
│ │ │ + Add to    │ │ 🔄 Refresh   │       │ │ Sent Today│ │Success Rate│
│ │ │   Queue (3) │ │              │       │ └───────────┘ └───────────┘ │
│ │ └─────────────┘ └──────────────┘       │                             │
│ └────────────────────────────────────────┴─────────────────────────────┘
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐
│ │ Filters & Search                                                      │
│ │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐            │
│ │ │ 🔍 Search...   │ │ Status: All  ▼ │ │Priority: All ▼ │            │
│ │ └────────────────┘ └────────────────┘ └────────────────┘            │
│ │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐            │
│ │ │Temperature:All▼│ │ Schedule ▼     │ │ □ Select All   │            │
│ │ └────────────────┘ └────────────────┘ └────────────────┘            │
│ └──────────────────────────────────────────────────────────────────────┘
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐
│ │ Queue Items (45)                                          ↑↓ Sort     │
│ ├──────────────────────────────────────────────────────────────────────┤
│ │ □  Lead Name       Phone          Priority  Status    Schedule  Error │
│ ├──────────────────────────────────────────────────────────────────────┤
│ │ ☑  David Cohen     +972-52-1234   🔴 High   ⏱ Pending  10:00 AM  -   │
│ │ ☑  Sarah Levi      +972-54-5678   🟡 Normal ⚡ Process. 10:05 AM  -   │
│ │ □  Moshe Ben-David +972-50-9012   🔴 High   ✅ Sent     10:10 AM  -   │
│ │ □  Rachel Green    +972-52-3456   🟢 Low    ❌ Failed   10:15 AM  429 │
│ │ ☑  Yossi Klein     +972-54-7890   🟡 Normal ⏱ Pending  10:20 AM  -   │
│ │ ...                                                                    │
│ └──────────────────────────────────────────────────────────────────────┘
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐
│ │ Bulk Actions Bar (3 selected)                                         │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│ │ │Set Priority▼│ │Schedule... │ │ Cancel      │ │Clear Select.│     │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │
│ └──────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

### **Dark Mode Version**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🍞 Dashboard > Leads > Queue Management                          👤 Michal│
├─────────────────────────────────────────────────────────────────────────┤
│ ████████████████████████████████████████████████████████████████████████│
│ █ 📋 Queue Management                                      [ ? Help ]   █
│ █                                                                       █
│ █ Manage your WhatsApp message queue for automated lead outreach       █
│ ████████████████████████████████████████████████████████████████████████│
│ ████████████████████████████████████████████████████████████████████████│
│ █ Queue Controls                          █ Live Metrics                █
│ █ ███████████████ ██████████████          █ ███████████ ███████████     █
│ █ █ ▶ Start     █ █ ⏸ Pause     █          █ █    45    █ █    12    █     █
│ █ █ Processing  █ █ Processing  █          █ █ In Queue █ █Processing█     █
│ █ ███████████████ ██████████████          █ ███████████ ███████████     █
│ ████████████████████████████████████████████████████████████████████████│
```

---

## 🎛️ Component Specifications

### **1. Queue Control Panel**

```
┌─────────────────────────────────────┐
│ Queue Controls         [ℹ️ Info]     │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────┐     ┌───────────┐   │
│  │    ▶️      │     │    ⏸️     │   │ 
│  │   Start    │     │   Pause   │   │
│  │Processing  │     │Processing │   │
│  └───────────┘     └───────────┘   │
│                                     │
│  Status: ● Active (Processing)      │
│  Next run: in 45 seconds            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ + Add Selected to Queue (3) │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

States:
- Idle (gray)
- Processing (green pulse)
- Paused (yellow)
- Error (red)
```

### **2. Metrics Dashboard**

```
┌─────────────────────────────────────┐
│ Today's Performance                 │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │   45    │ │   12    │ │  156    ││
│ │ Queued  │ │ Active  │ │  Sent   ││
│ │  📋     │ │  ⚡     │ │   ✅    ││
│ └─────────┘ └─────────┘ └─────────┘│
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │   8     │ │  95%    │ │  22/hr  ││
│ │ Failed  │ │Success  │ │ Rate    ││
│ │  ❌     │ │  📊     │ │  ⏱️    ││
│ └─────────┘ └─────────┘ └─────────┘│
│                                     │
│ Progress: ████████████░░░ 78%       │
│ Daily Target: 156/200               │
└─────────────────────────────────────┘
```

### **3. Lead Item Row**

```
Light Mode:
┌──────────────────────────────────────────────────────────┐
│ □  David Cohen      🔴 High    ⏱️ Pending   10:00 AM     │
│    +972-52-123456   Score: 85  Last: 7 days ago         │
└──────────────────────────────────────────────────────────┘

Dark Mode:
████████████████████████████████████████████████████████████
█ □  David Cohen      🔴 High    ⏱️ Pending   10:00 AM     █
█    +972-52-123456   Score: 85  Last: 7 days ago         █
████████████████████████████████████████████████████████████

Hover State:
┌──────────────────────────────────────────────────────────┐
│ □  David Cohen      🔴 High    ⏱️ Pending   10:00 AM     │
│    +972-52-123456   Score: 85  Last: 7 days ago         │
│ ┌──────┐ ┌────────┐ ┌────────┐ ┌──────────┐            │
│ │ View │ │Priority│ │Schedule│ │  Cancel  │            │
│ └──────┘ └────────┘ └────────┘ └──────────┘            │
└──────────────────────────────────────────────────────────┘
```

---

## 🌍 RTL (Hebrew) Layout

### **Hebrew Interface - Right-to-Left**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ מיכל 👤                          ניהול תור < לידים < לוח בקרה 🍞        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐
│ │                                   [ עזרה ? ]      ניהול תור 📋        │
│ │                                                                       │
│ │       נהל את תור ההודעות שלך בוואטסאפ לפנייה אוטומטית ללידים       │
│ └──────────────────────────────────────────────────────────────────────┘
│                                                                          │
│ ┌─────────────────────────────┬────────────────────────────────────────┐
│ │         מדדים חיים          │           בקרות התור                   │
│ │ ┌───────────┐ ┌───────────┐ │       ┌──────────────┐ ┌─────────────┐ │
│ │ │    12     │ │    45     │ │       │    השהה  ⏸   │ │  התחל    ▶  │ │
│ │ │  בעיבוד  │ │  בתור    │ │       │    עיבוד     │ │   עיבוד     │ │
│ │ └───────────┘ └───────────┘ │       └──────────────┘ └─────────────┘ │
│ │ ┌───────────┐ ┌───────────┐ │                                        │
│ │ │   95%     │ │   156     │ │       ┌──────────────┐ ┌─────────────┐ │
│ │ │אחוז הצלחה│ │נשלחו היום│ │       │              │ │ + הוסף      │ │
│ │ └───────────┘ └───────────┘ │       │   רענן 🔄    │ │ לתור (3)    │ │
│ │                             │       └──────────────┘ └─────────────┘ │
│ └─────────────────────────────┴────────────────────────────────────────┘
```

### **RTL Status Badges**

```
Hebrew Status Labels:
⏱️ ממתין    ⚡ בעיבוד    ✅ נשלח    ❌ נכשל

Priority Labels:
🔴 דחוף    🟡 רגיל    🟢 נמוך    ⚡ מיידי
```

---

## 📐 Spacing & Typography

### **Design Tokens**

```css
/* Spacing Scale */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;

/* Typography Scale */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-full: 9999px;

/* Queue-Specific Colors */
--queue-pending: #6B7280;    /* Gray */
--queue-processing: #3B82F6; /* Blue */
--queue-sent: #10B981;       /* Green */
--queue-failed: #EF4444;     /* Red */

/* Priority Colors */
--priority-immediate: #7C3AED; /* Purple */
--priority-high: #DC2626;      /* Red */
--priority-normal: #F59E0B;    /* Yellow */
--priority-low: #10B981;       /* Green */
```

---

## 📱 Mobile Responsive Views

### **Mobile Queue List (375px)**

```
┌─────────────────────┐
│ Queue (45)     ☰ │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ 🔍 Search...    │ │
│ └─────────────────┘ │
│ ┌────┐ ┌────┐ ┌────┐│
│ │All▼│ │Pri▼│ │+Add││
│ └────┘ └────┘ └────┘│
├─────────────────────┤
│ David Cohen         │
│ +972-52-123456      │
│ 🔴 High  ⏱️ Pending  │
│ ─────────────────── │
│ Sarah Levi          │
│ +972-54-567890      │
│ 🟡 Normal ⚡ Active  │
│ ─────────────────── │
│ Moshe Ben-David     │
│ +972-50-901234      │
│ 🔴 High  ✅ Sent     │
└─────────────────────┘

Bottom Navigation:
┌─────────────────────┐
│  Queue │ Metrics │  │
│   📋   │   📊    │  │
└─────────────────────┘
```

### **Mobile Metrics View**

```
┌─────────────────────┐
│ Today's Metrics  ⟲  │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Queued     45   │ │
│ │ Active     12   │ │
│ │ Sent      156   │ │
│ │ Failed      8   │ │
│ └─────────────────┘ │
│                     │
│ Success Rate: 95%   │
│ ██████████████░ 78% │
│ Daily: 156/200      │
│                     │
│ ┌─────────────────┐ │
│ │ ▶️ Start Queue   │ │
│ └─────────────────┘ │
└─────────────────────┘
```

---

## 🎯 Interaction States

### **Button States**

```
Default:
┌─────────────┐
│   Button    │
└─────────────┘

Hover:
┌─────────────┐
│  Button ↗️  │ (slight scale)
└─────────────┘

Active/Pressed:
┌─────────────┐
│  Button ↘️  │ (slight depress)
└─────────────┘

Disabled:
┌─────────────┐
│  Button 🚫  │ (50% opacity)
└─────────────┘

Loading:
┌─────────────┐
│  ⟳ Loading  │ (spinner)
└─────────────┘
```

### **Queue Item Selection**

```
Unselected:
□ Lead Name

Hover:
□ Lead Name (background highlight)

Selected:
☑ Lead Name (checkbox filled)

Processing:
⟳ Lead Name (spinner replaces checkbox)
```

---

## 🔔 Notification Patterns

### **Success Notification**

```
┌──────────────────────────────────┐
│ ✅ Success!                   ✕  │
│ 23 leads added to queue          │
└──────────────────────────────────┘
```

### **Error Notification**

```
┌──────────────────────────────────┐
│ ❌ Error                      ✕  │
│ Daily capacity exceeded (250/200)│
│ [View Details]                   │
└──────────────────────────────────┘
```

### **Warning Notification**

```
┌──────────────────────────────────┐
│ ⚠️ Warning                    ✕  │
│ Approaching rate limit (950/1000)│
└──────────────────────────────────┘
```

---

## 🎨 Component Library Integration

### **Using Shadcn/ui Components**

```tsx
// Card Component Usage
<Card>
  <CardHeader>
    <CardTitle>Queue Management</CardTitle>
    <CardDescription>
      Manage your WhatsApp message queue
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Queue content */}
  </CardContent>
</Card>

// Badge Variants
<Badge variant="default">Processing</Badge>
<Badge variant="success">Sent</Badge>
<Badge variant="destructive">Failed</Badge>
<Badge variant="outline">Pending</Badge>

// Button Variants
<Button variant="default">Start Queue</Button>
<Button variant="outline">Pause</Button>
<Button variant="ghost">Refresh</Button>
<Button variant="destructive">Cancel All</Button>
```

---

## 📊 Empty States

### **No Items in Queue**

```
┌─────────────────────────────────────┐
│                                     │
│            📋                       │
│                                     │
│      Your queue is empty            │
│                                     │
│   Select leads from your database   │
│   to start automated messaging      │
│                                     │
│    ┌──────────────────────┐        │
│    │  Browse Leads →      │        │
│    └──────────────────────┘        │
│                                     │
└─────────────────────────────────────┘
```

### **Error State**

```
┌─────────────────────────────────────┐
│                                     │
│            ⚠️                       │
│                                     │
│    Unable to load queue data        │
│                                     │
│   Please check your connection      │
│      and try again                  │
│                                     │
│    ┌──────────────────────┐        │
│    │     Retry 🔄         │        │
│    └──────────────────────┘        │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎬 Animation Guidelines

### **Transitions**

```css
/* Standard transition */
transition: all 0.2s ease-in-out;

/* Status badge updates */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Processing indicator */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Queue item appear */
@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 🔍 Accessibility Checklist

- [ ] All interactive elements have keyboard navigation
- [ ] ARIA labels for status indicators
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Focus indicators visible
- [ ] Screen reader announcements for status changes
- [ ] Reduced motion support
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] Error messages associated with form fields

---

**UI Design Version**: 1.0  
**Last Updated**: January 2024  
**Design System**: Shadcn/ui + Custom  
**Designer**: OvenAI UX Team 