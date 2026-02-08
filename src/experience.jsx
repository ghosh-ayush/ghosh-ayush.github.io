import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function ExperienceCard({ job, index, expanded, onToggle }) {
  const bullets = Array.isArray(job.description) ? job.description : [];

  return (
    <article
      className="glass-card"
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
          {job.logo && (
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
                flexShrink: 0
              }}
            >
              <img
                src={job.logo}
                alt={job.company}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
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
              {job.position}
            </h2>
            <p
              style={{
                margin: '0.2rem 0 0',
                color: 'var(--text-secondary)',
                fontSize: '0.94rem',
                lineHeight: 1.5
              }}
            >
              {job.company} {job.startDate || job.endDate ? `| ${job.startDate || ''} - ${job.endDate || ''}` : ''}
            </p>
          </div>
        </div>
        <span style={{ color: '#4a90e2', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>
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
            {job.location || 'Location not specified'}
          </p>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '0.35rem',
                color: '#4a90e2',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Company link ↗
            </a>
          )}
        </div>

        <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          {bullets.map((point, pointIndex) => (
            <li key={`${job.id || index}-${pointIndex}`} style={{ marginBottom: '0.55rem' }}>
              <span dangerouslySetInnerHTML={{ __html: point }} />
            </li>
          ))}
        </ul>
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

  useEffect(() => {
    if (!experience.length) return;
    if (!activeId) setActiveId(experience[0].id);
  }, [experience, activeId]);

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

      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '3rem 1.25rem 4rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: 0 }}>
          Full <span className="text-gradient">Experience</span>
        </h1>
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', maxWidth: '860px', lineHeight: 1.7 }}>
          Complete timeline across product leadership, AI strategy, data systems, and engineering execution.
        </p>

        <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
          {experience.map((job, index) => (
            <ExperienceCard
              key={job.id || index}
              job={job}
              index={index}
              expanded={activeId === job.id}
              onToggle={() => setActiveId((prev) => (prev === job.id ? null : job.id))}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<ExperiencePage />);
