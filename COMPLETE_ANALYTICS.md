# ACN Rewind 2025 - Complete Analytics Tracking Summary

## 🎯 Overview
Comprehensive PostHog analytics implementation to track every user interaction from login to download.

---

## 📊 All Tracked Events (15 Total)

### **1. Login & Authentication Events**

#### **`login_screen_viewed`**
- **Trigger**: When login screen loads
- **Properties**:
  - `timestamp`: ISO timestamp
  - `url`: Full URL
- **Use Case**: Track total app visits

#### **`login_input_started`**
- **Trigger**: When user types first digit
- **Properties**: None
- **Use Case**: Track engagement rate (how many visitors start typing)

#### **`login_attempted`**
- **Trigger**: When user clicks "Reveal My Rewind"
- **Properties**:
  - `mobile_length`: Number of digits entered
  - `timestamp`: ISO timestamp
- **Use Case**: Track login attempts

#### **`login_success`**
- **Trigger**: When agent data is found
- **Properties**:
  - `mobile`: User's mobile number
  - `agent_name`: Agent's name
  - `load_time_ms`: Time taken to load data
  - `timestamp`: ISO timestamp
  - `url`: Full URL with mobile parameter
- **Use Case**: Track successful logins and performance

#### **`login_failed`**
- **Trigger**: When mobile number not found
- **Properties**:
  - `mobile`: Attempted mobile number
  - `reason`: "agent_not_found"
  - `timestamp`: ISO timestamp
- **Use Case**: Track failed login attempts

#### **`login_error`**
- **Trigger**: When API call fails
- **Properties**:
  - `mobile`: Attempted mobile number
  - `error`: Error message
  - `timestamp`: ISO timestamp
- **Use Case**: Debug connection issues

---

### **2. User Identification**

#### **`posthog.identify(mobile)`**
- **Trigger**: On successful login
- **User Properties**:
  - `agent_name`: Agent's name
  - `cp_id`: Channel partner ID
  - `days_active`: Days active on platform
  - `total_enquiries`: Total enquiries
- **Use Case**: Track unique users and their properties

---

### **3. Navigation & Engagement Events**

#### **`page_view`**
- **Trigger**: When user successfully loads their rewind
- **Properties**:
  - `url`: Full URL
  - `mobile`: User's mobile
  - `agent_name`: Agent's name
- **Use Case**: Track unique page views

#### **`scroll_depth`**
- **Trigger**: At 25%, 50%, 75% scroll
- **Properties**:
  - `percentage`: 25, 50, or 75
  - `mobile`: User's mobile
  - `agent_name`: Agent's name
- **Use Case**: Track engagement depth

#### **`rewind_completed`**
- **Trigger**: When user scrolls to 100%
- **Properties**:
  - `percentage`: 100
  - `mobile`: User's mobile
  - `agent_name`: Agent's name
  - `url`: Full URL
- **Use Case**: Track completion rate

---

### **4. Interaction Events**

#### **`project_name_reveal`**
- **Trigger**: When user clicks eye icon to reveal project name
- **Properties**:
  - `project`: Project name
  - `page`: Page number (1-13)
- **Use Case**: Track which projects users are curious about

---

### **5. Download Events**

#### **`download_all_initiated`**
- **Trigger**: When user clicks "Download All"
- **Properties**: None
- **Use Case**: Track download all attempts

#### **`download_all_success`**
- **Trigger**: When ZIP file is created
- **Properties**:
  - `pages`: Number of pages (12)
- **Use Case**: Track successful bulk downloads

#### **`download_all_error`**
- **Trigger**: When download all fails
- **Properties**:
  - `error`: Error message
- **Use Case**: Debug download issues

#### **`download_single_page`**
- **Trigger**: When user clicks individual page download
- **Properties**:
  - `page`: Page number (1-12)
- **Use Case**: Track which pages users download

#### **`download_single_page_success`**
- **Trigger**: When single page download succeeds
- **Properties**:
  - `page`: Page number
- **Use Case**: Track successful individual downloads

#### **`download_single_page_error`**
- **Trigger**: When single page download fails
- **Properties**:
  - `page`: Page number
  - `error`: Error message
- **Use Case**: Debug individual download issues

---

## 📈 Key Metrics You Can Track

### **Funnel Analysis**
```
1. login_screen_viewed (100%)
   ↓
2. login_input_started (X%)
   ↓
3. login_attempted (X%)
   ↓
4. login_success (X%)
   ↓
5. page_view (X%)
   ↓
6. scroll_depth (50%) (X%)
   ↓
7. rewind_completed (X%)
   ↓
8. download_all_initiated OR download_single_page (X%)
```

### **Conversion Rates**
- **Visit to Login**: `login_input_started / login_screen_viewed`
- **Login Success Rate**: `login_success / login_attempted`
- **Completion Rate**: `rewind_completed / page_view`
- **Download Rate**: `(download_all_initiated + download_single_page) / page_view`

### **Engagement Metrics**
- **Average Scroll Depth**: Average of all scroll_depth percentages
- **Time to Login**: Distribution of time between screen view and login
- **Load Performance**: Average `load_time_ms` from login_success
- **Project Reveals**: Count of project_name_reveal events
- **Most Popular Pages**: Group download_single_page by page number

### **User Insights**
- **Unique Visitors**: Count of distinct mobile numbers
- **Returning Users**: Users with multiple login_success events
- **Failed Logins**: Count of login_failed events
- **Error Rate**: `login_error / login_attempted`
- **Most Active Agents**: Group by agent_name

---

## 🎨 Recommended PostHog Dashboards

### **Dashboard 1: Login Performance**
- **Total Visits**: Count of login_screen_viewed
- **Login Funnel**: login_screen_viewed → login_input_started → login_attempted → login_success
- **Success Rate**: login_success / login_attempted × 100
- **Failed Logins**: Count of login_failed
- **Error Rate**: Count of login_error
- **Average Load Time**: Average load_time_ms from login_success

### **Dashboard 2: User Engagement**
- **Unique Users**: Count of distinct mobile numbers
- **Page Views**: Count of page_view
- **Scroll Depth Distribution**: Bar chart of scroll_depth percentages
- **Completion Rate**: rewind_completed / page_view × 100
- **Average Session Duration**: Time from page_view to rewind_completed

### **Dashboard 3: Content Interaction**
- **Project Reveals by Page**: Bar chart of project_name_reveal grouped by page
- **Most Revealed Projects**: Table of project_name_reveal grouped by project
- **Download Rate**: (download_all_initiated + download_single_page) / page_view × 100
- **Download Method Split**: Pie chart of download_all vs download_single_page
- **Most Downloaded Pages**: Bar chart of download_single_page grouped by page

### **Dashboard 4: Performance & Errors**
- **API Load Time**: Line chart of load_time_ms over time
- **Error Breakdown**: Pie chart of login_error, download_all_error, download_single_page_error
- **Failed Login Reasons**: Table of login_failed grouped by reason
- **Success vs Failure**: Stacked bar chart of success vs error events

---

## 🔍 Sample PostHog Queries

### **Get unique visitors count:**
```javascript
events
  .filter(event => event.event === 'login_success')
  .groupBy('mobile')
  .count()
```

### **Calculate login success rate:**
```javascript
const attempted = events.filter(e => e.event === 'login_attempted').count()
const success = events.filter(e => e.event === 'login_success').count()
const rate = (success / attempted) * 100
```

### **Find most engaged users:**
```javascript
events
  .filter(event => event.event === 'rewind_completed')
  .groupBy('agent_name')
  .count()
  .orderBy('count', 'desc')
```

### **Track download preferences:**
```javascript
const downloadAll = events.filter(e => e.event === 'download_all_initiated').count()
const downloadSingle = events.filter(e => e.event === 'download_single_page').count()
const ratio = downloadAll / downloadSingle
```

---

## 📱 URL Tracking

### **URL Parameters**
- **Format**: `/?mobile=XXXXXXXXXX`
- **Captured in**: login_success, page_view, rewind_completed
- **Use Case**: Track sharing and referrals

### **Tracking Shared Links**
Users can share their rewind URL with the mobile parameter. Track:
- How many users access via shared link vs direct login
- Which agents share their rewind most
- Viral coefficient (shares per user)

---

## 🎯 Success Metrics (KPIs)

### **Primary KPIs**
1. **Total Unique Visitors**: Count of distinct login_screen_viewed
2. **Login Success Rate**: login_success / login_attempted
3. **Completion Rate**: rewind_completed / page_view
4. **Download Rate**: downloads / page_view

### **Secondary KPIs**
5. **Engagement Score**: Average scroll depth
6. **Load Performance**: Average load_time_ms
7. **Error Rate**: errors / total_events
8. **Viral Coefficient**: Shared URL visits / total visits

---

## 🚀 Advanced Tracking Ideas

### **Cohort Analysis**
- Group users by first_seen date
- Track retention: Do users return?
- Compare engagement by cohort

### **A/B Testing Opportunities**
- Different login screen designs
- Button text variations
- Download button placement

### **Heatmaps** (Future Enhancement)
- Track click positions
- Scroll heatmaps
- Time spent per page

---

## 📝 Event Properties Reference

| Event | Properties | Example |
|-------|-----------|---------|
| `login_screen_viewed` | timestamp, url | - |
| `login_input_started` | - | - |
| `login_attempted` | mobile_length, timestamp | mobile_length: 10 |
| `login_success` | mobile, agent_name, load_time_ms, timestamp, url | load_time_ms: 1234 |
| `login_failed` | mobile, reason, timestamp | reason: "agent_not_found" |
| `login_error` | mobile, error, timestamp | error: "Network error" |
| `page_view` | url, mobile, agent_name | - |
| `scroll_depth` | percentage, mobile, agent_name | percentage: 50 |
| `rewind_completed` | percentage, mobile, agent_name, url | percentage: 100 |
| `project_name_reveal` | project, page | project: "Brigade Valencia", page: 2 |
| `download_all_initiated` | - | - |
| `download_all_success` | pages | pages: 12 |
| `download_all_error` | error | error: "..." |
| `download_single_page` | page | page: 2 |
| `download_single_page_success` | page | page: 2 |
| `download_single_page_error` | page, error | page: 2, error: "..." |

---

## ✅ Implementation Checklist

- ✅ Login screen view tracking
- ✅ User input tracking
- ✅ Login attempt tracking
- ✅ Login success/failure/error tracking
- ✅ User identification with properties
- ✅ Page view tracking
- ✅ Scroll depth tracking (25%, 50%, 75%, 100%)
- ✅ Project name reveal tracking
- ✅ Download all tracking
- ✅ Single page download tracking
- ✅ URL parameter tracking
- ✅ Load time performance tracking
- ✅ Error tracking for all failure points

---

**Status**: ✅ Complete
**Last Updated**: January 5, 2026
**Total Events**: 15
**Total Properties**: 20+
