import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function DegreeCard({ degree, index, expanded, onToggle, onMouseEnter, onMouseLeave }) {
  const courses = Array.isArray(degree.courses) ? degree.courses : [];

  return (
    <article
      className="glass-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
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
          {degree.logo && (
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
                flexShrink: 0
              }}
            >
              <img src={degree.logo} alt={degree.institution} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#4a90e2',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              Degree {index + 1}
            </p>
            <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
              {degree.degree}
            </h2>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              {degree.institution} | {degree.startDate} - {degree.endDate}
            </p>
          </div>
        </div>
        <span style={{ color: '#4a90e2', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>
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
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{degree.location}</p>
          {degree.url && (
            <a
              href={degree.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: '0.35rem', color: '#4a90e2', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Institution link ↗
            </a>
          )}
        </div>

        {courses.length > 0 && (
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
        )}
      </div>
    </article>
  );
}

function CertificationCard({ cert, showLink, onMouseEnter, onMouseLeave, onToggle }) {
  const hasCertificateUrl = cert.url && cert.url !== '#';

  return (
    <article
      className="glass-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={hasCertificateUrl ? onToggle : undefined}
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
        {cert.logo && (
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
              flexShrink: 0
            }}
          >
            <img src={cert.logo} alt={cert.issuer} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        )}
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.98rem', lineHeight: 1.4 }}>{cert.title}</h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>{cert.issuer}</p>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{cert.date}</p>
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
              color: '#4a90e2',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            View Certificate ↗
          </a>
        </div>
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
          <a href="/" style={{ display: 'inline-block', marginTop: '1rem', color: '#4a90e2' }}>Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
      <header className="sticky-nav" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <a href="/" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 800 }}>Back to Home</a>
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
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

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.25rem 4rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: 0 }}>
          Degrees & <span className="text-gradient">Certifications</span>
        </h1>
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', maxWidth: '900px', lineHeight: 1.7 }}>
          Complete academic and certification profile, including coursework and credential links.
        </p>

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
        </section>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<CredentialsPage />);
