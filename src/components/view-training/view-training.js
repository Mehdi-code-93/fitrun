import state, { addTraining, updateTraining, deleteTraining, getUserTrainings, subscribe } from '../../lib/state.js';
import { CATEGORIES } from '../../lib/constants.js';

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

class ViewTraining extends HTMLElement{
  constructor(){ super(); this.unsubscribe = () => {}; this.editId = null; this.categoryFilter = 'all'; }
  async connectedCallback(){ await this.render(); this.unsubscribe = subscribe(()=> this.renderList()); }
  disconnectedCallback(){ this.unsubscribe(); }

  async render(){
    const categoryOptions = CATEGORIES.map(c=>`<option value="${c.id}">${c.label}</option>`).join('');
    const template = await loadTemplate('/src/components/view-training/view-training.html');
    this.innerHTML = renderTemplate(template, {
      categoryOptions
    });

    const form = this.querySelector('#trainingForm');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const session = state.session; if(!session) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        userId: session.userId,
        category: data.category,
        type: data.type.trim(),
        durationMin: Number(data.duration),
        date: data.date,
        note: (data.note||'').trim()
      };
      if(this.editId){ updateTraining(this.editId, payload); this.editId = null; }
      else { addTraining(payload); }
      form.reset();
      this.renderList();
    });
    this.querySelector('#resetBtn').addEventListener('click', ()=>{ this.editId=null; form.reset(); });
    this.querySelector('#filterCat').addEventListener('change', (e)=>{ this.categoryFilter = e.target.value; this.renderList(); });

    this.renderList();
  }

  renderList(){
    const wrap = this.querySelector('#listWrap'); if(!wrap) return;
    let rows = getUserTrainings().sort((a,b)=> b.date.localeCompare(a.date));
    if(this.categoryFilter !== 'all') rows = rows.filter(r => r.category === this.categoryFilter);

    if(rows.length===0){ wrap.innerHTML = `<div class="empty">Aucune séance</div>`; return; }

    wrap.innerHTML = `
      <table class="table">
        <thead><tr>
          <th>Date</th><th>Catégorie</th><th>Type</th><th>Durée</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${r.date}</td>
              <td>${CATEGORIES.find(c=>c.id===r.category)?.label||r.category}</td>
              <td>${r.type}</td>
              <td>${r.durationMin} min</td>
              <td>
                <button class="ghost" data-action="edit" data-id="${r.id}">Modifier</button>
                <button class="ghost" data-action="del" data-id="${r.id}">Supprimer</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    wrap.querySelectorAll('button[data-action]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const id = e.currentTarget.dataset.id;
        const action = e.currentTarget.dataset.action;
        if(action==='del'){ deleteTraining(id); this.renderList(); return; }
        if(action==='edit'){
          const t = getUserTrainings().find(x=>x.id===id); if(!t) return;
          const form = this.querySelector('#trainingForm');
          form.category.value = t.category;
          form.type.value = t.type;
          form.duration.value = t.durationMin;
          form.date.value = t.date;
          form.note.value = t.note || '';
          this.editId = id;
        }
      });
    });
  }
}

customElements.define('view-training', ViewTraining);
