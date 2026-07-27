import React from 'react';
import { renderToString } from 'react-dom/server';
import PortfolioApp from './App.jsx';

export function render() {
  return renderToString(<PortfolioApp />);
}
