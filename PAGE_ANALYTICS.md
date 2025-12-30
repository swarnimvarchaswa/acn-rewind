# Analytics Enhancement - Page-Level Tracking

## 🎯 What Was Updated

Enhanced analytics to track **which specific page/slide** users interact with for both project name reveals and downloads.

---

## 📊 Updated Analytics Events

### **1. Project Name Reveal** (Enhanced)
**Event**: `project_name_reveal`

**Properties**:
- `project`: Name of the project (e.g., "Prestige Shantiniketan")
- `page`: Page number where reveal happened (1-13) ⭐ NEW

**Example**:
```javascript
{
  project: "Brigade Valencia",
  page: 2
}
```

**Use Cases**:
- Track which projects users are most curious about
- See which pages get the most reveals
- Identify if certain pages have more engagement
- Compare reveal rates across different pages

---

### **2. Single Page Download** (Already had page tracking)
**Event**: `download_single_page`

**Properties**:
- `page`: Page number downloaded (1-12)

**Example**:
```javascript
{
  page: 2
}
```

**Use Cases**:
- Track which pages users download most
- Identify most valuable content
- See download patterns by page

---

## 📈 New Dashboard Insights You Can Create

### **Page-Level Engagement**

1. **Project Reveals by Page**
   - Event: `project_name_reveal`
   - Group by: `page`
   - Visualization: Bar chart
   - Shows: Which pages have highest reveal rates

2. **Most Revealed Projects**
   - Event: `project_name_reveal`
   - Group by: `project`
   - Order by: Count (descending)
   - Shows: Which projects users are most curious about

3. **Page-Specific Reveal Rate**
   - Formula: (Reveals on page X / Total page views) × 100
   - Shows: Engagement rate per page

4. **Downloads by Page**
   - Event: `download_single_page`
   - Group by: `page`
   - Visualization: Bar chart
   - Shows: Which pages users download most

5. **Page Engagement Heatmap**
   - Combine: `scroll_depth`, `project_name_reveal`, `download_single_page`
   - Group by: `page`
   - Shows: Overall engagement per page

---

## 🔍 Sample Queries

### Get reveal count by page:
```sql
SELECT page, COUNT(*) as reveals
FROM events
WHERE event = 'project_name_reveal'
GROUP BY page
ORDER BY page
```

### Get most revealed projects:
```sql
SELECT project, COUNT(*) as reveals
FROM events
WHERE event = 'project_name_reveal'
GROUP BY project
ORDER BY reveals DESC
LIMIT 10
```

### Get page engagement score:
```sql
SELECT 
  page,
  COUNT(DISTINCT CASE WHEN event = 'project_name_reveal' THEN timestamp END) as reveals,
  COUNT(DISTINCT CASE WHEN event = 'download_single_page' THEN timestamp END) as downloads,
  (reveals + downloads) as total_engagement
FROM events
WHERE page IS NOT NULL
GROUP BY page
ORDER BY total_engagement DESC
```

### Compare reveal rates across pages:
```sql
SELECT 
  page,
  COUNT(*) as reveals,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM events
WHERE event = 'project_name_reveal'
GROUP BY page
ORDER BY page
```

---

## 📊 Expected Insights

### **What You'll Learn**:

1. **Content Value**
   - Which pages have the most valuable content (high downloads)
   - Which projects are most interesting (high reveals)

2. **User Behavior**
   - Do users reveal names on early pages or later?
   - Which pages drive the most downloads?
   - Is there a correlation between reveals and downloads?

3. **Engagement Patterns**
   - Do users engage more with certain types of data?
   - Which visualizations are most effective?
   - Where do users lose interest?

4. **Optimization Opportunities**
   - Pages with low engagement might need better design
   - High-reveal pages could be promoted more
   - Most-downloaded pages show what users value

---

## 🎨 Dashboard Layout Suggestion

### **Page Performance Dashboard**

**Row 1: Overview**
- Total Reveals (all pages)
- Total Downloads (all pages)
- Most Engaged Page
- Least Engaged Page

**Row 2: Page Breakdown**
- Bar Chart: Reveals by Page
- Bar Chart: Downloads by Page
- Line Chart: Engagement over time by page

**Row 3: Project Insights**
- Table: Top 10 Most Revealed Projects (with page number)
- Pie Chart: Reveal distribution by page
- Heatmap: Page × Action (reveal/download)

**Row 4: User Journey**
- Funnel: Page 1 → Reveal → Download
- Retention: Users who reveal on multiple pages
- Cohort: First reveal page vs total engagement

---

## 🚀 Implementation Details

### **Components Updated**:
1. `ButtonBar.tsx` - Added `pageNumber` prop
2. All 13 ButtonBar instances in `page.tsx` - Added page numbers
3. `DownloadPageButton.tsx` - Already had page tracking

### **Analytics Events**:
- ✅ `project_name_reveal` - Now includes page number
- ✅ `download_single_page` - Already had page number
- ✅ `download_single_page_success` - Already had page number
- ✅ `download_single_page_error` - Already had page number

### **Page Mapping**:
- Page 1: Prestige Shantiniketan
- Page 2: Brigade Valencia
- Page 3: Embassy Lake Terraces
- Page 4: Brigade Exotica
- Page 5: Tata Promont
- Page 6: Sobha Crystal Meadows
- Page 7: Phoenix Kessaku
- Page 8: Sobha Royal Pavilion
- Page 9: Adarsh Palm Retreat
- Page 10: Pursuit of a Radical Rhapsody
- Page 11: Eden park @ The Prestige City
- Page 12: In That Quiet Earth
- Page 13: SNN Clermont

---

## ✅ Complete Event Reference

| Event | Properties | Example |
|-------|-----------|---------|
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

**Status**: ✅ Complete
**Last Updated**: December 30, 2025
**Version**: 3.0
