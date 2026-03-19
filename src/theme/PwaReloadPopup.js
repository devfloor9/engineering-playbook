import React from 'react';

export default function PwaReloadPopup({onReload}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        padding: '0.75rem 1.5rem',
        background: 'var(--ifm-color-primary)',
        color: 'white',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
      onClick={onReload}
    >
      New version available. Click to reload.
    </div>
  );
}
