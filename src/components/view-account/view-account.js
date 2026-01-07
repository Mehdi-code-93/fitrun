import state, { updateEmail, updatePassword, subscribe } from '../../lib/state.js';

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

class ViewAccount extends HTMLElement{
  constructor(){
    super();
    this.unsubscribe = () => {};
  }
  async connectedCallback(){ 
    await this.render(); 
    this.unsubscribe = subscribe(() => this.render());
  }
  disconnectedCallback(){ 
    this.unsubscribe(); 
  }

  async render(){
    const session = state.session;
    const template = await loadTemplate('/src/components/view-account/view-account.html');
    this.innerHTML = renderTemplate(template, {
      email: session?.email || ''
    });

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

