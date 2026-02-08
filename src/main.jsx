import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

      // ============================================
      // ANALYTICS UTILITY
      // ============================================
      const Analytics = {
        // Track page view
        pageView: (path, title) => {
          if (window.gtag) {
            window.gtag('event', 'page_view', {
              page_path: path,
              page_title: title
            });
          }
        },

        // Track custom event
        trackEvent: (category, action, label, value) => {
          if (window.gtag) {
            window.gtag('event', action, {
              event_category: category,
              event_label: label,
              value: value
            });
          }
        },

        // Track button click
        trackClick: (buttonName, buttonType = 'button') => {
          if (window.gtag) {
            window.gtag('event', 'click', {
              event_category: 'engagement',
              event_label: buttonName,
              button_type: buttonType
            });
          }
        },

        // Track scroll depth
        trackScrollDepth: (percentVisible) => {
          if (window.gtag) {
            window.gtag('event', 'scroll', {
              event_category: 'engagement',
              percent_scrolled: percentVisible
            });
          }
        },

        // Track section view
        trackSectionView: (sectionName) => {
          if (window.gtag) {
            window.gtag('event', 'view_section', {
              event_category: 'engagement',
              section_name: sectionName
            });
          }
        },

        // Track external link clicks
        trackExternalLink: (url, linkText) => {
          if (window.gtag) {
            window.gtag('event', 'click', {
              event_category: 'outbound',
              event_label: url,
              link_text: linkText
            });
          }
        }
      };

      // Expose analytics globally
      window.Analytics = Analytics;

      // ============================================
      // THEME COLORS - CENTRALIZED COLOR MANAGEMENT
      // ============================================
      const themeColors = {
        light: {
          textPrimary: '#1a1a1a',
          textSecondary: '#666',
          textTertiary: '#999',
          accentDarkBlue: '#2c5282',
          accentBlue: '#4a90e2',
          accentMediumBlue: '#5a67d8',
          accentBrightBlue: '#6db3ff'
        },
        dark: {
          textPrimary: '#ffffff',
          textSecondary: '#b3b3b3',
          textTertiary: '#b3b3b3',
          accentDarkBlue: '#6db3ff',
          accentBlue: '#6db3ff',
          accentMediumBlue: '#6db3ff',
          accentBrightBlue: '#6db3ff'
        }
      };

      // Helper function to get color based on dark mode
      const getColor = (colorName, darkMode) => {
        return themeColors[darkMode ? 'dark' : 'light'][colorName] || '#000000';
      };

      // Expose theme globally for debugging
      window.themeColors = themeColors;
      window.getColor = getColor;

      const NAV_ITEMS = [
        { id: 'experience', label: 'experience' },
        { id: 'projects', label: 'projects' },
        { id: 'education', label: 'education' },
        { id: 'skills', label: 'skills' },
        { id: 'contact', label: 'contact' }
      ];

      // Update head meta and structured data from portfolio JSON
      function updateMetaFromData(data) {
        if (!data || !data.personal) return;
        const p = data.personal;

        // Title
        if (p.name && p.title) document.title = `${p.name} | ${p.title}`;

        // Meta description
        const desc = document.querySelector('meta[name="description"]');
        if (desc && p.description) desc.setAttribute('content', p.description);

        // OG / Twitter
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && p.name && p.title) ogTitle.setAttribute('content', `${p.name} | ${p.title}`);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && p.description) ogDesc.setAttribute('content', p.description);

        const twTitle = document.querySelector('meta[property="twitter:title"]');
        if (twTitle && p.name && p.title) twTitle.setAttribute('content', `${p.name} | ${p.title}`);
        const twDesc = document.querySelector('meta[property="twitter:description"]');
        if (twDesc && p.description) twDesc.setAttribute('content', p.description);

        // Canonical URL (keep existing href if not provided)
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical && data.siteUrl) canonical.setAttribute('href', data.siteUrl);

        // Update Person JSON-LD if present
        try {
          const ld = document.getElementById('ld-person');
          if (ld) {
            const ldObj = {
              "@context": "https://schema.org",
              "@type": "Person",
              name: p.name || undefined,
              url: data.siteUrl || window.location.origin,
              jobTitle: p.title || undefined,
              description: p.description || undefined,
              email: p.email || undefined,
              telephone: p.phone || undefined,
              image: (p.image && (p.image.startsWith('http') ? p.image : (window.location.origin + p.image))) || undefined,
              sameAs: (data.social || []).map(s => s.url)
            };
            ld.textContent = JSON.stringify(ldObj, null, 2);
          }
        } catch (e) {
          console.warn('Could not update JSON-LD', e);
        }
      }

      // Initialize the logo belt so scrolling is seamless and circular
      function initLogoBelt() {
        let attempts = 0;
        const maxAttempts = 12;

        const findAndMeasure = () => {
          attempts += 1;
          const track = document.querySelector('.logo-track');
          if (!track) {
            if (attempts < maxAttempts) {
              setTimeout(findAndMeasure, 120);
            }
            return;
          }

          const measureAndSet = () => {
            // Wait for images to settle (ImageWithSkeleton uses opacity transition)
            const imgs = Array.from(track.querySelectorAll('img'));
            const whenLoaded = imgs.map(img => (img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; })));
            Promise.all(whenLoaded).then(() => {
              // Force a layout read
              const total = track.scrollWidth;
              // If the track wasn't duplicated correctly, guard against zero
              if (!total || total < 10) {
                if (attempts < maxAttempts) {
                  setTimeout(findAndMeasure, 120);
                }
                return;
              }
              const half = Math.round(total / 2);
              track.style.setProperty('--scroll-distance', `${half}px`);

              // Compute a duration proportional to distance so speed feels consistent across widths
              const duration = Math.max(12, Math.round(half / 60)); // seconds, min 12s
              track.style.setProperty('--scroll-duration', `${duration}s`);
            }).catch(() => {/* ignore */});
          };

          measureAndSet();

          // Recompute on resize (debounced)
          let t = null;
          window.addEventListener('resize', () => {
            clearTimeout(t);
            t = setTimeout(measureAndSet, 180);
          });
        };

        findAndMeasure();
      }

      // ============================================
      // REUSABLE COMPONENTS
      // ============================================
      
      // ImageWithSkeleton Component - shows skeleton while loading
      function ImageWithSkeleton({ src, alt, style, className, loading = "lazy" }) {
        const [imageLoaded, setImageLoaded] = React.useState(false);
        const [imageError, setImageError] = React.useState(false);
        const imgRef = React.useRef(null);

        React.useEffect(() => {
          setImageLoaded(false);
          setImageError(false);

          const img = imgRef.current;
          if (!img) return;

          // Handle cached images where onLoad may not fire after mount.
          if (img.complete) {
            if (img.naturalWidth > 0) {
              setImageLoaded(true);
            } else {
              setImageError(true);
            }
          }
        }, [src]);

        return (
          <div style={{ position: 'relative', ...style }}>
            {!imageLoaded && !imageError && (
              <div 
                className="skeleton" 
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  ...style
                }}
              />
            )}
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              loading={loading}
              className={className}
              style={{
                ...style,
                opacity: imageLoaded || imageError ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out'
              }}
              onLoad={() => {
                setImageLoaded(true);
                setImageError(false);
              }}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />
          </div>
        );
      }

      // ProjectCardImage Component - kept separate from logo rendering behavior
      function ProjectCardImage({ src, alt, className, style, loading = "lazy" }) {
        const [imageError, setImageError] = React.useState(false);

        if (!src || imageError) {
          return (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, rgba(44,82,130,0.75), rgba(90,103,216,0.6))'
            }}>
              Preview unavailable
            </div>
          );
        }

        return (
          <img
            src={src}
            alt={alt}
            loading={loading}
            className={className}
            style={style}
            onError={() => setImageError(true)}
          />
        );
      }
      
      // SectionHeader Component
      function SectionHeader({ title, highlight, subtitle, centered = true }) {
        return (
          <div style={{ 
            textAlign: centered ? 'center' : 'left', 
            marginBottom: '4rem'
          }}>
            <h2 className="section-title section-sticky" style={{ 
              fontSize: 'clamp(2rem, 4vw, 3rem)', 
              marginBottom: '1rem',
              color: 'var(--text-primary)',
              fontWeight: 800
            }}>
              {title} {highlight && (
                <span className="text-gradient" style={{
                  background: 'linear-gradient(135deg, #5a67d8, #2c5282)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {highlight}
                </span>
              )}
            </h2>
            {subtitle && (
              <p style={{ 
                fontSize: '1.1rem', 
                color: 'var(--text-secondary)',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                {subtitle}
              </p>
            )}
          </div>
        );
      }

      // Simple SVG Icon Renderer - inline SVG paths
      function LucideIcon({ name, size = 20, color = 'currentColor' }) {
        const iconPaths = {
          'brain': 'M12 5a4 4 0 0 0-4 4v1a4 4 0 0 0 4 4 4 4 0 0 0 4-4V9a4 4 0 0 0-4-4zm0 0V3m0 18v-2m-7-7H3m18 0h-2',
          'users': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7 0a3 3 0 1 0 0-6m6 13v-2a4 4 0 0 0-3-3.87',
          'code': 'M16 18l6-6-6-6M8 6l-6 6 6 6',
          'heart': 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
          'star': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
          'rocket': 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
          'lightbulb': 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4',
          'target': 'M12 2v4m0 12v4M2 12h4m12 0h4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
          'sparkles': 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 8l-1.5 1.5L16 11l-1.5 1.5L16 14l-1.5-1.5L13 14l1.5-1.5L13 11l1.5-1.5L13 8l1.5 1.5L16 8zM9 3l-.5.5L9 4l-.5.5L9 5l-.5-.5L8 5l.5-.5L8 4l.5-.5L8 3l.5.5L9 3z',
          'mail': 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
          'calendar': 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
          'briefcase': 'M16 20V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v16m-4-7h16',
          'map-pin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
          'linkedin': 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z',
          'handshake': 'M11 17a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4V5H11v12zm6-11a4 4 0 0 0-4 4 4 4 0 0 0-4-4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4',
          'github': 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
          'book': 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
          'download': 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3'
        };
        
        const path = iconPaths[name] || iconPaths['star'];
        
        return (
          <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ display: 'inline-block', verticalAlign: 'middle' }}
          >
            <path d={path} />
          </svg>
        );
      }

      // IconBadge Component
      function IconBadge({ icon, label, iconMap }) {
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            padding: '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(155, 89, 182, 0.05))',
            borderRadius: '20px',
            border: '1px solid rgba(74, 144, 226, 0.2)',
            fontSize: '1rem',
            color: 'var(--text-primary)',
            transition: 'all 0.3s'
          }}>
            {icon && (
              <LucideIcon name={iconMap?.[icon] || 'star'} size={20} color={getColor('accentBlue', true)} />
            )}
            {label}
          </div>
        );
      }

      // FadeInItem Component - for fade-in from bottom animation
      function FadeInItem({ children, delay = 0 }) {
        const [isVisible, setIsVisible] = React.useState(false);
        const itemRef = React.useRef(null);

        React.useEffect(() => {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  setIsVisible(true);
                }
              });
            },
            { threshold: 0.1 }
          );

          if (itemRef.current) {
            observer.observe(itemRef.current);
          }

          return () => {
            if (itemRef.current) {
              observer.unobserve(itemRef.current);
            }
          };
        }, []);

        return (
          <div
            ref={itemRef}
            className={`fade-in-bottom ${isVisible ? 'is-visible' : ''}`}
            style={{ animationDelay: `${delay}s` }}
          >
            {children}
          </div>
        );
      }

      // Card Component
      function Card({ children, hoverable = true, animated = true, onClick }) {
        return (
          <div 
            onClick={onClick}
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px var(--card-shadow)',
              transition: 'all 0.3s',
              border: `1px solid var(--border-color)`,
              position: 'relative',
              cursor: onClick ? 'pointer' : 'default'
            }}
            className={animated ? 'card-shadow fade-on-scroll glass-card' : 'card-shadow glass-card'}
            onMouseEnter={hoverable ? (e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 8px 30px var(--card-shadow-hover)`;
            } : undefined}
            onMouseLeave={hoverable ? (e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 20px var(--card-shadow)`;
            } : undefined}
          >
            {children}
          </div>
        );
      }

      // TimelineItem Component
      function TimelineItem({ job, index, darkMode }) {
        const isLeft = index % 2 === 0;
          const [isVisible, setIsVisible] = React.useState(false);
        const [lockedOpen, setLockedOpen] = React.useState(false);
        const [isHovering, setIsHovering] = React.useState(false);
        const expanded = lockedOpen || isHovering;
        const itemRef = React.useRef(null);
          const [isDesktop, setIsDesktop] = React.useState(() => window.innerWidth >= 768);

          React.useEffect(() => {
            const onResize = () => setIsDesktop(window.innerWidth >= 768);
            window.addEventListener('resize', onResize);
            return () => window.removeEventListener('resize', onResize);
          }, []);
        
        React.useEffect(() => {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  setIsVisible(true);
                }
              });
            },
            { threshold: 0.2 }
          );
          
          if (itemRef.current) {
            observer.observe(itemRef.current);
          }
          
          return () => {
            if (itemRef.current) {
              observer.unobserve(itemRef.current);
            }
          };
        }, []);
        
        return (
          <div 
            ref={itemRef}
            className="timeline-item-wrapper"
            style={{ 
              display: 'flex',
              justifyContent: isDesktop ? (isLeft ? 'flex-start' : 'flex-end') : 'center',
              marginBottom: '3rem',
              position: 'relative',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : (isLeft ? 'translateX(-50px)' : 'translateX(50px)'),
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: `${index * 0.1}s`
            }}
          >
            {/* Timeline dot */}
            <div className="timeline-dot" style={{ display: isDesktop ? 'block' : 'block' }} />

            <div className="timeline-content" style={{
              width: isDesktop ? '45%' : '100%',
              position: 'relative'
            }}>
              {/* Arrow pointing to timeline */}
              {isDesktop && (
                <div className="timeline-arrow" style={{
                  position: 'absolute',
                  top: '2rem',
                  [isLeft ? 'right' : 'left']: '-10px',
                  width: 0,
                  height: 0,
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  [isLeft ? 'borderRight' : 'borderLeft']: `10px solid var(--bg-primary)`,
                }} />
              )}
              
              <Card animated={true}>
                <div 
                  className={`interactive-card ${expanded ? 'timeline-item-expanded' : ''}`} 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expanded}
                  onClick={() => setLockedOpen(prev => !prev)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLockedOpen(prev => !prev); } }}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <div className="timeline-year" aria-hidden="true">{(job.startDate || '').split(' ').pop()}</div>
                  <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    {job.logo && (
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '12px',
                        background: 'var(--accent-light)',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <ImageWithSkeleton
                          src={job.logo} 
                          alt={job.company}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '1.3rem', 
                        marginBottom: '0.5rem',
                        color: 'var(--text-primary)',
                        fontWeight: 700
                      }}>
                        {job.position}
                      </h3>
                      <p style={{ 
                        margin: '0.25rem 0', 
                        color: getColor('accentDarkBlue', darkMode),
                        fontWeight: 600,
                        fontSize: '1.1rem'
                      }}>
                        {job.url ? (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: getColor('accentDarkBlue', darkMode),
                              textDecoration: 'none'
                            }}
                          >
                            {job.company}
                          </a>
                        ) : (
                          job.company
                        )}
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        marginTop: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <LucideIcon name="map-pin" size={16} color="var(--text-secondary)" />
                          {job.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <LucideIcon name="calendar" size={16} color="var(--text-secondary)" />
                          {job.startDate} - {job.endDate}
                        </span>
                      </div>
                    </div>
                  </div>
                      {(job.description && job.description.length > 0) && (
                    <ul style={{ 
                      marginTop: '1.5rem',
                      paddingLeft: '0',
                      listStyle: 'none',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.8',
                          opacity: expanded ? 1 : 0,
                          maxHeight: expanded ? '1000px' : '0',
                      overflow: 'hidden',
                      transition: 'all 0.5s ease'
                    }}>
                      {job.description.map((bullet, i) => (
                        <li key={i} style={{ 
                          marginBottom: '0.75rem',
                          paddingLeft: '1.5rem',
                          position: 'relative',
                          animation: expanded ? `fadeInScale 0.4s ease ${i * 0.1}s forwards` : 'none',
                          opacity: expanded ? 1 : 0
                        }}>
                          <span style={{
                            position: 'absolute',
                            left: 0,
                            top: '0.5rem',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2c5282, #5a67d8)'
                          }} />
                          <span dangerouslySetInnerHTML={{ __html: bullet }} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            </div>
          </div>
        );
      }

      // ============================================
      // DATA VALIDATION & ERROR HANDLING UTILITIES
      // ============================================
      const DataValidator = {
        // Validate portfolio data structure
        validate: function(data) {
          const errors = [];
          const warnings = [];
          
          if (!data) {
            errors.push('Portfolio data is null or undefined');
            return { valid: false, errors, warnings, data: {} };
          }
          
          // Check required fields
          if (!data.personal) {
            warnings.push('Missing personal information section');
            data.personal = { name: 'Portfolio' };
          }
          if (!data.personal.name) {
            warnings.push('Missing personal name');
            data.personal.name = 'Portfolio';
          }
          
          // Validate arrays
          if (!Array.isArray(data.experience)) {
            warnings.push('Experience should be an array');
            data.experience = [];
          }
          if (!Array.isArray(data.projects)) {
            warnings.push('Projects should be an array');
            data.projects = [];
          }
          if (!Array.isArray(data.social)) {
            warnings.push('Social links should be an array');
            data.social = [];
          }
          
          // Validate skills structure - skills is an OBJECT with nontechnical and technical arrays
          if (!data.skills || typeof data.skills !== 'object') {
            warnings.push('Skills should be an object with nontechnical and technical categories');
            data.skills = { nontechnical: [], technical: [] };
          } else {
            if (!Array.isArray(data.skills.nontechnical)) {
              data.skills.nontechnical = [];
            }
            if (!Array.isArray(data.skills.technical)) {
              data.skills.technical = [];
            }
          }
          
          // Validate education
          if (data.education) {
            if (!Array.isArray(data.education.degrees)) {
              warnings.push('Education degrees should be an array');
              if (!data.education.degrees) data.education.degrees = [];
            }
            if (!Array.isArray(data.education.certifications)) {
              warnings.push('Education certifications should be an array');
              if (!data.education.certifications) data.education.certifications = [];
            }
          }
          
          // Log warnings
          if (warnings.length > 0) {
            console.warn('⚠️ Data validation warnings:', warnings);
          }
          
          return { 
            valid: errors.length === 0, 
            errors, 
            warnings, 
            data 
          };
        },

        // Create fallback data structure
        getFallbackData: function() {
          return {
            personal: {
              name: 'Portfolio',
              title: 'Professional Portfolio',
              bio: 'Portfolio data could not be loaded',
              email: 'contact@example.com'
            },
            experience: [],
            projects: [],
            skills: { nontechnical: [], technical: [] },
            education: { degrees: [], certifications: [] },
            social: [],
            highlights: []
          };
        }
      };

      // Error Boundary Component
      class ErrorBoundary extends React.Component {
        constructor(props) {
          super(props);
          this.state = { 
            hasError: false, 
            error: null,
            errorCount: 0
          };
        }

        static getDerivedStateFromError(error) {
          return { hasError: true, error };
        }

        componentDidCatch(error, errorInfo) {
          // Log error
          console.error('🚨 Error caught by boundary:', error, errorInfo);
          
          // Track error analytics
          if (window.gtag) {
            window.gtag('event', 'exception', {
              description: error.toString(),
              fatal: false
            });
          }
          
          // Increment error count
          this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
          
          // If too many errors, suggest page reload
          if (this.state.errorCount > 2) {
            console.error('Too many errors detected. Please refresh the page.');
          }
        }

        render() {
          if (this.state.hasError) {
            return (
              <div style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}>
                <div style={{
                  maxWidth: '500px',
                  padding: '2rem',
                  background: 'var(--card-bg)',
                  borderRadius: '12px',
                  boxShadow: 'var(--card-shadow)',
                  textAlign: 'center'
                }}>
                  <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#e74c3c' }}>
                    ⚠️ Oops!
                  </h1>
                  <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Something went wrong while rendering this page.
                  </p>
                  <details style={{
                    textAlign: 'left',
                    marginBottom: '2rem',
                    padding: '1rem',
                    background: 'rgba(231, 76, 60, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    cursor: 'pointer'
                  }}>
                    <summary style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                      Error Details
                    </summary>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '0.85rem',
                      marginTop: '0.5rem',
                      color: '#c0392b'
                    }}>
                      {this.state.error?.toString()}
                    </pre>
                  </details>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      padding: '0.75rem 2rem',
                      background: 'linear-gradient(135deg, #4a90e2, #9b59b6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    🔄 Reload Page
                  </button>
                </div>
              </div>
            );
          }

          return this.props.children;
        }
      }

      // ============================================
      function PortfolioApp() {
        const [data, setData] = useState(null);
        const [loading, setLoading] = useState(true);
        const [darkMode, setDarkMode] = useState(() => {
          // Check localStorage first
          const saved = localStorage.getItem('darkMode');
          if (saved !== null) {
            return saved === 'true';
          }
          // Fall back to system preference
          return window.matchMedia('(prefers-color-scheme: dark)').matches;
        });

        // ===== INTERACTIVE FEATURES STATE =====
        const [scrollProgress, setScrollProgress] = useState(0);
        const [showBackToTop, setShowBackToTop] = useState(false);

        // Apply dark mode class to body
        useEffect(() => {
          if (darkMode) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
          localStorage.setItem('darkMode', darkMode);
        }, [darkMode]);

        useEffect(() => {
          fetch('./portfolio-data.json')
            .then(res => res.json())
            .then(portfolioData => {
              // Validate data
              const validation = DataValidator.validate(portfolioData);
              
              if (!validation.valid) {
                console.error('❌ Data validation failed:', validation.errors);
                // Use fallback data if validation fails
                setData(DataValidator.getFallbackData());
              } else {
                setData(validation.data);
                // Update meta + structured data from loaded portfolio
                try { updateMetaFromData(validation.data); } catch (e) { console.warn('updateMetaFromData failed', e); }
                try { initLogoBelt(); } catch (e) { console.warn('initLogoBelt failed', e); }
              }
              
              setLoading(false);
              window.portfolioData = validation.data;
            })
            .catch(err => {
              console.error('❌ Error loading portfolio data:', err);
              // Use fallback data on fetch error
              const fallbackData = DataValidator.getFallbackData();
              setData(fallbackData);
              setLoading(false);
              window.portfolioData = fallbackData;
              try { updateMetaFromData(fallbackData); } catch (e) { /* noop */ }
              try { initLogoBelt(); } catch (e) { /* noop */ }
              
              // Track error in analytics
              if (window.gtag) {
                window.gtag('event', 'data_load_error', {
                  error: err.message
                });
              }
            });
        }, []);

        // Track page view on load
        useEffect(() => {
          Analytics.pageView(window.location.pathname, 'Portfolio - Ayush Ghosh');
        }, []);

        // Track scroll depth
        useEffect(() => {
          let lastScrollDepth = 0;
          
          const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (window.scrollY / scrollHeight) * 100;
            
            // Track at 25%, 50%, 75%, 100%
            if (scrolled >= 25 && lastScrollDepth < 25) {
              Analytics.trackScrollDepth(25);
              lastScrollDepth = 25;
            } else if (scrolled >= 50 && lastScrollDepth < 50) {
              Analytics.trackScrollDepth(50);
              lastScrollDepth = 50;
            } else if (scrolled >= 75 && lastScrollDepth < 75) {
              Analytics.trackScrollDepth(75);
              lastScrollDepth = 75;
            } else if (scrolled >= 90 && lastScrollDepth < 90) {
              Analytics.trackScrollDepth(90);
              lastScrollDepth = 90;
            }
          };

          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
        }, []);

        // Scroll animations observer
        useEffect(() => {
          if (!data) return;

          const elements = document.querySelectorAll('.fade-on-scroll');
          if (!elements.length) return;

          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('is-visible');
                  
                  // Track section views
                  const sectionId = entry.target.closest('section')?.id;
                  if (sectionId) {
                    Analytics.trackSectionView(sectionId);
                  }
                  
                  observer.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
          );

          elements.forEach((el) => observer.observe(el));

          return () => observer.disconnect();
        }, [data]);

        // Scroll progress indicator
        useEffect(() => {
          const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrollTop = window.scrollY;
            const progress = (scrollTop / documentHeight) * 100;
            setScrollProgress(progress);
            setShowBackToTop(scrollTop > 500);
          };

          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
        }, []);

        // Set CSS variable for nav height so sticky section titles can offset correctly
        useEffect(() => {
          const setNavHeight = () => {
            const nav = document.querySelector('.sticky-nav');
            const h = nav ? nav.offsetHeight : 64;
            document.documentElement.style.setProperty('--nav-height', `${h}px`);
          };
          setNavHeight();
          window.addEventListener('resize', setNavHeight);
          return () => window.removeEventListener('resize', setNavHeight);
        }, []);

        // Global keyboard shortcuts (Ctrl/Cmd + 1..6 -> navigate sections, 0 -> top, D -> toggle dark)
        useEffect(() => {
          const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform || '') || navigator.userAgent.includes('Mac');
          const modCheck = (e) => (isMac ? e.metaKey : e.ctrlKey);

          const navigateTo = (id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const nav = document.querySelector('.sticky-nav');
            const navH = nav ? nav.offsetHeight : 0;
            const top = el.getBoundingClientRect().top + window.scrollY - navH - 12;
            window.scrollTo({ top, behavior: 'smooth' });
            Analytics.trackClick(`Shortcut navigate ${id}`, 'keyboard');
          };

          const onKey = (e) => {
            if (!modCheck(e)) return;
            const key = e.key;
            if (key === '1') { e.preventDefault(); navigateTo('experience'); }
            else if (key === '2') { e.preventDefault(); navigateTo('projects'); }
            else if (key === '3') { e.preventDefault(); navigateTo('education'); }
            else if (key === '4') { e.preventDefault(); navigateTo('skills'); }
            else if (key === '5') { e.preventDefault(); navigateTo('contact'); }
            else if (key === '0') { e.preventDefault(); scrollToTop(); }
            else if (key.toLowerCase() === 'd') { e.preventDefault(); setDarkMode(prev => !prev); Analytics.trackClick('Shortcut toggle dark', 'keyboard'); }
          };

          window.addEventListener('keydown', onKey);
          return () => window.removeEventListener('keydown', onKey);
        }, []);

        // Back to top handler
        const scrollToTop = () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          Analytics.trackClick('Back to Top', 'fab-button');
        };

        if (loading) {
          return (
            <div style={{ 
              minHeight: '100vh', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '1.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid rgba(74, 144, 226, 0.2)',
                  borderTop: '4px solid #4a90e2',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <p>Loading portfolio...</p>
              </div>
            </div>
          );
        }

        if (!data) {
          return (
            <div style={{ 
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              padding: '2rem'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                background: 'var(--card-bg)',
                borderRadius: '12px',
                boxShadow: 'var(--card-shadow)',
                maxWidth: '500px'
              }}>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e74c3c' }}>
                  ⚠️ Unable to Load Portfolio
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Please ensure portfolio-data.json exists and contains valid JSON.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'linear-gradient(135deg, #4a90e2, #9b59b6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  🔄 Retry
                </button>
              </div>
            </div>
          );
        }

        const selectedTestimonials = (data.testimonials || [])
          .filter((testimonial) => testimonial.featured !== false)
          .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
          .slice(0, 6);

        return (
          <ErrorBoundary>
            {/* Scroll Progress Bar */}
            <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
            <a href="#main-content" className="skip-link">Skip to main content</a>

            <div className="portfolio-container">
              <Navigation data={data} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
              <main id="main-content">
                <HeroSection personal={data.personal} data={data} social={data.social} />
                <AboutSection data={data.personal} highlights={data.highlights} darkMode={darkMode} />
                <ExperienceSection experience={data.experience} darkMode={darkMode} />
                <ProjectsSection projects={data.projects} caseStudies={data.caseStudies} darkMode={darkMode} />
                <EducationSection education={data.education} darkMode={darkMode} />
                <SkillsSection skills={data.skills} darkMode={darkMode} />
                <TestimonialsSection testimonials={selectedTestimonials} darkMode={darkMode} />
                <ContactSection personal={data.personal} social={data.social} />
              </main>
              <Footer data={data.personal} social={data.social} />
            </div>

            {/* Back to Top Floating Action Button */}
            <button 
              className={`fab ${!showBackToTop ? 'hidden' : ''}`}
              onClick={scrollToTop}
              title="Back to top"
            >
              ↑
            </button>
          </ErrorBoundary>
        );
      }

      // ============================================
      // NAVIGATION
      // ============================================
      function Navigation({ data, darkMode, toggleDarkMode }) {
        const [scrolled, setScrolled] = useState(false);
        const [activeSection, setActiveSection] = useState('');
        const [menuOpen, setMenuOpen] = useState(false);
        const drawerRef = useRef(null);

        useEffect(() => {
          const handleScroll = () => {
            setScrolled(window.scrollY > 50);
            
            // Determine active section
            const sections = NAV_ITEMS.map((item) => item.id);
            const scrollPosition = window.scrollY + 200;
            let foundSection = false;
            
            for (const section of sections) {
              const element = document.getElementById(section);
              if (element) {
                const offsetTop = element.offsetTop;
                const offsetBottom = offsetTop + element.offsetHeight;
                
                if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
                  setActiveSection(section);
                  foundSection = true;
                  break;
                }
              }
            }
            
            // If no section found, clear active section (user is above experience section)
            if (!foundSection) {
              setActiveSection('');
            }
          };
          
          handleScroll();
          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
        }, []);

        const scrollToSection = (id) => {
          const el = document.getElementById(id);
          if (!el) return;
          // Account for sticky nav height so section content is visible
          const navEl = document.querySelector('.sticky-nav');
          const navHeight = navEl ? navEl.offsetHeight : 0;
          const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 12;
          window.scrollTo({ top, behavior: 'smooth' });
          // close mobile menu if open
          if (menuOpen) setMenuOpen(false);
        };

        // Close menu on escape / resize and toggle body class to hide nav on mobile
        useEffect(() => {
          const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
          const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
          window.addEventListener('keydown', onKey);
          window.addEventListener('resize', onResize);

          // toggle body class and prevent background scroll when menu open
          if (menuOpen) {
            document.body.classList.add('menu-open');
            document.body.style.overflow = 'hidden';
          } else {
            document.body.classList.remove('menu-open');
            document.body.style.overflow = '';
          }

          return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', onResize);
            document.body.classList.remove('menu-open');
            document.body.style.overflow = '';
          };
        }, [menuOpen]);

        // Focus trap for mobile drawer
        useEffect(() => {
          if (!menuOpen) return;
          const trapRoot = drawerRef?.current;
          if (!trapRoot) return;
          const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
          const focusable = Array.from(trapRoot.querySelectorAll(focusableSelector)).filter(el => !el.hasAttribute('disabled'));
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (first) first.focus();
          const onKey = (e) => {
            if (e.key !== 'Tab') return;
            if (focusable.length === 0) { e.preventDefault(); return; }
            if (e.shiftKey) {
              if (document.activeElement === first) { e.preventDefault(); last && last.focus(); }
            } else {
              if (document.activeElement === last) { e.preventDefault(); first && first.focus(); }
            }
          };
          document.addEventListener('keydown', onKey);
          return () => document.removeEventListener('keydown', onKey);
        }, [menuOpen]);

        return (
          <>
          <nav className="sticky-nav" style={{
            position: 'fixed',
            top: 0,
            width: '100%',
            zIndex: 1000,
            background: scrolled ? (darkMode ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)') : 'transparent',
            backdropFilter: scrolled ? 'blur(10px)' : 'none',
            padding: '1rem 2rem',
            transition: 'all 0.3s ease',
            borderBottom: scrolled ? `1px solid var(--border-color)` : 'none'
          }}>
            <div style={{ 
              maxWidth: '1200px', 
              margin: '0 auto', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <h2 style={{ 
                  color: scrolled ? 'var(--text-primary)' : 'white', 
                  margin: 0, 
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  transition: 'color 0.3s'
                }}>
                  {data.personal?.name || 'Portfolio'}
                </h2>
                <button
                  onClick={() => {
                    Analytics.trackClick('Dark Mode Toggle', 'button');
                    toggleDarkMode();
                  }}
                  style={{
                    background: 'rgba(74, 144, 226, 0.2)',
                    border: '1px solid rgba(74, 144, 226, 0.3)',
                    color: scrolled ? 'var(--text-primary)' : 'white',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(74, 144, 226, 0.3)';
                    e.target.style.boxShadow = '0 0 10px rgba(74, 144, 226, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(74, 144, 226, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                  title={darkMode ? 'Light mode' : 'Dark mode'}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>
              <div className="nav-actions">
                <div className="desktop-nav-links">
                {NAV_ITEMS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => {
                      Analytics.trackClick(`Navigate to ${id}`, 'nav-link');
                      scrollToSection(id);
                    }}
                    className={`nav-link ${activeSection === id ? 'active' : ''}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: scrolled ? 'var(--text-primary)' : 'white',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      textTransform: 'capitalize',
                      transition: 'color 0.3s',
                      fontWeight: activeSection === id ? 700 : 400,
                      position: 'relative',
                      paddingBottom: '4px'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#4a90e2'}
                    onMouseLeave={(e) => e.target.style.color = scrolled ? 'var(--text-primary)' : 'white'}
                  >
                    {label}
                  </button>
                ))}
                </div>
                <button
                  aria-label="Open menu"
                  className="hamburger"
                  onClick={() => setMenuOpen(prev => !prev)}
                  title="Menu"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={scrolled ? 'var(--text-primary)' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
              </div>
            </div>
          </nav>

          {/* Drawer + overlay for mobile menu */}
          <div className={`drawer-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden={!menuOpen} />
          <aside ref={drawerRef} className={`mobile-drawer ${menuOpen ? 'open' : ''}`} role="dialog" aria-modal={menuOpen} aria-hidden={!menuOpen}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <strong style={{ fontSize: '1.1rem' }}>{data.personal?.name || 'Portfolio'}</strong>
              <button className="hamburger" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <nav>
              {NAV_ITEMS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { Analytics.trackClick(`Navigate to ${id}`, 'mobile-nav-link'); scrollToSection(id); setMenuOpen(false); }}
                  className={`nav-link ${activeSection === id ? 'active' : ''}`}
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'block', padding: '0.75rem 0', textAlign: 'left', width: '100%', fontSize: '1rem' }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>
          </>
        );
      }

      // ============================================
      // HERO SECTION
      // ============================================
      function HeroSection({ personal, data, social }) {
        const [visible, setVisible] = useState(false);

        useEffect(() => {
          setVisible(true);
        }, []);

        const getIconForLink = (name) => {
          const nameLower = name.toLowerCase();
          if (nameLower.includes('linkedin')) return 'linkedin';
          if (nameLower.includes('github')) return 'github';
          if (nameLower.includes('scholar') || nameLower.includes('google')) return 'book';
          return 'link';
        };

        return (
          <section className="animated-hero-bg" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Animated background circles */}
            <div style={{
              position: 'absolute',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74,144,226,0.1) 0%, transparent 70%)',
              top: '-200px',
              right: '-200px',
              animation: 'float 6s ease-in-out infinite'
            }} />
            <div style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(155,89,182,0.1) 0%, transparent 70%)',
              bottom: '-150px',
              left: '-150px',
              animation: 'float 8s ease-in-out infinite'
            }} />

            <div style={{ 
              maxWidth: '900px', 
              position: 'relative', 
              zIndex: 1,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s ease-out'
            }}>
              {/* Headshot */}
              {personal?.image && (
                <div style={{
                  marginBottom: '2rem',
                  animation: 'fadeInUp 1s ease-out',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <ImageWithSkeleton
                    src={personal.image} 
                    alt={personal.name}
                    loading="lazy"
                    style={{
                      width: '180px',
                      height: '180px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '5px solid rgba(74, 144, 226, 0.3)',
                      boxShadow: '0 10px 40px rgba(74, 144, 226, 0.3)',
                      transition: 'transform 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
              )}
              
              
              

              <h1 className="hero-name">
                <span style={{
                  background: 'linear-gradient(135deg, #4a90e2, #9b59b6, #e94b8f)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {personal?.name}
                </span>
              </h1>

              <h2 className="hero-title">
                Building Scalable AI to Solve Global Challenges
              </h2>

              <p className="hero-summary">
                Product Lead focused on enterprise AI and advanced analytics. I partner with stakeholders to define the right problem, prioritize roadmap tradeoffs, and ship products that improve speed, quality, and decision-making, with the art of connecting data to dollars.
              </p>

              {/* Affiliation logo belt (experience + degrees) */}
              {(() => {
                const items = [];
                (data.experience || []).forEach(e => { if (e.logo) items.push({ src: e.logo, url: e.url, title: e.company }); });
                (data.education?.degrees || []).forEach(d => { if (d.logo) items.push({ src: d.logo, url: d.url, title: d.institution }); });

                // Deduplicate by src while preserving order
                const seen = new Set();
                const unique = items.filter(it => { if (seen.has(it.src)) return false; seen.add(it.src); return true; });

                if (!unique.length) return null;

                const trackItems = unique.concat(unique);

                return (
                  <div className="logo-belt" aria-label="Affiliations">
                    <div className="logo-track" role="list">
                      {trackItems.map((it, idx) => (
                        <div className="logo-item" role="listitem" key={`logo-${idx}`}>
                          {it.url ? (
                            <a href={it.url} target="_blank" rel="noopener noreferrer" className="logo-pill" title={it.title || ''} onClick={() => Analytics.trackExternalLink(it.url, it.title || 'affiliation')}>
                              <ImageWithSkeleton src={it.src} alt={it.title || 'Affiliation logo'} style={{ maxHeight: '48px', maxWidth: '140px' }} />
                            </a>
                          ) : (
                            <div className="logo-pill" title={it.title || ''}>
                              <ImageWithSkeleton src={it.src} alt={it.title || 'Affiliation logo'} style={{ maxHeight: '48px', maxWidth: '140px' }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'center', 
                flexWrap: 'wrap', 
                marginBottom: '2.2rem' 
              }}>
                {social?.map((link, index) => {
                  const isGitHub = link.name.toLowerCase().includes('github');
                  return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => Analytics.trackExternalLink(link.url, `Hero: ${link.name}`)}
                    title={link.name}
                    className="btn-ripple icon-pulse"
                    style={{
                      padding: '1rem',
                      width: '50px',
                      height: '50px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: index === 0 
                        ? 'linear-gradient(135deg, #2c5282, #5a67d8)'
                        : isGitHub ? 'white' : 'rgba(44, 82, 130, 0.15)',
                      border: index === 0 ? 'none' : isGitHub ? '2px solid rgba(44, 82, 130, 0.2)' : '2px solid rgba(44, 82, 130, 0.3)',
                      borderRadius: '50%',
                      color: isGitHub ? '#1a1a1a' : 'white',
                      textDecoration: 'none',
                      transition: 'all 0.3s',
                      fontWeight: 600,
                      fontSize: '1rem'
                    }}
                    onMouseEnter={(e) => {
                      if (index === 0) {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(44, 82, 130, 0.4)';
                      } else if (isGitHub) {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                      } else {
                        e.currentTarget.style.background = 'rgba(44, 82, 130, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                      if (index !== 0) {
                        e.currentTarget.style.background = isGitHub ? 'white' : 'rgba(44, 82, 130, 0.15)';
                      }
                    }}
                  >
                    <LucideIcon name={getIconForLink(link.name)} size={22} color={isGitHub ? '#1a1a1a' : 'white'} />
                  </a>
                  );
                })}
                <a
                  href="./documents/resume.pdf"
                  download="AyushGhosh_Resume.pdf"
                  onClick={() => Analytics.trackClick('Download Resume', 'hero-button')}
                  title="Download Resume"
                  className="btn-ripple gradient-animate"
                  style={{
                    padding: '1rem',
                    width: '50px',
                    height: '50px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                    border: 'none',
                    borderRadius: '50%',
                    color: 'white',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: '0 6px 20px rgba(243, 156, 18, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(243, 156, 18, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(243, 156, 18, 0.3)';
                  }}
                >
                  <LucideIcon name="download" size={22} color="white" />
                </a>
                {/* <a
                  href="#perspectives"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('perspectives')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    padding: '1rem 2rem',
                    background: 'rgba(44, 82, 130, 0.15)',
                    border: '2px solid rgba(44, 82, 130, 0.3)',
                    borderRadius: '12px',
                    color: 'white',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    fontWeight: 600,
                    fontSize: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(44, 82, 130, 0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(44, 82, 130, 0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  📝 Read My Insights
                </a> */}
              </div>

              <div style={{ 
                fontSize: '0.9rem', 
                color: 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                {data.location && (
                  <>
                    <LucideIcon name="map-pin" size={16} color="rgba(255,255,255,0.5)" />
                    <span>{data.location}</span>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      }

      // ============================================
      // ABOUT SECTION
      // ============================================
      function AboutSection({ data, highlights, darkMode }) {
        // Icon mapping to Lucide icon names
        const iconMap = {
          'brain': 'brain',
          'users': 'users',
          'code': 'code',
          'heart': 'heart',
          'star': 'star',
          'rocket': 'rocket',
          'lightbulb': 'lightbulb',
          'target': 'target'
        };
        
        return (
          <section id="about" className="section-bg-mesh" style={{ 
            padding: '8rem 2rem', 
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ 
                  fontSize: 'clamp(2rem, 4vw, 3rem)', 
                  marginBottom: '1rem',
                  color: 'var(--text-primary)',
                  fontWeight: 800
                }}>
                  About <span className="text-gradient" style={{
                    background: 'linear-gradient(135deg, #4a90e2, #9b59b6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>Me</span>
                </h2>
                <p style={{ 
                  fontSize: '1.1rem', 
                  color: getColor('textSecondary', darkMode),
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Transforming ideas into impactful solutions
                </p>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '2rem',
                alignItems: 'stretch'
              }}>
                {highlights?.map((highlight, index) => (
                  <FadeInItem key={index} delay={index * 0.1}>
                    <div style={{
                      padding: '2.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      textAlign: 'center',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid var(--border-color)',
                      position: 'relative',
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    className="card-shadow"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(74, 144, 226, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                    }}
                    >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #4a90e2, #9b59b6)'
                    }} />
                    <div style={{
                      width: '70px',
                      height: '70px',
                      margin: '0 auto 1.5rem',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgba(74,144,226,0.1), rgba(155,89,182,0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <LucideIcon name={iconMap[highlight.icon] || 'sparkles'} size={32} color={getColor('accentBlue', darkMode)} />
                    </div>
                    <h3 style={{ 
                      fontSize: '1.5rem', 
                      marginBottom: '1rem',
                      color: getColor('textPrimary', darkMode),
                      fontWeight: 700
                    }}>
                      {highlight.title}
                    </h3>
                    <p style={{ 
                      color: getColor('textSecondary', darkMode), 
                      lineHeight: '1.7',
                      fontSize: '1rem',
                      margin: 0,
                      flexGrow: 1
                    }}>
                      {highlight.description}
                    </p>
                    </div>
                  </FadeInItem>
                ))}
              </div>
            </div>
          </section>
        );
      }

      // ============================================
      // SKILLS SECTION
      // ============================================
      function SkillsSection({ skills, darkMode }) {
        if (!skills) return null;

        return (
          <section id="skills" style={{ 
            padding: '8rem 2rem', 
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <SectionHeader
                title="Core"
                highlight="Skills"
                subtitle="Product leadership and technical execution capabilities"
              />
              
              {/* Non-Technical Skills */}
              {skills.nontechnical && skills.nontechnical.length > 0 && (
                <>
                  <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                    <h3 style={{ 
                      fontSize: 'clamp(1.4rem, 2.4vw, 1.9rem)', 
                      marginBottom: '0.5rem',
                      color: 'var(--text-primary)',
                      fontWeight: 800
                    }}>
                      Product <span className="text-gradient">Leadership & Strategy</span>
                    </h3>
                    <p style={{ 
                      fontSize: '1rem', 
                      color: 'var(--text-secondary)',
                      maxWidth: '700px',
                      margin: 0
                    }}>
                      Core competencies in product management and team leadership
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem', alignItems: 'stretch' }}>
                    {skills.nontechnical.map((category, idx) => {
                      let items = [];
                      if (Array.isArray(category.items)) {
                        items = category.items;
                      } else if (category.items && typeof category.items === 'string') {
                        items = category.items.split(',').map(s => s.trim()).filter(s => s);
                      }
                      
                      return (
                        <div key={idx} style={{
                          padding: '2rem',
                          background: 'var(--bg-primary)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 20px var(--card-shadow)',
                          border: '1px solid var(--border-color)',
                          transition: 'all 0.3s',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }} className="card-shadow fade-on-scroll">
                          <h3 style={{ 
                            fontSize: '1.3rem', 
                            marginBottom: '1.5rem',
                            color: 'var(--text-primary)',
                            fontWeight: 700
                          }}>
                            {category.category}
                          </h3>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {items.map((item, i) => {
                              const skillName = typeof item === 'string' ? item : item.name;
                              const skillLevel = typeof item === 'object' ? item.level : null;
                              const fillPercent = skillLevel ? (skillLevel / 10) * 100 : 0;
                              
                              return (
                                <div 
                                  key={i} 
                                  className="skill-badge"
                                  style={{
                                    position: 'relative',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(74, 144, 226, 0.2)',
                                    overflow: 'hidden',
                                    background: 'rgba(74, 144, 226, 0.1)',
                                    color: getColor('accentMediumBlue', darkMode),
                                    transition: 'all 0.3s',
                                    minWidth: 'fit-content'
                                  }}
                                  onMouseEnter={(e) => {
                                    const fillEl = e.currentTarget.querySelector('.skill-fill');
                                    if (fillEl) {
                                      fillEl.style.width = `${fillPercent}%`;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    const fillEl = e.currentTarget.querySelector('.skill-fill');
                                    if (fillEl) {
                                      fillEl.style.width = '0%';
                                    }
                                  }}
                                >
                                  <div 
                                    className="skill-fill"
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      height: '100%',
                                      width: '0%',
                                      background: 'rgba(74, 144, 226, 0.3)',
                                      borderRadius: '8px',
                                      transition: 'width 0.6s ease-out',
                                      zIndex: 0,
                                      pointerEvents: 'none'
                                    }}
                                  />
                                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {skillName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Technical Skills */}
              {skills.technical && skills.technical.length > 0 && (
                <>
                  <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                    <h3 style={{ 
                      fontSize: 'clamp(1.4rem, 2.4vw, 1.9rem)', 
                      marginBottom: '0.5rem',
                      color: 'var(--text-primary)',
                      fontWeight: 800
                    }}>
                      Technical <span className="text-gradient">Foundation</span>
                    </h3>
                    <p style={{ 
                      fontSize: '1rem', 
                      color: 'var(--text-secondary)',
                      maxWidth: '700px',
                      margin: 0
                    }}>
                      Technologies and tools I work with
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
                    {skills.technical.map((category, idx) => {
                      let items = [];
                      if (Array.isArray(category.items)) {
                        items = category.items;
                      } else if (category.items && typeof category.items === 'string') {
                        items = category.items.split(',').map(s => s.trim()).filter(s => s);
                      }
                      
                      return (
                        <div key={idx} style={{
                          padding: '2rem',
                          background: 'var(--bg-primary)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 20px var(--card-shadow)',
                          border: '1px solid var(--border-color)',
                          transition: 'all 0.3s',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }} className="card-shadow fade-on-scroll">
                          <h3 style={{ 
                            fontSize: '1.3rem', 
                            marginBottom: '1.5rem',
                            color: 'var(--text-primary)',
                            fontWeight: 700
                          }}>
                            {category.category}
                          </h3>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {items.map((item, i) => {
                              const skillName = typeof item === 'string' ? item : item.name;
                              const skillLevel = typeof item === 'object' ? item.level : null;
                              const fillPercent = skillLevel ? (skillLevel / 10) * 100 : 0;
                              
                              return (
                                <div 
                                  key={i} 
                                  className="skill-badge"
                                  style={{
                                    position: 'relative',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(44, 82, 130, 0.2)',
                                    overflow: 'hidden',
                                    background: 'rgba(44, 82, 130, 0.1)',
                                    color: getColor('accentDarkBlue', darkMode),
                                    transition: 'all 0.3s',
                                    minWidth: 'fit-content'
                                  }}
                                  onMouseEnter={(e) => {
                                    const fillEl = e.currentTarget.querySelector('.skill-fill');
                                    if (fillEl) {
                                      fillEl.style.width = `${fillPercent}%`;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    const fillEl = e.currentTarget.querySelector('.skill-fill');
                                    if (fillEl) {
                                      fillEl.style.width = '0%';
                                    }
                                  }}
                                >
                                  <div 
                                    className="skill-fill"
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      height: '100%',
                                      width: '0%',
                                      background: 'rgba(44, 82, 130, 0.3)',
                                      borderRadius: '8px',
                                      transition: 'width 0.6s ease-out',
                                      zIndex: 0,
                                      pointerEvents: 'none'
                                    }}
                                  />
                                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {skillName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        );
      }

      // ============================================
      // EXPERIENCE SECTION
      // ============================================
      function ExperienceSection({ experience, darkMode }) {
        return (
          <section id="experience" className="section-bg-mesh" style={{ 
            padding: '8rem 2rem', 
            background: 'var(--bg-primary)',
            position: 'relative'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <SectionHeader 
                title="Work"
                highlight="Experience"
                subtitle="Building products that make an impact"
              />

              {/* Timeline */}
              <div style={{ position: 'relative' }}>
                {/* Center line */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  background: 'linear-gradient(180deg, #4a90e2, #9b59b6)',
                  transform: 'translateX(-50%)',
                  display: window.innerWidth >= 768 ? 'block' : 'none'
                }} />
                
                {experience?.map((job, index) => (
                  <TimelineItem key={index} job={job} index={index} darkMode={darkMode} />
                ))}
              </div>
            </div>
          </section>
        );
      }

      // ============================================
      // CASE STUDIES SECTION
      // ============================================
      function CaseStudiesSection({ caseStudies, darkMode }) {
        if (!Array.isArray(caseStudies) || caseStudies.length === 0) return null;
        const [activeIndex, setActiveIndex] = useState(null);

        return (
          <section id="case-studies" className="section-bg-mesh alt" style={{ padding: '8rem 2rem', background: 'var(--bg-secondary)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '0.75rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  Product <span className="text-gradient">Case Studies</span>
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                  How I frame ambiguity, make product tradeoffs, and deliver measurable outcomes.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {caseStudies.map((study, index) => (
                  <FadeInItem key={study.id || index} delay={index * 0.08}>
                    <article
                      className="glass-card"
                      style={{ border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveIndex(prev => (prev === index ? null : index))}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          padding: '1.25rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{study.title}</h3>
                          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            {study.summary || study.problem}
                          </p>
                        </div>
                        <span style={{ color: getColor('accentBlue', darkMode), fontWeight: 700, fontSize: '1.1rem' }}>
                          {activeIndex === index ? '−' : '+'}
                        </span>
                      </button>
                      <div
                        style={{
                          maxHeight: activeIndex === index ? '1200px' : '0',
                          opacity: activeIndex === index ? 1 : 0,
                          overflow: 'hidden',
                          transition: 'max-height 0.35s ease, opacity 0.25s ease',
                          padding: activeIndex === index ? '0 1.5rem 1.5rem' : '0 1.5rem'
                        }}
                      >
                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ margin: 0, color: getColor('accentBlue', darkMode), fontWeight: 700, fontSize: '0.9rem' }}>{study.company}</p>
                          <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {study.role} {study.timeline ? `| ${study.timeline}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'grid', gap: '0.85rem' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: getColor('accentDarkBlue', darkMode) }}>Problem</h4>
                            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{study.problem}</p>
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: getColor('accentDarkBlue', darkMode) }}>Strategy</h4>
                            <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              {(study.strategy || []).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: getColor('accentDarkBlue', darkMode) }}>Execution</h4>
                            <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              {(study.execution || []).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: getColor('accentDarkBlue', darkMode) }}>Outcome</h4>
                            <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              {(study.outcome || []).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                          {study.tradeoffs && (
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', color: getColor('accentDarkBlue', darkMode) }}>Tradeoffs</h4>
                              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{study.tradeoffs}</p>
                            </div>
                          )}
                          {study.nextStep && (
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', color: getColor('accentDarkBlue', darkMode) }}>What I'd Do Next</h4>
                              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{study.nextStep}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </FadeInItem>
                ))}
              </div>
            </div>
          </section>
        );
      }

      // ============================================
      // EDUCATION SECTION
      // ============================================
      function EducationSection({ education, darkMode }) {
        const [hoveredDegreeIndex, setHoveredDegreeIndex] = useState(null);
        const [hoveredCertIndex, setHoveredCertIndex] = useState(null);

        return (
          <section id="education" style={{ 
            padding: '8rem 2rem', 
            background: 'var(--bg-secondary)' 
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <SectionHeader 
                title="Education &"
                highlight="Certifications"
                subtitle="Academic background and professional development"
              />
              
              {/* Degrees */}
              <h3 style={{ fontSize: '2rem', marginBottom: '2rem', color: getColor('accentBlue', darkMode) }}>Degrees</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem' }}>
                {education?.degrees?.map((degree, index) => {
                  const showCourses = hoveredDegreeIndex === index;
                  
                  return (
                  <FadeInItem key={index} delay={index * 0.1}>
                    <div 
                      onMouseEnter={() => setHoveredDegreeIndex(index)}
                      onMouseLeave={() => setHoveredDegreeIndex(null)}
                      style={{
                        padding: '2rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        cursor: 'default',
                        transition: 'all 0.3s ease',
                        transform: 'translateY(0)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      {degree.logo && (
                        <ImageWithSkeleton
                          src={degree.logo} 
                          alt={degree.institution}
                          loading="lazy"
                          style={{
                            width: '45px',
                            height: '45px',
                            objectFit: 'contain',
                            borderRadius: '6px',
                            background: 'rgba(74, 144, 226, 0.1)',
                            padding: '5px'
                          }}
                        />
                      )}
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                          {degree.degree}
                        </h4>
                        <a
                          href={degree.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            margin: '0.25rem 0',
                            color: getColor('accentDarkBlue', darkMode),
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'inline-block'
                          }}
                        >
                          {degree.institution}
                        </a>
                        <div style={{ 
                          margin: '0.25rem 0 0 0', 
                          color: getColor('textSecondary', darkMode), 
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <LucideIcon name="map-pin" size={14} color={getColor('textSecondary', darkMode)} />
                            {degree.location}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <LucideIcon name="calendar" size={14} color={getColor('textSecondary', darkMode)} />
                            {degree.startDate} - {degree.endDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    {degree.courses && degree.courses.length > 0 && (
                      <div style={{ 
                        marginTop: '1rem', 
                        paddingTop: '1rem', 
                        borderTop: '1px solid var(--border-color)',
                        opacity: showCourses ? 1 : 0,
                        maxHeight: showCourses ? '1000px' : '0',
                        overflow: 'hidden',
                        transition: 'all 0.4s ease',
                      }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: getColor('textSecondary', darkMode), fontWeight: 600 }}>
                          Relevant Coursework:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {degree.courses.map((course, i) => (
                            <span key={i} style={{
                              padding: '0.35rem 0.75rem',
                              background: 'rgba(44, 82, 130, 0.08)',
                              color: getColor('accentDarkBlue', darkMode),
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              border: '1px solid rgba(44, 82, 130, 0.15)',
                              animation: showCourses ? `fadeInScale 0.3s ease ${i * 0.05}s forwards` : 'none',
                              opacity: showCourses ? 1 : 0
                            }}>
                              {course}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    </div>
                  </FadeInItem>
                  );
                })}
              </div>

              {/* Certifications */}
              <h3 style={{ fontSize: '2rem', marginBottom: '2rem', color: getColor('accentDarkBlue', darkMode) }}>Certifications</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {education?.certifications?.map((cert, index) => {
                  const showLink = hoveredCertIndex === index && Boolean(cert.url);
                  
                  return (
                  <FadeInItem key={index} delay={index * 0.1}>
                    <div 
                      onMouseEnter={() => setHoveredCertIndex(index)}
                      onMouseLeave={() => setHoveredCertIndex(null)}
                      style={{
                        padding: '1.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        transition: 'all 0.3s',
                        cursor: 'default',
                        position: 'relative',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {cert.logo && (
                        <ImageWithSkeleton
                          src={cert.logo} 
                          alt={cert.issuer}
                          loading="lazy"
                          style={{
                            width: '45px',
                            height: '45px',
                            objectFit: 'contain',
                            borderRadius: '6px',
                            background: 'rgba(74, 144, 226, 0.1)',
                            padding: '5px',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <div>
                        <h5 style={{ margin: 0, fontSize: '1rem', color: getColor('textPrimary', darkMode) }}>
                          {cert.title}
                        </h5>
                        <p style={{ margin: '0.25rem 0 0 0', color: getColor('textSecondary', darkMode), fontSize: '0.85rem' }}>
                          {cert.issuer}
                        </p>
                      </div>
                    </div>
                    
                    {/* Certificate link */}
                    {showLink && cert.url && cert.url !== '#' && (
                      <a
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(74, 144, 226, 0.1)',
                          color: getColor('accentBlue', darkMode),
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          border: '1px solid rgba(74, 144, 226, 0.3)',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(74, 144, 226, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.3)';
                        }}
                      >
                        🔗 View Certificate
                      </a>
                    )}
                    </div>
                  </FadeInItem>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }

      // ============================================
      // TESTIMONIALS SECTION
      // ============================================
      function TestimonialsSection({ testimonials, darkMode }) {
        const [activeTestimonialId, setActiveTestimonialId] = useState(null);

        return (
          <section id="testimonials" style={{ 
            padding: '6rem 2rem',
            background: 'var(--bg-primary)'
                  }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ 
                  fontSize: 'clamp(2rem, 4vw, 2.5rem)', 
                  marginBottom: '1rem',
                  color: 'var(--text-primary)',
                  fontWeight: 800
                }}>
                  What People <span style={{
                    background: 'linear-gradient(135deg, #2c5282, #5a67d8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>Say</span>
                </h2>
                <p style={{ 
                  fontSize: '1.1rem', 
                  color: '#666',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Selected LinkedIn recommendations from collaborators and leaders
                </p>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                gap: '2rem'
              }}>
                {testimonials?.map((testimonial, index) => {
                  const testimonialId = testimonial.id ?? index;
                  const showDetails = activeTestimonialId === testimonialId;

                  return (
                  <FadeInItem key={testimonialId} delay={index * 0.1}>
                    <div
                      tabIndex={0}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        padding: '2rem',
                        borderRadius: '16px',
                        boxShadow: '0 8px 30px rgba(44, 82, 130, 0.12)',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        border: '1px solid var(--border-color)'
                      }}
                      onFocus={() => setActiveTestimonialId(testimonialId)}
                      onBlur={() => setActiveTestimonialId(null)}
                      onClick={() => setActiveTestimonialId((prev) => (prev === testimonialId ? null : testimonialId))}
                      onMouseEnter={(e) => {
                        setActiveTestimonialId(testimonialId);
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(44, 82, 130, 0.18)';
                      }}
                      onMouseLeave={(e) => {
                        setActiveTestimonialId(null);
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(44, 82, 130, 0.12)';
                      }}
                  >
                    {/* Quote Icon */}
                    <div style={{
                      position: 'absolute',
                      top: '1.5rem',
                      right: '1.5rem',
                      fontSize: '3rem',
                      color: 'var(--border-color)',
                      lineHeight: 1,
                      fontFamily: 'Georgia, serif'
                    }}>
                      "
                    </div>
                    
                    {/* Quote Text */}
                    <p style={{
                      fontSize: '1rem',
                      lineHeight: '1.8',
                      color: getColor('textPrimary', darkMode),
                      marginBottom: '1.5rem',
                      fontStyle: 'italic',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {testimonial.quote}
                    </p>
                    
                    {/* Person Info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      paddingTop: showDetails ? '1rem' : '0',
                      borderTop: showDetails ? '1px solid var(--border-color)' : 'none',
                      opacity: showDetails ? 1 : 0,
                      maxHeight: showDetails ? '200px' : '0',
                      overflow: 'hidden',
                      pointerEvents: showDetails ? 'auto' : 'none',
                      transition: 'all 0.4s ease',
                    }}>
                      {testimonial.image && (
                        <ImageWithSkeleton
                          src={testimonial.image}
                          alt={testimonial.name}
                          loading="lazy"
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid rgba(44, 82, 130, 0.2)',
                            animation: 'fadeInScale 0.4s ease'
                          }}
                        />
                      )}
                      <div style={{
                        animation: showDetails ? 'fadeInScale 0.4s ease 0.1s forwards' : 'none',
                        opacity: showDetails ? 1 : 0
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '1.05rem',
                          color: getColor('accentDarkBlue', darkMode),
                          fontWeight: 700
                        }}>
                          {testimonial.name}
                        </h4>
                        <p style={{
                          margin: '0.25rem 0 0 0',
                          fontSize: '0.9rem',
                          color: getColor('accentDarkBlue', darkMode)
                        }}>
                          {testimonial.title}
                        </p>
                        {testimonial.company && (
                          <p style={{
                            margin: '0.15rem 0 0 0',
                            fontSize: '0.85rem',
                            color: getColor('accentDarkBlue', darkMode)
                          }}>
                            {testimonial.company}
                          </p>
                        )}
                      </div>
                    </div>
                    </div>
                  </FadeInItem>
                  );
                })}
              </div>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <a
                  href="https://www.linkedin.com/in/ayush-ghosh/details/recommendations/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => Analytics.trackExternalLink('https://www.linkedin.com/in/ayush-ghosh/details/recommendations/', 'All LinkedIn Recommendations')}
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.2rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(44, 82, 130, 0.25)',
                    textDecoration: 'none',
                    color: getColor('accentDarkBlue', darkMode),
                    fontWeight: 700
                  }}
                >
                  View All LinkedIn Recommendations
                </a>
              </div>
            </div>
          </section>
        );
      }

      // ============================================
      // PERSPECTIVES SECTION
      // ============================================
      function PerspectivesSection({ darkMode = false }) {
        const insights = [
          {
            icon: 'lightbulb',
            title: 'Beyond the Hype: Prioritizing High-ROI Use Cases for Generative AI',
            excerpt: 'A strategic framework for product leaders to evaluate and prioritize generative AI initiatives that deliver measurable business value, not just technical novelty.',
            color: '#2c5282'
          },
          {
            icon: 'handshake',
            title: 'Bridging the Gap: How Product Leaders Can Effectively Manage ML Engineering Teams',
            excerpt: 'Leadership principles for aligning ML engineering execution with product vision, fostering collaboration between research and production, and setting realistic expectations with stakeholders.',
            color: '#5a67d8'
          },
          {
            icon: 'rocket',
            title: 'The Future of RAG: Moving from Simple Retrieval to Contextual Intelligence',
            excerpt: 'Exploring the evolution of retrieval-augmented generation systems from basic keyword search to sophisticated contextual reasoning—and what it means for enterprise AI applications.',
            color: '#4a5568'
          }
        ];

        return (
          <section id="perspectives" style={{ padding: '8rem 2rem', background: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ 
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', 
                  fontWeight: 800, 
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, #2c5282, #5a67d8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Perspectives on AI & Product
                </h2>
                <p style={{ fontSize: '1.2rem', color: getColor('textSecondary', darkMode), maxWidth: '700px', margin: '0 auto' }}>
                  Thought leadership on building AI products that drive real business outcomes
                </p>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '2.5rem' 
              }}>
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '2.5rem',
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                      borderRadius: '16px',
                      border: '1px solid rgba(44, 82, 130, 0.1)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(44, 82, 130, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '4px',
                      background: `linear-gradient(90deg, ${insight.color}, ${insight.color}88)`
                    }} />
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.5rem',
                      width: '60px',
                      height: '60px',
                      margin: '0 auto 1.5rem',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${insight.color}15, ${insight.color}05)`,
                      border: `2px solid ${insight.color}30`
                    }}>
                      <LucideIcon name={insight.icon} size={28} color={insight.color} />
                    </div>
                    <h3 style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: 700, 
                      marginBottom: '1rem',
                      color: getColor('textPrimary', darkMode),
                      lineHeight: 1.3
                    }}>
                      {insight.title}
                    </h3>
                    <p style={{ 
                      color: getColor('textSecondary', darkMode), 
                      fontSize: '1rem',
                      lineHeight: 1.7,
                      marginBottom: '1.5rem'
                    }}>
                      {insight.excerpt}
                    </p>
                    <div style={{
                      color: insight.color,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      Read More →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      // ============================================
      // PROJECTS SECTION
      // ============================================
      function ProjectsSection({ projects, caseStudies, darkMode }) {
        const [activeCardId, setActiveCardId] = useState(null);

        const mergedItems = [
          ...(projects || []).map((item) => ({
            ...item,
            type: item.title === 'Personalised Loyalty Model' ? 'Publication' : 'Project',
            oneLiner: item.description,
            details: item.description
          })),
          ...(caseStudies || []).map((item) => ({
            ...item,
            type: 'Case Study',
            description: item.summary || item.problem || '',
            oneLiner: item.summary || item.problem || '',
            sections: [
              item.problem ? { label: 'Problem', text: item.problem } : null,
              Array.isArray(item.strategy) && item.strategy.length ? { label: 'Strategy', bullets: item.strategy } : null,
              Array.isArray(item.execution) && item.execution.length ? { label: 'Execution', bullets: item.execution } : null,
              Array.isArray(item.outcome) && item.outcome.length ? { label: 'Outcome', bullets: item.outcome } : null
            ].filter(Boolean)
          }))
        ];

        return (
          <section id="projects" className="section-bg-mesh alt" style={{ 
            padding: '8rem 2rem', 
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <SectionHeader 
                title="Projects &"
                highlight="Case Studies"
                subtitle="Selected projects, publication, and product case studies"
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
                {mergedItems.map((item, index) => {
                  const isExpanded = activeCardId === item.id;
                  const typeColor = item.type === 'Case Study'
                    ? getColor('accentMediumBlue', darkMode)
                    : item.type === 'Publication'
                      ? getColor('accentDarkBlue', darkMode)
                      : getColor('accentBlue', darkMode);

                  return (
                    <FadeInItem key={item.id || index} delay={index * 0.1}>
                      <div 
                        className="interactive-card project-card fade-on-scroll glass-card"
                        onMouseEnter={() => setActiveCardId(item.id)}
                        onMouseLeave={() => setActiveCardId(null)}
                        onClick={() => setActiveCardId(prev => (prev === item.id ? null : item.id))}
                        style={{
                          borderRadius: '16px',
                          overflow: 'hidden',
                          boxShadow: '0 4px 20px var(--card-shadow)',
                          border: `1px solid var(--border-color)`,
                          cursor: 'pointer'
                        }}
                      >
                        <div className="card-content">
                        {item.image && (
                      <div className="image-zoom-container" style={{
                        width: '100%',
                        height: '220px',
                        position: 'relative'
                      }}>
                        <ProjectCardImage
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          className="image-zoom"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <div className="image-zoom-overlay">
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>View Details</span>
                        </div>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
                          pointerEvents: 'none'
                        }} />
                      </div>
                    )}
                    <div style={{ padding: '2rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        marginBottom: '0.75rem',
                        padding: '0.28rem 0.62rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        borderRadius: '999px',
                        border: `1px solid ${typeColor}55`,
                        color: typeColor,
                        background: `${typeColor}15`
                      }}>
                        {item.type}
                      </span>
                      <h3 style={{ 
                        fontSize: '1.4rem', 
                        marginBottom: item.type === 'Case Study' ? '0.35rem' : '1rem',
                        color: 'var(--text-primary)',
                        fontWeight: 700
                      }}>
                        {item.title}
                      </h3>
                      {item.type === 'Case Study' && item.company && (
                        <p style={{
                          margin: '0 0 0.75rem',
                          color: 'var(--text-tertiary)',
                          fontSize: '0.85rem'
                        }}>
                          {item.company} {item.timeline ? `| ${item.timeline}` : ''}
                        </p>
                      )}
                      {item.type === 'Case Study' ? (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <p style={{ 
                            color: 'var(--text-secondary)', 
                            lineHeight: '1.7',
                            marginBottom: isExpanded ? '1rem' : 0,
                            fontSize: '0.95rem',
                            whiteSpace: isExpanded ? 'normal' : 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.oneLiner}
                          </p>
                          <div style={{
                            maxHeight: isExpanded ? '1000px' : '0',
                            opacity: isExpanded ? 1 : 0,
                            overflow: 'hidden',
                            transition: 'max-height 0.35s ease, opacity 0.25s ease'
                          }}>
                            {(item.sections || []).map((section, sectionIndex) => (
                              <div key={`${item.id}-section-${sectionIndex}`} style={{ marginTop: sectionIndex === 0 ? 0 : '0.85rem' }}>
                                <p style={{
                                  margin: 0,
                                  fontSize: '0.86rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.02em',
                                  color: getColor('accentDarkBlue', darkMode)
                                }}>
                                  {section.label}
                                </p>
                                {section.text && (
                                  <p style={{
                                    margin: '0.25rem 0 0',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.92rem',
                                    lineHeight: 1.6
                                  }}>
                                    {section.text}
                                  </p>
                                )}
                                {Array.isArray(section.bullets) && section.bullets.length > 0 && (
                                  <ul style={{
                                    margin: '0.35rem 0 0',
                                    paddingLeft: '1rem',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.92rem',
                                    lineHeight: 1.55
                                  }}>
                                    {section.bullets.map((bullet, bulletIndex) => (
                                      <li key={`${item.id}-${section.label}-${bulletIndex}`}>{bullet}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p style={{ 
                          color: 'var(--text-secondary)', 
                          lineHeight: '1.7',
                          marginBottom: '1.5rem',
                          fontSize: '0.95rem',
                          opacity: 1
                        }}>
                          {isExpanded ? item.details : item.oneLiner}
                        </p>
                      )}
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '0.5rem',
                        marginBottom: item.tags?.length ? '1.5rem' : '0'
                      }}>
                        {item.tags?.map((tag, i) => (
                          <span key={i} className={`skill-badge fade-on-scroll`} style={{
                            padding: '0.4rem 0.9rem',
                            background: 'var(--accent-light)',
                            color: getColor('accentBlue', darkMode),
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            border: '1px solid rgba(74, 144, 226, 0.2)'
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      {item.link && (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            Analytics.trackExternalLink(item.link, item.title);
                          }}
                          className="btn-ripple cta-animate is-visible"
                          style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #2c5282, #5a67d8)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.3s',
                            boxShadow: '0 4px 12px rgba(44, 82, 130, 0.3)',
                            opacity: 1,
                            transform: 'scale(1)',
                            pointerEvents: 'auto'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(44, 82, 130, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(44, 82, 130, 0.3)';
                          }}
                        >
                          View Details →
                        </a>
                      )}
                      </div>
                    </div>
                  </div>
                    </FadeInItem>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }

      // ============================================
      // CONTACT SECTION
      // ============================================
      function ContactSection({ personal, social }) {
        return (
          <section id="contact" className="section-bg-mesh alt" style={{ 
            padding: '8rem 2rem', 
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-200px',
              right: '-200px',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74,144,226,0.15), transparent)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-150px',
              left: '-150px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(155,89,182,0.15), transparent)',
              pointerEvents: 'none'
            }} />
            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
              <h2 style={{ 
                fontSize: 'clamp(2rem, 4vw, 3rem)', 
                marginBottom: '1rem',
                fontWeight: 800
              }}>
                Get In <span style={{
                  background: 'linear-gradient(135deg, #4a90e2, #9b59b6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>Touch</span>
              </h2>
              <p style={{ 
                fontSize: '1.15rem', 
                marginBottom: '3rem',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: '1.7',
                maxWidth: '600px',
                margin: '0 auto 3rem'
              }}>
                Have a project in mind or want to collaborate? Let's connect and build something amazing together!
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                marginBottom: '2.5rem'
              }}>
                <a 
                  href="https://calendly.com/ayushghosh990/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => Analytics.trackExternalLink('https://calendly.com/ayushghosh990/30min', 'Book a coffee chat')}
                  className="btn-ripple"
                  style={{
                    padding: '1rem 2.5rem',
                    background: 'linear-gradient(135deg, #4a90e2, #9b59b6)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    transition: 'all 0.3s',
                    boxShadow: '0 8px 20px rgba(74, 144, 226, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(74, 144, 226, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(74, 144, 226, 0.4)';
                  }}
                >
                  <LucideIcon name="calendar" size={20} color="white" />
                  Book a coffee chat
                </a>
                <a 
                  href={`mailto:${personal?.email || ''}`}
                  onClick={() => Analytics.trackClick('Email Me', 'contact-button')}
                  className="btn-ripple"
                  style={{
                    padding: '1rem 2.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    transition: 'all 0.3s',
                    border: '2px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <LucideIcon name="mail" size={20} color="white" />
                  Email Me
                </a>
                <a 
                  href={social?.find(s => s.name === 'LinkedIn')?.url || 'https://www.linkedin.com/in/ayush-ghosh/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => Analytics.trackExternalLink(social?.find(s => s.name === 'LinkedIn')?.url || 'https://www.linkedin.com/in/ayush-ghosh/', 'LinkedIn')}
                  className="btn-ripple"
                  style={{
                    padding: '1rem 2.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    transition: 'all 0.3s',
                    border: '2px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <LucideIcon name="linkedin" size={20} color="white" />
                  LinkedIn
                </a>
              </div>
            </div>
          </section>
        );
      }

      // ============================================
      // FOOTER
      // ============================================
      function Footer({ data, social }) {
        const getIconForLink = (name) => {
          const nameLower = name.toLowerCase();
          if (nameLower.includes('linkedin')) return 'linkedin';
          if (nameLower.includes('github')) return 'github';
          if (nameLower.includes('scholar') || nameLower.includes('google')) return 'book';
          return 'link';
        };

        return (
          <footer style={{ 
            padding: '3rem 2rem', 
            background: '#1a1a1a', 
            color: 'white', 
            textAlign: 'center' 
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>{data.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                {social?.map(link => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => Analytics.trackExternalLink(link.url, link.name)}
                    title={link.name}
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      textDecoration: 'none',
                      transition: 'all 0.3s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#4a90e2';
                      e.currentTarget.style.background = 'rgba(74,144,226,0.1)';
                      e.currentTarget.style.borderColor = '#4a90e2';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <LucideIcon name={getIconForLink(link.name)} size={20} color="currentColor" />
                  </a>
                ))}
              </div>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              © {new Date().getFullYear()} {data.name}. All rights reserved.
            </p>
          </footer>
        );
      }

      // ============================================
      // RENDER APP
      // ============================================
const root = createRoot(document.getElementById('root'));
root.render(<PortfolioApp />);
