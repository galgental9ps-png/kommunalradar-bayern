import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourcesPath = path.join(root, 'public', 'data', 'sources.json');
const outputPath = path.join(root, 'public', 'data', 'latest.json');

const CONFIG = JSON.parse(await fs.readFile(sourcesPath, 'utf8'));
const now = new Date();
const MAX_ITEMS_PER_SOURCE = Number(process.env.MAX_ITEMS_PER_SOURCE || 24);
const MAX_TOTAL_ITEMS = Number(process.env.MAX_TOTAL_ITEMS || 220);
const MAX_DETAIL_FETCHES = Number(process.env.MAX_DETAIL_FETCHES || 45);

const CATEGORIES = [
  'Verwaltungsvorschriften',
  'Kommunalrecht',
  'Haushalt & Finanzen',
  'Förderprogramme',
  'Steuern & Abgaben',
  'Vergabe',
  'Personal & Tarif',
  'Beamtenrecht',
  'Ausbildung / BVS',
  'Digitalisierung / BayernPortal / OZG',
  'Bauen & Planung',
  'Klima / Energie',
  'Schule / Kita',
  'Soziales',
  'Sicherheit & Ordnung',
  'Datenschutz',
  'Rechtsprechung',
  'Landtag / Gesetze',
  'Fristen & To-dos'
];

const CATEGORY_KEYWORDS = {
  'Verwaltungsvorschriften': ['verwaltungsvorschrift', 'verwaltungsvorschriften', 'vollzugshinweis', 'vollzugshinweise', 'vollzug', 'bekanntmachung', 'rundschreiben', 'ministerialblatt', 'baymbl', 'amtsblatt', 'richtlinie', 'förderrichtlinie', 'vollzugsbekanntmachung'],
  'Kommunalrecht': ['kommunalrecht', 'gemeindeordnung', 'landkreisordnung', 'bezirksordnung', 'baygo', 'baylko', 'satzung', 'geschäftsordnung', 'gemeinderat', 'stadtrat', 'kommunale selbstverwaltung', 'verwaltungsgemeinschaft', 'wahlen', 'bürgerbegehren'],
  'Haushalt & Finanzen': ['haushalt', 'finanzausgleich', 'schlüsselzuweisung', 'kreisumlage', 'bezirksumlage', 'haushaltsplan', 'finanzplanung', 'investition', 'jahresrechnung', 'kasse', 'kredit', 'rücklage', 'steuerkraft', 'kommHV', 'doppik', 'kameralistik'],
  'Förderprogramme': ['förderprogramm', 'förderung', 'förderrichtlinie', 'zuwendung', 'antragsfrist', 'aufruf', 'förderantrag', 'mittelabruf', 'städtebauförderung', 'leader', 'bewilligung', 'zuwendungsrecht'],
  'Steuern & Abgaben': ['grundsteuer', 'gewerbesteuer', 'hundesteuer', 'abgabe', 'beitrag', 'gebühr', 'gebühren', 'kommunalabgabengesetz', 'baykag', 'hebesatz', 'steuerkraft', 'erschließungsbeitrag', 'straßenausbaubeitrag'],
  'Vergabe': ['vergabe', 'ausschreibung', 'schwellenwert', 'vob', 'uvgo', 'gwb', 'beschaffung', 'auftragsvergabe', 'ex-ante', 'ex-post', 'vergaberecht'],
  'Personal & Tarif': ['tvöd', 'tarif', 'personal', 'fachkräftemangel', 'stellenplan', 'dienstrecht', 'arbeitszeit', 'eingruppierung', 'personalrat', 'tvoed', 'entgeltordnung'],
  'Beamtenrecht': ['beamtenrecht', 'beamter', 'beamte', 'beamtin', 'baybg', 'beamtstg', 'beamtenstatusgesetz', 'llbg', 'leistungslaufbahngesetz', 'laufbahn', 'probezeit', 'ernennung', 'abordnung', 'versetzung', 'besoldung', 'baybesg', 'versorgung', 'beihilfe', 'dienstunfähigkeit', 'disziplinarrecht', 'nebentätigkeit', 'personalakte', 'ruhegehalt', 'dienstunfall'],
  'Ausbildung / BVS': ['bvs', 'bayerische verwaltungsschule', 'verwaltungsfachangestellte', 'verwaltungsfachangestellter', 'vfa-k', 'vfa', 'verwaltungsfachwirt', 'beschäftigtenlehrgang', 'angestelltenlehrgang', 'bl i', 'bl ii', 'prüfung', 'abschlussprüfung', 'zwischenprüfung', 'ausbildung', 'stoffplan', 'lehrgang', 'verwaltungsausbildung', 'verwaltungswirt', 'qe2', 'fallbezogene rechtsanwendung'],
  'Digitalisierung / BayernPortal / OZG': ['digitalisierung', 'bayernportal', 'ozg', 'registermodernisierung', 'online-dienst', 'online dienst', 'bayernid', 'e-government', 'egov', 'id-wallet', 'eid', 'once-only'],
  'Bauen & Planung': ['bauleitplanung', 'bebauungsplan', 'flächennutzungsplan', 'baybo', 'baugb', 'baurecht', 'wohnraum', 'städtebau', 'planung', 'mobilität', 'verkehr', 'sanierungssatzung'],
  'Klima / Energie': ['klima', 'energie', 'wärmeplanung', 'kommunale wärmeplanung', 'photovoltaik', 'windenergie', 'kommunaler klimaschutz', 'nachhaltigkeit', 'wasser', 'hochwasser', 'starkregen', 'abwasser'],
  'Schule / Kita': ['schule', 'kita', 'kindertageseinrichtung', 'ganztag', 'schulfinanzierung', 'schülerbeförderung', 'kinderbetreuung', 'jugendhilfe', 'kindergarten'],
  'Soziales': ['soziales', 'pflege', 'integration', 'eingliederungshilfe', 'senioren', 'unterkunft', 'asyl', 'krankenhaus', 'gesundheit', 'jugendamt', 'wohngeld'],
  'Sicherheit & Ordnung': ['sicherheit', 'ordnung', 'katastrophenschutz', 'feuerwehr', 'rettungsdienst', 'polizei', 'kommunaler ordnungsdienst', 'waffenrecht', 'gefahrenabwehr', 'sirene', 'versammlungsrecht', 'melderecht', 'passwesen'],
  'Datenschutz': ['datenschutz', 'dsgvo', 'informationssicherheit', 'datenschutzbeauftragte', 'auskunftsanspruch', 'ki-verordnung', 'videoüberwachung', 'datensicherheit'],
  'Rechtsprechung': ['urteil', 'beschluss', 'entscheidung', 'verwaltungsgericht', 'vgh', 'bayvgh', 'bverwg', 'rechtsprechung', 'leitsatz', 'gericht'],
  'Landtag / Gesetze': ['gesetz', 'gesetzentwurf', 'verordnung', 'landtag', 'ausschuss', 'drucksache', 'anhörung', 'gesetzesänderung', 'gvbl', 'bundesgesetzblatt'],
  'Fristen & To-dos': ['frist', 'fristen', 'stichtag', 'antragsfrist', 'abgabefrist', 'inkrafttreten', 'tritt in kraft', 'übergangsfrist', 'meldepflicht', 'berichtspflicht', 'muss', 'verpflichtend', 'pflicht', 'bis zum', 'umsetzung']
};

const HIGH_RELEVANCE_TERMS = [
  'pflichtaufgabe', 'pflicht', 'muss', 'gesetzesänderung', 'änderung', 'frist', 'stichtag', 'inkrafttreten', 'förderrichtlinie', 'förderprogramm', 'kommunaler haushalt', 'finanzausgleich', 'schlüsselzuweisung', 'kreisumlage', 'bezirksumlage', 'grundsteuer', 'gewerbesteuer', 'hebesatz', 'satzung', 'gebühr', 'beitrag', 'vergabe', 'schwellenwert', 'tvöd', 'beamtenrecht', 'baybg', 'besoldung', 'beihilfe', 'bvs', 'prüfung', 'ozg', 'bayernportal', 'registermodernisierung', 'baugb', 'baybo', 'wärmeplanung', 'datenschutz', 'rechtsprechung', 'gemeinde', 'stadt', 'landkreis', 'kommune', 'kommunal', 'verwaltungsvorschrift', 'baymbl', 'bekanntmachung'
];

const MUNICIPAL_TERMS = [
  'kommune', 'kommunal', 'gemeinde', 'stadt', 'markt', 'landkreis', 'bezirk', 'rathaus', 'verwaltungsgemeinschaft', 'gemeinderat', 'stadtrat', 'bürgermeister', 'landratsamt', 'kämmerei', 'hauptamt', 'bauamt', 'ordnungsamt', 'personalamt'
];

const EXCLUDE_TERMS = [
  'impressum', 'datenschutzinformation', 'datenschutzerklärung', 'kontakt', 'barrierefreiheit', 'leichte sprache', 'newsletter', 'social media', 'facebook', 'instagram', 'youtube', 'pressefoto', 'pressefotos', 'pressebild', 'bildergalerie', 'stellenangebot', 'karriere', 'praktikum', 'öffnungszeiten', 'anfahrt', 'veranstaltungskalender', 'login', 'anmelden', 'warenkorb'
];

const UI_LABELS = {
  urgent: 'Sofort wichtig',
  high: 'Hoch',
  normal: 'Normal',
  watch: 'Beobachten'
};

const DEPARTMENTS = {
  'Verwaltungsvorschriften': ['Geschäftsleitung', 'Hauptamt', 'Fachamt', 'Kämmerei'],
  'Kommunalrecht': ['Geschäftsleitung', 'Hauptamt', 'Bürgermeister', 'Gemeinderat/Stadtrat'],
  'Haushalt & Finanzen': ['Kämmerei', 'Geschäftsleitung', 'Bürgermeister', 'Gemeinderat/Stadtrat'],
  'Steuern & Abgaben': ['Kämmerei', 'Steueramt', 'Geschäftsleitung', 'Gemeinderat/Stadtrat'],
  'Förderprogramme': ['Kämmerei', 'Fachamt', 'Geschäftsleitung', 'Gemeinderat/Stadtrat'],
  'Vergabe': ['Vergabestelle', 'Kämmerei', 'Bauamt', 'Fachamt'],
  'Personal & Tarif': ['Personalamt', 'Geschäftsleitung', 'Bürgermeister'],
  'Beamtenrecht': ['Personalamt', 'Geschäftsleitung', 'Bürgermeister', 'betroffene Beamte'],
  'Ausbildung / BVS': ['Auszubildende', 'Ausbildungsleitung', 'Personalamt', 'Hauptamt'],
  'Digitalisierung / BayernPortal / OZG': ['Hauptamt', 'IT/Digitalisierung', 'Geschäftsleitung', 'Bürgerbüro'],
  'Bauen & Planung': ['Bauamt', 'Kämmerei', 'Geschäftsleitung', 'Gemeinderat/Stadtrat'],
  'Klima / Energie': ['Bauamt', 'Klimaschutz/Umwelt', 'Kämmerei', 'Gemeinderat/Stadtrat'],
  'Schule / Kita': ['Hauptamt', 'Schulverwaltung', 'Kita-Verwaltung', 'Kämmerei'],
  'Soziales': ['Sozialamt', 'Jugendamt', 'Geschäftsleitung', 'Kämmerei'],
  'Sicherheit & Ordnung': ['Ordnungsamt', 'Feuerwehr/Katastrophenschutz', 'Geschäftsleitung', 'Bürgermeister'],
  'Datenschutz': ['Datenschutzbeauftragte/r', 'Hauptamt', 'IT/Digitalisierung', 'Geschäftsleitung'],
  'Rechtsprechung': ['Geschäftsleitung', 'Rechtsamt', 'betroffenes Fachamt'],
  'Landtag / Gesetze': ['Geschäftsleitung', 'Hauptamt', 'Fachamt', 'Gemeinderat/Stadtrat'],
  'Fristen & To-dos': ['Geschäftsleitung', 'Hauptamt', 'Kämmerei', 'Fachamt']
};

function decodeHtml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripHtml(value = '') {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeHtml(match[1]).trim() : '';
}

function absolutize(url, base) {
  try {
    return new URL(decodeHtml(url), base).toString();
  } catch {
    return '';
  }
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function isAllowedDomain(url) {
  const host = hostname(url);
  return CONFIG.allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function normalizeText(value = '') {
  return stripHtml(value).replace(/[\u00ad]/g, '').replace(/\s+/g, ' ').trim();
}

function parseDate(value = '') {
  const clean = stripHtml(value).trim();
  if (!clean) return null;

  const german = clean.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  if (german) {
    const [, d, m, y] = german;
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00+01:00`).toISOString();
  }

  const isoDate = clean.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (isoDate) return new Date(`${isoDate[0]}T12:00:00+01:00`).toISOString();

  const parsed = Date.parse(clean);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function daysAgo(isoDate) {
  if (!isoDate) return 999;
  return Math.floor((now.getTime() - new Date(isoDate).getTime()) / 86400000);
}

async function fetchText(url) {
  if (!isAllowedDomain(url)) throw new Error(`Domain nicht erlaubt: ${url}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'KommunalRadarBayern/0.2 (+public source monitor; contact via repository owner)',
        'accept': 'text/html,application/xhtml+xml,application/xml,text/xml,application/rss+xml;q=0.9,*/*;q=0.7'
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function parseFeed(xml, source) {
  const blocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const atomBlocks = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  const feedBlocks = blocks.length ? blocks : atomBlocks;

  return feedBlocks.slice(0, MAX_ITEMS_PER_SOURCE).map((block) => {
    const atomLink = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
    const rawLink = getTag(block, 'link') || atomLink || source.url;
    const title = normalizeText(getTag(block, 'title'));
    const description = normalizeText(getTag(block, 'description') || getTag(block, 'summary') || getTag(block, 'content'));
    const date = parseDate(getTag(block, 'pubDate') || getTag(block, 'updated') || getTag(block, 'published') || getTag(block, 'dc:date'));
    return {
      rawTitle: title,
      rawSummary: description,
      url: absolutize(rawLink, source.url),
      date,
      source
    };
  }).filter((item) => item.rawTitle && item.url && isAllowedDomain(item.url));
}

function parseHtml(html, source) {
  const clean = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const candidates = [];
  const seen = new Set();

  for (const match of clean.matchAll(/<a\b([^>]*?)href=["']([^"'#]+)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = match[2];
    const text = normalizeText(match[4]);
    const url = absolutize(href, source.url);
    if (!text || text.length < 8 || !url || !isAllowedDomain(url) || seen.has(url)) continue;
    seen.add(url);
    const aroundStart = Math.max(0, match.index - 220);
    const aroundEnd = Math.min(clean.length, match.index + match[0].length + 260);
    const around = normalizeText(clean.slice(aroundStart, aroundEnd));
    const date = parseDate(around) || parseDate(text);
    candidates.push({ rawTitle: text, rawSummary: around, url, date, source });
  }

  if (source.type === 'reference' || candidates.length === 0) {
    candidates.unshift({
      rawTitle: source.title || source.name,
      rawSummary: source.description || source.tags?.join(', ') || source.name,
      url: source.url,
      date: null,
      source
    });
  }

  return candidates.slice(0, MAX_ITEMS_PER_SOURCE);
}

function shouldExclude(item) {
  const text = `${item.rawTitle} ${item.rawSummary} ${item.url}`.toLowerCase();
  if (EXCLUDE_TERMS.some((term) => text.includes(term))) return true;
  if (item.rawTitle.length > 220) return true;
  return false;
}

function keywordScore(text, keywords) {
  return keywords.reduce((sum, term) => sum + (text.includes(term.toLowerCase()) ? 1 : 0), 0);
}

function classify(text, source) {
  const scores = CATEGORIES.map((category) => {
    const terms = CATEGORY_KEYWORDS[category] || [];
    let score = keywordScore(text, terms) * 8;
    if (source.categoryHint === category) score += 9;
    if ((source.tags || []).some((tag) => tag.toLowerCase() === category.toLowerCase())) score += 5;
    return { category, score };
  }).sort((a, b) => b.score - a.score);

  return scores[0].score > 0 ? scores[0].category : source.categoryHint || 'Kommunalrecht';
}

function focusAreasFor(text, category) {
  const focus = new Set([category]);
  for (const key of ['Verwaltungsvorschriften', 'Beamtenrecht', 'Ausbildung / BVS', 'Fristen & To-dos', 'Haushalt & Finanzen', 'Rechtsprechung']) {
    if (keywordScore(text, CATEGORY_KEYWORDS[key] || []) > 0) focus.add(key);
  }
  if (category === 'Förderprogramme' && keywordScore(text, CATEGORY_KEYWORDS['Fristen & To-dos']) > 0) focus.add('Fristen & To-dos');
  return [...focus];
}

function priorityFromScore(score) {
  if (score >= 82) return UI_LABELS.urgent;
  if (score >= 64) return UI_LABELS.high;
  if (score >= 42) return UI_LABELS.normal;
  return UI_LABELS.watch;
}

function relevanceFromScore(score) {
  if (score >= 82) return 'Sehr hoch';
  if (score >= 64) return 'Hoch';
  if (score >= 42) return 'Normal';
  return 'Beobachten';
}

function summaryFor(item, category, focusAreas) {
  const base = item.rawSummary && item.rawSummary.length > item.rawTitle.length ? item.rawSummary : item.rawTitle;
  const trimmed = base.length > 260 ? `${base.slice(0, 257).trim()}…` : base;
  if (trimmed && trimmed !== item.rawTitle) return trimmed;

  if (focusAreas.includes('Beamtenrecht')) return 'Hinweis mit möglichem Bezug zu Beamtenrecht, Dienstrecht, Laufbahn, Besoldung, Beihilfe oder Personalverfahren.';
  if (focusAreas.includes('Ausbildung / BVS')) return 'Hinweis mit möglichem Bezug zu Ausbildung, BVS, Prüfung, Lehrgang oder prüfungsrelevantem Verwaltungswissen.';
  if (focusAreas.includes('Verwaltungsvorschriften')) return 'Hinweis aus dem Bereich Bekanntmachungen, Verwaltungsvorschriften, Richtlinien oder ministerielle Vollzugshinweise.';
  if (focusAreas.includes('Fristen & To-dos')) return 'Hinweis mit möglicher Frist, Umsetzungsaufgabe oder einem konkreten nächsten Prüfschritt.';
  return `Hinweis aus dem Bereich ${category} mit möglicher Bedeutung für die kommunale Verwaltungspraxis.`;
}

function whyImportant(category, focusAreas) {
  if (focusAreas.includes('Beamtenrecht')) return 'Kann Personalamt, Dienstvorgesetzte und kommunale Beamte bei Statusfragen, Besoldung, Beihilfe, Laufbahn oder Dienstpflichten betreffen.';
  if (focusAreas.includes('Ausbildung / BVS')) return 'Kann für Auszubildende, Beschäftigtenlehrgänge, Prüfungsstoff oder praktische Fallbearbeitung in der Kommunalverwaltung wichtig sein.';
  if (focusAreas.includes('Verwaltungsvorschriften')) return 'Verwaltungsvorschriften, Bekanntmachungen und Vollzugshinweise können unmittelbar bestimmen, wie Verfahren, Förderung oder Haushaltsvollzug anzuwenden sind.';
  if (focusAreas.includes('Fristen & To-dos')) return 'Fristen, Inkrafttreten oder Pflichtaufgaben können kurzfristige organisatorische Schritte in der Verwaltung auslösen.';
  const map = {
    'Haushalt & Finanzen': 'Kann Haushaltsplanung, Finanzplanung, Umlagen, Steuerkraft oder Investitionsentscheidungen beeinflussen.',
    'Förderprogramme': 'Kann Förderanträge, Eigenanteile, Mittelabruf, Fristen und Haushaltsansätze betreffen.',
    'Steuern & Abgaben': 'Kann Satzungen, Hebesätze, Gebührenkalkulation, Beiträge oder Bescheide betreffen.',
    'Vergabe': 'Kann Beschaffung, Schwellenwerte, Dokumentation, Ausschreibung oder Vergabeverfahren betreffen.',
    'Digitalisierung / BayernPortal / OZG': 'Kann Online-Dienste, BayernPortal, Registermodernisierung, Bürgerbüro oder interne IT-Prozesse betreffen.',
    'Bauen & Planung': 'Kann Bauleitplanung, Genehmigungsverfahren, Satzungen, Städtebauförderung oder Investitionen betreffen.',
    'Datenschutz': 'Kann Datenschutzorganisation, Informationspflichten, Aktenführung oder digitale Verfahren betreffen.',
    'Rechtsprechung': 'Kann Bescheide, Satzungen, Ermessensausübung oder laufende Verfahren beeinflussen.'
  };
  return map[category] || 'Kann Zuständigkeiten, Verfahren, Gremienvorbereitung oder Verwaltungspraxis in einer bayerischen Kommune betreffen.';
}

function impactsFor(category, focusAreas) {
  const impacts = new Set();
  if (focusAreas.includes('Fristen & To-dos')) impacts.add('Frist/Termin überwachen');
  if (focusAreas.includes('Verwaltungsvorschriften')) impacts.add('Verfahren/Vollzug prüfen');
  if (focusAreas.includes('Beamtenrecht')) impacts.add('Personalverfahren prüfen');
  if (focusAreas.includes('Ausbildung / BVS')) impacts.add('Lern-/Prüfungsstoff prüfen');
  if (['Haushalt & Finanzen', 'Förderprogramme', 'Steuern & Abgaben'].includes(category)) impacts.add('Haushalt/Finanzplanung');
  if (['Kommunalrecht', 'Steuern & Abgaben', 'Bauen & Planung'].includes(category)) impacts.add('Satzung/Beschluss prüfen');
  if (['Vergabe'].includes(category)) impacts.add('Vergabe/Beschaffung');
  if (['Digitalisierung / BayernPortal / OZG'].includes(category)) impacts.add('Online-Dienst/IT-Verfahren');
  if (['Rechtsprechung', 'Landtag / Gesetze'].includes(category)) impacts.add('Rechtsgrundlage/Muster prüfen');
  impacts.add('Zuständiges Fachamt informieren');
  return [...impacts];
}

function nextStepFor(category, focusAreas) {
  if (focusAreas.includes('Fristen & To-dos')) return 'Originalquelle öffnen, Frist oder Inkrafttreten notieren und die federführende Stelle festlegen.';
  if (focusAreas.includes('Ausbildung / BVS')) return 'Prüfen, ob Termin, Stoffplan, Prüfungsinhalt oder Lernunterlagen angepasst werden müssen.';
  if (focusAreas.includes('Beamtenrecht')) return 'Prüfen, ob kommunale Beamte betroffen sind und ob Personalamt, Geschäftsleitung oder Personalrat einzubinden sind.';
  if (focusAreas.includes('Verwaltungsvorschriften')) return 'Fundstelle, Geltungsbereich und Vollzugshinweise prüfen; Zuständigkeit und Umsetzungsbedarf dokumentieren.';
  if (category === 'Haushalt & Finanzen') return 'Auswirkungen auf Haushaltsplan, Finanzplanung, Umlagen oder Investitionen prüfen.';
  if (category === 'Förderprogramme') return 'Förderfähigkeit, Antragsfrist, Eigenanteil und Haushaltsmittel prüfen.';
  if (category === 'Rechtsprechung') return 'Vergleichbarkeit mit eigenen Verfahren prüfen und bei Bedarf Rechtsamt/Geschäftsleitung informieren.';
  return 'Originalquelle öffnen, kommunale Betroffenheit prüfen und nächsten internen Bearbeitungsschritt festlegen.';
}

function tagsFor(text, source, category, focusAreas) {
  const tags = new Set([category, ...focusAreas, ...(source.tags || [])]);
  for (const term of HIGH_RELEVANCE_TERMS) {
    if (text.includes(term.toLowerCase()) && term.length > 2) tags.add(term.length > 22 ? term.slice(0, 22) : term);
  }
  return [...tags].slice(0, 12);
}

function analyse(item, detailText = '') {
  const source = item.source;
  const text = `${item.rawTitle} ${item.rawSummary} ${detailText} ${(source.tags || []).join(' ')}`.toLowerCase();
  const category = classify(text, source);
  const focusAreas = focusAreasFor(text, category);
  const recency = daysAgo(item.date);
  const recencyScore = recency <= 2 ? 20 : recency <= 7 ? 14 : recency <= 30 ? 8 : 2;
  const municipalScore = keywordScore(text, MUNICIPAL_TERMS) * 5;
  const highScore = keywordScore(text, HIGH_RELEVANCE_TERMS) * 4;
  const sourceScore = Number(source.weight || 10);
  const focusBonus = focusAreas.includes('Verwaltungsvorschriften') || focusAreas.includes('Beamtenrecht') || focusAreas.includes('Ausbildung / BVS') ? 10 : 0;
  const score = Math.max(18, Math.min(100, sourceScore + recencyScore + municipalScore + highScore + focusBonus));
  const priority = priorityFromScore(score);

  return {
    id: crypto.createHash('sha1').update(`${source.id}-${item.url}-${item.rawTitle}`).digest('hex').slice(0, 16),
    title: item.rawTitle,
    source: source.name,
    sourceUrl: source.url,
    url: item.url,
    date: item.date || now.toISOString(),
    category,
    focusAreas,
    priority,
    score,
    relevance: relevanceFromScore(score),
    shortSummary: summaryFor(item, category, focusAreas),
    whyImportant: whyImportant(category, focusAreas),
    affectedUnits: DEPARTMENTS[category] || ['Geschäftsleitung', 'Hauptamt', 'Fachamt'],
    possibleImpacts: impactsFor(category, focusAreas),
    nextStep: nextStepFor(category, focusAreas),
    tags: tagsFor(text, source, category, focusAreas)
  };
}

async function enrichDetails(items) {
  const relevant = items
    .filter((item) => item.url && item.url !== item.source.url)
    .slice(0, MAX_DETAIL_FETCHES);
  const details = new Map();

  for (const item of relevant) {
    try {
      const html = await fetchText(item.url);
      const text = normalizeText(html).slice(0, 3500);
      details.set(item.url, text);
    } catch {
      details.set(item.url, '');
    }
  }

  return details;
}

async function collect() {
  const sourceErrors = [];
  const rawItems = [];

  for (const source of CONFIG.sources) {
    try {
      if (source.type === 'reference') {
        rawItems.push(...parseHtml('', source));
        continue;
      }
      const text = await fetchText(source.url);
      const parsed = source.type === 'rss' || /<rss|<feed/i.test(text) ? parseFeed(text, source) : parseHtml(text, source);
      rawItems.push(...parsed);
    } catch (error) {
      sourceErrors.push({ source: source.name, url: source.url, message: error.message });
    }
  }

  const filtered = rawItems.filter((item) => !shouldExclude(item));
  const unique = new Map();
  for (const item of filtered) {
    const key = item.url || `${item.source.id}-${item.rawTitle}`;
    if (!unique.has(key)) unique.set(key, item);
  }

  const detailMap = await enrichDetails([...unique.values()]);
  const analysed = [...unique.values()]
    .map((item) => analyse(item, detailMap.get(item.url) || ''))
    .filter((item) => item.score >= 30)
    .sort((a, b) => b.score - a.score || new Date(b.date) - new Date(a.date))
    .slice(0, MAX_TOTAL_ITEMS);

  const categoryCounts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
  const focusCounts = {
    'Verwaltungsvorschriften': 0,
    'Beamtenrecht': 0,
    'Ausbildung / BVS': 0,
    'Fristen & To-dos': 0,
    'Haushalt & Finanzen': 0,
    'Rechtsprechung': 0
  };

  for (const item of analysed) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    for (const focus of item.focusAreas || []) {
      if (focus in focusCounts) focusCounts[focus] += 1;
    }
  }

  return {
    appName: CONFIG.meta.appName,
    subtitle: CONFIG.meta.subtitle,
    generatedAt: now.toISOString(),
    disclaimer: CONFIG.meta.notes,
    stats: {
      total: analysed.length,
      urgent: analysed.filter((item) => item.priority === 'Sofort wichtig').length,
      high: analysed.filter((item) => item.priority === 'Hoch').length,
      sourcesChecked: CONFIG.sources.length,
      sourcesWithErrors: sourceErrors.length,
      focusCounts
    },
    categoryCounts,
    items: analysed,
    sourceErrors
  };
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const data = await collect();
await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`KommunalRadar Bayern: ${data.items.length} Hinweise, ${data.stats.sourcesWithErrors} Quellenfehler.`);
