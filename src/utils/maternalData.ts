// Maternal Health SMS & Voice Companion — Seed Data & LocalStorage Utils

export interface Mother {
  id: string;
  name: string;
  phone: string;
  language: 'English' | 'Hausa' | 'Yoruba' | 'Igbo';
  preference: 'SMS' | 'Voice';
  pregnancyWeek: number;
  edd: string; // estimated delivery date ISO string
  registeredAt: string;
}

export interface HealthTip {
  week: number;
  en: string;
  ha: string;
  yo: string;
  ig: string;
}

export interface ActivityLog {
  id: string;
  type: 'sms' | 'voice' | 'registration' | 'system';
  motherId: string;
  motherName: string;
  message: string;
  timestamp: string;
  status: 'delivered' | 'pending' | 'failed';
}

export interface DispatchPayload {
  to: string;
  motherName: string;
  week: number;
  message: string;
  channel: 'SMS' | 'Voice';
  language: string;
  gateway: string;
  timestamp: string;
}

// ---------- Seed Mothers ----------
const SEED_MOTHERS: Mother[] = [
  { id: 'm1', name: 'Aisha Bello', phone: '+2348023456789', language: 'Hausa', preference: 'Voice', pregnancyWeek: 24, edd: '2025-10-15', registeredAt: '2025-02-10T08:00:00Z' },
  { id: 'm2', name: 'Yetunde Ogunlade', phone: '+2348034567890', language: 'Yoruba', preference: 'SMS', pregnancyWeek: 14, edd: '2025-12-20', registeredAt: '2025-03-05T09:30:00Z' },
  { id: 'm3', name: 'Ngozi Eze', phone: '+2347045678901', language: 'Igbo', preference: 'Voice', pregnancyWeek: 32, edd: '2025-07-28', registeredAt: '2025-01-20T10:00:00Z' },
  { id: 'm4', name: 'Grace Okonkwo', phone: '+2348056789012', language: 'English', preference: 'SMS', pregnancyWeek: 8, edd: '2026-02-14', registeredAt: '2025-04-01T11:00:00Z' },
  { id: 'm5', name: 'Fatima Yusuf', phone: '+2349067890123', language: 'Hausa', preference: 'Voice', pregnancyWeek: 36, edd: '2025-06-10', registeredAt: '2025-01-05T07:00:00Z' },
];

// ---------- Seed Health Tips (Weeks 1–40) ----------
function generateSeedTips(): HealthTip[] {
  const tips: HealthTip[] = [];
  for (let w = 1; w <= 40; w++) {
    tips.push({
      week: w,
      en: `Week ${w}: Your baby is growing fast. Eat balanced meals with plenty of vegetables, protein, and iron-rich foods. Stay hydrated and attend your antenatal clinic visits.`,
      ha: `Mako ${w}: Jaririn ku yana girma da sauri. Ku ci abinci masu gina jiki kamar zogale, kayan lambu, da hatsi. Ku sha ruwa mai yawa kuma ku je asibiti don duba lafiyar juna biyu.`,
      yo: `Ose ${w}: Omo inu re n dagba ni kiakia. Jeun to ni ewa, eran, ati efo yii. Mu omi to, ki o si lo si ile iwosan fun ayewo oyun re.`,
      ig: `Izu ${w}: Nwa gi na-eto ngwa ngwa. Rie nri ndi nwere uru dika akwukwo nri, anu, na mkpuru. Nu mmiri nke oma ma gaa ulo ogwu maka nyocha.`,
    });
  }
  return tips;
}

// ---------- LocalStorage Wrapper ----------
const STORAGE_KEYS = {
  mothers: 'maternal_mothers',
  tips: 'maternal_tips',
  logs: 'maternal_logs',
  dispatchCount: 'maternal_dispatch_count',
} as const;

export function loadMothers(): Mother[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.mothers);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEYS.mothers, JSON.stringify(SEED_MOTHERS));
  return [...SEED_MOTHERS];
}

export function saveMothers(mothers: Mother[]) {
  localStorage.setItem(STORAGE_KEYS.mothers, JSON.stringify(mothers));
}

export function loadTips(): HealthTip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.tips);
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed = generateSeedTips();
  localStorage.setItem(STORAGE_KEYS.tips, JSON.stringify(seed));
  return seed;
}

export function saveTips(tips: HealthTip[]) {
  localStorage.setItem(STORAGE_KEYS.tips, JSON.stringify(tips));
}

export function loadLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.logs);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveLogs(logs: ActivityLog[]) {
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
}

export function getDispatchCount(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEYS.dispatchCount)) || 0;
  } catch { return 0; }
}

export function incrementDispatchCount(): number {
  const next = getDispatchCount() + 1;
  localStorage.setItem(STORAGE_KEYS.dispatchCount, String(next));
  return next;
}

// ---------- Helpers ----------
export function calcWeekFromEDD(edd: string): number {
  const due = new Date(edd);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const weeksLeft = Math.max(0, Math.floor(diffDays / 7));
  return Math.min(42, Math.max(1, 40 - weeksLeft));
}

export function getTrimester(week: number): 1 | 2 | 3 {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
}

export function generateId(): string {
  return `m${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length >= 11) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.startsWith('1') && digits.length >= 10) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
  return phone;
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // +234 (11 digits after) or +1 (10 digits after) or generic 10-15 digits
  if (digits.startsWith('234') && digits.length === 13) return true;
  if (digits.startsWith('1') && digits.length === 11) return true;
  if (digits.length >= 10 && digits.length <= 15) return true;
  return false;
}

export function buildDispatchPayload(mother: Mother, message: string, gateway: string = 'africas-talking'): DispatchPayload {
  return {
    to: mother.phone,
    motherName: mother.name,
    week: mother.pregnancyWeek,
    message,
    channel: mother.preference,
    language: mother.language,
    gateway,
    timestamp: new Date().toISOString(),
  };
}

export function generateGatewaySnippet(payload: DispatchPayload): string {
  const { to, message, channel, language } = payload;
  if (channel === 'SMS') {
    return `// Africa's Talking SMS Gateway
const axios = require('axios');

const response = await axios.post('https://api.africastalking.com/version1/messaging', {
  username: 'YOUR_USERNAME',
  to: ['${to}'],
  message: \`${message.slice(0, 80)}...\`,
}, {
  headers: {
    apiKey: 'YOUR_API_KEY',
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

console.log(response.data);`;
  }
  return `// Africa's Talking Voice Gateway
const axios = require('axios');

const response = await axios.post('https://voice.africastalking.com/call', {
  username: 'YOUR_USERNAME',
  to: ['${to}'],
  from: '+234XXXXXXXXX',
  message: \`${message.slice(0, 80)}...\`,
  language: '${language}',
}, {
  headers: {
    apiKey: 'YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
});

console.log(response.data);`;
}