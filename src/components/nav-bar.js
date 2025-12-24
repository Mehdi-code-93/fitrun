import state, { logout, subscribe } from '../lib/state.js';

class NavBar extends HTMLElement{
  constructor(){
    super();
    this.unsubscribe = () => {};
    this.handleNavigate = this.handleNavigate.bind(this);
  }
  connectedCallback(){
    this.render();
    this.unsubscribe = subscribe(() => this.render());
    window.addEventListener('app:navigate', this.handleNavigate);
  }
  disconnectedCallback(){
    this.unsubscribe();
    window.removeEventListener('app:navigate', this.handleNavigate);
  }
  handleNavigate(){ this.render(); }

  render(){
    const session = state.session;
    const route = location.hash.replace('#','') || 'dashboard';
    const link = (hash, label) => `<a href="#${hash}" class="${route===hash?'active':''}">${label}</a>`;

    this.innerHTML = `
      <nav class="nav">
        <div class="brand"><span class="logo"></span> <span>FitDash</span></div>
        <div style="display:flex;gap:6px;align-items:center;">
          ${session ? `
            ${link('dashboard','Tableau de bord')}
            ${link('training','Entraînements')}
            ${link('goals','Objectifs')}
          ` : ''}
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          ${session ? `
            <span class="badge">${session.email}</span>
            <button class="ghost" id="logoutBtn">Déconnexion</button>
          ` : `
            ${link('auth','Connexion')}
          `}
        </div>
      </nav>
    `;

    const btn = this.querySelector('#logoutBtn');
    if(btn){
      btn.addEventListener('click', () => { logout(); location.hash = '#auth'; });
    }
  }
}

customElements.define('nav-bar', NavBar);
