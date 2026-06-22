import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const FALLBACK_DATA = {
  appName: 'KommunalRadar Bayern',
  subtitle: 'Täglicher Verwaltungs-, Vorschriften-, Finanz- und Ausbildungsmonitor für die bayerische Kommunalverwaltung.',
  generatedAt: new Date().toISOString(),
  disclaimer: 'Automatische fachliche Vorbewertung öffentlicher Quellen. Keine Rechtsberatung, keine Verwaltungsentscheidung und kein Ersatz für Prüfung der Originalquelle.',
  stats: {
    total: 5,
    urgent: 1,
    high: 3,
    sourcesChecked: 0,
    sourcesWithErrors: 0,
    focusCounts: {
      'Verwaltungsvorschriften': 1,
      'Beamtenrecht': 1,
      'Ausbildung / BVS': 1,
      'Fristen & To-dos': 2,
      'Haushalt & Finanzen': 1,
      'Rechtsprechung': 0
    }
  },
  categoryCounts: {},
  items: [
    {
      id: 'fallback-baymbl',
      title: 'Neue oder geänderte Bekanntmachung im Bayerischen Ministerialblatt prüfen',
      source: 'Bayerisches Ministerialblatt',
      sourceUrl: 'https://www.verkuendung-bayern.de/baymbl/',
      url: 'https://www.verkuendung-bayern.de/baymbl/',
      date: new Date().toISOString(),
      category: 'Verwaltungsvorschriften',
      focusAreas: ['Verwaltungsvorschriften', 'Fristen & To-dos'],
      priority: 'Sofort wichtig',
      score: 88,
      relevance: 'Sehr hoch',
      shortSummary: 'Bekanntmachungen, Richtlinien und Vollzugshinweise können unmittelbar für Satzungen, Förderanträge, Haushaltsvollzug oder Verfahren relevant sein.',
      whyImportant: 'Verwaltungsvorschriften konkretisieren häufig, wie Gesetze und Programme praktisch umzusetzen sind.',
      affectedUnits: ['Geschäftsleitung', 'Hauptamt', 'Kämmerei', 'Fachamt'],
      possibleImpacts: ['Verfahren anpassen', 'Frist prüfen', 'Haushaltsansatz prüfen', 'Gremieninformation vorbereiten'],
      nextStep: 'Originalveröffentlichung öffnen, Zuständigkeit klären und prüfen, ob eine Umsetzung oder Information im Haus erforderlich ist.',
      tags: ['BayMBl.', 'Bekanntmachung', 'Vollzug', 'Richtlinie']
    },
    {
      id: 'fallback-beamtenrecht',
      title: 'Änderungen im Beamtenrecht, Besoldung oder Beihilfe beobachten',
      source: 'Bayern.Recht / Freistaat Bayern',
      sourceUrl: 'https://www.gesetze-bayern.de/',
      url: 'https://www.gesetze-bayern.de/',
      date: new Date().toISOString(),
      category: 'Beamtenrecht',
      focusAreas: ['Beamtenrecht', 'Personal & Tarif'],
      priority: 'Hoch',
      score: 76,
      relevance: 'Hoch',
      shortSummary: 'Für Personalamt und Beschäftigte sind BayBG, BeamtStG, LlbG, BayBesG, Versorgung, Beihilfe und Disziplinarrecht besonders relevant.',
      whyImportant: 'Änderungen können Personalverfahren, Dienstpflichten, Besoldung, Beihilfe, Versorgung oder interne Hinweise betreffen.',
      affectedUnits: ['Personalamt', 'Geschäftsleitung', 'Bürgermeister', 'betroffene Beamte'],
      possibleImpacts: ['Personalvorgang prüfen', 'Dienstanweisung aktualisieren', 'Beschäftigte informieren'],
      nextStep: 'Prüfen, ob die Änderung staatliche oder kommunale Beamte betrifft und ob Personalakten, Hinweise oder Bescheide betroffen sind.',
      tags: ['BayBG', 'BeamtStG', 'LlbG', 'Besoldung', 'Beihilfe']
    },
    {
      id: 'fallback-bvs',
      title: 'Ausbildung/BVS: prüfungsrelevante Themen und Termine im Blick behalten',
      source: 'Bayerische Verwaltungsschule',
      sourceUrl: 'https://www.bvs.de/',
      url: 'https://www.bvs.de/',
      date: new Date().toISOString(),
      category: 'Ausbildung / BVS',
      focusAreas: ['Ausbildung / BVS', 'Fristen & To-dos'],
      priority: 'Hoch',
      score: 74,
      relevance: 'Hoch',
      shortSummary: 'Für Ausbildung, BL I/BL II und Prüfungsvorbereitung sind Stoffpläne, Termine, Prüfungsfächer und Fallbearbeitung wichtig.',
      whyImportant: 'Auszubildende und Verwaltungsangestellte brauchen schnelle Orientierung zu prüfungs- und praxisrelevanten Änderungen.',
      affectedUnits: ['Auszubildende', 'Personalamt', 'Ausbildungsleitung', 'Hauptamt'],
      possibleImpacts: ['Lernplan anpassen', 'Prüfungstermin prüfen', 'Ausbildungsnachweis/Unterricht vorbereiten'],
      nextStep: 'BVS-Seite und interne Ausbildungsplanung prüfen.',
      tags: ['BVS', 'VFA-K', 'BL I', 'BL II', 'Prüfung']
    },
    {
      id: 'fallback-finanz',
      title: 'Kommunaler Finanzausgleich, Umlagen und Haushaltsrecht überwachen',
      source: 'Bayerische Finanzverwaltung',
      sourceUrl: 'https://www.stmfh.bayern.de/',
      url: 'https://www.stmfh.bayern.de/',
      date: new Date().toISOString(),
      category: 'Haushalt & Finanzen',
      focusAreas: ['Haushalt & Finanzen', 'Fristen & To-dos'],
      priority: 'Hoch',
      score: 78,
      relevance: 'Hoch',
      shortSummary: 'Finanzausgleich, Umlagen, Steuern und Haushaltsvorschriften können unmittelbar auf Planung und Haushaltsausgleich wirken.',
      whyImportant: 'Kämmerei und Gremien müssen Auswirkungen auf Haushalt, Finanzplanung und Investitionen früh erkennen.',
      affectedUnits: ['Kämmerei', 'Geschäftsleitung', 'Bürgermeister', 'Gemeinderat/Stadtrat'],
      possibleImpacts: ['Haushaltsansatz anpassen', 'Finanzplanung prüfen', 'Gremium informieren'],
      nextStep: 'Auswirkungen auf laufenden Haushalt und Finanzplanungsjahre prüfen.',
      tags: ['Finanzausgleich', 'Kreisumlage', 'Bezirksumlage', 'Haushalt']
    },
    {
      id: 'fallback-fristen',
      title: 'Fristen, Inkrafttreten und kommunale Pflichten gesondert prüfen',
      source: 'KommunalRadar Bayern',
      sourceUrl: '#',
      url: '#',
      date: new Date().toISOString(),
      category: 'Fristen & To-dos',
      focusAreas: ['Fristen & To-dos'],
      priority: 'Normal',
      score: 63,
      relevance: 'Normal',
      shortSummary: 'Meldungen mit Fristen, Inkrafttreten, Förderaufrufen oder Pflichtaufgaben werden in diesem Bereich gesammelt.',
      whyImportant: 'Verpasste Fristen können Fördermittel, Satzungsverfahren, Meldepflichten oder Gremienläufe betreffen.',
      affectedUnits: ['Geschäftsleitung', 'Hauptamt', 'Kämmerei', 'Fachamt'],
      possibleImpacts: ['Termin überwachen', 'Zuständigkeit klären', 'Vorlage vorbereiten'],
      nextStep: 'Frist in eigenen Kalender oder Aufgabenliste übertragen und Originalquelle prüfen.',
      tags: ['Frist', 'To-do', 'Inkrafttreten']
    }
  ],
  sourceErrors: []
};

const TABS = [
  { id: 'overview', label: 'Überblick', description: 'Alle kommunalrelevanten Meldungen mit Priorität und Verwaltungseinschätzung.' },
  { id: 'urgent', label: 'Sofort wichtig', description: 'Meldungen mit Pflicht, Frist, Haushaltseffekt oder unmittelbarem Handlungsbedarf.' },
  { id: 'vv', label: 'Verwaltungsvorschriften', description: 'BayMBl., Bekanntmachungen, Vollzugshinweise, Richtlinien und ministerielle Vorgaben.' },
  { id: 'beamte', label: 'Beamtenrecht', description: 'Alles Wichtige zu Beamtenstatus, Laufbahn, Besoldung, Versorgung, Beihilfe und Dienstpflichten.' },
  { id: 'bvs', label: 'Ausbildung / BVS', description: 'Prüfung, BVS, VFA-K, BL I/BL II, Lernfelder und praktische Fallbearbeitung.' },
  { id: 'fristen', label: 'Fristen & To-dos', description: 'Antragsfristen, Inkrafttreten, Umsetzungsaufgaben und nächste Prüfschritte.' },
  { id: 'finanzen', label: 'Haushalt & Finanzen', description: 'Finanzausgleich, Umlagen, Haushaltsrecht, Steuern, Abgaben und Fördermittel.' },
  { id: 'recht', label: 'Rechtsprechung', description: 'Gerichtsentscheidungen mit möglicher Bedeutung für kommunale Verfahren.' }
];

const ALL_CATEGORIES = [
  'Alle Kategorien',
  'Sofort wichtig',
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

const PRIORITIES = ['Alle Prioritäten', 'Sofort wichtig', 'Hoch', 'Normal', 'Beobachten'];
const UNITS = ['Alle Stellen', 'Auszubildende', 'Personalamt', 'Hauptamt', 'Kämmerei', 'Bauamt', 'Ordnungsamt', 'Geschäftsleitung', 'Bürgermeister', 'Gemeinderat/Stadtrat', 'Datenschutzbeauftragte/r', 'IT/Digitalisierung'];

const KNOWLEDGE = {
  vv: {
    title: 'Was der Tab Verwaltungsvorschriften abdeckt',
    points: ['BayMBl. und Amtsblätter', 'Bekanntmachungen und Richtlinien', 'Vollzugshinweise und Rundschreiben', 'Förderrichtlinien mit Fristen', 'Vorgaben für Satzung, Bescheid, Verfahren oder Haushalt'],
    checklist: ['Originalfundstelle öffnen', 'Geltung für Gemeinden, Städte, Landkreise oder Verwaltungsgemeinschaft prüfen', 'Betroffenes Fachamt festlegen', 'Frist/Inkrafttreten notieren', 'Gremien- oder Dienstanweisung prüfen']
  },
  beamte: {
    title: 'Beamtenrecht – wichtige Themen für Personalamt und Beschäftigte',
    points: ['Beamtenstatusrecht und BayBG', 'Laufbahnrecht, Probezeit, Qualifikation, Beurteilung', 'Ernennung, Abordnung, Versetzung, Ruhestand', 'Dienstpflichten, Nebentätigkeit, Verschwiegenheit', 'Besoldung, Versorgung, Beihilfe, Dienstunfall', 'Disziplinarrecht und Personalaktenrecht'],
    checklist: ['Betrifft es kommunale Beamte oder staatliche Beamte?', 'Ändert sich eine Frist, ein Anspruch oder ein Verfahren?', 'Müssen Personalinformationen oder Muster aktualisiert werden?', 'Ist die Geschäftsleitung oder der Personalrat einzubinden?']
  },
  bvs: {
    title: 'Ausbildung / BVS – wichtig für Verwaltungsangestellte',
    points: ['VFA-K, BL I, BL II und Verwaltungsfachwirt', 'Kommunalrecht, Verwaltungsrecht, Haushaltswesen, Personalwesen', 'Bescheidtechnik, Aktenvermerk, Gutachtenstil und Fallbearbeitung', 'Prüfungstermine, Stoffpläne, Zwischen- und Abschlussprüfung', 'Praxisstationen: Bürgerbüro, Kämmerei, Bauamt, Ordnungsamt, Personalamt'],
    checklist: ['Lernstoff mit aktueller Rechtslage abgleichen', 'Prüfungsrelevante Änderungen markieren', 'Falllösung mit Rechtsgrundlage üben', 'Termine und Nachweise intern prüfen']
  },
  fristen: {
    title: 'Fristen & To-dos – Arbeitsliste für die Verwaltung',
    points: ['Antragsfristen für Förderprogramme', 'Inkrafttreten von Gesetzen und Verordnungen', 'Übergangsfristen und Berichtspflichten', 'Satzungsänderungen, Gebührenkalkulation, Haushaltsvollzug', 'Vorlagen für Gemeinderat/Stadtrat oder Ausschüsse'],
    checklist: ['Frist in Kalender übernehmen', 'Federführende Stelle festlegen', 'Haushaltsmittel prüfen', 'Beschlussbedarf klären', 'Erledigung nachhalten']
  },
  finanzen: {
    title: 'Haushalt & Finanzen – kommunale Steuerung',
    points: ['Finanzausgleich, Schlüsselzuweisungen, Umlagen', 'Haushaltsrecht, Haushaltsplan, Jahresrechnung', 'Steuern, Gebühren, Beiträge und Satzungen', 'Fördermittel, Eigenanteile und Mittelabruf', 'Investitionsplanung und Haushaltsausgleich'],
    checklist: ['Auswirkung auf laufenden Haushalt prüfen', 'Finanzplanungsjahre aktualisieren', 'Satzung oder Gebührenkalkulation prüfen', 'Gremieninformation vorbereiten']
  },
  recht: {
    title: 'Rechtsprechung – Bedeutung für kommunale Praxis',
    points: ['BayVGH, Verwaltungsgerichte, BVerwG', 'Kommunalrecht, Baurecht, Abgabenrecht, Vergabe, Datenschutz', 'Auswirkungen auf Bescheide, Satzungen und Ermessensausübung'],
    checklist: ['Leitsatz und Sachverhalt prüfen', 'Vergleichbarkeit mit eigener Kommune bewerten', 'Musterbescheide oder Satzungen prüfen', 'Rechtsamt/Geschäftsleitung informieren']
  }
};

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return 'ohne Datum';
  }
}

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return 'nicht verfügbar';
  }
}

function priorityClass(priority) {
  if (priority === 'Sofort wichtig') return 'urgent';
  if (priority === 'Hoch') return 'high';
  if (priority === 'Normal') return 'normal';
  return 'watch';
}

function focusForTab(item, activeTab) {
  const text = [item.category, ...(item.focusAreas || []), ...(item.tags || [])].join(' ').toLowerCase();
  if (activeTab === 'overview') return true;
  if (activeTab === 'urgent') return item.priority === 'Sofort wichtig' || item.score >= 80;
  if (activeTab === 'vv') return text.includes('verwaltungsvorschrift') || text.includes('baymbl') || text.includes('rundschreiben') || item.category === 'Verwaltungsvorschriften';
  if (activeTab === 'beamte') return text.includes('beamtenrecht') || text.includes('beamte') || text.includes('besoldung') || item.category === 'Beamtenrecht';
  if (activeTab === 'bvs') return text.includes('bvs') || text.includes('ausbildung') || text.includes('prüfung') || item.category === 'Ausbildung / BVS';
  if (activeTab === 'fristen') return text.includes('frist') || text.includes('to-do') || item.category === 'Fristen & To-dos';
  if (activeTab === 'finanzen') return text.includes('haushalt') || text.includes('finanzen') || text.includes('finanzausgleich') || item.category === 'Haushalt & Finanzen';
  if (activeTab === 'recht') return text.includes('rechtsprechung') || text.includes('gericht') || item.category === 'Rechtsprechung';
  return true;
}

function App() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Alle Kategorien');
  const [priority, setPriority] = useState('Alle Prioritäten');
  const [unit, setUnit] = useState('Alle Stellen');
  const [activeTab, setActiveTab] = useState('overview');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/latest.json`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Daten konnten nicht geladen werden.');
        const json = await response.json();
        setData({ ...FALLBACK_DATA, ...json, stats: { ...FALLBACK_DATA.stats, ...(json.stats || {}) } });
      } catch {
        setData(FALLBACK_DATA);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const allItems = useMemo(() => {
    return [...(data.items || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [data.items]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const text = [
        item.title,
        item.source,
        item.category,
        item.shortSummary,
        item.whyImportant,
        item.nextStep,
        ...(item.focusAreas || []),
        ...(item.tags || []),
        ...(item.affectedUnits || [])
      ].join(' ').toLowerCase();
      const matchesQuery = !needle || text.includes(needle);
      const matchesTab = focusForTab(item, activeTab);
      const matchesCategory = category === 'Alle Kategorien' || item.category === category || (category === 'Sofort wichtig' && item.priority === 'Sofort wichtig');
      const matchesPriority = priority === 'Alle Prioritäten' || item.priority === priority;
      const matchesUnit = unit === 'Alle Stellen' || (item.affectedUnits || []).some((entry) => entry.toLowerCase().includes(unit.toLowerCase()));
      return matchesQuery && matchesTab && matchesCategory && matchesPriority && matchesUnit;
    });
  }, [allItems, query, activeTab, category, priority, unit]);

  const briefing = useMemo(() => allItems.filter((item) => item.priority === 'Sofort wichtig' || item.priority === 'Hoch').slice(0, 5), [allItems]);

  const activeCategories = useMemo(() => {
    const counts = data.categoryCounts || {};
    return ALL_CATEGORIES.filter((entry) => entry === 'Alle Kategorien' || entry === 'Sofort wichtig' || counts[entry] > 0 || ['Verwaltungsvorschriften', 'Beamtenrecht', 'Ausbildung / BVS', 'Fristen & To-dos'].includes(entry));
  }, [data.categoryCounts]);

  const selectedTab = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const knowledge = KNOWLEDGE[activeTab];

  return (
    <main>
      <section className="hero">
        <div className="heroText">
          <p className="eyebrow">Bayern · Kommunalverwaltung · Vorschriften · Ausbildung · Beamtenrecht</p>
          <h1>{data.appName || 'KommunalRadar Bayern'}</h1>
          <p className="subtitle">{data.subtitle || FALLBACK_DATA.subtitle}</p>
          <div className="metaLine">
            <span>Stand: {formatDateTime(data.generatedAt)}</span>
            <span>{loading ? 'Daten werden geladen …' : `${data.stats?.total ?? allItems.length} Hinweise bewertet`}</span>
            <span>{data.stats?.sourcesChecked ?? 0} Quellen beobachtet</span>
          </div>
        </div>
        <div className="heroPanel" aria-label="Übersicht Tageslage">
          <Metric value={data.stats?.urgent ?? 0} label="Sofort wichtig" />
          <Metric value={data.stats?.high ?? 0} label="Hohe Relevanz" />
          <Metric value={data.stats?.focusCounts?.['Verwaltungsvorschriften'] ?? 0} label="Verwaltungsvorschriften" />
          <Metric value={data.stats?.focusCounts?.['Beamtenrecht'] ?? 0} label="Beamtenrecht" />
        </div>
      </section>

      <nav className="tabs" aria-label="Arbeitsbereiche">
        {TABS.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="briefing" aria-labelledby="briefing-title">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">{selectedTab.label}</p>
            <h2 id="briefing-title">{activeTab === 'overview' ? 'Was heute zuerst geprüft werden sollte' : selectedTab.description}</h2>
          </div>
          <span className="pill">{filteredItems.length} passende Hinweise</span>
        </div>

        {activeTab === 'overview' ? (
          briefing.length ? (
            <div className="briefingGrid">
              {briefing.map((item) => <BriefingCard item={item} key={item.id} />)}
            </div>
          ) : <p className="empty">Aktuell liegen keine hoch priorisierten Meldungen vor.</p>
        ) : knowledge ? (
          <KnowledgePanel knowledge={knowledge} />
        ) : null}
      </section>

      <section className="filters" aria-label="Hinweise filtern">
        <label>
          Suche
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="z. B. BayMBl, BayBG, BVS, Frist, Satzung" />
        </label>
        <label>
          Kategorie
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {activeCategories.map((entry) => <option key={entry}>{entry}</option>)}
          </select>
        </label>
        <label>
          Priorität
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            {PRIORITIES.map((entry) => <option key={entry}>{entry}</option>)}
          </select>
        </label>
        <label>
          Stelle
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            {UNITS.map((entry) => <option key={entry}>{entry}</option>)}
          </select>
        </label>
      </section>

      <section className="results" aria-live="polite">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>{filteredItems.length} fachlich eingeordnete Hinweise</h2>
          </div>
          <button className="clearButton" onClick={() => { setQuery(''); setCategory('Alle Kategorien'); setPriority('Alle Prioritäten'); setUnit('Alle Stellen'); setActiveTab('overview'); }}>
            Filter zurücksetzen
          </button>
        </div>

        {filteredItems.length ? filteredItems.map((item) => (
          <article className="monitorCard" key={item.id}>
            <div className="cardTop">
              <div>
                <div className="badges">
                  <span className={`priority ${priorityClass(item.priority)}`}>{item.priority}</span>
                  <span className="categoryBadge">{item.category}</span>
                  <span className="scoreBadge">Relevanz {item.score}/100</span>
                </div>
                <h3>{item.title}</h3>
                <p className="sourceLine">{item.source} · {formatDate(item.date)}</p>
              </div>
              {item.url && item.url !== '#' && <a className="sourceButton" href={item.url} target="_blank" rel="noreferrer">Quelle öffnen</a>}
            </div>

            <p className="summary">{item.shortSummary}</p>

            <div className="detailsGrid">
              <InfoBlock title="Warum wichtig für eine Kommune?" content={item.whyImportant} />
              <InfoBlock title="Mögliche Auswirkungen" content={(item.possibleImpacts || []).join(', ')} />
              <InfoBlock title="Betroffene Stellen" content={(item.affectedUnits || []).join(', ')} />
              <InfoBlock title="Nächster Schritt" content={item.nextStep} />
            </div>

            <button className="moreButton" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
              {openId === item.id ? 'Weniger anzeigen' : 'Einordnung anzeigen'}
            </button>

            {openId === item.id && (
              <div className="expanded">
                <div>
                  <strong>Arbeitsbereiche</strong>
                  <div className="tagList">{(item.focusAreas || [item.category]).map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
                <div>
                  <strong>Tags</strong>
                  <div className="tagList">{(item.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
                <div>
                  <strong>Quelle</strong>
                  {item.sourceUrl && item.sourceUrl !== '#' ? <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.source}</a> : <span>{item.source}</span>}
                </div>
                <div>
                  <strong>Prüfhinweis</strong>
                  <p>Originalquelle öffnen, fachliche Zuständigkeit klären und nur nach eigener Prüfung weiterverwenden.</p>
                </div>
              </div>
            )}
          </article>
        )) : (
          <p className="empty">Keine Meldung passt zu den aktuellen Filtern. Bitte Filter zurücksetzen oder einen anderen Arbeitsbereich wählen.</p>
        )}
      </section>

      <footer>
        <p>{data.disclaimer}</p>
        {data.stats?.sourcesWithErrors > 0 && <p>{data.stats.sourcesWithErrors} Quelle(n) konnten zuletzt nicht ausgewertet werden. Das Dashboard bleibt mit den verfügbaren Quellen nutzbar.</p>}
      </footer>
    </main>
  );
}

function Metric({ value, label }) {
  return (
    <div>
      <span className="statValue">{value}</span>
      <span className="statLabel">{label}</span>
    </div>
  );
}

function BriefingCard({ item }) {
  return (
    <article className="briefingCard">
      <span className={`priority ${priorityClass(item.priority)}`}>{item.priority}</span>
      <h3>{item.title}</h3>
      <p>{item.whyImportant}</p>
      {item.url && item.url !== '#' && <a href={item.url} target="_blank" rel="noreferrer">Originalquelle öffnen</a>}
    </article>
  );
}

function KnowledgePanel({ knowledge }) {
  return (
    <div className="knowledgeGrid">
      <div className="knowledgeCard">
        <h3>{knowledge.title}</h3>
        <ul>{knowledge.points.map((point) => <li key={point}>{point}</li>)}</ul>
      </div>
      <div className="knowledgeCard accent">
        <h3>Prüfschema</h3>
        <ol>{knowledge.checklist.map((point) => <li key={point}>{point}</li>)}</ol>
      </div>
    </div>
  );
}

function InfoBlock({ title, content }) {
  return (
    <div className="infoBlock">
      <h4>{title}</h4>
      <p>{content || 'Noch keine Einordnung verfügbar.'}</p>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
