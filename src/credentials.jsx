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
        aria-label={alt || 'Logo unavailable'}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textAlign: 'center',
          padding: '0.2rem',
          background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.12), rgba(44, 82, 130, 0.1))'
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

function DegreeCard({ degree, index, expanded, onToggle, onMouseEnter, onMouseLeave }) {
  const courses = Array.isArray(degree.courses) ? degree.courses : [];
  const degreeTitle = degree.degree || 'Degree title unavailable';
  const institution = degree.institution || 'Institution not specified';
  const startDate = degree.startDate || '';
  const endDate = degree.endDate || '';
  const period = startDate || endDate ? `${startDate} - ${endDate}`.trim() : 'Timeline not specified';

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
      style={{ border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`Toggle details for degree ${index + 1}: ${degreeTitle}`}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '1.15rem 1.3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', minWidth: 0 }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '10px',
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.2)',
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden'
            }}
          >
            <LogoThumb src={degree.logo} alt={degree.institution} />
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
              Degree {index + 1}
            </p>
            <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
              {degreeTitle}
            </h2>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              {institution} | {period}
            </p>
          </div>
        </div>
        <span style={{ color: 'var(--accent-accessible)', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>
          {expanded ? '−' : '+'}
        </span>
      </button>

      <div
        style={{
          maxHeight: expanded ? '900px' : '0',
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease, opacity 0.25s ease',
          padding: expanded ? '0 1.3rem 1.2rem' : '0 1.3rem'
        }}
      >
        <div style={{ marginBottom: '0.8rem' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{degree.location || 'Location not specified'}</p>
          {degree.url && (
            <a
              href={degree.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: '0.35rem', color: 'var(--accent-accessible)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Institution link ↗
            </a>
          )}
        </div>

        {courses.length > 0 ? (
          <div>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
              Relevant Coursework
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {courses.map((course, courseIndex) => (
                <span
                  key={`${degree.id || index}-course-${courseIndex}`}
                  style={{
                    padding: '0.35rem 0.72rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(74, 144, 226, 0.25)',
                    background: 'rgba(74, 144, 226, 0.1)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.84rem'
                  }}
                >
                  {course}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Relevant coursework details are not available yet.
          </p>
        )}
      </div>
    </article>
  );
}

function CertificationCard({ cert, showLink, onMouseEnter, onMouseLeave, onToggle }) {
  const hasCertificateUrl = cert.url && cert.url !== '#';
  const certTitle = cert.title || 'Certification title unavailable';
  const certIssuer = cert.issuer || 'Issuer not specified';
  const certDate = cert.date || 'Date not specified';

  return (
    <article
      className="glass-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={hasCertificateUrl ? onMouseEnter : undefined}
      onBlur={hasCertificateUrl ? (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onMouseLeave();
        }
      } : undefined}
      onClick={hasCertificateUrl ? onToggle : undefined}
      onKeyDown={(event) => {
        if (!hasCertificateUrl) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
      tabIndex={hasCertificateUrl ? 0 : undefined}
      role={hasCertificateUrl ? 'button' : undefined}
      aria-expanded={hasCertificateUrl ? showLink : undefined}
      aria-label={hasCertificateUrl ? `Toggle certificate link for ${certTitle}` : undefined}
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        cursor: hasCertificateUrl ? 'pointer' : 'default'
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: 'rgba(74, 144, 226, 0.1)',
            border: '1px solid rgba(74, 144, 226, 0.2)',
            padding: '0.3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden'
          }}
        >
          <LogoThumb src={cert.logo} alt={cert.issuer} />
        </div>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.98rem', lineHeight: 1.4 }}>{certTitle}</h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>{certIssuer}</p>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{certDate}</p>
        </div>
      </div>

      {hasCertificateUrl && (
        <div
          style={{
            maxHeight: showLink ? '60px' : '0',
            opacity: showLink ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.3s ease, opacity 0.2s ease'
          }}
        >
          <a
            href={cert.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'flex-start',
              padding: '0.45rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              background: 'rgba(74, 144, 226, 0.1)',
              color: 'var(--accent-accessible)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            View Certificate ↗
          </a>
        </div>
      )}
      {!hasCertificateUrl && (
        <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
          Certificate link unavailable.
        </p>
      )}
    </article>
  );
}

function CredentialsPage() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeDegreeId, setActiveDegreeId] = useState(null);
  const [hoveredDegreeId, setHoveredDegreeId] = useState(null);
  const [activeCertId, setActiveCertId] = useState(null);
  const [hoveredCertId, setHoveredCertId] = useState(null);

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

  const degrees = useMemo(() => data?.education?.degrees || [], [data]);
  const certifications = useMemo(() => data?.education?.certifications || [], [data]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        Loading credentials...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem' }}>
        <div style={{ maxWidth: '720px', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '0.75rem' }}>Could not load credentials</h1>
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

      <main className="subpage-main">
        <div className="subpage-hero">
          <h1 className="subpage-title">
            Degrees & <span className="text-gradient">Certifications</span>
          </h1>
          <p className="subpage-intro">
            Complete academic and certification profile, including coursework and credential links.
          </p>
        </div>

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.45rem', color: 'var(--text-primary)' }}>Degrees</h2>
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {degrees.map((degree, index) => (
              (() => {
                const degreeId = degree.id || `degree-${index}`;
                const expanded = activeDegreeId === degreeId || hoveredDegreeId === degreeId;
                return (
              <DegreeCard
                key={degreeId}
                degree={degree}
                index={index}
                expanded={expanded}
                onToggle={() => setActiveDegreeId((prev) => (prev === degreeId ? null : degreeId))}
                onMouseEnter={() => setHoveredDegreeId(degreeId)}
                onMouseLeave={() => setHoveredDegreeId((prev) => (prev === degreeId ? null : prev))}
              />
                );
              })()
            ))}
          </div>
          {degrees.length === 0 && (
            <article className="glass-card" style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1rem 1.1rem' }}>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>No degrees available.</p>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>
                Add degree entries in `portfolio-data.json` to populate this section.
              </p>
            </article>
          )}
        </section>

        <section style={{ marginTop: '2.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.45rem', color: 'var(--text-primary)' }}>Certifications</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.9rem' }}>
            {certifications.map((cert, index) => (
              (() => {
                const certId = cert.id || `cert-${index}`;
                const showLink = hoveredCertId === certId || activeCertId === certId;
                return (
                  <CertificationCard
                    key={certId}
                    cert={cert}
                    showLink={showLink}
                    onToggle={() => setActiveCertId((prev) => (prev === certId ? null : certId))}
                    onMouseEnter={() => setHoveredCertId(certId)}
                    onMouseLeave={() => setHoveredCertId((prev) => (prev === certId ? null : prev))}
                  />
                );
              })()
            ))}
          </div>
          {certifications.length === 0 && (
            <article className="glass-card" style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1rem 1.1rem', marginTop: '0.9rem' }}>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>No certifications available.</p>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>
                Add certification entries in `portfolio-data.json` to populate this section.
              </p>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<CredentialsPage />);
