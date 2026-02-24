'use strict';

// ─── Open-Meteo API ───────────────────────────────────────────────────────────
const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';

// ─── WMO Weather Code Mapping ─────────────────────────────────────────────────
const WMO = {
  0:  { icon: '☀️',  desc: 'Clear sky' },
  1:  { icon: '🌤',  desc: 'Mainly clear' },
  2:  { icon: '⛅',  desc: 'Partly cloudy' },
  3:  { icon: '☁️',  desc: 'Overcast' },
  45: { icon: '🌫',  desc: 'Fog' },
  48: { icon: '🌫',  desc: 'Icy fog' },
  51: { icon: '🌦',  desc: 'Light drizzle' },
  53: { icon: '🌦',  desc: 'Drizzle' },
  55: { icon: '🌧',  desc: 'Dense drizzle' },
  61: { icon: '🌧',  desc: 'Light rain' },
  63: { icon: '🌧',  desc: 'Rain' },
  65: { icon: '🌧',  desc: 'Heavy rain' },
  71: { icon: '❄️',  desc: 'Light snow' },
  73: { icon: '🌨',  desc: 'Snow' },
  75: { icon: '🌨',  desc: 'Heavy snow' },
  77: { icon: '❄️',  desc: 'Snow grains' },
  80: { icon: '🌦',  desc: 'Rain showers' },
  81: { icon: '🌧',  desc: 'Rain showers' },
  82: { icon: '⛈',  desc: 'Heavy showers' },
  85: { icon: '🌨',  desc: 'Snow showers' },
  86: { icon: '🌨',  desc: 'Heavy snow showers' },
  95: { icon: '⛈',  desc: 'Thunderstorm' },
  96: { icon: '⛈',  desc: 'Thunderstorm + hail' },
  99: { icon: '⛈',  desc: 'Thunderstorm + hail' },
};

function wmoInfo(code) {
  // Exact match first, then nearest lower code
  if (WMO[code]) return WMO[code];
  const keys = Object.keys(WMO).map(Number).sort((a, b) => a - b);
  const best = keys.filter(k => k <= code).pop();
  return WMO[best] || { icon: '⛅', desc: 'Variable' };
}

function deriveCondition(base48h, wmoCode) {
  if (base48h >= 40) return 'Powder';
  if (base48h >= 20) return 'Packed Powder';
  if (base48h >= 8)  return 'Groomed';
  if (wmoCode >= 71 && wmoCode <= 77)  return 'Light Snow';
  if (wmoCode >= 85 && wmoCode <= 86)  return 'Snow Showers';
  if (wmoCode >= 45 && wmoCode <= 48)  return 'Foggy';
  return 'Groomed';
}

function visibilityLabel(meters) {
  if (meters == null || meters < 0) return 'N/A';
  if (meters > 15000) return 'Excellent';
  if (meters > 8000)  return 'Good';
  if (meters > 3000)  return 'Moderate';
  return 'Poor';
}

// ─── Resort Data ──────────────────────────────────────────────────────────────
// lat/lon target the summit/upper-mountain area for more accurate snow data.
// Operational data (runs, lifts, notes) is static — no free API provides it.
// photo: Wikimedia Commons images (CC licensed). bgGradient is the CSS fallback.

const RESORTS = [
  {
    id: 1, rank: '#1',
    name: 'Niseko United', nameJP: 'ニセコユナイテッド',
    region: 'hokkaido', prefecture: 'Hokkaido',
    lat: 42.8054, lon: 140.6870,
    elevation: { base: 250, summit: 1308 },
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Niseko_United_Ski_Resort_in_Hokkaido_Japan.jpg/800px-Niseko_United_Ski_Resort_in_Hokkaido_Japan.jpg',
    bgGradient: 'linear-gradient(135deg,#0d3b6e,#1a5276)',
    stats: {
      baseDepth: 185, summit48h: 62, base48h: 54,
      openRuns: 38, totalRuns: 41,
      lifts: { open: 15, total: 17 },
      condition: 'Powder', windKph: 22, visibility: 'Good', tempC: -9
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:28, high:-7,  low:-13, desc:'Heavy snow' },
      { day:'Tue', icon:'❄️', snow:15, high:-8,  low:-15, desc:'Snow showers' },
      { day:'Wed', icon:'⛅', snow:3,  high:-6,  low:-12, desc:'Partly cloudy' },
      { day:'Thu', icon:'☀️', snow:0,  high:-4,  low:-10, desc:'Sunny' },
      { day:'Fri', icon:'🌨', snow:18, high:-8,  low:-14, desc:'Snow' },
    ],
    weeklySnow: [28, 15, 3, 0, 18, 22, 11],
    website: 'https://www.niseko.ne.jp',
    notes: 'Consistently among the best powder skiing on earth. Avg 15m of snowfall per season.',
  },
  {
    id: 2, rank: '#2',
    name: 'Hakuba Valley', nameJP: '白馬バレー',
    region: 'honshu', prefecture: 'Nagano',
    lat: 36.7080, lon: 137.8608,
    elevation: { base: 700, summit: 2696 },
    photo: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Hakuba_Happo-one_Winter_Resort.JPG',
    bgGradient: 'linear-gradient(135deg,#1a3a4a,#0d4f3a)',
    stats: {
      baseDepth: 140, summit48h: 35, base48h: 28,
      openRuns: 124, totalRuns: 140,
      lifts: { open: 42, total: 51 },
      condition: 'Packed Powder', windKph: 30, visibility: 'Moderate', tempC: -7
    },
    forecast: [
      { day:'Mon', icon:'⛅', snow:8,  high:-5, low:-11, desc:'Light snow' },
      { day:'Tue', icon:'🌨', snow:22, high:-7, low:-13, desc:'Heavy snow' },
      { day:'Wed', icon:'🌨', snow:14, high:-6, low:-12, desc:'Snow' },
      { day:'Thu', icon:'⛅', snow:2,  high:-4, low:-9,  desc:'Clearing' },
      { day:'Fri', icon:'☀️', snow:0,  high:-2, low:-8,  desc:'Sunny' },
    ],
    weeklySnow: [8, 22, 14, 2, 0, 5, 18],
    website: 'https://www.hakuba-valley.com',
    notes: '10 interconnected resorts. Japan\'s largest ski area. Olympic venue from 1998.',
  },
  {
    id: 3, rank: '#3',
    name: 'Nozawa Onsen', nameJP: '野沢温泉',
    region: 'honshu', prefecture: 'Nagano',
    lat: 36.9247, lon: 138.4500,
    elevation: { base: 565, summit: 1650 },
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Nozawa_Ski.jpg/800px-Nozawa_Ski.jpg',
    bgGradient: 'linear-gradient(135deg,#2d1b69,#11047a)',
    stats: {
      baseDepth: 160, summit48h: 45, base48h: 38,
      openRuns: 33, totalRuns: 36,
      lifts: { open: 18, total: 20 },
      condition: 'Powder', windKph: 18, visibility: 'Good', tempC: -10
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:20, high:-8,  low:-14, desc:'Snow showers' },
      { day:'Tue', icon:'🌨', snow:25, high:-9,  low:-15, desc:'Heavy snow' },
      { day:'Wed', icon:'❄️', snow:10, high:-7,  low:-13, desc:'Snow' },
      { day:'Thu', icon:'⛅', snow:1,  high:-5,  low:-11, desc:'Partly cloudy' },
      { day:'Fri', icon:'☀️', snow:0,  high:-3,  low:-9,  desc:'Clear' },
    ],
    weeklySnow: [20, 25, 10, 1, 0, 12, 30],
    website: 'https://www.nozawaski.com',
    notes: 'Famous for its free public hot spring baths (sotoyu) and steep tree runs.',
  },
  {
    id: 4, rank: '#4',
    name: 'Myoko Kogen', nameJP: '妙高高原',
    region: 'honshu', prefecture: 'Niigata',
    lat: 36.8950, lon: 138.1100,
    elevation: { base: 580, summit: 1855 },
    photo: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Suginohara.JPG',
    bgGradient: 'linear-gradient(135deg,#1a4a2e,#2d5016)',
    stats: {
      baseDepth: 175, summit48h: 55, base48h: 48,
      openRuns: 46, totalRuns: 52,
      lifts: { open: 20, total: 24 },
      condition: 'Powder', windKph: 15, visibility: 'Excellent', tempC: -11
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:30, high:-9,  low:-16, desc:'Heavy snow' },
      { day:'Tue', icon:'🌨', snow:22, high:-8,  low:-14, desc:'Snow' },
      { day:'Wed', icon:'❄️', snow:12, high:-7,  low:-12, desc:'Snow showers' },
      { day:'Thu', icon:'⛅', snow:3,  high:-5,  low:-10, desc:'Partly cloudy' },
      { day:'Fri', icon:'🌨', snow:16, high:-7,  low:-13, desc:'Snow' },
    ],
    weeklySnow: [30, 22, 12, 3, 16, 8, 25],
    website: 'https://myoko.tv',
    notes: 'Known as the \'powder paradise\' of Niigata. Japan Sea weather dumps huge snowfall.',
  },
  {
    id: 5, rank: '#5',
    name: 'Furano', nameJP: '富良野スキー場',
    region: 'hokkaido', prefecture: 'Hokkaido',
    lat: 43.3500, lon: 142.3833,
    elevation: { base: 250, summit: 1074 },
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Furano_ski.jpg/800px-Furano_ski.jpg',
    bgGradient: 'linear-gradient(135deg,#2c1810,#4a1c0d)',
    stats: {
      baseDepth: 145, summit48h: 30, base48h: 24,
      openRuns: 26, totalRuns: 28,
      lifts: { open: 9, total: 10 },
      condition: 'Packed Powder', windKph: 12, visibility: 'Excellent', tempC: -13
    },
    forecast: [
      { day:'Mon', icon:'☀️', snow:0,  high:-11, low:-17, desc:'Clear & cold' },
      { day:'Tue', icon:'⛅', snow:5,  high:-9,  low:-15, desc:'Partly cloudy' },
      { day:'Wed', icon:'🌨', snow:18, high:-8,  low:-14, desc:'Snow' },
      { day:'Thu', icon:'🌨', snow:20, high:-10, low:-16, desc:'Heavy snow' },
      { day:'Fri', icon:'❄️', snow:10, high:-9,  low:-15, desc:'Snow showers' },
    ],
    weeklySnow: [0, 5, 18, 20, 10, 3, 14],
    website: 'https://www.princehotels.com/furano',
    notes: 'Prince Hotel resort in central Hokkaido. Very dry, light powder. Less crowded than Niseko.',
  },
  {
    id: 6, rank: '#6',
    name: 'Rusutsu', nameJP: 'ルスツリゾート',
    region: 'hokkaido', prefecture: 'Hokkaido',
    lat: 42.7500, lon: 140.8833,
    elevation: { base: 251, summit: 994 },
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Rusutsu_WestMt%28200703%29.jpg/800px-Rusutsu_WestMt%28200703%29.jpg',
    bgGradient: 'linear-gradient(135deg,#0a3d2b,#1a5c40)',
    stats: {
      baseDepth: 200, summit48h: 58, base48h: 50,
      openRuns: 37, totalRuns: 37,
      lifts: { open: 18, total: 18 },
      condition: 'Powder', windKph: 20, visibility: 'Good', tempC: -10
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:25, high:-8,  low:-14, desc:'Snow' },
      { day:'Tue', icon:'🌨', snow:33, high:-9,  low:-15, desc:'Heavy snow' },
      { day:'Wed', icon:'❄️', snow:8,  high:-7,  low:-13, desc:'Snow showers' },
      { day:'Thu', icon:'⛅', snow:2,  high:-5,  low:-11, desc:'Partly cloudy' },
      { day:'Fri', icon:'🌨', snow:20, high:-8,  low:-14, desc:'Snow' },
    ],
    weeklySnow: [25, 33, 8, 2, 20, 15, 28],
    website: 'https://rusutsu.com',
    notes: '3 mountains, 37 runs all accessible from one lift ticket. Uncrowded powder paradise.',
  },
  {
    id: 7, rank: '#7',
    name: 'Kiroro', nameJP: 'キロロリゾート',
    region: 'hokkaido', prefecture: 'Hokkaido',
    lat: 43.0667, lon: 140.9667,
    elevation: { base: 420, summit: 1180 },
    photo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Kiroro_Resort.JPG',
    bgGradient: 'linear-gradient(135deg,#1c1c4a,#2a2a7a)',
    stats: {
      baseDepth: 220, summit48h: 70, base48h: 62,
      openRuns: 22, totalRuns: 26,
      lifts: { open: 9, total: 10 },
      condition: 'Powder', windKph: 8, visibility: 'Excellent', tempC: -12
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:35, high:-10, low:-17, desc:'Heavy powder' },
      { day:'Tue', icon:'🌨', snow:35, high:-11, low:-18, desc:'Heavy snow' },
      { day:'Wed', icon:'❄️', snow:20, high:-9,  low:-15, desc:'Snow' },
      { day:'Thu', icon:'❄️', snow:12, high:-8,  low:-14, desc:'Snow showers' },
      { day:'Fri', icon:'⛅', snow:3,  high:-6,  low:-12, desc:'Easing' },
    ],
    weeklySnow: [35, 35, 20, 12, 3, 18, 40],
    website: 'https://www.kiroro.co.jp',
    notes: 'Highest base elevation in Hokkaido. Gets the most snow of any resort in Japan most seasons.',
  },
  {
    id: 8, rank: '#8',
    name: 'Zao Onsen', nameJP: '蔵王温泉スキー場',
    region: 'honshu', prefecture: 'Yamagata',
    lat: 38.1380, lon: 140.4502,
    elevation: { base: 880, summit: 1661 },
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/220430_ZaoOnsen_Yamagata_Yamagata_pref_Japan02s3.jpg/800px-220430_ZaoOnsen_Yamagata_Yamagata_pref_Japan02s3.jpg',
    bgGradient: 'linear-gradient(135deg,#3d1a0a,#6b2c0f)',
    stats: {
      baseDepth: 130, summit48h: 22, base48h: 18,
      openRuns: 41, totalRuns: 43,
      lifts: { open: 26, total: 28 },
      condition: 'Juhyo (Ice Trees)', windKph: 35, visibility: 'Moderate', tempC: -8
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:12, high:-6, low:-12, desc:'Snow' },
      { day:'Tue', icon:'❄️', snow:8,  high:-7, low:-13, desc:'Snow showers' },
      { day:'Wed', icon:'🌨', snow:15, high:-6, low:-11, desc:'Snow' },
      { day:'Thu', icon:'⛅', snow:2,  high:-4, low:-9,  desc:'Partly cloudy' },
      { day:'Fri', icon:'☀️', snow:0,  high:-2, low:-7,  desc:'Clear' },
    ],
    weeklySnow: [12, 8, 15, 2, 0, 10, 20],
    website: 'https://www.zao-ski.or.jp',
    notes: 'Famous for \'Juhyo\' snow monsters (ice-covered trees). Unique landscape attraction.',
  },
  {
    id: 9, rank: '#9',
    name: 'Shiga Kogen', nameJP: '志賀高原',
    region: 'honshu', prefecture: 'Nagano',
    lat: 36.7883, lon: 138.5167,
    elevation: { base: 1500, summit: 2305 },
    photo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e6/Takamaga.jpg/800px-Takamaga.jpg',
    bgGradient: 'linear-gradient(135deg,#0d2a4a,#1a4060)',
    stats: {
      baseDepth: 115, summit48h: 18, base48h: 15,
      openRuns: 80, totalRuns: 86,
      lifts: { open: 51, total: 55 },
      condition: 'Groomed', windKph: 25, visibility: 'Good', tempC: -6
    },
    forecast: [
      { day:'Mon', icon:'⛅', snow:5,  high:-4, low:-9,  desc:'Partly cloudy' },
      { day:'Tue', icon:'🌨', snow:12, high:-6, low:-11, desc:'Snow' },
      { day:'Wed', icon:'🌨', snow:8,  high:-5, low:-10, desc:'Snow showers' },
      { day:'Thu', icon:'☀️', snow:0,  high:-3, low:-8,  desc:'Sunny' },
      { day:'Fri', icon:'⛅', snow:3,  high:-4, low:-9,  desc:'Partly cloudy' },
    ],
    weeklySnow: [5, 12, 8, 0, 3, 7, 15],
    website: 'https://www.shigakogen.gr.jp',
    notes: 'Japan\'s largest interconnected ski area. 21 linked resorts, 80 runs total. 1998 Olympic venue.',
  },
  {
    id: 10, rank: '#10',
    name: 'Appi Kogen', nameJP: '安比高原スキー場',
    region: 'honshu', prefecture: 'Iwate',
    lat: 39.9500, lon: 141.0000,
    elevation: { base: 500, summit: 1305 },
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Appi_Cable_Cars.jpg/800px-Appi_Cable_Cars.jpg',
    bgGradient: 'linear-gradient(135deg,#1a3a1a,#2d5c2d)',
    stats: {
      baseDepth: 95, summit48h: 14, base48h: 10,
      openRuns: 21, totalRuns: 23,
      lifts: { open: 12, total: 13 },
      condition: 'Groomed', windKph: 10, visibility: 'Excellent', tempC: -5
    },
    forecast: [
      { day:'Mon', icon:'⛅', snow:4,  high:-3, low:-8,  desc:'Light snow' },
      { day:'Tue', icon:'🌨', snow:10, high:-5, low:-10, desc:'Snow' },
      { day:'Wed', icon:'❄️', snow:6,  high:-4, low:-9,  desc:'Snow showers' },
      { day:'Thu', icon:'☀️', snow:0,  high:-2, low:-7,  desc:'Clear' },
      { day:'Fri', icon:'⛅', snow:2,  high:-3, low:-8,  desc:'Partly cloudy' },
    ],
    weeklySnow: [4, 10, 6, 0, 2, 8, 12],
    website: 'https://www.appi.co.jp',
    notes: 'Tohoku\'s premier resort. Wide, well-groomed runs great for families and intermediate skiers.',
  },
  {
    id: 11, rank: '#11',
    name: 'Tomamu', nameJP: 'トマムスキー場',
    region: 'hokkaido', prefecture: 'Hokkaido',
    lat: 43.0200, lon: 142.7800,
    elevation: { base: 600, summit: 1239 },
    photo: '',
    bgGradient: 'linear-gradient(135deg,#0a2a3a,#0d4a5c)',
    stats: {
      baseDepth: 175, summit48h: 50, base48h: 40,
      openRuns: 28, totalRuns: 30,
      lifts: { open: 8, total: 8 },
      condition: 'Powder', windKph: 15, visibility: 'Excellent', tempC: -14
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:22, high:-12, low:-18, desc:'Heavy powder' },
      { day:'Tue', icon:'❄️', snow:14, high:-11, low:-17, desc:'Snow' },
      { day:'Wed', icon:'☀️', snow:0,  high:-9,  low:-15, desc:'Clear & cold' },
      { day:'Thu', icon:'🌨', snow:18, high:-12, low:-18, desc:'Snow showers' },
      { day:'Fri', icon:'⛅', snow:5,  high:-10, low:-16, desc:'Partly cloudy' },
    ],
    weeklySnow: [22, 14, 0, 18, 5, 20, 12],
    website: 'https://www.snowtomamu.jp',
    notes: 'Hoshino Resorts flagship. Famous for the "sea of clouds" at sunrise. Tree skiing heaven in Hokkaido\'s interior.',
  },
  {
    id: 12, rank: '#12',
    name: 'Naeba', nameJP: '苗場スキー場',
    region: 'honshu', prefecture: 'Niigata',
    lat: 36.8200, lon: 138.7100,
    elevation: { base: 780, summit: 1789 },
    photo: '',
    bgGradient: 'linear-gradient(135deg,#0d3320,#1a5c38)',
    stats: {
      baseDepth: 120, summit48h: 28, base48h: 22,
      openRuns: 28, totalRuns: 30,
      lifts: { open: 16, total: 17 },
      condition: 'Packed Powder', windKph: 25, visibility: 'Good', tempC: -8
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:10, high:-6, low:-11, desc:'Snow' },
      { day:'Tue', icon:'🌨', snow:18, high:-7, low:-12, desc:'Heavy snow' },
      { day:'Wed', icon:'⛅', snow:3,  high:-5, low:-10, desc:'Clearing' },
      { day:'Thu', icon:'☀️', snow:0,  high:-3, low:-8,  desc:'Sunny' },
      { day:'Fri', icon:'🌨', snow:8,  high:-6, low:-11, desc:'Snow' },
    ],
    weeklySnow: [10, 18, 3, 0, 8, 14, 6],
    website: 'https://www.princehotels.com/naeba',
    notes: 'One of Japan\'s largest single resorts. Connected to Kagura via the Dragondola. Hosts Fuji Rock Festival in summer.',
  },
  {
    id: 13, rank: '#13',
    name: 'Geto Kogen', nameJP: '夏油高原スキー場',
    region: 'honshu', prefecture: 'Iwate',
    lat: 39.5100, lon: 141.0800,
    elevation: { base: 450, summit: 1042 },
    photo: '',
    bgGradient: 'linear-gradient(135deg,#05101e,#0a2040)',
    stats: {
      baseDepth: 250, summit48h: 75, base48h: 65,
      openRuns: 14, totalRuns: 14,
      lifts: { open: 7, total: 7 },
      condition: 'Powder', windKph: 10, visibility: 'Good', tempC: -12
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:32, high:-10, low:-16, desc:'Heavy powder' },
      { day:'Tue', icon:'🌨', snow:28, high:-11, low:-17, desc:'Snow' },
      { day:'Wed', icon:'❄️', snow:15, high:-9,  low:-15, desc:'Snow showers' },
      { day:'Thu', icon:'⛅', snow:2,  high:-7,  low:-13, desc:'Partly cloudy' },
      { day:'Fri', icon:'🌨', snow:20, high:-10, low:-16, desc:'Snow' },
    ],
    weeklySnow: [32, 28, 15, 2, 20, 10, 35],
    website: 'https://www.geto.co.jp',
    notes: 'Legendary for some of the driest, lightest powder in Japan. Small but world-class. Deep tree runs.',
  },
  {
    id: 14, rank: '#14',
    name: 'Madarao Kogen', nameJP: '斑尾高原スキー場',
    region: 'honshu', prefecture: 'Nagano',
    lat: 36.9800, lon: 138.3300,
    elevation: { base: 1000, summit: 1382 },
    photo: '',
    bgGradient: 'linear-gradient(135deg,#143020,#1e4a30)',
    stats: {
      baseDepth: 155, summit48h: 40, base48h: 32,
      openRuns: 22, totalRuns: 23,
      lifts: { open: 10, total: 10 },
      condition: 'Packed Powder', windKph: 12, visibility: 'Good', tempC: -9
    },
    forecast: [
      { day:'Mon', icon:'❄️', snow:14, high:-7,  low:-13, desc:'Snow showers' },
      { day:'Tue', icon:'🌨', snow:20, high:-8,  low:-14, desc:'Heavy snow' },
      { day:'Wed', icon:'⛅', snow:5,  high:-6,  low:-12, desc:'Partly cloudy' },
      { day:'Thu', icon:'☀️', snow:0,  high:-4,  low:-10, desc:'Sunny' },
      { day:'Fri', icon:'🌨', snow:12, high:-7,  low:-13, desc:'Snow' },
    ],
    weeklySnow: [14, 20, 5, 0, 12, 8, 18],
    website: 'https://www.madarao.jp',
    notes: 'Famous for deep powder stashes and tree skiing. Called "The Hidden Secret" of Nagano. Japan Sea snowfall.',
  },
  {
    id: 15, rank: '#15',
    name: 'Cortina', nameJP: 'コルチナスキー場',
    region: 'honshu', prefecture: 'Nagano',
    lat: 36.6800, lon: 137.9200,
    elevation: { base: 840, summit: 1920 },
    photo: '',
    bgGradient: 'linear-gradient(135deg,#0a1a3a,#101f4e)',
    stats: {
      baseDepth: 195, summit48h: 58, base48h: 48,
      openRuns: 6, totalRuns: 6,
      lifts: { open: 5, total: 5 },
      condition: 'Powder', windKph: 8, visibility: 'Excellent', tempC: -11
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:28, high:-9,  low:-15, desc:'Heavy powder' },
      { day:'Tue', icon:'🌨', snow:35, high:-10, low:-16, desc:'Extreme snow' },
      { day:'Wed', icon:'❄️', snow:18, high:-8,  low:-14, desc:'Snow' },
      { day:'Thu', icon:'⛅', snow:4,  high:-6,  low:-12, desc:'Clearing' },
      { day:'Fri', icon:'🌨', snow:22, high:-9,  low:-15, desc:'Snow' },
    ],
    weeklySnow: [28, 35, 18, 4, 22, 15, 30],
    website: 'https://www.cortina.co.jp',
    notes: 'Extreme deep powder. Gets the most snowfall of any resort in Nagano. Off-piste and tree skiing paradise in Otari.',
  },
  {
    id: 16, rank: '#16',
    name: 'Asahidake', nameJP: '大雪山旭岳',
    region: 'hokkaido', prefecture: 'Hokkaido',
    lat: 43.6600, lon: 142.8600,
    elevation: { base: 1100, summit: 2291 },
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Asahidake_2014.jpg/800px-Asahidake_2014.jpg',
    bgGradient: 'linear-gradient(135deg,#060c18,#0d1a30)',
    stats: {
      baseDepth: 280, summit48h: 80, base48h: 68,
      openRuns: 1, totalRuns: 1,
      lifts: { open: 1, total: 1 },
      condition: 'Powder', windKph: 35, visibility: 'Poor', tempC: -20
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:40, high:-18, low:-24, desc:'Alpine blizzard' },
      { day:'Tue', icon:'🌨', snow:35, high:-17, low:-23, desc:'Heavy snow' },
      { day:'Wed', icon:'❄️', snow:20, high:-15, low:-21, desc:'Snow' },
      { day:'Thu', icon:'⛅', snow:5,  high:-13, low:-19, desc:'Partly cloudy' },
      { day:'Fri', icon:'☀️', snow:0,  high:-12, low:-18, desc:'Clear & bitter' },
    ],
    weeklySnow: [40, 35, 20, 5, 0, 25, 45],
    website: 'https://asahidake.hokkaido.jp',
    notes: 'Highest resort in Hokkaido at 2291m. Opens in October, closes in June. Extreme alpine terrain. Japan\'s most snowfall.',
  },
  {
    id: 17, rank: '#17',
    name: 'Sahoro', nameJP: 'サホロスキー場',
    region: 'hokkaido', prefecture: 'Hokkaido',
    lat: 43.1100, lon: 143.1200,
    elevation: { base: 390, summit: 1029 },
    photo: '',
    bgGradient: 'linear-gradient(135deg,#2a1a0a,#4a3010)',
    stats: {
      baseDepth: 155, summit48h: 38, base48h: 30,
      openRuns: 20, totalRuns: 21,
      lifts: { open: 9, total: 9 },
      condition: 'Packed Powder', windKph: 18, visibility: 'Good', tempC: -11
    },
    forecast: [
      { day:'Mon', icon:'❄️', snow:12, high:-9,  low:-15, desc:'Snow showers' },
      { day:'Tue', icon:'🌨', snow:20, high:-10, low:-16, desc:'Snow' },
      { day:'Wed', icon:'☀️', snow:0,  high:-8,  low:-14, desc:'Clear' },
      { day:'Thu', icon:'⛅', snow:3,  high:-7,  low:-13, desc:'Partly cloudy' },
      { day:'Fri', icon:'🌨', snow:15, high:-9,  low:-15, desc:'Snow' },
    ],
    weeklySnow: [12, 20, 0, 3, 15, 10, 8],
    website: 'https://www.clubmed.co.jp/r/sahoro',
    notes: 'Club Med resort in the Tokachi mountains. Wide groomed runs, family-friendly. Less crowded than western Hokkaido.',
  },
  {
    id: 18, rank: '#18',
    name: 'Tazawako', nameJP: 'たざわ湖スキー場',
    region: 'honshu', prefecture: 'Akita',
    lat: 39.7200, lon: 140.6900,
    elevation: { base: 400, summit: 1167 },
    photo: '',
    bgGradient: 'linear-gradient(135deg,#0a1e3a,#0f2d55)',
    stats: {
      baseDepth: 105, summit48h: 22, base48h: 16,
      openRuns: 13, totalRuns: 13,
      lifts: { open: 8, total: 8 },
      condition: 'Groomed', windKph: 14, visibility: 'Good', tempC: -7
    },
    forecast: [
      { day:'Mon', icon:'⛅', snow:6,  high:-5, low:-10, desc:'Light snow' },
      { day:'Tue', icon:'🌨', snow:14, high:-6, low:-11, desc:'Snow' },
      { day:'Wed', icon:'❄️', snow:8,  high:-5, low:-10, desc:'Snow showers' },
      { day:'Thu', icon:'☀️', snow:0,  high:-3, low:-8,  desc:'Clear' },
      { day:'Fri', icon:'⛅', snow:4,  high:-4, low:-9,  desc:'Partly cloudy' },
    ],
    weeklySnow: [6, 14, 8, 0, 4, 10, 6],
    website: 'https://www.tazawako-ski.com',
    notes: 'Overlooking the deep-blue Lake Tazawa (Japan\'s deepest). Well-groomed runs with spectacular lake views. Good Tohoku powder.',
  },
  {
    id: 19, rank: '#19',
    name: 'Grandeco', nameJP: 'グランデコスノーリゾート',
    region: 'honshu', prefecture: 'Fukushima',
    lat: 37.7700, lon: 139.9700,
    elevation: { base: 1100, summit: 1590 },
    photo: '',
    bgGradient: 'linear-gradient(135deg,#112210,#1c3a1a)',
    stats: {
      baseDepth: 135, summit48h: 28, base48h: 22,
      openRuns: 26, totalRuns: 30,
      lifts: { open: 10, total: 10 },
      condition: 'Packed Powder', windKph: 10, visibility: 'Excellent', tempC: -8
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:12, high:-6, low:-11, desc:'Snow' },
      { day:'Tue', icon:'🌨', snow:16, high:-7, low:-12, desc:'Heavy snow' },
      { day:'Wed', icon:'⛅', snow:4,  high:-5, low:-10, desc:'Partly cloudy' },
      { day:'Thu', icon:'☀️', snow:0,  high:-3, low:-8,  desc:'Sunny' },
      { day:'Fri', icon:'❄️', snow:8,  high:-5, low:-10, desc:'Snow showers' },
    ],
    weeklySnow: [12, 16, 4, 0, 8, 10, 14],
    website: 'https://www.grandeco.com',
    notes: 'Four gondolas access the upper mountain. Consistent powder snow in Ura-Bandai. One of Tohoku\'s best kept secrets.',
  },
  {
    id: 20, rank: '#20',
    name: 'Yuzawa Kogen', nameJP: '湯沢高原スキー場',
    region: 'honshu', prefecture: 'Niigata',
    lat: 36.9300, lon: 138.8200,
    elevation: { base: 340, summit: 1124 },
    photo: '',
    bgGradient: 'linear-gradient(135deg,#1e1e2e,#2a2a4a)',
    stats: {
      baseDepth: 110, summit48h: 22, base48h: 18,
      openRuns: 10, totalRuns: 10,
      lifts: { open: 4, total: 4 },
      condition: 'Groomed', windKph: 20, visibility: 'Moderate', tempC: -6
    },
    forecast: [
      { day:'Mon', icon:'🌨', snow:8,  high:-4, low:-9,  desc:'Snow' },
      { day:'Tue', icon:'🌨', snow:14, high:-5, low:-10, desc:'Heavy snow' },
      { day:'Wed', icon:'⛅', snow:2,  high:-3, low:-8,  desc:'Clearing' },
      { day:'Thu', icon:'☀️', snow:0,  high:-1, low:-6,  desc:'Sunny' },
      { day:'Fri', icon:'🌨', snow:6,  high:-4, low:-9,  desc:'Snow' },
    ],
    weeklySnow: [8, 14, 2, 0, 6, 10, 5],
    website: 'https://yuzawakogen.com',
    notes: 'Easy Shinkansen access from Tokyo (75 min). Popular with Tokyo weekenders. Reliable Niigata Japan Sea snowfall.',
  },
];

// ─── Date / Time Helpers ──────────────────────────────────────────────────────
// Open-Meteo returns times in the requested timezone (Asia/Tokyo).
// We convert local time to JST for index matching.

function nowJST() {
  const now = new Date();
  return new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60 * 1000);
}

function todayStrJST() {
  return nowJST().toISOString().slice(0, 10); // "2025-02-24"
}

function findTodayIndex(times) {
  const today = todayStrJST();
  return times.findIndex(t => t === today);
}

function findCurrentHourIndex(times) {
  const jst = nowJST();
  const target = jst.toISOString().slice(0, 13) + ':00'; // "2025-02-24T14:00"
  let best = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] <= target) best = i;
    else break;
  }
  return best;
}

// ─── Data Processing ──────────────────────────────────────────────────────────
function processWeatherData(resort, data) {
  try {
    const { current, hourly, daily } = data;
    if (!current || !hourly || !daily) return false;

    // --- Current conditions ---
    const tempC    = Math.round(current.temperature_2m ?? resort.stats.tempC);
    const windKph  = Math.round(current.windspeed_10m  ?? resort.stats.windKph);
    const wmoCode  = current.weathercode ?? 0;
    const rawDepth = current.snow_depth;  // meters
    const baseDepth = rawDepth != null
      ? Math.max(0, Math.round(rawDepth * 100))
      : resort.stats.baseDepth;
    const visibility = visibilityLabel(current.visibility);

    // --- 48h snowfall from hourly ---
    const hIdx   = findCurrentHourIndex(hourly.time);
    const start  = Math.max(0, hIdx - 47);
    const snowSlice = hourly.snowfall.slice(start, hIdx + 1);
    const base48h = Math.max(0, Math.round(
      snowSlice.reduce((sum, v) => sum + (v || 0), 0)
    ));
    const summit48h = Math.round(base48h * 1.25); // summits get ~25% more

    // --- Surface condition ---
    const condition = deriveCondition(base48h, wmoCode);

    // --- 5-day forecast from daily ---
    const dIdx = findTodayIndex(daily.time);
    if (dIdx === -1) return false;
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const forecast = [];
    for (let i = 0; i < 5 && (dIdx + i) < daily.time.length; i++) {
      const idx = dIdx + i;
      const date = new Date(daily.time[idx] + 'T12:00:00+09:00');
      const info = wmoInfo(daily.weathercode[idx] ?? 0);
      forecast.push({
        day:  DAY_NAMES[date.getDay()],
        icon: info.icon,
        snow: Math.max(0, Math.round(daily.snowfall_sum[idx] || 0)),
        high: Math.round(daily.temperature_2m_max[idx] ?? 0),
        low:  Math.round(daily.temperature_2m_min[idx] ?? 0),
        desc: info.desc,
      });
    }

    // --- 7-day snowfall history (6 days ago → today) ---
    const weeklySnow = [];
    for (let i = 6; i >= 0; i--) {
      const idx = dIdx - i;
      weeklySnow.push(idx >= 0 ? Math.max(0, Math.round(daily.snowfall_sum[idx] || 0)) : 0);
    }

    // --- Apply to resort ---
    resort.stats.baseDepth  = baseDepth;
    resort.stats.base48h    = base48h;
    resort.stats.summit48h  = summit48h;
    resort.stats.tempC      = tempC;
    resort.stats.windKph    = windKph;
    resort.stats.visibility = visibility;
    resort.stats.condition  = condition;
    if (forecast.length >= 3) resort.forecast   = forecast;
    if (weeklySnow.length === 7) resort.weeklySnow = weeklySnow;

    return true;
  } catch (err) {
    console.warn(`[${resort.name}] processWeatherData error:`, err);
    return false;
  }
}

// ─── API Fetch ────────────────────────────────────────────────────────────────
async function fetchResortWeather(resort, onProgress) {
  const params = new URLSearchParams({
    latitude:        resort.lat,
    longitude:       resort.lon,
    current:         'temperature_2m,windspeed_10m,weathercode,snow_depth,visibility',
    hourly:          'snowfall',
    daily:           'snowfall_sum,temperature_2m_max,temperature_2m_min,weathercode',
    past_days:       '7',
    forecast_days:   '5',
    timezone:        'Asia/Tokyo',
    wind_speed_unit: 'kmh',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${OPEN_METEO}?${params}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const ok = processWeatherData(resort, data);
    resort.liveData = ok;
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[${resort.name}] Fetch failed — using fallback data.`, err);
    resort.liveData = false;
  }
  onProgress?.();
}

async function fetchAllWeather() {
  let loaded = 0;
  const badge = document.getElementById('dataBadge');
  if (badge) badge.textContent = '⏳ Updating…';

  const fetchAll = Promise.all(
    RESORTS.map(resort =>
      fetchResortWeather(resort, () => {
        loaded++;
        if (badge) badge.textContent = `⏳ ${loaded}/20 resorts…`;
      })
    )
  );

  await Promise.race([fetchAll, new Promise(resolve => setTimeout(resolve, 10000))]);
  RESORTS.forEach(r => { if (r.liveData === undefined) r.liveData = false; });
}

// ─── 3-Month History ──────────────────────────────────────────────────────────
function getHistoryDateRange() {
  const jst = nowJST();
  const end = new Date(jst);
  end.setDate(end.getDate() - 1);           // yesterday JST (archive requires past dates)
  const start = new Date(end);
  start.setDate(start.getDate() - 90);      // 91-day window = ~13 weeks
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate:   end.toISOString().slice(0, 10),
  };
}

function processHistoryData(daily) {
  if (!daily || !daily.time || !daily.time.length) return null;
  const weeks = [];
  const n = daily.time.length;

  for (let i = 0; i < n; i += 7) {
    const slice   = daily.time.slice(i, i + 7);
    if (!slice.length) break;
    const hiVals  = daily.temperature_2m_max.slice(i, i + 7);
    const loVals  = daily.temperature_2m_min.slice(i, i + 7);
    const snVals  = daily.snowfall_sum.slice(i, i + 7);
    const wdVals  = daily.windspeed_10m_max.slice(i, i + 7);

    const snowTotal = Math.round(snVals.reduce((s, v) => s + (v || 0), 0));
    const tempHi    = Math.round(Math.max(...hiVals.map(v => v ?? -99)));
    const tempLo    = Math.round(Math.min(...loVals.map(v => v ??  99)));
    const windAvg   = Math.round(wdVals.reduce((s, v) => s + (v || 0), 0) / wdVals.length);

    const d = new Date(slice[0] + 'T12:00:00+09:00');
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    weeks.push({ label, snowTotal, tempHi, tempLo, windAvg });
  }
  return weeks.length ? { weeks } : null;
}

async function fetchResortHistory(resort) {
  if (resort.historyCache !== undefined) return resort.historyCache;

  const { startDate, endDate } = getHistoryDateRange();
  const params = new URLSearchParams({
    latitude:        resort.lat,
    longitude:       resort.lon,
    start_date:      startDate,
    end_date:        endDate,
    daily:           'snowfall_sum,temperature_2m_max,temperature_2m_min,windspeed_10m_max',
    timezone:        'Asia/Tokyo',
    wind_speed_unit: 'kmh',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?${params}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    resort.historyCache = processHistoryData(data.daily);
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[${resort.name}] History fetch failed:`, err);
    resort.historyCache = null;
  }
  return resort.historyCache;
}

function buildHistoryHTML(history) {
  if (!history || !history.weeks || !history.weeks.length) {
    return `<div class="hist-error">Historical data unavailable</div>`;
  }
  const { weeks } = history;

  // — Snowfall bars —
  const maxSnow  = Math.max(...weeks.map(w => w.snowTotal), 1);
  const snowBars = weeks.map(w => {
    const h = Math.max(4, Math.round((w.snowTotal / maxSnow) * 52));
    return `
      <div class="snow-bar-wrap">
        <div class="snow-bar-val">${w.snowTotal > 0 ? w.snowTotal : ''}</div>
        <div class="snow-bar" style="height:${h}px"></div>
        <div class="snow-bar-label">${w.label}</div>
      </div>`;
  }).join('');

  // — Temperature range bars —
  const globalHi  = Math.max(...weeks.map(w => w.tempHi));
  const globalLo  = Math.min(...weeks.map(w => w.tempLo));
  const totalSpan = Math.max(globalHi - globalLo, 1);
  const TEMP_H    = 60;
  const tempBars  = weeks.map(w => {
    const rangeH    = Math.max(4, Math.round(((w.tempHi - w.tempLo) / totalSpan) * TEMP_H));
    const topOffset = Math.round(((globalHi - w.tempHi) / totalSpan) * TEMP_H);
    const hiColor   = w.tempHi >= 0 ? 'var(--amber)' : 'var(--accent2)';
    const loColor   = w.tempLo <= -10 ? 'var(--powder)' : 'var(--accent)';
    return `
      <div class="hist-temp-bar-wrap">
        <div class="hist-temp-hi" style="color:${hiColor}">${w.tempHi}°</div>
        <div class="hist-temp-col" style="height:${TEMP_H}px">
          <div class="hist-temp-bar" style="height:${rangeH}px;margin-top:${topOffset}px"></div>
        </div>
        <div class="hist-temp-lo" style="color:${loColor}">${w.tempLo}°</div>
        <div class="snow-bar-label">${w.label}</div>
      </div>`;
  }).join('');

  // — Wind bars —
  const maxWind  = Math.max(...weeks.map(w => w.windAvg), 1);
  const windBars = weeks.map(w => {
    const h = Math.max(4, Math.round((w.windAvg / maxWind) * 52));
    return `
      <div class="snow-bar-wrap">
        <div class="snow-bar-val">${w.windAvg}</div>
        <div class="hist-wind-bar" style="height:${h}px"></div>
        <div class="snow-bar-label">${w.label}</div>
      </div>`;
  }).join('');

  return `
    <div class="modal-section">
      <div class="modal-section-title">Snowfall — Weekly Total (cm)</div>
      <div class="snow-chart hist-chart">${snowBars}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Temperature — Weekly Hi / Lo (°C)</div>
      <div class="hist-temp-chart">${tempBars}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Wind Speed — Weekly Avg (km/h)</div>
      <div class="snow-chart hist-chart">${windBars}</div>
    </div>`;
}

async function renderHistoryIntoModal(resort) {
  const placeholder = document.getElementById('hist-placeholder');
  if (!placeholder) return;
  placeholder.innerHTML = `<div class="hist-loading"><span style="animation:spin 2s linear infinite;display:inline-block">⏳</span> Loading 3-month history…</div>`;
  const history = await fetchResortHistory(resort);
  const el = document.getElementById('hist-placeholder');
  if (el) el.innerHTML = buildHistoryHTML(history);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isPowderDay(resort) {
  return resort.stats.base48h >= 30 || resort.stats.summit48h >= 38;
}

function formatDate() {
  return new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getDayLabels() {
  const jst  = nowJST();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(jst);
    d.setDate(d.getDate() - 6 + i);
    return days[d.getDay()];
  });
}

// ─── Summary Stats ────────────────────────────────────────────────────────────
function renderSummary() {
  const avgTop = Math.round(RESORTS.map(r => Math.round(r.stats.baseDepth * 1.5)).reduce((a, b) => a + b) / RESORTS.length);
  const best48 = Math.max(...RESORTS.map(r => r.stats.summit48h));
  const open   = RESORTS.filter(r => r.stats.lifts.open > 0).length;
  const powder = RESORTS.filter(isPowderDay).length;
  const live   = RESORTS.filter(r => r.liveData).length;

  document.getElementById('avgBase').textContent      = avgTop + ' cm';
  document.getElementById('best48h').textContent      = best48 + ' cm';
  document.getElementById('resortsOpen').textContent  = open + '/20';
  document.getElementById('powderAlert').textContent  = powder > 0 ? `${powder} Resort${powder > 1 ? 's' : ''}!` : 'None';
  if (powder > 0) document.getElementById('powderAlert').style.color = 'var(--powder)';

  document.getElementById('lastUpdated').textContent =
    `Live data (${live}/20 resorts) · ${formatDate()}`;

  // Show live/demo ratio badge
  const badge = document.getElementById('dataBadge');
  if (badge) {
    badge.textContent = live === 20 ? '🟢 All Live' : live > 0 ? `🟡 ${live}/20 Live` : '⚪ Demo Data';
  }
}

// ─── Card Rendering ───────────────────────────────────────────────────────────
function buildCard(resort) {
  const { stats, forecast } = resort;
  const powder = isPowderDay(resort);
  const condCls = /powder/i.test(stats.condition) ? 'open'
                : /groomed|packed/i.test(stats.condition) ? ''
                : 'warn';

  const forecastHTML = forecast.map(f => `
    <div class="forecast-day">
      <div class="forecast-day-name">${f.day}</div>
      <div class="forecast-day-icon">${f.icon}</div>
      <div class="forecast-day-snow">${f.snow > 0 ? f.snow + 'cm' : '—'}</div>
      <div class="forecast-day-temp">${f.high}°</div>
    </div>`).join('');

  const card = document.createElement('div');
  card.className = 'resort-card';
  card.dataset.region = resort.region;
  card.dataset.powder = powder ? 'true' : 'false';
  card.innerHTML = `
    <div class="card-hero">
      <div class="card-hero-bg" style="background:${resort.bgGradient}" data-photo="${resort.photo || ''}"></div>
      <div class="card-hero-overlay"></div>
      <div class="card-rank">${resort.rank}</div>
      <div class="card-live-badge ${resort.liveData ? 'live' : 'demo'}">${resort.liveData ? '● LIVE' : '○ DEMO'}</div>
      ${powder ? '<div class="card-powder-badge show">❄ POWDER DAY</div>' : ''}
      <div class="card-name-block">
        <div class="card-name">${resort.name}</div>
        <div class="card-prefecture">${resort.prefecture} · ${resort.elevation.base}–${resort.elevation.summit}m</div>
      </div>
    </div>
    <div class="card-body">
      <div class="snow-strip">
        <div class="snow-strip-item">
          <div class="snow-strip-label">Base Depth</div>
          <div class="snow-strip-val" style="color:var(--accent)">${stats.baseDepth}<span class="snow-strip-unit"> cm</span></div>
        </div>
        <div class="snow-strip-divider"></div>
        <div class="snow-strip-item">
          <div class="snow-strip-label">48h Snow</div>
          <div class="snow-strip-val" style="color:${stats.base48h >= 30 ? 'var(--powder)' : 'var(--accent2)'}">${stats.base48h}<span class="snow-strip-unit"> cm</span></div>
        </div>
        <div class="snow-strip-divider"></div>
        <div class="snow-strip-item">
          <div class="snow-strip-label">Temp</div>
          <div class="snow-strip-val">${stats.tempC}°<span class="snow-strip-unit">C</span></div>
        </div>
      </div>
      <div class="forecast-row">${forecastHTML}</div>
      <div class="stat-row">
        <div class="stat-pill ${condCls}"><span class="pill-icon">🏔</span>${stats.condition}</div>
        <div class="stat-pill ${stats.lifts.open === stats.lifts.total ? 'open' : ''}"><span class="pill-icon">🚡</span>${stats.lifts.open}/${stats.lifts.total} lifts</div>
        <div class="stat-pill"><span class="pill-icon">💨</span>${stats.windKph} km/h</div>
        <div class="stat-pill"><span class="pill-icon">👁</span>${stats.visibility}</div>
      </div>
    </div>`;

  // Load photo progressively — gradient stays until image is ready
  if (resort.photo) {
    const heroBg = card.querySelector('.card-hero-bg');
    const img = new Image();
    img.onload = () => {
      heroBg.style.backgroundImage = `url(${resort.photo})`;
      heroBg.style.backgroundSize = 'cover';
      heroBg.style.backgroundPosition = 'center';
      heroBg.classList.add('photo-loaded');
    };
    img.src = resort.photo;
  }

  card.addEventListener('click', () => openModal(resort));
  return card;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(resort) {
  const { stats, forecast } = resort;
  const dayLabels = getDayLabels();
  const maxSnow   = Math.max(...resort.weeklySnow, 1);

  const barsHTML = resort.weeklySnow.map((v, i) => {
    const h = Math.max(4, Math.round((v / maxSnow) * 52));
    return `
      <div class="snow-bar-wrap">
        <div class="snow-bar-val">${v > 0 ? v : ''}</div>
        <div class="snow-bar" style="height:${h}px"></div>
        <div class="snow-bar-label">${dayLabels[i]}</div>
      </div>`;
  }).join('');

  const forecastHTML = forecast.map(f => `
    <div class="modal-forecast-day">
      <div class="modal-day-name">${f.day}</div>
      <div class="modal-day-icon">${f.icon}</div>
      <div class="modal-day-snow">${f.snow > 0 ? f.snow + ' cm' : '—'}</div>
      <div class="modal-day-temp">${f.high}° / ${f.low}°</div>
      <div class="modal-day-desc">${f.desc}</div>
    </div>`).join('');

  const liveNote = resort.liveData
    ? `<span class="modal-live-chip live">● Live — Open-Meteo</span>`
    : `<span class="modal-live-chip demo">○ Demo data (API unavailable)</span>`;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-hero" style="background:${resort.bgGradient}" id="modalHero">
      <div class="modal-hero-overlay"></div>
      <div class="modal-hero-title">
        <div class="modal-resort-name">${resort.name}</div>
        <div class="modal-resort-sub">${resort.nameJP} · ${resort.prefecture} · ${resort.rank} in Japan</div>
        <div style="margin-top:6px">${liveNote}</div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <div class="modal-section-title">Current Conditions</div>
        <div class="modal-stat-grid">
          <div class="modal-stat"><div class="modal-stat-icon">🏔</div><div class="modal-stat-val" style="color:var(--accent)">${stats.baseDepth} cm</div><div class="modal-stat-label">Base Depth</div></div>
          <div class="modal-stat"><div class="modal-stat-icon">❄️</div><div class="modal-stat-val" style="color:var(--powder)">${stats.summit48h} cm</div><div class="modal-stat-label">Summit 48h</div></div>
          <div class="modal-stat"><div class="modal-stat-icon">🌡</div><div class="modal-stat-val">${stats.tempC}°C</div><div class="modal-stat-label">Temperature</div></div>
          <div class="modal-stat"><div class="modal-stat-icon">💨</div><div class="modal-stat-val">${stats.windKph}</div><div class="modal-stat-label">Wind km/h</div></div>
          <div class="modal-stat"><div class="modal-stat-icon">👁</div><div class="modal-stat-val" style="font-size:1rem">${stats.visibility}</div><div class="modal-stat-label">Visibility</div></div>
          <div class="modal-stat"><div class="modal-stat-icon">🎿</div><div class="modal-stat-val" style="font-size:0.85rem">${stats.condition}</div><div class="modal-stat-label">Surface</div></div>
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">5-Day Forecast</div>
        <div class="modal-forecast-row">${forecastHTML}</div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">7-Day Snowfall (cm)</div>
        <div class="snow-chart">${barsHTML}</div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">Resort Info</div>
        <div class="modal-info-grid">
          <div class="modal-info-item"><span class="modal-info-label">Elevation</span><span class="modal-info-val">${resort.elevation.base}–${resort.elevation.summit}m</span></div>
          <div class="modal-info-item"><span class="modal-info-label">Open Runs</span><span class="modal-info-val ${stats.openRuns === stats.totalRuns ? 'green' : ''}">${stats.openRuns} / ${stats.totalRuns}</span></div>
          <div class="modal-info-item"><span class="modal-info-label">Lifts Open</span><span class="modal-info-val ${stats.lifts.open === stats.lifts.total ? 'green' : 'amber'}">${stats.lifts.open} / ${stats.lifts.total}</span></div>
          <div class="modal-info-item"><span class="modal-info-label">Base 48h Snow</span><span class="modal-info-val" style="color:var(--accent)">${stats.base48h} cm</span></div>
          <div class="modal-info-item"><span class="modal-info-label">Prefecture</span><span class="modal-info-val">${resort.prefecture}</span></div>
          <div class="modal-info-item"><span class="modal-info-label">Region</span><span class="modal-info-val">${resort.region.charAt(0).toUpperCase() + resort.region.slice(1)}</span></div>
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">About</div>
        <p style="font-size:0.85rem;color:var(--text-dim);line-height:1.6">${resort.notes}</p>
      </div>
      <div id="hist-placeholder"></div>
    </div>`;

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Load modal hero photo progressively
  if (resort.photo) {
    const hero = document.getElementById('modalHero');
    const img = new Image();
    img.onload = () => {
      hero.style.backgroundImage = `url(${resort.photo})`;
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundPosition = 'center';
    };
    img.src = resort.photo;
  }

  // Load 3-month history asynchronously (non-blocking)
  renderHistoryIntoModal(resort);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function applyFilter(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  document.querySelectorAll('.resort-card').forEach(card => {
    let show = true;
    if (filter === 'hokkaido') show = card.dataset.region === 'hokkaido';
    else if (filter === 'honshu') show = card.dataset.region === 'honshu';
    else if (filter === 'powder') show = card.dataset.powder === 'true';
    card.classList.toggle('hidden', !show);
  });
}

// ─── Map ──────────────────────────────────────────────────────────────────────
let map, conditionLayer, forecastLayer, markersLayer;

function conditionColor(base48h) {
  if (base48h >= 40) return '#a78bfa'; // powder purple
  if (base48h >= 20) return '#4fc3f7'; // packed powder cyan
  if (base48h >= 8)  return '#4ade80'; // groomed green
  return '#94a3b8';                    // minimal slate
}

function initMap() {
  if (typeof L === 'undefined') {
    console.warn('Leaflet not loaded — map section hidden.');
    document.querySelector('.map-section').style.display = 'none';
    return;
  }

  map = L.map('map', {
    center: [39.8, 139.5],
    zoom: 6,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  conditionLayer = L.layerGroup().addTo(map);
  forecastLayer  = L.layerGroup(); // hidden by default
  markersLayer   = L.layerGroup().addTo(map);

  document.querySelectorAll('.map-layer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.map-layer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.layer === 'conditions') {
        map.removeLayer(forecastLayer);
        conditionLayer.addTo(map);
      } else {
        map.removeLayer(conditionLayer);
        forecastLayer.addTo(map);
      }
    });
  });
}

function renderMapMarkers() {
  if (!map) return;

  conditionLayer.clearLayers();
  forecastLayer.clearLayers();
  markersLayer.clearLayers();

  RESORTS.forEach(resort => {
    const { stats, lat, lon } = resort;
    const color    = conditionColor(stats.base48h);
    const isPowder = stats.base48h >= 40;

    // Condition halo — size reflects base snow depth
    const condRadius = Math.min(65, Math.max(25, 25 + Math.sqrt(stats.baseDepth) * 1.8));
    L.circleMarker([lat, lon], {
      radius:      condRadius,
      fillColor:   color,
      fillOpacity: 0.22,
      color:       color,
      weight:      1.5,
      opacity:     0.55,
    }).addTo(conditionLayer);

    // Forecast halo — size reflects 48h predicted snowfall
    const fcRadius = Math.min(55, Math.max(15, 15 + Math.sqrt(stats.base48h + 1) * 4.5));
    L.circleMarker([lat, lon], {
      radius:      fcRadius,
      fillColor:   color,
      fillOpacity: 0.28,
      color:       color,
      weight:      1.5,
      opacity:     0.6,
    }).addTo(forecastLayer);

    // Resort marker pill
    const sName      = resort.name.split(' ')[0];
    const icon       = resort.region === 'hokkaido' ? '❄' : '⛷';
    const powderCls  = isPowder ? ' powder' : '';

    const divIcon = L.divIcon({
      html: `<div class="map-pin${powderCls}" style="--mc:${color}">
               <div class="map-pin-bubble">
                 <span class="map-pin-icon">${icon}</span>
                 <span class="map-pin-name">${sName}</span>
                 <span class="map-pin-temp">${stats.tempC}°</span>
               </div>
               <div class="map-pin-tip"></div>
             </div>`,
      className:  '',
      iconAnchor: [0, 0],
    });

    const marker = L.marker([lat, lon], { icon: divIcon });
    marker.on('click', () => openModal(resort));
    marker.addTo(markersLayer);
  });
}

// ─── Full-Screen Map Modal ────────────────────────────────────────────────────
let bigMap = null;

// Global hook so Leaflet popup buttons can open the resort modal
window.openResortFromMap = function(id) {
  closeBigMap();
  const resort = RESORTS.find(r => r.id === id);
  if (resort) openModal(resort);
};

function renderBigMapMarkers() {
  if (!bigMap) return;
  RESORTS.forEach(resort => {
    const { stats, lat, lon } = resort;
    const color    = conditionColor(stats.base48h);
    const isPowder = stats.base48h >= 40;

    // Snow-depth halo
    const haloR = Math.min(55, Math.max(20, 20 + Math.sqrt(stats.baseDepth) * 1.5));
    L.circleMarker([lat, lon], {
      radius: haloR, fillColor: color, fillOpacity: 0.2,
      color: color, weight: 1.5, opacity: 0.5,
    }).addTo(bigMap);

    // Popup
    const popupHTML = `
      <div>
        <div class="bmp-popup-head" style="background:${resort.bgGradient}">
          <div class="bmp-popup-rank">${resort.rank} in Japan</div>
          <div class="bmp-popup-name">${resort.name}</div>
          <div class="bmp-popup-sub">${resort.nameJP} · ${resort.prefecture}</div>
        </div>
        <div class="bmp-popup-body">
          <div class="bmp-popup-row"><span>❄ Base Depth</span><strong style="color:var(--accent)">${stats.baseDepth} cm</strong></div>
          <div class="bmp-popup-row"><span>🌨 48h Snow</span><strong style="color:${color}">${stats.base48h} cm</strong></div>
          <div class="bmp-popup-row"><span>🌡 Temp</span><strong>${stats.tempC}°C</strong></div>
          <div class="bmp-popup-row"><span>💨 Wind</span><strong>${stats.windKph} km/h</strong></div>
          <div class="bmp-popup-row"><span>🏔 Surface</span><strong>${stats.condition}</strong></div>
        </div>
        <button class="bmp-popup-btn" onclick="openResortFromMap(${resort.id})">View Full Details →</button>
      </div>`;

    // Pin marker (reuses existing map-pin styles)
    const sName     = resort.name.split(' ')[0];
    const pinIcon   = resort.region === 'hokkaido' ? '❄' : '⛷';
    const powderCls = isPowder ? ' powder' : '';
    const divIcon = L.divIcon({
      html: `<div class="map-pin${powderCls}" style="--mc:${color}">
               <div class="map-pin-bubble">
                 <span class="map-pin-icon">${pinIcon}</span>
                 <span class="map-pin-name">${sName}</span>
                 <span class="map-pin-temp">${stats.tempC}°</span>
               </div>
               <div class="map-pin-tip"></div>
             </div>`,
      className: '', iconAnchor: [0, 0],
    });

    L.marker([lat, lon], { icon: divIcon })
      .bindPopup(popupHTML, { maxWidth: 230, className: 'bmp-popup-wrap' })
      .addTo(bigMap);
  });
}

function initBigMap() {
  if (typeof L === 'undefined') return;
  if (bigMap) { bigMap.invalidateSize(); return; }

  bigMap = L.map('bigMap', { center: [39.8, 139.5], zoom: 6 });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(bigMap);

  renderBigMapMarkers();
}

function openBigMap() {
  document.getElementById('bigMapOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => initBigMap(), 60); // delay ensures modal has dimensions
}

function closeBigMap() {
  document.getElementById('bigMapOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Snow Background ──────────────────────────────────────────────────────────
function createSnowflakes() {
  const container = document.getElementById('snowBg');
  const chars = ['❄', '❅', '❆', '·', '•'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'snowflake';
    el.textContent = chars[Math.floor(Math.random() * chars.length)];
    el.style.left              = Math.random() * 100 + 'vw';
    el.style.fontSize          = (Math.random() * 1.2 + 0.4) + 'em';
    el.style.animationDuration = (Math.random() * 15 + 10) + 's';
    el.style.animationDelay    = (Math.random() * 15) + 's';
    el.style.opacity           = Math.random() * 0.5 + 0.1;
    container.appendChild(el);
  }
}

// ─── Auto-Refresh ─────────────────────────────────────────────────────────────
function scheduleRefresh() {
  // Refresh live data every 6 hours
  setTimeout(async () => {
    const grid = document.getElementById('resortGrid');
    grid.innerHTML = '';
    await fetchAllWeather();
    renderSummary();
    RESORTS.forEach(resort => grid.appendChild(buildCard(resort)));
    scheduleRefresh();
  }, 6 * 60 * 60 * 1000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  createSnowflakes();
  try { initMap(); } catch (e) {
    console.warn('Map init failed:', e);
    document.querySelector('.map-section').style.display = 'none';
  }

  const grid = document.getElementById('resortGrid');

  // Render immediately with fallback data so the UI is never blocked
  RESORTS.forEach(r => { r.liveData = false; });
  renderSummary();
  RESORTS.forEach(resort => grid.appendChild(buildCard(resort)));
  renderMapMarkers();

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  // Resort detail modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // Full-screen map modal
  document.getElementById('bigMapClose').addEventListener('click', closeBigMap);
  document.getElementById('bigMapOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('bigMapOverlay')) closeBigMap();
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeBigMap(); } });

  // Fetch live data in background, then silently refresh
  await fetchAllWeather();
  renderSummary();
  grid.innerHTML = '';
  RESORTS.forEach(resort => grid.appendChild(buildCard(resort)));
  renderMapMarkers();

  scheduleRefresh();
}

document.addEventListener('DOMContentLoaded', init);
