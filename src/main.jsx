import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const FALLBACK_DATA = {
  appName: 'KommunalRadar Bayern',
  subtitle: 'Wichtige Entwicklungen für Kommunalverwaltung, Haushalt und Finanzen in Bayern.',
  generatedAt: new Date().toISOString(),
  disclaimer: 'Automatische Vorbewertung öffentlicher Quellen. Keine Rechtsberatung und keine Verwaltungsentscheidung. Originalquelle und fachliche Zuständigkeit immer prüfen.',
  stats: { total: 2, urgent: 1, high: 1, sourcesChecked: 0, sourcesWithErrors: 0 },
  categoryCounts: {},
  items: [
    {
      id: 'sample-warmeplanung',
      title: 'Neue Hinweise zur kommunalen Wärmeplanung in Bayern',
      source: 'Beispielmeldung',
      sourceUrl: '#',
      url: '#',
      date: new Date().toISOString(),
      category: 'Klima / Energie',
      priority: 'Hoch',
      score: 68,
      relevance: 'Hoch',
      shortSummary: 'Hinweise zur kommunalen Wärmeplanung können Planung, Förderung, Bürgerinformation und Haushaltsansätze betreffen.',
      whyImportant: 'Kann Städte und Gemeinden bei Planung, Förderanträgen, Bürgerinformation und Haushaltsplanung betreffen.',
      affectedUnits: ['Bauamt', 'Kämmerei', 'Geschäftsleitung', 'Gemeinderat/Stadtrat'],
      possibleImpacts: ['Planung/Bau/Projektsteuerung', 'Haushalt/Finanzplanung', 'Fristen/Antragsverfahren'],
      nextStep: 'Prüfen, ob die Kommune betroffen ist, ob Fristen bestehen und ob Mittel im Haushalt eingeplant werden müssen.',
      tags: ['Klima / Energie', 'Wärmeplanung', 'Förderung']
    },
    {
      id: 'sample-finanzausgleich',
      title: 'Änderung bei kommunalem Finanzausgleich Bayern',
      source: 'Beispielmeldung',
      sourceUrl: '#',
      url: '#',
      date: new Date().toISOString(),
      category: 'Haushalt & Finanzen',
      priority: 'Sofort wichtig',
      score: 82,
      relevance: 'Sehr hoch',
      shortSummary: 'Eine Änderung beim kommunalen Finanzausgleich kann Schlüsselzuweisungen, Umlagen und Finanzplanungsjahre beeinflussen.',
      whyImportant: 'Kann Schlüsselzuweisungen, Kreisumlage, Investitionsplanung oder Haushaltsausgleich betreffen.',
      affectedUnits: ['Kämmerei', 'Geschäftsleitung', 'Bürgermeister', 'Gemeinderat/Stadtrat'],
      possibleImpacts: ['Haushalt/Finanzplanung', 'Gremienvorbereitung'],
      nextStep: 'Auswirkungen auf Haushaltsplanung und Finanzplanungsjahre prüfen.',
      tags: ['Haushalt & Finanzen', 'Finanzausgleich']
    }
  ],
  sourceErrors: []
};

const ALL_CATEGORIES = [
  'Alle Kategorien',
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

const PRIORITIES = ['Alle Prioritäten', 'Sofort wichtig', 'Hoch', 'Normal', 'Beobachten'];
const UNITS = ['Alle Stellen', 'Kämmerei', 'Hauptamt', 'Bauamt', 'Ordnungsamt', 'Personalamt', 'Geschäftsleitung', 'Bürgermeister', 'Gemeinderat/Stadtrat', 'Datenschutzbeauftragte/r', 'IT/Digitalisierung'];

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

function App() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Alle Kategorien');
  const [priority, setPriority] = useState('Alle Prioritäten');
  const [unit, setUnit] = useState('Alle Stellen');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/latest.json`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Daten konnten nicht geladen werden.');
        setData(await response.json());
      } catch {
        setData(FALLBACK_DATA);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data.items || []).filter((item) => {
      const text = [item.title, item.source, item.category, item.shortSummary, item.whyImportant, item.nextStep, ...(item.tags || [])].join(' ').toLowerCase();
      const matchesQuery = !needle || text.includes(needle);
      const matchesCategory = category === 'Alle Kategorien' || item.category === category || (category === 'Sofort wichtig' && item.priority === 'Sofort wichtig');
      const matchesPriority = priority === 'Alle Prioritäten' || item.priority === priority;
      const matchesUnit = unit === 'Alle Stellen' || (item.affectedUnits || []).some((entry) => entry.toLowerCase().includes(unit.toLowerCase()));
      return matchesQuery && matchesCategory && matchesPriority && matchesUnit;
    });
  }, [data.items, query, category, priority, unit]);

  const briefing = useMemo(() => {
    return (data.items || [])
      .filter((item) => item.priority === 'Sofort wichtig' || item.priority === 'Hoch')
      .slice(0, 4);
  }, [data.items]);

  const activeCategories = useMemo(() => {
    const counts = data.categoryCounts || {};
    return ALL_CATEGORIES.filter((entry) => entry === 'Alle Kategorien' || entry === 'Sofort wichtig' || counts[entry] > 0);
  }, [data.categoryCounts]);

  return (
    <main>
      <section className="hero">
        <div className="heroText">
          <p className="eyebrow">Bayern · Kommunalverwaltung · Haushalt · Recht</p>
          <h1>{data.appName}</h1>
          <p className="subtitle">{data.subtitle}</p>
          <div className="metaLine">
            <span>Stand: {formatDateTime(data.generatedAt)}</span>
            <span>{loading ? 'Daten werden geladen …' : `${data.stats?.total ?? filteredItems.length} Meldungen bewertet`}</span>
          </div>
        </div>
        <div className="heroPanel" aria-label="Übersicht Tageslage">
          <div>
            <span className="statValue">{data.stats?.urgent ?? 0}</span>
            <span className="statLabel">Sofort wichtig</span>
          </div>
          <div>
            <span className="statValue">{data.stats?.high ?? 0}</span>
            <span className="statLabel">Hohe Relevanz</span>
          </div>
          <div>
            <span className="statValue">{data.stats?.sourcesChecked ?? 0}</span>
            <span className="statLabel">Quellen im Blick</span>
          </div>
        </div>
      </section>

      <section className="briefing" aria-labelledby="briefing-title">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Tagesbriefing</p>
            <h2 id="briefing-title">Was heute zuerst geprüft werden sollte</h2>
          </div>
          <span className="pill">{briefing.length} priorisierte Hinweise</span>
        </div>
        {briefing.length ? (
          <div className="briefingGrid">
            {briefing.map((item) => (
              <article className="briefingCard" key={item.id}>
                <span className={`priority ${priorityClass(item.priority)}`}>{item.priority}</span>
                <h3>{item.title}</h3>
                <p>{item.whyImportant}</p>
                <a href={item.url} target="_blank" rel="noreferrer">Originalquelle öffnen</a>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">Aktuell liegen keine hoch priorisierten Meldungen vor.</p>
        )}
      </section>

      <section className="filters" aria-label="Meldungen filtern">
        <label>
          Suche
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="z. B. Grundsteuer, Satzung, Förderung, OZG" />
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
            <h2>{filteredItems.length} relevante Meldungen</h2>
          </div>
          <button className="clearButton" onClick={() => { setQuery(''); setCategory('Alle Kategorien'); setPriority('Alle Prioritäten'); setUnit('Alle Stellen'); }}>
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
              <a className="sourceButton" href={item.url} target="_blank" rel="noreferrer">Quelle öffnen</a>
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
                  <strong>Quelle</strong>
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.source}</a>
                </div>
                <div>
                  <strong>Tags</strong>
                  <div className="tagList">{(item.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
              </div>
            )}
          </article>
        )) : (
          <p className="empty">Keine Meldung passt zu den aktuellen Filtern.</p>
        )}
      </section>

      <footer>
        <p>{data.disclaimer}</p>
        {data.stats?.sourcesWithErrors > 0 && <p>{data.stats.sourcesWithErrors} Quelle(n) konnten zuletzt nicht ausgewertet werden.</p>}
      </footer>
    </main>
  );
}

function InfoBlock({ title, content }) {
  return (
    <div className="infoBlock">
      <h4>{title}</h4>
      <p>{content}</p>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
