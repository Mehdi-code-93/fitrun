import state, { logout, subscribe } from '../../lib/state.js';

const templateCache = new Map();

async function loadTemplate(path) {
  if (templateCache.has(path)) {
    return templateCache.get(path);
  }
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load template: ${path}`);
  const html = await response.text();
  templateCache.set(path, html);
  return html;
}

function renderTemplate(template, data = {}) {
  return template.replace(/<script type="text\/template">([\s\S]*?)<\/script>/g, (match, scriptContent) => {
    try {
      const dataKeys = Object.keys(data);
      const func = new Function('data', `
        const { ${dataKeys.join(', ')} } = data;
        let html = '';
        ${scriptContent}
        return html;
      `);
      return func(data);
    } catch (error) {
      console.error('Error executing template script:', error, scriptContent);
      return '';
    }
  });
}

class NavBar extends HTMLElement{
  constructor(){
    super();
    this.unsubscribe = () => {};
    this.handleNavigate = this.handleNavigate.bind(this);
  }
  async connectedCallback(){
    await this.render();
    this.unsubscribe = subscribe(() => this.render());
    window.addEventListener('app:navigate', this.handleNavigate);
  }
  disconnectedCallback(){
    this.unsubscribe();
    window.removeEventListener('app:navigate', this.handleNavigate);
  }
  handleNavigate(){ this.render(); }

  async render(){
    const session = state.session;
    const userParams = state.userParams;
    const route = location.hash.replace('#','') || 'dashboard';
    const displayName = userParams?.firstName || 'Utilisateur';

    const template = await loadTemplate('/src/components/nav-bar/nav-bar.html');
    this.innerHTML = renderTemplate(template, {
      session: !!session,
      displayName,
      dashboardActive: route === 'dashboard' ? 'active' : '',
      trainingActive: route === 'training' ? 'active' : '',
      goalsActive: route === 'goals' ? 'active' : '',
      authActive: route === 'auth' ? 'active' : ''
    });

    const btn = this.querySelector('#logoutBtn');
    if(btn){
      btn.addEventListener('click', () => { logout(); location.hash = '#auth'; });
    }
  }
}

customElements.define('nav-bar', NavBar);
