import { createUser, login } from '../lib/state.js';

class ViewAuth extends HTMLElement{
  connectedCallback(){
    this.render('login');
  }
  render(mode){
    this.mode = mode;
    this.innerHTML = `
      <div class="grid two">
        <section class="card">
          <h2>${mode==='login'?'Connexion':'Inscription'}</h2>
          <form id="authForm" class="grid" style="gap:12px">
            ${mode==='register' ? `
            <div>
              <label>Prénom</label>
              <input type="text" name="firstName" required placeholder="Jean"/>
            </div>
            <div>
              <label>Nom</label>
              <input type="text" name="lastName" required placeholder="Dupont"/>
            </div>
            ` : ''}
            <div>
              <label>Email</label>
              <input type="email" name="email" required placeholder="email@example.com"/>
            </div>
            <div>
              <label>Mot de passe</label>
              <input type="password" name="password" required minlength="4"/>
            </div>
            <button type="submit">${mode==='login'?'Se connecter':'Créer un compte'}</button>
          </form>
          <div style="margin-top:10px;color:var(--muted)">
            ${mode==='login'?'Pas de compte ?':'Déjà inscrit ?'}
            <a href="#" id="toggle">${mode==='login'?'Créer un compte':'Se connecter'}</a>
          </div>
          <div id="msg" style="margin-top:10px"></div>
        </section>
        <section class="card">
          <h3>À propos</h3>
          <p>Version statique sans base de données. Les données sont stockées dans votre navigateur.</p>
        </section>
      </div>
    `;

    this.querySelector('#toggle').addEventListener('click', (e)=>{ e.preventDefault(); this.render(mode==='login'?'register':'login'); });

    this.querySelector('#authForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const email = String(form.get('email')||'').trim().toLowerCase();
      const password = String(form.get('password')||'').trim();
      const msg = this.querySelector('#msg');
      msg.textContent = '';
      try{
        if(this.mode==='register'){
          const firstName = String(form.get('firstName')||'').trim();
          const lastName = String(form.get('lastName')||'').trim();
          await createUser({ email, password, firstName, lastName });
          location.hash = '#dashboard';
        } else {
          await login({ email, password });
          location.hash = '#dashboard';
        }
      }catch(err){
        msg.className = 'alert';
        msg.textContent = err.message || 'Erreur';
      }
    });
  }
}

customElements.define('view-auth', ViewAuth);
