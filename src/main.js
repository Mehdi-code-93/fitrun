import './components/app-root.js';
import './components/nav-bar.js';
import './components/view-auth.js';
import './components/view-training.js';
import './components/view-dashboard.js';
import './components/view-goals.js';
import './components/view-account.js';
import state, { ensureSeed } from './lib/state.js';

try {
	ensureSeed();
} catch (err) {
	console.error('Erreur d\'initialisation:', err);
	// Aide visuelle minimale en cas d\'erreur bloquante
	const el = document.createElement('div');
	el.style.cssText = 'position:fixed;top:10px;left:10px;background:#211315;color:#ffb4b4;padding:10px;border:1px solid #3b1a1f;border-radius:8px;z-index:9999';
	el.textContent = 'Erreur d\'initialisation: ' + (err?.message || String(err));
	document.body.appendChild(el);
}

window.addEventListener('hashchange', () => window.dispatchEvent(new Event('app:navigate')));

window.__fitdash_state = state;
