import state from '../lib/state.js';

class AppRoot extends HTMLElement{
  constructor(){
    super();
    this.handleNavigate = this.handleNavigate.bind(this);
  }
  connectedCallback(){
    this.innerHTML = `
      <nav-bar></nav-bar>
      <main>
        <div id="outlet"></div>
        <div class="footer">Projet ESGI - Suivi d’activité - Version statique</div>
      </main>
    `;
    window.addEventListener('app:navigate', this.handleNavigate);
    this.handleNavigate();
  }
  disconnectedCallback(){
    window.removeEventListener('app:navigate', this.handleNavigate);
  }
  handleNavigate(){
    const session = state.session;
    const route = (location.hash.replace('#','') || 'dashboard');
    const outlet = this.querySelector('#outlet');

    if(!session && route !== 'auth'){
      location.hash = '#auth';
      return;
    }

    const viewTag = route === 'auth' ? 'view-auth' : route === 'training' ? 'view-training' : route === 'goals' ? 'view-goals' : 'view-dashboard';
    outlet.innerHTML = `<${viewTag}></${viewTag}>`;
  }
}

customElements.define('app-root', AppRoot);
