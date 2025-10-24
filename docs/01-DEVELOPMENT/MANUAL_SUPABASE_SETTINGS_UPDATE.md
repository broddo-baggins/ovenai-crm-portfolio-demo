# 🔧 Manual Supabase Settings Update Guide

## How to Change User Settings from Hebrew to English in Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: **ajszzemkpenbfnghqiyz** (Site DB)

### Step 2: Open SQL Editor
1. Click on **SQL Editor** in the left sidebar
2. Click **+ New Query**

### Step 3: Update User Settings to English

```sql
-- 🔄 QUICK UPDATE TEST USER TO ENGLISH DEFAULTS

-- 1. Update App Preferences to English
UPDATE public.user_app_preferences 
SET 
    interface_settings = jsonb_set(
        jsonb_set(interface_settings, '{language}', '"en"'),
        '{rtl}', 'false'
    ),
    data_preferences = jsonb_set(
        jsonb_set(
            jsonb_set(data_preferences, '{currency}', '"USD"'),
            '{dateFormat}', '"MM/DD/YYYY"'
        ),
        '{timeFormat}', '"12h"'
    ),
    updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@test.test');

-- 2. Update Notification Settings to UTC
UPDATE public.user_notification_settings
SET 
    notification_schedule = jsonb_set(
        notification_schedule,
        '{timezone}',
        '"UTC"'
    ),
    updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@test.test');

-- 3. Verify Changes
SELECT 
    u.email,
    (uap.interface_settings->>'language') as language,
    (uap.data_preferences->>'currency') as currency,
    (uap.data_preferences->>'dateFormat') as date_format,
    (uns.notification_schedule->>'timezone') as timezone
FROM auth.users u
LEFT JOIN user_app_preferences uap ON u.id = uap.user_id
LEFT JOIN user_notification_settings uns ON u.id = uns.user_id
WHERE u.email = 'test@test.test';
```

### Step 4: Run the Query
1. Paste the SQL above into the editor
2. Click **RUN** button
3. Check the results in the bottom panel

### Step 5: Manual Table Editing (Alternative)

If you prefer GUI editing:

1. Click **Table Editor** in left sidebar
2. Select **user_app_preferences** table
3. Find your user's row
4. Click the **Edit** button (pencil icon)
5. Update the JSON fields:
   - `interface_settings` → change `"language": "he"` to `"language": "en"`
   - `data_preferences` → change `"currency": "ILS"` to `"currency": "USD"`

### Step 6: Verify in Application
1. Login to your app with test@test.test
2. Check that interface is in English
3. Check currency displays as USD
4. Verify dates show in MM/DD/YYYY format

## 🎯 Default Settings Summary

**English Defaults Applied:**
- Language: `en` (English)
- Currency: `USD` (US Dollar)
- Date Format: `MM/DD/YYYY` (US format)
- Time Format: `12h` (12-hour format)
- Timezone: `UTC` (Universal Time)
- RTL: `false` (Left-to-right)

**Hebrew Defaults (Previous):**
- Language: `he` (Hebrew)
- Currency: `ILS` (Israeli Shekel)
- Date Format: `DD/MM/YYYY` (Israeli format)
- Time Format: `24h` (24-hour format)
- Timezone: `Asia/Jerusalem`
- RTL: `true` (Right-to-left)

## 🚀 For New Users

All new users created after running our finalization script will automatically get English defaults. This affects:

1. **Admin Console User Creation** - Uses `initialize_user_for_edge_function()`
2. **Direct Supabase User Addition** - Manual initialization required
3. **API User Creation** - Uses updated edge function

## 🔧 Functions Available

- `initialize_complete_user_english(user_id, email)` - Full English initialization
- `initialize_user_for_edge_function(user_id, email, name, role, language, currency, timezone)` - Enhanced edge function version
- `meta_submission_readiness_check()` - Check system status 