import state, { subscribe, getUserTrainings } from '../../lib/state.js';
import { getMetByCategory } from '../../lib/constants.js';

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

function kcalFor(row, weightKg){
  const met = getMetByCategory(row.category);
  return met * weightKg * (row.durationMin/60);
}

function renderGoalsStatus(goals, currentSessions, currentCalories){
  const sessionsReached = goals.weeklySessions > 0 && currentSessions >= goals.weeklySessions;
  const caloriesReached = goals.weeklyCalories > 0 && currentCalories >= goals.weeklyCalories;
  
  const sessionsProgress = goals.weeklySessions > 0 ? Math.min(100, (currentSessions / goals.weeklySessions) * 100) : 0;
  const caloriesProgress = goals.weeklyCalories > 0 ? Math.min(100, (currentCalories / goals.weeklyCalories) * 100) : 0;
  
  const sessionsMessage = sessionsReached 
    ? '<div style="color:#22c55e;font-size:0.875rem">Objectif atteint !</div>' 
    : goals.weeklySessions > 0 
      ? `<div style="color:var(--muted);font-size:0.875rem">Il reste ${goals.weeklySessions - currentSessions} séance${goals.weeklySessions - currentSessions > 1 ? 's' : ''} à réaliser</div>` 
      : '<div style="color:var(--muted);font-size:0.875rem">Aucun objectif défini</div>';
  
  const caloriesMessage = caloriesReached 
    ? '<div style="color:#22c55e;font-size:0.875rem">Objectif atteint !</div>' 
    : goals.weeklyCalories > 0 
      ? `<div style="color:var(--muted);font-size:0.875rem">Il reste ${Math.round(goals.weeklyCalories - currentCalories)} kcal à brûler</div>` 
      : '<div style="color:var(--muted);font-size:0.875rem">Aucun objectif défini</div>';
  
  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600">Séances</span>
        <span style="font-size:1.25rem;font-weight:700">${currentSessions} / ${goals.weeklySessions}</span>
      </div>
      <div style="background:var(--bg);height:8px;border-radius:4px;overflow:hidden;margin-bottom:4px">
        <div style="background:${sessionsReached ? '#22c55e' : '#4f8cff'};height:100%;width:${sessionsProgress}%;transition:width 0.3s"></div>
      </div>
      ${sessionsMessage}
    </div>
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600">Calories</span>
        <span style="font-size:1.25rem;font-weight:700">${Math.round(currentCalories)} / ${goals.weeklyCalories} kcal</span>
      </div>
      <div style="background:var(--bg);height:8px;border-radius:4px;overflow:hidden;margin-bottom:4px">
        <div style="background:${caloriesReached ? '#22c55e' : '#f59e0b'};height:100%;width:${caloriesProgress}%;transition:width 0.3s"></div>
      </div>
      ${caloriesMessage}
    </div>
  `;
}

class ViewGoals extends HTMLElement{
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
    
    const goalsStatusContent = renderGoalsStatus(goals, currentSessions, currentCalories);
    
    const template = await loadTemplate('/src/components/view-goals/view-goals.html');
    this.innerHTML = renderTemplate(template, {
      weeklySessions: goals.weeklySessions,
      weeklyCalories: goals.weeklyCalories,
      goalsStatusContent,
      weightKg: params.weightKg,
      heightCm: params.heightCm,
      age: params.age
    });

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
