import { createUser, login } from '../../lib/state.js';

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

class ViewAuth extends HTMLElement{
  async connectedCallback(){
    await this.render('login');
  }
  async render(mode){
    this.mode = mode;
    const isRegister = mode === 'register';
    
    const template = await loadTemplate('/src/components/view-auth/view-auth.html');
    this.innerHTML = renderTemplate(template, {
      title: isRegister ? 'Inscription' : 'Connexion',
      isRegister,
      submitText: isRegister ? 'Créer un compte' : 'Se connecter',
      toggleText: isRegister ? 'Déjà inscrit ?' : 'Pas de compte ?',
      toggleLinkText: isRegister ? 'Se connecter' : 'Créer un compte'
    });

    this.querySelector('#toggle').addEventListener('click', (e)=>{ 
      e.preventDefault(); 
      this.render(mode==='login'?'register':'login'); 
    });

    this.querySelector('#authForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const email = String(form.get('email')||'').trim().toLowerCase();
      const password = String(form.get('password')||'').trim();
      const msg = this.querySelector('#msg');
      msg.textContent = '';
      
      try{
        if(this.mode==='register'){
          // Mode inscription : récupère aussi prénom et nom
          const firstName = String(form.get('firstName')||'').trim();
          const lastName = String(form.get('lastName')||'').trim();
          await createUser({ email, password, firstName, lastName });
          location.hash = '#dashboard';
        } else {
          // Mode connexion
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
