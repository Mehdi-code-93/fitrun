import state, { subscribe } from '../../lib/state.js';

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

class AppRoot extends HTMLElement{
  constructor(){
    super();
    this.handleNavigate = this.handleNavigate.bind(this);
    this.unsubscribe = () => {};
  }
  async connectedCallback(){
    const template = await loadTemplate('/src/components/app-root/app-root.html');
    this.innerHTML = template;
    window.addEventListener('app:navigate', this.handleNavigate);
    this.unsubscribe = subscribe(() => this.handleNavigate());
    this.handleNavigate();
  }
  disconnectedCallback(){
    window.removeEventListener('app:navigate', this.handleNavigate);
    this.unsubscribe();
  }
  handleNavigate(){
    const session = state.session;
    const route = location.hash.replace('#','');
    const outlet = this.querySelector('#outlet');

    if(!session && route !== 'auth'){
      location.hash = '#auth';
      return;
    }

    if(session && (route === 'auth' || !route)){
      location.hash = '#dashboard';
      return;
    }

    let viewTag = 'view-dashboard';
    if(route === 'auth') viewTag = 'view-auth';
    else if(route === 'training') viewTag = 'view-training';
    else if(route === 'goals') viewTag = 'view-goals';
    else if(route === 'account') viewTag = 'view-account';
    
    if(outlet){
      outlet.innerHTML = `<${viewTag}></${viewTag}>`;
    }
  }
}

customElements.define('app-root', AppRoot);
