import { google } from 'googleapis';

// Configuration - You can set these in .env.local
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || '';

export interface AgentData {
  found: boolean;
  mobile?: string;
  cp_id?: string;
  agent_name?: string;
  days_active?: number;
  longest_streak?: number;
  streak_start_date?: string;
  streak_end_date?: string;
  activity_data?: number[][];
  top_zone?: string;
  top_zone_pct?: number;
  zone_deals?: number;
  all_zones?: Array<{ zone: string; count: number }>;
  top_micromarket?: string;
  micromarket_count?: number;
  all_micromarkets?: Array<{ micromarket: string; count: number }>;
  enquiries_sent?: number;
  enquiries_received?: number;
  resale_count?: number;
  rental_count?: number;
  asset_types?: string;
  asset_types_pct?: number;
  top_configuration?: string;
  config_pct?: number;
  all_configurations?: Array<{ bedrooms: string; count: number }>;
  resale_avg_price?: number;
  resale_min_price?: number;
  resale_max_price?: number;
  rental_avg_rent?: number;
  rental_min_rent?: number;
  rental_max_rent?: number;
  bestie_cp_id?: string;
  bestie_name?: string;
  bestie_mobile?: string;
  bestie_count?: number;
  total_properties?: number;
  total_enquiries?: number;
  top_month?: string;
  error?: string;
}

// Helper functions (same logic as Apps Script)
function parseDaywiseString(daywiseStr: string): number[] {
  const result: number[] = [];
  const str = daywiseStr.toString();
  for (let i = 0; i < 365; i++) {
    if (i < str.length) {
      result.push(str[i] === '1' ? 1 : 0);
    } else {
      result.push(0);
    }
  }
  return result;
}

function convertToMonthlyData(daywiseData: number[]): number[][] {
  const months: number[][] = [];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayIndex = 0;
  for (let m = 0; m < 12; m++) {
    const monthData: number[] = [];
    for (let d = 0; d < 31; d++) {
      if (d < daysInMonth[m] && dayIndex < daywiseData.length) {
        monthData.push(daywiseData[dayIndex] || 0);
        dayIndex++;
      } else {
        monthData.push(0);
      }
    }
    months.push(monthData);
  }
  return months;
}

function parseZonesJSON(zonesStr: string) {
  try {
    if (!zonesStr) return { topZone: 'North', topZonePct: 0, topZoneDeals: 0, allZones: [] };
    
    const zones = JSON.parse(zonesStr);
    if (!zones || zones.length === 0) {
      return { topZone: 'North', topZonePct: 0, topZoneDeals: 0, allZones: [] };
    }
    
    let maxZone = zones[0];
    let totalDeals = 0;
    
    zones.forEach((z: any) => {
      totalDeals += z.count || 0;
      if (z.count > maxZone.count) {
        maxZone = z;
      }
    });
    
    const zoneName = maxZone.zone.replace(' Bangalore', '').trim();
    const pct = totalDeals > 0 ? Math.round((maxZone.count / totalDeals) * 100) : 0;
    
    return {
      topZone: zoneName,
      topZonePct: pct,
      topZoneDeals: maxZone.count,
      allZones: zones
    };
  } catch (e) {
    return { topZone: 'North', topZonePct: 0, topZoneDeals: 0, allZones: [] };
  }
}

function parseTopMicromarkets(micromarketsStr: string) {
  try {
    if (!micromarketsStr || micromarketsStr.trim() === '') {
      return { topMicromarket: '-', count: 0, allMicromarkets: [] };
    }
    
    const micromarkets = JSON.parse(micromarketsStr);
    
    if (!micromarkets || micromarkets.length === 0) {
      return { topMicromarket: '-', count: 0, allMicromarkets: [] };
    }
    
    const top = micromarkets[0];
    return {
      topMicromarket: top.micromarket || '-',
      count: top.count || 0,
      allMicromarkets: micromarkets
    };
  } catch (e) {
    return { topMicromarket: '-', count: 0, allMicromarkets: [] };
  }
}

function parseAssetTypes(assetTypesStr: string) {
  try {
    if (!assetTypesStr) return { topAsset: 'Apartment', topAssetPct: 0 };
    
    const assets = JSON.parse(assetTypesStr);
    if (!assets || assets.length === 0) {
      return { topAsset: 'Apartment', topAssetPct: 0 };
    }
    
    let maxAsset = assets[0];
    let totalCount = 0;
    
    assets.forEach((a: any) => {
      totalCount += a.count || 0;
      if (a.count > maxAsset.count) {
        maxAsset = a;
      }
    });
    
    const pct = totalCount > 0 ? Math.round((maxAsset.count / totalCount) * 100) : 0;
    const assetName = maxAsset.assetType.charAt(0).toUpperCase() + maxAsset.assetType.slice(1);
    
    return { topAsset: assetName, topAssetPct: pct };
  } catch (e) {
    return { topAsset: 'Apartment', topAssetPct: 0 };
  }
}

function parseConfigurations(configStr: string) {
  try {
    if (!configStr) return { topConfig: '2 BHK', topConfigPct: 0, allConfigurations: [] };
    
    const configs = JSON.parse(configStr);
    if (!configs || configs.length === 0) {
      return { topConfig: '2 BHK', topConfigPct: 0, allConfigurations: [] };
    }
    
    let maxConfig = configs[0];
    let totalCount = 0;
    
    configs.forEach((c: any) => {
      totalCount += c.count || 0;
      if (c.count > maxConfig.count) {
        maxConfig = c;
      }
    });
    
    const pct = totalCount > 0 ? Math.round((maxConfig.count / totalCount) * 100) : 0;
    const configName = maxConfig.bedrooms === 'Not Specified' ? 'Mixed' : `${maxConfig.bedrooms} BHK`;
    
    return { topConfig: configName, topConfigPct: pct, allConfigurations: configs };
  } catch (e) {
    return { topConfig: '2 BHK', topConfigPct: 0, allConfigurations: [] };
  }
}

function findTopMonth(activityData: number[][]): string {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  let maxMonth = 0;
  let maxActivity = 0;
  
  activityData.forEach((monthData, index) => {
    const monthTotal = monthData.reduce((sum, day) => sum + day, 0);
    if (monthTotal > maxActivity) {
      maxActivity = monthTotal;
      maxMonth = index;
    }
  });
  
  return monthNames[maxMonth];
}

function formatDate(dateStr: any): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
  } catch (e) {
    return dateStr.toString();
  }
}

function calculateEndDate(startDateStr: string, streakDays: number): string {
  if (!startDateStr || !streakDays) return '-';
  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + streakDays - 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[endDate.getMonth()]} ${endDate.getDate()}`;
  } catch (e) {
    return '-';
  }
}

export async function getAgentData(mobile: string): Promise<AgentData> {
  try {
    if (!mobile) {
      return {
        found: false,
        error: 'No mobile number provided'
      };
    }

    // Initialize Google Sheets API
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });

    // Fetch both sheets
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: ['Activity!A:E', 'Data!A:U'],
    });

    const activityData = response.data.valueRanges?.[0]?.values || [];
    const agentData = response.data.valueRanges?.[1]?.values || [];

    // Normalize mobile number - remove +, spaces, and handle 91 prefix
    let normalizedMobile = mobile.toString().replace(/[\+\s\-]/g, '');
    
    // If it's 10 digits, also try with 91 prefix
    const searchNumbers = [normalizedMobile];
    if (normalizedMobile.length === 10) {
      searchNumbers.push('91' + normalizedMobile);
    } else if (normalizedMobile.startsWith('91') && normalizedMobile.length === 12) {
      searchNumbers.push(normalizedMobile.substring(2)); // Also try without 91
    }

    let activityRow: any[] | null = null;
    let agentRow: any[] | null = null;

    // Search in Activity sheet (Mobile Number is column A, index 0)
    for (let i = 1; i < activityData.length; i++) {
      const rowMobile = (activityData[i][0] || '').toString().replace(/[\+\s\-]/g, '');
      if (searchNumbers.some(num => rowMobile === num || rowMobile.endsWith(num) || num.endsWith(rowMobile.slice(-10)))) {
        activityRow = activityData[i];
        break;
      }
    }

    // Search in Data sheet (Mobile Number is column B, index 1)
    for (let i = 1; i < agentData.length; i++) {
      const rowMobile = (agentData[i][1] || '').toString().replace(/[\+\s\-]/g, '');
      if (searchNumbers.some(num => rowMobile === num || rowMobile.endsWith(num) || num.endsWith(rowMobile.slice(-10)))) {
        agentRow = agentData[i];
        break;
      }
    }

    // If not found in either sheet
    if (!activityRow && !agentRow) {
      return {
        found: false,
        error: 'Mobile number not found in any sheet'
      };
    }

    // Build response object
    const result: AgentData = {
      found: true,
      mobile: mobile
    };

    // Extract Activity sheet data
    if (activityRow) {
      result.days_active = parseInt(activityRow[1]) || 0;
      result.longest_streak = parseInt(activityRow[2]) || 0;
      result.streak_start_date = formatDate(activityRow[3]) || '-';
      
      const daywiseString = activityRow[4] ? activityRow[4].toString() : '';
      const daywiseData = parseDaywiseString(daywiseString);
      result.activity_data = convertToMonthlyData(daywiseData);
      result.streak_end_date = calculateEndDate(result.streak_start_date, result.longest_streak);
    }

    // Extract Data sheet data
    if (agentRow) {
      result.cp_id = agentRow[0] || '';
      result.agent_name = agentRow[2] || 'Agent';
      
      // Parse Zones JSON (Column D)
      const zonesData = parseZonesJSON(agentRow[3]);
      result.top_zone = zonesData.topZone;
      result.top_zone_pct = zonesData.topZonePct;
      result.zone_deals = zonesData.topZoneDeals;
      result.all_zones = zonesData.allZones;
      
      // Parse Top Micromarkets JSON (Column E)
      const micromarketsStr = agentRow[4] ? agentRow[4].toString() : '';
      const micromarketsData = parseTopMicromarkets(micromarketsStr);
      result.top_micromarket = micromarketsData.topMicromarket;
      result.micromarket_count = micromarketsData.count;
      result.all_micromarkets = micromarketsData.allMicromarkets;
      
      result.enquiries_sent = parseInt(agentRow[5]) || 0;
      result.enquiries_received = parseInt(agentRow[6]) || 0;
      result.resale_count = parseInt(agentRow[7]) || 0;
      result.rental_count = parseInt(agentRow[8]) || 0;
      
      const assetTypesData = parseAssetTypes(agentRow[9]);
      result.asset_types = assetTypesData.topAsset;
      result.asset_types_pct = assetTypesData.topAssetPct;
      
      const configData = parseConfigurations(agentRow[10]);
      result.top_configuration = configData.topConfig;
      result.config_pct = configData.topConfigPct;
      result.all_configurations = configData.allConfigurations;
      
      result.resale_avg_price = parseInt(agentRow[11]) || 0;
      result.resale_min_price = parseInt(agentRow[12]) || 0;
      result.resale_max_price = parseInt(agentRow[13]) || 0;
      result.rental_avg_rent = parseInt(agentRow[14]) || 0;
      result.rental_min_rent = parseInt(agentRow[15]) || 0;
      result.rental_max_rent = parseInt(agentRow[16]) || 0;
      
      result.bestie_cp_id = agentRow[17] || '';
      result.bestie_name = agentRow[18] || '-';
      result.bestie_mobile = agentRow[19] || '';
      result.bestie_count = parseInt(agentRow[20]) || 0;
      
      result.total_properties = result.resale_count + result.rental_count;
      result.total_enquiries = result.enquiries_sent + result.enquiries_received;
      
      if (result.activity_data) {
        result.top_month = findTopMonth(result.activity_data);
      }
    }

    return result;
  } catch (error: any) {
    return {
      found: false,
      error: error.message || 'An error occurred while fetching data'
    };
  }
}
