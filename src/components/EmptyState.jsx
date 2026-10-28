import React from 'react';

export default function EmptyState({
  emoji,
  icon,
  title,
  message,
  action,
  compact = false,
  minHeight,
  className = '',
  style = {}
}) {
  return (
    <div
      className={`app-empty-state ${compact ? 'compact' : ''} ${className}`}
      style={{
        minHeight: minHeight || (compact ? '180px' : '230px'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? '20px 12px' : '28px 16px',
        textAlign: 'center',
        width: '100%',
        ...style
      }}
    >
      {emoji && (
        <span
          className="app-empty-emoji"
          role="img"
          aria-label={title || 'Empty state'}
          style={{
            display: 'block',
            marginBottom: compact ? '10px' : '14px',
            fontSize: compact ? '3.2rem' : '4.5rem',
            lineHeight: 1,
            userSelect: 'none'
          }}
        >
          {emoji}
        </span>
      )}
      {!emoji && icon && (
        <div
          className="app-empty-icon"
          style={{
            fontSize: compact ? '2.4rem' : '3.2rem',
            color: '#a0a3bd',
            marginBottom: compact ? '8px' : '12px'
          }}
        >
          <i className={`bi ${icon}`}></i>
        </div>
      )}
      {title && (
        <strong
          style={{
            display: 'block',
            fontSize: compact ? '1.15rem' : '1.35rem',
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: '6px'
          }}
        >
          {title}
        </strong>
      )}
      {message && (
        <p
          style={{
            maxWidth: compact ? '280px' : '320px',
            margin: '0 auto',
            fontSize: compact ? '0.85rem' : '0.9rem',
            lineHeight: 1.5
          }}
        >
          {message}
        </p>
      )}
      {action && (
        <div className="app-empty-action" style={{ marginTop: '16px' }}>
          {action}
        </div>
      )}
    </div>
  );
}
