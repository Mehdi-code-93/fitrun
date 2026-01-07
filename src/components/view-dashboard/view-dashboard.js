import state, { subscribe, getUserTrainings } from '../../lib/state.js';
import { CATEGORIES, getMetByCategory } from '../../lib/constants.js';

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

function groupByCategory(rows){
  const map = new Map();
  for(const r of rows){ map.set(r.category, (map.get(r.category)||0) + 1); }
  return map;
}

function kcalFor(row, weightKg){
  const met = getMetByCategory(row.category);
  return met * weightKg * (row.durationMin/60);
}

function weeklyBuckets(rows){
  const weeks = [];
  const now = new Date();
  for(let i=7; i>=0; i--){
    const d = new Date(now); d.setDate(now.getDate() - i*7);
    const start = new Date(d); const day = (d.getDay()+6)%7;
    start.setDate(d.getDate()-day); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(start.getDate()+7);
    weeks.push({ start, end, kcal:0, minutes:0, label: `${start.getDate()}/${start.getMonth()+1}` });
  }
  for(const r of rows){
    const date = new Date(r.date);
    for(const w of weeks){
      if(date >= w.start && date < w.end){
        w.minutes += r.durationMin;
        w.kcal += kcalFor(r, state.userParams.weightKg);
        break;
      }
    }
  }
  return weeks;
}

class ViewDashboard extends HTMLElement{
  constructor(){ super(); this.unsubscribe = () => {}; this.pie = null; this.line = null; }
  async connectedCallback(){
    const template = await loadTemplate('/src/components/view-dashboard/view-dashboard.html');
    this.innerHTML = template;
    this.unsubscribe = subscribe(()=> this.update());
    this.update();
  }
  disconnectedCallback(){ this.unsubscribe(); if(this.pie){ this.pie.destroy(); } if(this.line){ this.line.destroy(); } }

  update(){
    const rows = getUserTrainings();
    const weightKg = state.userParams.weightKg;
    const now = new Date(); const monday = new Date(now); monday.setDate(now.getDate()-((now.getDay()+6)%7)); monday.setHours(0,0,0,0);
    const weekRows = rows.filter(r => new Date(r.date) >= monday);
    const totalMinutes = weekRows.reduce((s,r)=>s+r.durationMin,0);
    const totalKcal = weekRows.reduce((s,r)=> s + kcalFor(r, weightKg), 0);

    this.querySelector('#kpiSessions').textContent = String(weekRows.length);
    this.querySelector('#kpiMinutes').textContent = `${totalMinutes} min`;
    this.querySelector('#kpiCalories').textContent = `${Math.round(totalKcal)} kcal`;

    const goals = state.goals;
    const currentSessions = weekRows.length;
    const currentCalories = totalKcal;
    const sessionsReached = goals.weeklySessions > 0 && currentSessions >= goals.weeklySessions;
    const caloriesReached = goals.weeklyCalories > 0 && currentCalories >= goals.weeklyCalories;
    
    const goalsStatusWrap = this.querySelector('#goalsStatus');
    goalsStatusWrap.innerHTML = `
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
    `;

    const alerts = [];
    const today = now.getDay();
    const daysLeft = today === 0 ? 0 : 7 - today;
    
    // Alerte séances
    if (goals.weeklySessions > 0 && !sessionsReached) {
      const remaining = goals.weeklySessions - currentSessions;
      if (daysLeft === 0) {
        alerts.push({
          type: 'danger',
          message: `Objectif séances non atteint ! Il manque ${remaining} séance${remaining > 1 ? 's' : ''}.`
        });
      } else if (remaining > daysLeft) {
        alerts.push({
          type: 'warning',
          message: `Attention : ${remaining} séance${remaining > 1 ? 's' : ''} à faire en ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`
        });
      } else {
        alerts.push({
          type: 'info',
          message: `Plus que ${remaining} séance${remaining > 1 ? 's' : ''} pour atteindre votre objectif !`
        });
      }
    }
    
    // Alerte calories
    if (goals.weeklyCalories > 0 && !caloriesReached) {
      const remaining = Math.round(goals.weeklyCalories - currentCalories);
      if (daysLeft === 0) {
        alerts.push({
          type: 'danger',
          message: `Objectif calories non atteint ! Il manque ${remaining} kcal.`
        });
      } else if (remaining > 500 * daysLeft) {
        alerts.push({
          type: 'warning',
          message: `${remaining} kcal à brûler en ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`
        });
      } else {
        alerts.push({
          type: 'info',
          message: `Plus que ${remaining} kcal pour atteindre votre objectif !`
        });
      }
    }
    
    // Message objectifs atteints
    if (goals.weeklySessions > 0 && sessionsReached && goals.weeklyCalories > 0 && caloriesReached) {
      alerts.push({
        type: 'success',
        message: `Félicitations ! Tous vos objectifs de la semaine sont atteints !`
      });
    }
    
    const alertsWrap = this.querySelector('#alerts');
    if (alerts.length === 0) {
      alertsWrap.innerHTML = '<div style="color:var(--muted);text-align:center;padding:12px">Aucune alerte</div>';
    } else {
      alertsWrap.innerHTML = alerts.map(a => {
        let bgColor, borderColor, textColor;
        switch (a.type) {
          case 'danger':
            bgColor = '#fef2f2'; borderColor = '#fecaca'; textColor = '#991b1b';
            break;
          case 'warning':
            bgColor = '#fffbeb'; borderColor = '#fde68a'; textColor = '#92400e';
            break;
          case 'success':
            bgColor = '#f0fdf4'; borderColor = '#bbf7d0'; textColor = '#166534';
            break;
          default:
            bgColor = '#eff6ff'; borderColor = '#bfdbfe'; textColor = '#1e40af';
        }
        return `<div style="padding:12px 14px;border-radius:10px;background:${bgColor};border:1px solid ${borderColor};color:${textColor};font-size:0.9rem;margin-bottom:8px">
          ${a.message}
        </div>`;
      }).join('');
    }


    const byCat = groupByCategory(rows);
    const labels = CATEGORIES.map(c=>c.label);
    const data = CATEGORIES.map(c=> byCat.get(c.id)||0);
    const colors = ['#4f8cff','#22c55e','#f59e0b','#a78bfa','#f472b6','#60a5fa'];

    const pieCtx = this.querySelector('#pie');
    if(this.pie){ this.pie.data.labels = labels; this.pie.data.datasets[0].data = data; this.pie.update(); }
    else {
      this.pie = new Chart(pieCtx, {
        type:'pie',
        data:{ labels, datasets:[{ data, backgroundColor: colors }] },
        options:{ plugins:{ legend:{ labels:{ color:'#c7d2fe' } } } }
      });
    }

    const buckets = weeklyBuckets(rows);
    const lLabels = buckets.map(b=>b.label);
    const kcalSeries = buckets.map(b=>Math.round(b.kcal));
    const minutesSeries = buckets.map(b=>b.minutes);
    const lineCtx = this.querySelector('#line');
    if(this.line){
      this.line.data.labels = lLabels;
      this.line.data.datasets[0].data = kcalSeries;
      this.line.data.datasets[1].data = minutesSeries;
      this.line.update();
    } else {
      const config = {
        type: 'line',
        data: {
          labels: lLabels,
          datasets: [
            { label:'Calories', data:kcalSeries, borderColor:'#4f8cff', backgroundColor:'rgba(79,140,255,.2)' },
            { label:'Minutes', data:minutesSeries, borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,.2)' }
          ]
        },
        options: {
          scales: {
            x: { ticks: { color: '#9fb0c0' } },
            y: { ticks: { color: '#9fb0c0' } }
          },
          plugins: { legend: { labels: { color: '#c7d2fe' } } }
        }
      };
      this.line = new Chart(lineCtx, config);
    }
  }
}

customElements.define('view-dashboard', ViewDashboard);
