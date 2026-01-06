import state, { updateEmail, updatePassword, subscribe } from '../lib/state.js';

class ViewAccount extends HTMLElement{
  constructor(){
    super();
    this.unsubscribe = () => {};
  }
  connectedCallback(){ 
    this.render(); 
    this.unsubscribe = subscribe(() => this.render());
  }
  disconnectedCallback(){ 
    this.unsubscribe(); 
  }

  render(){
    const session = state.session;
    this.innerHTML = `
      <div class="grid two">
        <section class="card">
          <h2>Compte</h2>
          <form id="accountForm" class="grid" style="gap:12px">
            <div>
              <label>Email</label>
              <input type="email" name="email" required value="${session?.email || ''}" />
            </div>
            <div style="grid-column:1/-1">
              <button type="submit">Mettre à jour l'email</button>
            </div>
            <div id="accountMsg" style="grid-column:1/-1"></div>
          </form>
        </section>
        <section class="card">
          <h2>Mot de passe</h2>
          <form id="passwordForm" class="grid" style="gap:12px">
            <div>
              <label>Nouveau mot de passe</label>
              <input type="password" name="password" required minlength="4" autocomplete="new-password" />
            </div>
            <div>
              <label>Confirmer le mot de passe</label>
              <input type="password" name="passwordConfirm" required minlength="4" autocomplete="new-password" />
            </div>
            <div style="grid-column:1/-1">
              <button type="submit">Changer le mot de passe</button>
            </div>
            <div id="passwordMsg" style="grid-column:1/-1"></div>
          </form>
        </section>
      </div>
    `;

    this.querySelector('#accountForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const form = e.currentTarget;
      const email = String(form.email.value).trim().toLowerCase();
      const msg = form.querySelector('#accountMsg');
      msg.textContent = '';
      msg.className = '';
      
      try {
        await updateEmail(email);
        msg.style.color = '#22c55e';
        msg.textContent = 'Email mis à jour avec succès !';
        setTimeout(() => { msg.textContent = ''; }, 3000);
      } catch(err) {
        msg.className = 'alert';
        msg.textContent = err.message || 'Erreur lors de la mise à jour de l\'email';
      }
    });

    this.querySelector('#passwordForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const form = e.currentTarget;
      const password = String(form.password.value).trim();
      const passwordConfirm = String(form.passwordConfirm.value).trim();
      const msg = form.querySelector('#passwordMsg');
      msg.textContent = '';
      msg.className = '';

      if(password !== passwordConfirm){
        msg.className = 'alert';
        msg.textContent = 'Les mots de passe ne correspondent pas';
        return;
      }

      if(password.length < 4){
        msg.className = 'alert';
        msg.textContent = 'Le mot de passe doit contenir au moins 4 caractères';
        return;
      }

      try {
        await updatePassword(password);
        msg.className = '';
        msg.style.color = '#22c55e';
        msg.textContent = 'Mot de passe changé avec succès !';
        form.reset();
        setTimeout(() => { msg.textContent = ''; }, 3000);
      } catch(err) {
        msg.className = 'alert';
        msg.textContent = err.message || 'Erreur lors du changement de mot de passe';
      }
    });
  }
}

customElements.define('view-account', ViewAccount);

