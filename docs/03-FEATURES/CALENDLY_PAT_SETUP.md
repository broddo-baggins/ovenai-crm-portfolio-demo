# Calendly Personal Access Token (PAT) Setup Guide

## ✅ No Developer Account Required!

This guide shows you how to connect Calendly to OvenAI using a **Personal Access Token (PAT)** - a much simpler method that doesn't require creating a developer account.

## 🔄 Why Use PAT Instead of OAuth?

| Method | PAT (Recommended) | OAuth (Complex) |
|--------|------------------|-----------------|
| **Developer Account** | ❌ Not required | ✅ Required |
| **Setup Time** | 2 minutes | 30+ minutes |
| **Maintenance** | None | Token refresh handling |
| **Works With** | All Calendly plans | Developer accounts only |
| **Security** | Secure & encrypted | Enterprise-grade |

## 📋 Step-by-Step Setup

### Step 1: Get Your Personal Access Token

1. **Visit Calendly Integrations**
   - Go to [calendly.com/integrations/api_webhooks](https://calendly.com/integrations/api_webhooks)
   - Log in to your Calendly account

2. **Generate Token**
   - Click on "API & Webhooks"
   - Click "Create Token"
   - Copy the generated token (it starts with `eyJ` followed by your unique token)

### Step 2: Connect in OvenAI

1. **Navigate to Calendar**
   - Go to `/calendar` in your OvenAI app
   - You'll see the Calendly integration card

2. **Enter Your Token**
   - Click "Connect Calendly"
   - Paste your Personal Access Token
   - Click "Connect Calendly"

3. **Success!**
   - Your calendar events will now sync automatically
   - You can share your booking link directly from conversations

## 🔧 Technical Details

### Token Storage
- Tokens are encrypted and stored securely in your user settings
- Uses AES encryption with user-specific keys
- Stored in Supabase with Row Level Security (RLS)

### API Calls
- Direct API calls to Calendly using Bearer authentication
- No OAuth refresh token complexity
- Real-time event fetching

### Permissions
PAT tokens have access to:
- ✅ Read your user profile
- ✅ Read your scheduled events
- ✅ Read your event types
- ✅ Read your availability
- ❌ Cannot modify or delete events (read-only)

## 🚀 Features Available

### Calendar Integration
- **Unified Calendar View**: See both Calendly and Google Calendar events
- **Color-coded Events**: Blue for Calendly, Red for Google Calendar
- **Event Details**: Click events to see attendees, notes, and links
- **Monthly Navigation**: Browse past and future events

### WhatsApp Integration
- **Schedule from Messages**: Click "Schedule Meeting" in conversations
- **Auto-populated Forms**: Lead info pre-filled in booking forms
- **BANT/HEAT Context**: Meeting context passed to Calendly
- **Booking Link Sharing**: Share your link directly in chats

### Meeting Management
- **Meeting Details**: View attendee info, meeting notes, and status
- **External Links**: Jump to Calendly or Google Calendar
- **Meeting Statistics**: Track bookings and show rates
- **Lead Context**: See which lead scheduled each meeting

## 🔍 Troubleshooting

### Token Not Working
- **Check Token Format**: Should start with `eyJ` (JWT format - this is normal)
- **Verify Permissions**: Make sure token has calendar access
- **Re-generate**: Create a new token if the old one expired

### Events Not Showing
- **Check Date Range**: Make sure events are in the current month
- **Verify Status**: Only "active" events are shown by default
- **Refresh**: Click the refresh button to reload events

### Connection Issues
- **Network**: Ensure you can access calendly.com
- **Firewall**: Check if API calls are blocked
- **Browser**: Try clearing cache and cookies

## 📊 Comparison with OAuth

### PAT Method (Current)
```javascript
// Simple API call with PAT
const response = await fetch('https://api.calendly.com/users/me', {
  headers: {
    'Authorization': `Bearer ${personalAccessToken}`
  }
});
```

### OAuth Method (Complex)
```javascript
// OAuth requires multiple steps
1. Redirect to Calendly for authorization
2. Handle callback with authorization code
3. Exchange code for access token
4. Handle token refresh when expired
5. Store and manage multiple tokens
```

## 🔒 Security Best Practices

1. **Token Protection**
   - Never share your PAT with others
   - Don't commit tokens to version control
   - Regenerate tokens if compromised

2. **Access Control**
   - PAT tokens are read-only by default
   - Cannot modify or delete your calendar events
   - Limited to your own Calendly account data

3. **Monitoring**
   - Check token usage in Calendly settings
   - Monitor for unusual API activity
   - Revoke tokens when no longer needed

## 🎯 Next Steps

After connecting Calendly:

1. **Test the Integration**
   - Visit the Calendar page
   - Verify your events are showing
   - Try scheduling a test meeting

2. **Configure WhatsApp**
   - Go to a conversation in Messages
   - Click "Schedule Meeting"
   - Test the booking flow

3. **Share Your Link**
   - Copy your booking link from Calendar
   - Share it in WhatsApp conversations
   - Track bookings in the dashboard

## 📞 Support

If you need help:
- Check the [Calendly API Documentation](https://developer.calendly.com/)
- Review the troubleshooting section above
- Contact support through the app

---

**✨ That's it! Your Calendly integration is now complete without needing a developer account.** 