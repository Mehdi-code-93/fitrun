import state, { addTraining, updateTraining, deleteTraining, getUserTrainings, subscribe } from '../lib/state.js';
import { CATEGORIES } from '../lib/constants.js';

class ViewTraining extends HTMLElement{
  constructor(){ super(); this.unsubscribe = () => {}; this.editId = null; this.categoryFilter = 'all'; }
  connectedCallback(){ this.render(); this.unsubscribe = subscribe(()=> this.renderList()); }
  disconnectedCallback(){ this.unsubscribe(); }

  render(){
    this.innerHTML = `
      <div class="grid two">
        <section class="card">
          <h2>Ajouter / modifier une séance</h2>
          <form id="trainingForm" class="grid two" style="gap:12px">
            <div>
              <label>Catégorie</label>
              <select name="category" required>
                ${CATEGORIES.map(c=>`<option value="${c.id}">${c.label}</option>`).join('')}
              </select>
            </div>
            <div>
              <label>Type</label>
              <input name="type" placeholder="ex: Fractionné, Bench press" required />
            </div>
            <div>
              <label>Durée (min)</label>
              <input type="number" name="duration" min="1" required />
            </div>
            <div>
              <label>Date</label>
              <input type="date" name="date" required />
            </div>
            <div class="grid" style="grid-column:1/-1">
              <label>Commentaire</label>
              <textarea name="note" rows="3" placeholder="Notes"></textarea>
            </div>
            <div style="grid-column:1/-1;display:flex;gap:8px">
              <button type="submit">Enregistrer</button>
              <button type="button" class="secondary" id="resetBtn">Réinitialiser</button>
            </div>
          </form>
        </section>
        <section class="card">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <h2>Historique</h2>
            <select id="filterCat">
              <option value="all">Toutes catégories</option>
              ${CATEGORIES.map(c=>`<option value="${c.id}">${c.label}</option>`).join('')}
            </select>
          </div>
          <div id="listWrap"></div>
        </section>
      </div>
    `;

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
