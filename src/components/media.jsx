import React from 'react';

export function ImageWithSkeleton({
  src,
  alt,
  style,
  className,
  loading = 'lazy',
  decoding = 'async',
  width,
  height,
  fallbackLabel = 'Image unavailable',
  ...rest
}) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const imgRef = React.useRef(null);

  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);

    const img = imgRef.current;
    if (!img) return;

    if (img.complete) {
      if (img.naturalWidth > 0) {
        setImageLoaded(true);
      } else {
        setImageError(true);
      }
    }
  }, [src]);

  if (!src || imageError) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackLabel}
        className={className}
        style={{
          position: 'relative',
          ...style,
          width: style?.width || width,
          height: style?.height || height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.14), rgba(44, 82, 130, 0.12))',
          color: 'var(--text-secondary)',
          fontSize: '0.78rem',
          fontWeight: 700,
          textAlign: 'center',
          padding: '0.35rem'
        }}
        {...rest}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', ...style }} {...rest}>
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
        decoding={decoding}
        width={width}
        height={height}
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

export function ProjectCardImage({
  src,
  alt,
  className,
  style,
  loading = 'lazy',
  decoding = 'async',
  width = 640,
  height = 360
}) {
  const [imageError, setImageError] = React.useState(false);

  if (!src || imageError) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '0.9rem',
          fontWeight: 600,
          background: 'linear-gradient(135deg, rgba(44,82,130,0.75), rgba(90,103,216,0.6))'
        }}
      >
        Preview unavailable
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      width={width}
      height={height}
      className={className}
      style={style}
      onError={() => setImageError(true)}
    />
  );
}
