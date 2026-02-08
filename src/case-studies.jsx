import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function SectionBlock({ title, children }) {
  return (
    <section className="case-detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function CaseStudyExpandedContent({ study, includeMetric = true }) {
  const strategy = Array.isArray(study.strategy) ? study.strategy : [];
  const execution = Array.isArray(study.execution) ? study.execution : [];
  const outcome = Array.isArray(study.outcome) ? study.outcome : [];
  const decisionOptions = Array.isArray(study.decisionOptions) ? study.decisionOptions : [];
  const whatIdDoDifferently = study.whatIdDoDifferently || study.nextStep || '';
  const context = [study.company, study.timeline].filter(Boolean).join(' | ') || 'Not specified';

  return (
    <div className="case-detail-sections">
      <SectionBlock title="Context">
        <p>{context}</p>
      </SectionBlock>

      <SectionBlock title="Problem">
        <p>{study.problem || 'Not specified'}</p>
      </SectionBlock>

      <SectionBlock title="Decision">
        {decisionOptions.length > 0 && (
          <div className="case-subsection">
            <p className="case-subtitle">Options considered</p>
            <ul>
              {decisionOptions.map((option, index) => (
                <li key={`decision-option-${study.id}-${index}`}>{option}</li>
              ))}
            </ul>
          </div>
        )}
        {study.decisionChosen && (
          <div className="case-subsection">
            <p className="case-subtitle">Chosen path</p>
            <p>{study.decisionChosen}</p>
          </div>
        )}
        {study.decisionWhy && (
          <div className="case-subsection">
            <p className="case-subtitle">Why this option</p>
            <p>{study.decisionWhy}</p>
          </div>
        )}
        {!study.decisionChosen && !study.decisionWhy && decisionOptions.length === 0 && <p>Not specified</p>}
      </SectionBlock>

      <SectionBlock title="Approach">
        {strategy.length > 0 && (
          <div className="case-subsection">
            <p className="case-subtitle">Strategy</p>
            <ul>
              {strategy.map((item, index) => (
                <li key={`strategy-${study.id}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {execution.length > 0 && (
          <div className="case-subsection">
            <p className="case-subtitle">Execution</p>
            <ul>
              {execution.map((item, index) => (
                <li key={`execution-${study.id}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {strategy.length === 0 && execution.length === 0 && <p>Not specified</p>}
      </SectionBlock>

      <SectionBlock title="Tradeoffs">
        <p>{study.tradeoffs || 'Not specified'}</p>
      </SectionBlock>

      <SectionBlock title="Outcome">
        {outcome.length > 0 ? (
          <ul>
            {outcome.map((item, index) => (
              <li key={`outcome-${study.id}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>Not specified</p>
        )}
      </SectionBlock>

      <SectionBlock title="What I'd do differently">
        <p>{whatIdDoDifferently || 'Not specified'}</p>
      </SectionBlock>

      {includeMetric && (
        <SectionBlock title="Measurable Result">
          <p>{study.metric || 'Not specified'}</p>
        </SectionBlock>
      )}
    </div>
  );
}

function DesktopListItem({
  study,
  index,
  isActive,
  isSelected,
  onHover,
  onLeave,
  onSelect
}) {
  const title = study.title || 'Untitled case study';
  const summaryLine = study.summary || study.problem || 'Not specified';
  const metricLine = study.metric || 'Metric not specified';

  return (
    <button
      type="button"
      className={`case-list-item ${isActive ? 'is-active' : ''}`}
      onMouseEnter={onHover}
      onFocus={onHover}
      onMouseLeave={onLeave}
      onBlur={onLeave}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Preview case study ${index + 1}: ${title}`}
    >
      <div className="case-list-thumb">
        {study.image ? (
          <img src={study.image} alt={`${title} case study preview image`} loading="lazy" decoding="async" width="640" height="360" />
        ) : (
          <div className="case-list-thumb-fallback">No image</div>
        )}
      </div>
      <div className="case-list-copy">
        <p className="case-list-kicker">Case Study {index + 1}</p>
        <h3>{title}</h3>
        <p className="case-list-summary">{summaryLine}</p>
        <p className="case-list-metric">{metricLine}</p>
      </div>
    </button>
  );
}

function MobileAccordionItem({ study, index, expanded, onToggle }) {
  const title = study.title || 'Untitled case study';
  const summaryLine = study.summary || study.problem || 'Not specified';

  return (
    <article className="glass-card case-mobile-item">
      <button
        type="button"
        onClick={onToggle}
        className="case-mobile-trigger"
        aria-expanded={expanded}
        aria-label={`Toggle case study ${index + 1}: ${title}`}
      >
        <div className="case-mobile-head">
          <div className="case-mobile-thumb">
            {study.image ? (
              <img src={study.image} alt={`${title} case study preview image`} loading="lazy" decoding="async" width="640" height="360" />
            ) : (
              <div className="case-mobile-thumb-fallback">No image</div>
            )}
          </div>
          <div className="case-mobile-copy">
            <p className="case-mobile-kicker">Case Study {index + 1}</p>
            <h3>{title}</h3>
            <p>{summaryLine}</p>
          </div>
        </div>
        <span className="case-mobile-symbol">{expanded ? '−' : '+'}</span>
      </button>

      <div className={`case-mobile-panel ${expanded ? 'is-open' : ''}`}>
        <CaseStudyExpandedContent study={study} includeMetric />
        {study.id && (
          <a
            href={`/case-study-${study.id}.html`}
            className="case-detail-link"
            aria-label={`Open dedicated page for ${title}`}
          >
            Open dedicated case page →
          </a>
        )}
      </div>
    </article>
  );
}

function CaseStudiesPage() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedStudyId, setSelectedStudyId] = useState(null);
  const [previewStudyId, setPreviewStudyId] = useState(null);
  const [mobileOpenId, setMobileOpenId] = useState(null);

  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    fetch('./portfolio-data.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load data (${res.status})`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const caseStudies = useMemo(() => data?.caseStudies || [], [data]);
  const visibleStudyId = previewStudyId || selectedStudyId || caseStudies[0]?.id;
  const activeStudy = caseStudies.find((study) => study.id === visibleStudyId) || caseStudies[0] || null;
  const activeIndex = caseStudies.findIndex((study) => study.id === (activeStudy?.id || ''));
  const activeStudyTitle = activeStudy?.title || 'Untitled case study';

  useEffect(() => {
    if (caseStudies.length === 0) return;
    if (!selectedStudyId) setSelectedStudyId(caseStudies[0].id);
    if (!mobileOpenId) setMobileOpenId(caseStudies[0].id);
  }, [caseStudies, selectedStudyId, mobileOpenId]);

  if (loading) {
    return (
      <div className="case-loading-state">
        Loading case studies...
      </div>
    );
  }

  if (error) {
    return (
      <div className="case-error-state">
        <div className="case-error-panel">
          <h1>Could not load case studies</h1>
          <p>{error}</p>
          <a href="/">Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="case-page-shell">
      <header className="sticky-nav case-nav-border">
        <div className="case-nav-inner">
          <a href="/" className="case-back-link">Back to Home</a>
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="case-mode-toggle"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <main className="case-main">
        <div className="subpage-hero">
          <h1 className="subpage-title">
            Product <span className="text-gradient">Case Studies</span>
          </h1>
          <p className="subpage-intro case-page-intro">
            Explore each case study as a decision narrative with options considered, chosen path, tradeoffs, measurable results, and retrospective improvements.
          </p>
        </div>

        <div className="case-explorer-grid">
          <aside className="glass-card case-list-pane">
            {caseStudies.length > 0 ? caseStudies.map((study, index) => (
              <DesktopListItem
                key={study.id || index}
                study={study}
                index={index}
                isActive={study.id === (activeStudy?.id || '')}
                isSelected={study.id === selectedStudyId}
                onHover={() => setPreviewStudyId(study.id)}
                onLeave={() => setPreviewStudyId(null)}
                onSelect={() => setSelectedStudyId(study.id)}
              />
            )) : (
              <p className="case-empty-state">No case studies available yet.</p>
            )}
          </aside>

          <section className="glass-card case-detail-pane">
            {activeStudy ? (
              <>
                <p className="case-detail-kicker">
                  Case Study {activeIndex + 1}
                </p>
                <h2>{activeStudyTitle}</h2>
                <p className="case-detail-summary">
                  {activeStudy.summary || activeStudy.problem || 'Not specified'}
                </p>

                <div className="case-detail-visual">
                  {activeStudy.image ? (
                    <img src={activeStudy.image} alt={`${activeStudyTitle} case study visual`} loading="lazy" decoding="async" width="640" height="360" />
                  ) : (
                    <div className="case-detail-visual-fallback">No image available</div>
                  )}
                </div>

                <div className="case-metric-highlight">
                  <span>Measurable Result</span>
                  <p>{activeStudy.metric || 'Metric not specified'}</p>
                </div>

                {activeStudy.id && (
                  <a
                    href={`/case-study-${activeStudy.id}.html`}
                    className="case-detail-link"
                    aria-label={`Open dedicated page for ${activeStudyTitle}`}
                  >
                    Open dedicated case page →
                  </a>
                )}

                <CaseStudyExpandedContent study={activeStudy} includeMetric={false} />
              </>
            ) : (
              <p className="case-empty-state">No case studies available.</p>
            )}
          </section>
        </div>

        <div className="case-mobile-stack">
          {caseStudies.length > 0 ? caseStudies.map((study, index) => (
            <MobileAccordionItem
              key={study.id || index}
              study={study}
              index={index}
              expanded={mobileOpenId === study.id}
              onToggle={() => setMobileOpenId((prev) => (prev === study.id ? null : study.id))}
            />
          )) : (
            <article className="glass-card case-mobile-item">
              <p className="case-empty-state case-empty-state-mobile">
                No case studies available yet.
              </p>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<CaseStudiesPage />);
