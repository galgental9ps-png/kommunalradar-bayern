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
const MAX_ITEMS_PER_SOURCE = Number(process.env.MAX_ITEMS_PER_SOURCE || 18);
const MAX_TOTAL_ITEMS = Number(process.env.MAX_TOTAL_ITEMS || 160);
const MAX_DETAIL_FETCHES = Number(process.env.MAX_DETAIL_FETCHES || 35);

const CATEGORIES = [
  'Sofort wichtig',
  'Kommunalrecht',
  'Haushalt & Finanzen',
  'Förderprogramme',
  'Steuern & Abgaben',
  'Vergabe',
  'Personal & Tarif',
  'Digitalisierung / BayernPortal / OZG',
  'Bauen & Planung',
  'Klima / Energie',
  'Schule / Kita',
  'Soziales',
  'Sicherheit & Ordnung',
  'Datenschutz',
  'Rechtsprechung',
  'Landtag / Gesetze',
  'Ministerien / Rundschreiben'
];

const CATEGORY_KEYWORDS = {
  'Kommunalrecht': ['kommunalrecht', 'gemeindeordnung', 'landkreisordnung', 'bezirksordnung', 'baygo', 'baylko', 'satzung', 'geschäftsordnung', 'gemeinderat', 'stadtrat', 'kommunale selbstverwaltung'],
  'Haushalt & Finanzen': ['haushalt', 'finanzausgleich', 'schlüsselzuweisung', 'kreisumlage', 'bezirksumlage', 'haushaltsplan', 'finanzplanung', 'investition', 'jahresrechnung', 'kasse', 'kredit', 'rücklage', 'steuerkraft'],
  'Förderprogramme': ['förderprogramm', 'förderung', 'förderrichtlinie', 'zuwendung', 'antragsfrist', 'aufruf', 'förderantrag', 'mittelabruf', 'städtebauförderung', 'leader'],
  'Steuern & Abgaben': ['grundsteuer', 'gewerbesteuer', 'hundesteuer', 'abgabe', 'beitrag', 'gebühr', 'gebühren', 'kommunalabgabengesetz', 'baykag', 'hebesatz', 'steuerkraft'],
  'Vergabe': ['vergabe', 'ausschreibung', 'schwellenwert', 'vob', 'uvgo', 'gwb', 'beschaffung', 'auftragsvergabe', 'ex-ante', 'ex-post'],
  'Personal & Tarif': ['tvöd', 'tarif', 'beamtenrecht', 'besoldung', 'personal', 'fachkräftemangel', 'stellenplan', 'dienstrecht', 'arbeitszeit', 'eingruppierung'],
  'Digitalisierung / BayernPortal / OZG': ['digitalisierung', 'bayernportal', 'ozg', 'registermodernisierung', 'online-dienst', 'online dienst', 'bayernid', 'e-government', 'egov', 'id-wallet', 'eid'],
  'Bauen & Planung': ['bauleitplanung', 'bebauungsplan', 'flächennutzungsplan', 'baybo', 'baugb', 'baurecht', 'wohnraum', 'städtebau', 'planung', 'mobilität', 'verkehr'],
  'Klima / Energie': ['klima', 'energie', 'wärmeplanung', 'kommunale wärmeplanung', 'photovoltaik', 'windenergie', 'kommunaler klimaschutz', 'nachhaltigkeit', 'wasser', 'hochwasser'],
  'Schule / Kita': ['schule', 'kita', 'kindertageseinrichtung', 'ganztag', 'schulfinanzierung', 'schülerbeförderung', 'kinderbetreuung', 'jugendhilfe'],
  'Soziales': ['soziales', 'pflege', 'integration', 'eingliederungshilfe', 'senioren', 'unterkunft', 'asyl', 'krankenhaus', 'gesundheit', 'jugendamt'],
  'Sicherheit & Ordnung': ['sicherheit', 'ordnung', 'katastrophenschutz', 'feuerwehr', 'rettungsdienst', 'polizei', 'kommunaler ordnungsdienst', 'waffenrecht', 'gefahrenabwehr', 'sirene'],
  'Datenschutz': ['datenschutz', 'dsgvo', 'informationssicherheit', 'datenschutzbeauftragte', 'auskunftsanspruch', 'ki-verordnung', 'videoüberwachung'],
  'Rechtsprechung': ['urteil', 'beschluss', 'entscheidung', 'verwaltungsgericht', 'vgh', 'bayvgh', 'bverwg', 'rechtsprechung', 'leitsatz'],
  'Landtag / Gesetze': ['gesetz', 'gesetzentwurf', 'verordnung', 'landtag', 'ausschuss', 'drucksache', 'anhörung', 'gesetzesänderung', 'bundesgesetzblatt'],
  'Ministerien / Rundschreiben': ['bekanntmachung', 'rundschreiben', 'vollzugshinweis', 'verwaltungsvorschrift', 'ministerialblatt', 'richtlinie', 'vollzug', 'hinweise']
};

const HIGH_RELEVANCE_TERMS = [
  'pflichtaufgabe', 'pflicht', 'muss', 'gesetzesänderung', 'änderung', 'frist', 'stichtag', 'förderrichtlinie', 'förderprogramm', 'kommunaler haushalt', 'finanzausgleich', 'schlüsselzuweisung', 'kreisumlage', 'bezirksumlage', 'grundsteuer', 'gewerbesteuer', 'hebesatz', 'satzung', 'gebühr', 'beitrag', 'vergabe', 'schwellenwert', 'tvöd', 'beamtenrecht', 'ozg', 'bayernportal', 'registermodernisierung', 'baugb', 'baybo', 'wärmeplanung', 'datenschutz', 'rechtsprechung', 'gemeinde', 'stadt', 'landkreis', 'kommune', 'kommunal'
];

const MUNICIPAL_TERMS = [
  'kommune', 'kommunal', 'gemeinde', 'stadt', 'markt', 'landkreis', 'bezirk', 'rathaus', 'verwaltungsgemeinschaft', 'gemeinderat', 'stadtrat', 'bürgermeister', 'landratsamt', 'kämmerei'
];

const EXCLUDE_TERMS = [
  'impressum', 'datenschutzinformation', 'datenschutzerklärung', 'kontakt', 'barrierefreiheit', 'leichte sprache', 'newsletter', 'social media', 'facebook', 'instagram', 'youtube', 'pressefoto', 'pressefotos', 'pressebild', 'bildergalerie', 'stellenangebot', 'karriere', 'praktikum', 'öffnungszeiten', 'anfahrt', 'veranstaltungskalender', 'login', 'anmelden'
];

const UI_LABELS = {
  urgent: 'Sofort wichtig',
  high: 'Hoch',
  normal: 'Normal',
  watch: 'Beobachten'
};

const DEPARTMENTS = {
  'Haushalt & Finanzen': ['Kämmerei', 'Geschäftsleitung', 'Bürgermeister', 'Gemeinderat/Stadtrat'],
  'Steuern & Abgaben': ['Kämmerei', 'Steueramt', 'Geschäftsleitung', 'Gemeinderat/Stadtrat'],
  'Förderprogramme': ['Kämmerei', 'Fachamt', 'Geschäftsleitung', 'Gemeinderat/Stadtrat'],
  'Vergabe': ['Vergabestelle', 'Kämmerei', 'Bauamt', 'Fachamt'],
  'Personal & Tarif': ['Personalamt', 'Geschäftsleitung', 'Bürgermeister'],
  'Digitalisierung / BayernPortal / OZG': ['Hauptamt', 'IT/Digitalisierung', 'Geschäftsleitung', 'Bürgerbüro'],
  'Bauen & Planung': ['Bauamt', 'Kämmerei', 'Geschäftsleitung', 'Gemeinderat/Stadtrat'],
  'Klima / Energie': ['Bauamt', 'Klimaschutz/Umwelt', 'Kämmerei', 'Gemeinderat/Stadtrat'],
  'Schule / Kita': ['Hauptamt', 'Schulverwaltung', 'Kita-Verwaltung', 'Kämmerei'],
  'Soziales': ['Sozialamt', 'Jugendamt', 'Geschäftsleitung', 'Kämmerei'],
  'Sicherheit & Ordnung': ['Ordnungsamt', 'Feuerwehr/Katastrophenschutz', 'Geschäftsleitung', 'Bürgermeister'],
  'Datenschutz': ['Datenschutzbeauftragte/r', 'Hauptamt', 'IT', 'Geschäftsleitung'],
  'Rechtsprechung': ['Geschäftsleitung', 'Rechtsamt', 'betroffenes Fachamt'],
  'Landtag / Gesetze': ['Geschäftsleitung', 'Hauptamt', 'Fachamt', 'Gemeinderat/Stadtrat'],
  'Ministerien / Rundschreiben': ['Geschäftsleitung', 'Hauptamt', 'Fachamt']
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
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'KommunalRadarBayern/0.1 (+public source monitor; contact via repository owner)',
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
      title,
      url: absolutize(rawLink, source.url),
      date,
      rawSummary: description,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      sourceWeight: source.weight || 0,
      categoryHint: source.categoryHint,
      sourceTags: source.tags || []
    };
  }).filter((item) => item.title && item.url && isAllowedDomain(item.url));
}

function parseHtml(html, source) {
  const cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');

  const anchors = [...cleanHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const result = [];

  for (const match of anchors) {
    const [, href, inner] = match;
    const title = normalizeText(inner);
    if (!title || title.length < 7 || title.length > 220) continue;
    const url = absolutize(href, source.url);
    if (!url || !isAllowedDomain(url)) continue;

    const before = cleanHtml.slice(Math.max(0, match.index - 350), match.index);
    const after = cleanHtml.slice(match.index + match[0].length, match.index + match[0].length + 350);
    const context = normalizeText(`${before} ${title} ${after}`);
    const date = parseDate(context);

    result.push({
      title,
      url,
      date,
      rawSummary: context.length > title.length + 20 ? context.slice(0, 420) : '',
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      sourceWeight: source.weight || 0,
      categoryHint: source.categoryHint,
      sourceTags: source.tags || []
    });
  }

  return result.slice(0, MAX_ITEMS_PER_SOURCE * 3);
}

function isExcluded(item) {
  const text = `${item.title} ${item.rawSummary} ${item.url}`.toLowerCase();
  if (EXCLUDE_TERMS.some((term) => text.includes(term))) return true;
  if (/\.(jpg|jpeg|png|gif|svg|webp|mp4|zip)$/i.test(new URL(item.url).pathname)) return true;
  if (text.includes('/impressum') || text.includes('/datenschutz') || text.includes('/kontakt')) return true;
  return false;
}

function countTerms(text, terms) {
  return terms.reduce((score, term) => score + (text.includes(term.toLowerCase()) ? 1 : 0), 0);
}

function classify(item) {
  const text = `${item.title} ${item.rawSummary} ${item.sourceTags.join(' ')} ${item.sourceName}`.toLowerCase();
  let bestCategory = item.categoryHint || 'Kommunalrecht';
  let bestScore = 0;

  for (const [category, terms] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = countTerms(text, terms);
    if (hits > bestScore) {
      bestScore = hits;
      bestCategory = category;
    }
  }

  return CATEGORIES.includes(bestCategory) ? bestCategory : 'Kommunalrecht';
}

function scoreItem(item, category) {
  const text = `${item.title} ${item.rawSummary} ${item.sourceTags.join(' ')} ${item.sourceName}`.toLowerCase();
  let score = 8 + (item.sourceWeight || 0);

  score += Math.min(24, countTerms(text, HIGH_RELEVANCE_TERMS) * 4);
  score += Math.min(20, countTerms(text, MUNICIPAL_TERMS) * 5);
  score += Math.min(16, countTerms(text, CATEGORY_KEYWORDS[category] || []) * 3);

  if (text.includes('bayern') && countTerms(text, MUNICIPAL_TERMS) > 0) score += 8;
  if (text.includes('frist') || text.includes('stichtag') || text.includes('antragsfrist')) score += 10;
  if (text.includes('gesetzesänderung') || text.includes('änderung der') || text.includes('verordnung zur änderung')) score += 10;
  if (text.includes('pflichtaufgabe') || text.includes('muss ') || text.includes('verpflichtet')) score += 12;
  if (category === 'Haushalt & Finanzen' || category === 'Steuern & Abgaben' || category === 'Förderprogramme') score += 6;

  const age = daysAgo(item.date);
  if (age <= 7) score += 10;
  else if (age <= 30) score += 6;
  else if (age <= 90) score += 2;
  else if (age > 365) score -= 6;

  return Math.max(0, Math.min(100, score));
}

function priorityFromScore(score) {
  if (score >= 72) return UI_LABELS.urgent;
  if (score >= 52) return UI_LABELS.high;
  if (score >= 32) return UI_LABELS.normal;
  return UI_LABELS.watch;
}

function summaryFor(item, category) {
  if (item.rawSummary && item.rawSummary.length > 60) {
    const trimmed = item.rawSummary.replace(item.title, '').trim();
    if (trimmed.length > 70) return sentence(trimmed, 260);
  }
  return `Die Meldung weist auf eine Entwicklung im Bereich ${category} hin. Für die kommunale Praxis sollte geprüft werden, ob daraus Handlungs-, Informations- oder Beschlussbedarf entsteht.`;
}

function sentence(text, max = 220) {
  const clean = normalizeText(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const boundary = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf(', '));
  return `${cut.slice(0, boundary > 120 ? boundary + 1 : max).trim()} …`;
}

function whyImportant(category, item) {
  const text = `${item.title} ${item.rawSummary}`.toLowerCase();

  if (text.includes('frist') || text.includes('stichtag') || text.includes('förderantrag')) {
    return 'Enthält mögliche Fristen oder Antragspunkte. Kommunen sollten Zuständigkeit, Zeitplan und Haushaltsmittel frühzeitig prüfen.';
  }
  if (text.includes('satzung') || text.includes('gebühr') || text.includes('beitrag') || text.includes('steuer')) {
    return 'Kann kommunale Satzungen, Gebühren-, Beitrags- oder Steuerregelungen berühren und damit Beschluss- oder Anpassungsbedarf auslösen.';
  }
  if (text.includes('gesetz') || text.includes('verordnung') || text.includes('bekanntmachung') || text.includes('richtlinie')) {
    return 'Kann neue oder geänderte rechtliche Vorgaben enthalten. Für die Verwaltung ist eine fachliche Prüfung der Vollzugsauswirkungen erforderlich.';
  }

  const defaults = {
    'Haushalt & Finanzen': 'Kann sich auf Haushaltsplanung, Finanzplanung, Umlagen, Zuweisungen oder Investitionsentscheidungen auswirken.',
    'Förderprogramme': 'Kann Förderchancen, Kofinanzierung, Antragsunterlagen oder Fristen für kommunale Projekte betreffen.',
    'Vergabe': 'Kann Beschaffungsprozesse, Schwellenwerte, Vergabeunterlagen oder interne Zuständigkeiten beeinflussen.',
    'Personal & Tarif': 'Kann Stellenplanung, Personalaufwand, Organisation oder arbeits- und dienstrechtliche Abläufe betreffen.',
    'Digitalisierung / BayernPortal / OZG': 'Kann Online-Dienste, Bürgerkommunikation, Schnittstellen oder organisatorische Zuständigkeiten in der Verwaltung betreffen.',
    'Bauen & Planung': 'Kann Bauleitplanung, Genehmigungsverfahren, kommunale Bauprojekte oder Investitionsplanung betreffen.',
    'Klima / Energie': 'Kann Planung, Fördermittel, Bürgerinformation, Energieprojekte oder kommunale Pflichtaufgaben berühren.',
    'Schule / Kita': 'Kann Sachaufwandsträger, Betreuungsangebote, Schulfinanzierung oder Kita-Verwaltung betreffen.',
    'Soziales': 'Kann kommunale Sozialaufgaben, Landratsamt, Jugendhilfe, Unterbringung oder Kreis-/Bezirksfinanzen betreffen.',
    'Sicherheit & Ordnung': 'Kann Vollzug, Gefahrenabwehr, Feuerwehr, Katastrophenschutz oder ordnungsrechtliche Verfahren betreffen.',
    'Datenschutz': 'Kann Datenschutzorganisation, Informationspflichten, technische Maßnahmen oder behördliche Verfahren betreffen.',
    'Rechtsprechung': 'Kann Auslegung und Vollzugspraxis beeinflussen. Vergleichbare Fälle sollten fachlich/rechtlich geprüft werden.',
    'Landtag / Gesetze': 'Kann auf kommende Rechtsänderungen, parlamentarische Verfahren oder neue Vollzugsanforderungen hinweisen.',
    'Ministerien / Rundschreiben': 'Kann Vollzugshinweise, Verwaltungsvorschriften oder Richtlinien enthalten, die Fachämter beachten müssen.'
  };

  return defaults[category] || 'Kann für kommunale Aufgabenwahrnehmung, interne Verfahren oder Beschlussvorbereitung relevant sein.';
}

function impactFor(category, item) {
  const text = `${item.title} ${item.rawSummary}`.toLowerCase();
  const impacts = [];

  if (text.includes('haushalt') || text.includes('finanz') || text.includes('förder') || text.includes('zuwendung') || text.includes('umlage')) impacts.push('Haushalt/Finanzplanung');
  if (text.includes('satzung') || text.includes('gebühr') || text.includes('beitrag') || text.includes('steuer') || text.includes('hebesatz')) impacts.push('Satzung/Gebühren/Abgaben');
  if (text.includes('frist') || text.includes('stichtag') || text.includes('antrag')) impacts.push('Fristen/Antragsverfahren');
  if (text.includes('personal') || text.includes('tvöd') || text.includes('beamtenrecht') || text.includes('besoldung')) impacts.push('Personal/Organisation');
  if (text.includes('vergabe') || text.includes('beschaffung') || text.includes('ausschreibung')) impacts.push('Vergabe/Beschaffung');
  if (text.includes('ozg') || text.includes('digital') || text.includes('portal') || text.includes('register')) impacts.push('Digitalisierung/Online-Dienste');
  if (text.includes('bau') || text.includes('planung') || text.includes('wohnraum') || text.includes('wärmeplanung')) impacts.push('Planung/Bau/Projektsteuerung');
  if (text.includes('datenschutz') || text.includes('dsgvo') || text.includes('informationssicherheit')) impacts.push('Datenschutz/IT-Sicherheit');
  if (text.includes('gemeinderat') || text.includes('stadtrat') || text.includes('beschluss')) impacts.push('Gremienvorbereitung');

  if (!impacts.length) {
    const fallback = {
      'Haushalt & Finanzen': ['Haushalt/Finanzplanung'],
      'Förderprogramme': ['Fristen/Antragsverfahren', 'Haushalt/Finanzplanung'],
      'Vergabe': ['Vergabe/Beschaffung'],
      'Personal & Tarif': ['Personal/Organisation'],
      'Digitalisierung / BayernPortal / OZG': ['Digitalisierung/Online-Dienste'],
      'Bauen & Planung': ['Planung/Bau/Projektsteuerung'],
      'Datenschutz': ['Datenschutz/IT-Sicherheit'],
      'Landtag / Gesetze': ['Satzung/Verfahren', 'Gremienvorbereitung']
    };
    return fallback[category] || ['Verfahren/Organisation'];
  }

  return [...new Set(impacts)].slice(0, 4);
}

function nextStepFor(category, item) {
  const text = `${item.title} ${item.rawSummary}`.toLowerCase();
  if (text.includes('frist') || text.includes('stichtag')) return 'Frist und Zuständigkeit sofort prüfen; bei Betroffenheit Wiedervorlage und Bearbeitungsvermerk anlegen.';
  if (text.includes('förder') || text.includes('zuwendung')) return 'Prüfen, ob laufende oder geplante Projekte förderfähig sind und ob Eigenmittel im Haushalt eingeplant werden müssen.';
  if (text.includes('satzung') || text.includes('gebühr') || text.includes('beitrag') || text.includes('steuer')) return 'Satzungs-/Gebührenlage mit Kämmerei und Fachamt abgleichen; möglichen Beschlussbedarf vormerken.';
  if (text.includes('vergabe') || text.includes('beschaffung')) return 'Vergabevorgaben mit aktuellen Mustern, Wertgrenzen und laufenden Verfahren abgleichen.';
  if (text.includes('gesetz') || text.includes('verordnung') || text.includes('bekanntmachung')) return 'Originalquelle öffnen und prüfen, ob Vollzugshinweise, Inkrafttreten oder Übergangsfristen relevant sind.';
  if (category === 'Datenschutz') return 'Datenschutzbeauftragte/n einbeziehen und prüfen, ob Verfahren, Informationspflichten oder TOMs anzupassen sind.';
  if (category === 'Personal & Tarif') return 'Personalamt einbeziehen und mögliche Auswirkungen auf Stellenplan, Arbeitsverträge oder Dienstanweisungen prüfen.';
  if (category === 'Digitalisierung / BayernPortal / OZG') return 'Zuständigkeit im Hauptamt/IT klären und prüfen, ob Online-Dienste oder Bürgerinformationen angepasst werden müssen.';
  return 'Originalquelle prüfen, Betroffenheit der Kommune bewerten und bei Bedarf zuständiges Fachamt informieren.';
}

function enrich(item) {
  const category = classify(item);
  const score = scoreItem(item, category);
  const priority = priorityFromScore(score);
  const impacts = impactFor(category, item);
  const affectedUnits = DEPARTMENTS[category] || ['Geschäftsleitung', 'Hauptamt', 'zuständiges Fachamt'];

  return {
    id: crypto.createHash('sha256').update(`${item.url}|${item.title}`).digest('hex').slice(0, 16),
    title: item.title,
    source: item.sourceName,
    sourceId: item.sourceId,
    sourceUrl: item.sourceUrl,
    url: item.url,
    date: item.date || now.toISOString(),
    category,
    priority,
    score,
    relevance: score >= 72 ? 'Sehr hoch' : score >= 52 ? 'Hoch' : score >= 32 ? 'Mittel' : 'Niedrig',
    shortSummary: summaryFor(item, category),
    whyImportant: whyImportant(category, item),
    affectedUnits,
    possibleImpacts: impacts,
    nextStep: nextStepFor(category, item),
    tags: [...new Set([category, ...(item.sourceTags || []), ...impacts])].slice(0, 8)
  };
}

function dedupe(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const canonical = item.url.split('#')[0].replace(/\/$/, '');
    const titleKey = item.title.toLowerCase().replace(/[^a-zäöüß0-9]+/gi, ' ').trim();
    const key = `${hostname(item.url)}|${canonical}|${titleKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

async function main() {
  const errors = [];
  const rawItems = [];

  for (const source of CONFIG.sources.filter((s) => s.enabled !== false)) {
    try {
      const body = await fetchText(source.url);
      const looksLikeFeed = source.type === 'rss' || /<rss|<feed|<item|<entry/i.test(body.slice(0, 3000));
      const parsed = looksLikeFeed ? parseFeed(body, source) : parseHtml(body, source);
      rawItems.push(...parsed.map((item) => ({ ...item, sourceName: source.name, sourceUrl: source.url })));
      console.log(`${source.id}: ${parsed.length} Treffer`);
    } catch (error) {
      errors.push({ source: source.name, url: source.url, message: error.message });
      console.warn(`${source.id}: ${error.message}`);
    }
  }

  const detailCandidates = dedupe(rawItems)
    .filter((item) => !isExcluded(item))
    .slice(0, MAX_DETAIL_FETCHES);

  for (const item of detailCandidates) {
    try {
      const html = await fetchText(item.url);
      const mainText = normalizeText(html)
        .replace(/\b(Startseite|Kontakt|Impressum|Datenschutz|Barrierefreiheit|Suche)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 1200);
      if (mainText.length > item.rawSummary.length) item.rawSummary = mainText;
    } catch {
      // Detailseiten sind Ergänzung; der Monitor bleibt auch ohne Detailtext brauchbar.
    }
  }

  const items = dedupe(rawItems)
    .filter((item) => item.title && item.url && !isExcluded(item))
    .map(enrich)
    .filter((item) => item.score >= 18)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, MAX_TOTAL_ITEMS);

  const categoryCounts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
  for (const item of items) categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;

  const data = {
    appName: CONFIG.meta.appName,
    subtitle: CONFIG.meta.subtitle,
    generatedAt: now.toISOString(),
    disclaimer: 'Automatische Vorbewertung öffentlicher Quellen. Keine Rechtsberatung und keine Verwaltungsentscheidung. Originalquelle und fachliche Zuständigkeit immer prüfen.',
    stats: {
      total: items.length,
      urgent: items.filter((item) => item.priority === UI_LABELS.urgent).length,
      high: items.filter((item) => item.priority === UI_LABELS.high).length,
      sourcesChecked: CONFIG.sources.length,
      sourcesWithErrors: errors.length
    },
    categoryCounts,
    items,
    sourceErrors: errors
  };

  await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Geschrieben: ${outputPath} (${items.length} Meldungen)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
