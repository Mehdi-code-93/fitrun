import state from '../lib/state.js';

class ViewGoals extends HTMLElement{
  connectedCallback(){ this.render(); }
  render(){
    const goals = state.goals; const params = state.userParams;
    this.innerHTML = `
      <div class="grid two">
        <section class="card">
          <h2>Objectifs hebdomadaires</h2>
          <form id="goalsForm" class="grid two" style="gap:12px">
            <div>
              <label>Séances</label>
              <input type="number" name="weeklySessions" min="0" value="${goals.weeklySessions}" />
            </div>
            <div>
              <label>Calories</label>
              <input type="number" name="weeklyCalories" min="0" value="${goals.weeklyCalories}" />
            </div>
            <div style="grid-column:1/-1">
              <button type="submit">Enregistrer les objectifs</button>
            </div>
          </form>
        </section>
        <section class="card">
          <h2>Paramètres utilisateur</h2>
          <form id="paramsForm" class="grid three" style="gap:12px">
            <div>
              <label>Poids (kg)</label>
              <input type="number" name="weightKg" min="1" value="${params.weightKg}" />
            </div>
            <div>
              <label>Taille (cm)</label>
              <input type="number" name="heightCm" min="1" value="${params.heightCm}" />
            </div>
            <div>
              <label>Âge</label>
              <input type="number" name="age" min="1" value="${params.age}" />
            </div>
            <div style="grid-column:1/-1">
              <button type="submit">Enregistrer les paramètres</button>
            </div>
          </form>
        </section>
      </div>
    `;

    this.querySelector('#goalsForm').addEventListener('submit', (e)=>{
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget).entries());
      state.goals = { weeklySessions: Number(d.weeklySessions||0), weeklyCalories: Number(d.weeklyCalories||0) };
    });
    this.querySelector('#paramsForm').addEventListener('submit', (e)=>{
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget).entries());
      state.userParams = { weightKg: Number(d.weightKg||0), heightCm: Number(d.heightCm||0), age: Number(d.age||0) };
    });
  }
}

customElements.define('view-goals', ViewGoals);
