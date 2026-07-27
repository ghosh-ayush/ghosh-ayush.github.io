import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import PortfolioApp from './App.jsx';

const container = document.getElementById('root');

// The production build ships prerendered markup, so hydrate it rather than
// throwing it away. `npm run dev` serves an empty shell, so mount normally.
if (container.hasChildNodes()) {
  hydrateRoot(container, <PortfolioApp />);
} else {
  createRoot(container).render(<PortfolioApp />);
}
