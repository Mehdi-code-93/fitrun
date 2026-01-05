import { DEFAULT_USER_PARAMS } from './constants.js';
import {
  getCurrentSession,
  signUp,
  signIn,
  signOut,
  onAuthChange,
  getProfile,
  upsertProfile,
  getGoals,
  upsertGoals,
  listTrainings,
  insertTraining,
  updateTrainingRow,
  deleteTrainingRow,
  subscribeTrainings
} from './supabase.js';

const listeners = new Set();
let _session = null;
let _trainings = [];
let _userParams = DEFAULT_USER_PARAMS;
let _goals = { weeklySessions: 3, weeklyCalories: 2000 };
let unsubscribeRealtime = () => {};

const state = {
  get session(){ return _session; },
  set session(v){ _session = v; notify(); },

  get trainings(){ return _trainings; },
  set trainings(v){ _trainings = v; notify(); },

  get userParams(){ return _userParams; },
  set userParams(v){ _userParams = v; notify(); },

  get goals(){ return _goals; },
  set goals(v){ _goals = v; notify(); }
};

export function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
function notify(){ for(const fn of listeners) fn(); }

async function loadAll(){
  if(!_session) return;
  const [params, goals, trainings] = await Promise.all([
    getProfile(_session.userId),
    getGoals(_session.userId),
    listTrainings(_session.userId)
  ]);
  state.userParams = params || DEFAULT_USER_PARAMS;
  state.goals = goals || { weeklySessions: 3, weeklyCalories: 2000 };
  state.trainings = trainings;
}

export async function createUser({ email, password }){
  await signUp(email, password);
  await login({ email, password });
  const s = state.session;
  if(!s) throw new Error('Inscription échouée');
  await Promise.all([
    upsertProfile(s.userId, DEFAULT_USER_PARAMS),
    upsertGoals(s.userId, { weeklySessions: 3, weeklyCalories: 2000 })
  ]);
  await loadAll();
}

export async function login({ email, password }){
  const s = await signIn(email, password);
  if(!s) throw new Error('Identifiants invalides');
  state.session = s;
  await loadAll();
  setupRealtime();
  return state.session;
}

export async function logout(){
  await signOut();
  unsubscribeRealtime();
  state.session = null;
  state.trainings = [];
  state.userParams = DEFAULT_USER_PARAMS;
  state.goals = { weeklySessions: 3, weeklyCalories: 2000 };
}

export async function addTraining(t){
  if(!_session) return;
  await insertTraining(_session.userId, t);
  // Le realtime va automatiquement mettre à jour state.trainings via setupRealtime()
}

export async function updateTraining(id, updates){
  await updateTrainingRow(id, updates);
  // Le realtime va automatiquement mettre à jour state.trainings via setupRealtime()
}

export async function deleteTraining(id){
  await deleteTrainingRow(id);
  // Le realtime va automatiquement mettre à jour state.trainings via setupRealtime()
}

export function getUserTrainings(){
  if(!_session) return [];
  return state.trainings;
}

export async function ensureSeed(){
  const s = await getCurrentSession();
  state.session = s;
  if(s){ await loadAll(); setupRealtime(); }
  onAuthChange((session)=>{
    state.session = session;
    if(session){ loadAll(); setupRealtime(); }
    else { unsubscribeRealtime(); state.trainings=[]; state.userParams=DEFAULT_USER_PARAMS; state.goals={ weeklySessions:3, weeklyCalories:2000 }; }
  });
}

function setupRealtime(){
  unsubscribeRealtime();
  if(!_session) return;
  unsubscribeRealtime = subscribeTrainings(_session.userId, (payload)=>{
    const { eventType, new: newRow, old: oldRow } = payload;
    if(eventType === 'INSERT'){
      const t = { id: newRow.id, userId: newRow.user_id, category: newRow.category, type: newRow.type, durationMin: newRow.duration_min, date: newRow.date, note: newRow.note||'' };
      state.trainings = [t, ...state.trainings];
    } else if(eventType === 'UPDATE'){
      const t = { id: newRow.id, userId: newRow.user_id, category: newRow.category, type: newRow.type, durationMin: newRow.duration_min, date: newRow.date, note: newRow.note||'' };
      state.trainings = state.trainings.map(x=> x.id===t.id ? t : x);
    } else if(eventType === 'DELETE'){
      const id = oldRow.id;
      state.trainings = state.trainings.filter(x=> x.id !== id);
    }
  });
}

// Override setters to persist to Supabase
Object.defineProperty(state, 'goals', {
  get(){ return _goals; },
  set(v){ _goals = v; if(_session){ upsertGoals(_session.userId, v).then(()=>notify()); } else { notify(); } }
});

Object.defineProperty(state, 'userParams', {
  get(){ return _userParams; },
  set(v){ _userParams = v; if(_session){ upsertProfile(_session.userId, v).then(()=>notify()); } else { notify(); } }
});

export default state;
