import state, { subscribe, getUserTrainings } from '../lib/state.js';
import { getMetByCategory } from '../lib/constants.js';

function kcalFor(row, weightKg){
  const met = getMetByCategory(row.category);
  return met * weightKg * (row.durationMin/60);
}

class ViewGoals extends HTMLElement{
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
    const goals = state.goals; 
    const params = state.userParams;
    const rows = getUserTrainings();
    
    // Calcul des statistiques de la semaine
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weekRows = rows.filter(r => new Date(r.date) >= monday);
    const currentSessions = weekRows.length;
    const currentCalories = weekRows.reduce((s, r) => s + kcalFor(r, params.weightKg), 0);
    
    const sessionsReached = goals.weeklySessions > 0 && currentSessions >= goals.weeklySessions;
    const caloriesReached = goals.weeklyCalories > 0 && currentCalories >= goals.weeklyCalories;
    
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
          <h2>Statut des objectifs</h2>
          <div style="display:flex;flex-direction:column;gap:16px;padding:16px 0">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-weight:600">Séances</span>
                <span style="font-size:1.25rem;font-weight:700">${currentSessions} / ${goals.weeklySessions}</span>
              </div>
              <div style="background:var(--bg);height:8px;border-radius:4px;overflow:hidden;margin-bottom:4px">
                <div style="background:${sessionsReached ? '#22c55e' : '#4f8cff'};height:100%;width:${goals.weeklySessions > 0 ? Math.min(100, (currentSessions / goals.weeklySessions) * 100) : 0}%;transition:width 0.3s"></div>
              </div>
              ${sessionsReached ? '<div style="color:#22c55e;font-size:0.875rem">Objectif atteint !</div>' : goals.weeklySessions > 0 ? `<div style="color:var(--muted);font-size:0.875rem">Il reste ${goals.weeklySessions - currentSessions} séance${goals.weeklySessions - currentSessions > 1 ? 's' : ''} à réaliser</div>` : '<div style="color:var(--muted);font-size:0.875rem">Aucun objectif défini</div>'}
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-weight:600">Calories</span>
                <span style="font-size:1.25rem;font-weight:700">${Math.round(currentCalories)} / ${goals.weeklyCalories} kcal</span>
              </div>
              <div style="background:var(--bg);height:8px;border-radius:4px;overflow:hidden;margin-bottom:4px">
                <div style="background:${caloriesReached ? '#22c55e' : '#f59e0b'};height:100%;width:${goals.weeklyCalories > 0 ? Math.min(100, (currentCalories / goals.weeklyCalories) * 100) : 0}%;transition:width 0.3s"></div>
              </div>
              ${caloriesReached ? '<div style="color:#22c55e;font-size:0.875rem">Objectif atteint !</div>' : goals.weeklyCalories > 0 ? `<div style="color:var(--muted);font-size:0.875rem">Il reste ${Math.round(goals.weeklyCalories - currentCalories)} kcal à brûler</div>` : '<div style="color:var(--muted);font-size:0.875rem">Aucun objectif défini</div>'}
            </div>
          </div>
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
