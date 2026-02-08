import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function LogoThumb({ src, alt }) {
  const [errored, setErrored] = useState(false);
  const hasImage = Boolean(src) && !errored;

  if (!hasImage) {
    return (
      <div
        role="img"
        aria-label={alt || 'Company logo unavailable'}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.12), rgba(44, 82, 130, 0.1))',
          textAlign: 'center',
          padding: '0.25rem'
        }}
      >
        No logo
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      width="112"
      height="112"
      onError={() => setErrored(true)}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}

function ExperienceCard({ job, index, expanded, onToggle, onMouseEnter, onMouseLeave }) {
  const bullets = Array.isArray(job.description) ? job.description : [];
  const position = job.position || 'Role title unavailable';
  const company = job.company || 'Company not specified';
  const startDate = job.startDate || '';
  const endDate = job.endDate || '';
  const timeRange = startDate || endDate ? `${startDate} - ${endDate}`.trim() : '';
  const location = job.location || 'Location not specified';

  return (
    <article
      className="glass-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onMouseEnter}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onMouseLeave();
        }
      }}
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`Toggle details for role ${index + 1}: ${position}`}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '1.2rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', minWidth: 0 }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '10px',
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.2)',
              padding: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden'
            }}
          >
            <LogoThumb src={job.logo} alt={job.company} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--accent-accessible)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              Role {index + 1}
            </p>
            <h2
              style={{
                margin: '0.35rem 0 0',
                color: 'var(--text-primary)',
                fontSize: '1.16rem',
                lineHeight: 1.35
              }}
            >
              {position}
            </h2>
            <p
              style={{
                margin: '0.2rem 0 0',
                color: 'var(--text-secondary)',
                fontSize: '0.94rem',
                lineHeight: 1.5
              }}
            >
              {company} {timeRange ? `| ${timeRange}` : ''}
            </p>
          </div>
        </div>
        <span style={{ color: 'var(--accent-accessible)', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>
          {expanded ? '−' : '+'}
        </span>
      </button>

      <div
        style={{
          maxHeight: expanded ? '1400px' : '0',
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease, opacity 0.25s ease',
          padding: expanded ? '0 1.4rem 1.3rem' : '0 1.4rem'
        }}
      >
        <div style={{ marginBottom: '0.9rem' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {location}
          </p>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '0.35rem',
                color: 'var(--accent-accessible)',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Company link ↗
            </a>
          )}
        </div>

        {bullets.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {bullets.map((point, pointIndex) => (
              <li key={`${job.id || index}-${pointIndex}`} style={{ marginBottom: '0.55rem' }}>
                <span dangerouslySetInnerHTML={{ __html: point }} />
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Detailed impact points will be added soon.
          </p>
        )}
      </div>
    </article>
  );
}

function ExperiencePage() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

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

  const experience = useMemo(() => data?.experience || [], [data]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        Loading experience...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem' }}>
        <div style={{ maxWidth: '720px', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '0.75rem' }}>Could not load experience</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <a href="/" style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--accent-accessible)' }}>Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="subpage-shell">
      <header className="sticky-nav" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="subpage-nav-inner">
          <a href="/" className="subpage-back-link">Back to Home</a>
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              padding: '0.45rem 0.75rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <main className="subpage-main" style={{ maxWidth: '1040px' }}>
        <div className="subpage-hero">
          <h1 className="subpage-title">
            Work <span className="text-gradient">Experience</span>
          </h1>
          <p className="subpage-intro" style={{ maxWidth: '860px' }}>
            Complete timeline across product leadership, AI strategy, data systems, and engineering execution.
          </p>
        </div>

        <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
          {experience.length > 0 ? experience.map((job, index) => {
            const cardId = job.id ?? `experience-${index}`;
            return (
              <ExperienceCard
                key={cardId}
                job={job}
                index={index}
                expanded={activeId === cardId || hoveredId === cardId}
                onToggle={() => setActiveId((prev) => (prev === cardId ? null : cardId))}
                onMouseEnter={() => setHoveredId(cardId)}
                onMouseLeave={() => setHoveredId((prev) => (prev === cardId ? null : prev))}
              />
            );
          }) : (
            <article
              className="glass-card"
              style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem 1.2rem' }}
            >
              <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>
                No work experience entries available.
              </p>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>
                Add experience items in `portfolio-data.json` to populate this page.
              </p>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<ExperiencePage />);
