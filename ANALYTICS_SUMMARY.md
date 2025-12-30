# ACN Rewind 2025 - Analytics Summary

## 📊 Analytics Events Tracked

### 1. **User Identification**
- **Event**: User login
- **Data Captured**:
  - Mobile number (used as unique identifier)
  - Agent name
  - Agent ID
- **Trigger**: When user enters mobile number and data is found
- **PostHog Method**: `posthog.identify(mobile)`

### 2. **Page View**
- **Event**: `page_view`
- **Data Captured**:
  - Full URL (including mobile parameter)
  - Mobile number
  - Agent name
- **Trigger**: When user successfully loads their rewind
- **Use Case**: Track unique visitors and URL patterns

### 3. **Scroll Depth Tracking**
- **Events**: `scroll_depth`
- **Data Captured**:
  - Percentage: 25%, 50%, 75%
  - Mobile number
  - Agent name
- **Trigger**: When user scrolls past each milestone
- **Use Case**: Measure engagement and drop-off points

### 4. **Rewind Completion**
- **Event**: `rewind_completed`
- **Data Captured**:
  - Percentage: 100
  - Mobile number
  - Agent name
  - Full URL
- **Trigger**: When user scrolls to the very end (last page)
- **Use Case**: Track completion rate

### 5. **Project Name Reveal**
- **Event**: `project_name_reveal`
- **Data Captured**:
  - Project name
- **Trigger**: When user clicks the eye icon button to reveal project name
- **Use Case**: Track curiosity and interaction with property names

### 6. **Download Initiated**
- **Event**: `download_all_initiated`
- **Data Captured**: None (basic event)
- **Trigger**: When user clicks "Download Now" button
- **Use Case**: Track download intent

### 7. **Download Success**
- **Event**: `download_all_success`
- **Data Captured**:
  - Number of pages downloaded (12)
- **Trigger**: When ZIP file is successfully created
- **Use Case**: Track successful downloads

### 8. **Download Error**
- **Event**: `download_all_error`
- **Data Captured**:
  - Error message
- **Trigger**: When download fails
- **Use Case**: Debug download issues

### 9. **Single Page Download Initiated**
- **Event**: `download_single_page`
- **Data Captured**:
  - Page number (1-12)
- **Trigger**: When user clicks individual page download button
- **Use Case**: Track which pages users download individually

### 10. **Single Page Download Success**
- **Event**: `download_single_page_success`
- **Data Captured**:
  - Page number
- **Trigger**: When single page download succeeds
- **Use Case**: Track successful individual page downloads

### 11. **Single Page Download Error**
- **Event**: `download_single_page_error`
- **Data Captured**:
  - Page number
  - Error message
- **Trigger**: When single page download fails
- **Use Case**: Debug individual page download issues

---

## 📈 Dashboard Metrics You Can Track

### **Engagement Metrics**
1. **Total Unique Visitors**: Count of unique mobile numbers
2. **Total Page Views**: Count of `page_view` events
3. **Completion Rate**: (`rewind_completed` / `page_view`) × 100
4. **Average Scroll Depth**: Average of all scroll_depth percentages
5. **Drop-off Points**: Where users stop scrolling (25%, 50%, 75%)

### **Interaction Metrics**
6. **Project Name Reveals**: Count of `project_name_reveal` events
7. **Most Revealed Projects**: Group by project name
8. **Download All Rate**: (`download_all_initiated` / `page_view`) × 100
9. **Download All Success Rate**: (`download_all_success` / `download_all_initiated`) × 100
10. **Single Page Downloads**: Count of `download_single_page` events
11. **Most Downloaded Pages**: Group by page number
12. **Single Page Download Success Rate**: (`download_single_page_success` / `download_single_page`) × 100

### **User Insights**
10. **Top Agents**: Most viewed agent profiles (by agent_name)
11. **URL Patterns**: Most common URL parameters
12. **Mobile Numbers**: List of all users who viewed their rewind
13. **Returning Users**: Users who viewed multiple times

### **Time-Based Metrics**
14. **Views Over Time**: Daily/hourly page views
15. **Peak Usage Times**: When most users access the rewind
16. **Average Session Duration**: Time from page_view to rewind_completed

---

## 🎯 Key Performance Indicators (KPIs)

### **Primary KPIs**
- **Unique Visitors**: Total unique mobile numbers
- **Completion Rate**: % of users who reach the end
- **Download Rate**: % of users who download their rewind

### **Secondary KPIs**
- **Engagement Score**: Average scroll depth percentage
- **Interaction Rate**: % of users who reveal project names
- **Error Rate**: % of failed downloads

---

## 📋 PostHog Dashboard Setup

### **Recommended Insights**

1. **Funnel: User Journey**
   - Step 1: `page_view`
   - Step 2: `scroll_depth` (50%)
   - Step 3: `rewind_completed`
   - Step 4: `download_all_initiated`
   - Step 5: `download_all_success`

2. **Trend: Daily Active Users**
   - Event: `page_view`
   - Unique by: `mobile`
   - Breakdown: By day

3. **Trend: Completion Rate**
   - Formula: (`rewind_completed` / `page_view`) × 100
   - Over time

4. **Bar Chart: Top Agents**
   - Event: `page_view`
   - Group by: `agent_name`
   - Order by: Count (descending)

5. **Retention: Returning Users**
   - Event: `page_view`
   - Unique by: `mobile`
   - Show: Returning users

6. **Pie Chart: Scroll Depth Distribution**
   - Event: `scroll_depth`
   - Group by: `percentage`

7. **Table: User List**
   - Event: `page_view`
   - Columns: `mobile`, `agent_name`, `url`, `timestamp`

---

## 🔍 Sample Queries

### Get all unique visitors:
```sql
SELECT DISTINCT mobile, agent_name 
FROM events 
WHERE event = 'page_view'
```

### Calculate completion rate:
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN event = 'rewind_completed' THEN mobile END) * 100.0 / 
  COUNT(DISTINCT CASE WHEN event = 'page_view' THEN mobile END) as completion_rate
FROM events
```

### Get download success rate:
```sql
SELECT 
  COUNT(CASE WHEN event = 'download_all_success' THEN 1 END) * 100.0 / 
  COUNT(CASE WHEN event = 'download_all_initiated' THEN 1 END) as download_success_rate
FROM events
```

---

## 📝 Event Properties Reference

| Event | Properties |
|-------|-----------|
| `page_view` | url, mobile, agent_name |
| `scroll_depth` | percentage, mobile, agent_name |
| `rewind_completed` | percentage, mobile, agent_name, url |
| `project_name_reveal` | project |
| `download_all_initiated` | - |
| `download_all_success` | pages |
| `download_all_error` | error |
| `download_single_page` | page |
| `download_single_page_success` | page |
| `download_single_page_error` | page, error |

---

## 🎨 Features Implemented

### **UI/UX Enhancements**
- ✅ Glassmorphism design with backdrop blur
- ✅ Semi-transparent white backgrounds (bg-white/20)
- ✅ Compact padding (px-6 py-4)
- ✅ Tutorial mode on first page (auto-reveal project name)
- ✅ Proper text capitalization (title case for names)

### **Download Features**
- ✅ Single ZIP file download (no multiple prompts)
- ✅ Excludes last page from download
- ✅ No modal overlay during download
- ✅ Downloads pages 1-12 only
- ✅ Clean button with border design

### **Text Updates**
- ✅ Buyer agent: "You spent more time finding properties for your buyers"
- ✅ Seller agent: "You spent more time getting properties sold for your sellers"
- ✅ Price: "The average property value you work with"
- ✅ Asset type: "This was your most active asset type"
- ✅ Last page: "See you in 2026" + "Share your rewind on social media and don't forget to tag us"

### **Analytics**
- ✅ Page view tracking with URL
- ✅ User identification by mobile
- ✅ Scroll depth tracking (25%, 50%, 75%, 100%)
- ✅ Completion tracking
- ✅ Project name reveal tracking
- ✅ Download tracking (initiated, success, error)

---

## 🚀 Next Steps for Dashboard

1. **Set up PostHog Project** (if not already done)
2. **Create the recommended insights** listed above
3. **Set up alerts** for:
   - Low completion rate (< 50%)
   - High error rate (> 5%)
   - Spike in traffic
4. **Export data regularly** for deeper analysis
5. **Create weekly reports** on key metrics

---

**Last Updated**: December 30, 2025
**Version**: 1.0
