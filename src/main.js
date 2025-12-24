import './components/app-root.js';
import './components/nav-bar.js';
import './components/view-auth.js';
import './components/view-training.js';
import './components/view-dashboard.js';
import './components/view-goals.js';
import state, { ensureSeed } from './lib/state.js';

ensureSeed();

// Simple client-side routing using hash
window.addEventListener('hashchange', () => window.dispatchEvent(new Event('app:navigate')));

// Expose state for debugging
window.__fitdash_state = state;
