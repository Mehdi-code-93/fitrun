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
    const userParams = state.userParams;
    const route = location.hash.replace('#','') || 'dashboard';
    const link = (hash, label) => `<a href="#${hash}" class="${route===hash?'active':''}">${label}</a>`;
    const displayName = userParams?.firstName || 'Utilisateur';

    this.innerHTML = `
      <nav class="nav">
        <div class="brand"><span>FitRun</span></div>
        <div style="display:flex;gap:8px;align-items:center;">
        ${session ? `
          ${link('dashboard','Tableau de bord')}
          ${link('training','Entraînements')}
          ${link('goals','Objectifs')}
        ` : ''}
          ${session ? `
            <a href="#account" class="badge" style="text-decoration:none;cursor:pointer">${displayName}</a>
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
