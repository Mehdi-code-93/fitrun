import { STORAGE_KEYS, DEFAULT_USER_PARAMS } from './constants.js';

const listeners = new Set();

function read(key, fallback){
  try{ const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }catch{ return fallback; }
}
function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

const state = {
  get users(){ return read(STORAGE_KEYS.users, []); },
  set users(v){ write(STORAGE_KEYS.users, v); notify(); },

  get session(){ return read(STORAGE_KEYS.session, null); },
  set session(v){ write(STORAGE_KEYS.session, v); notify(); },

  get trainings(){ return read(STORAGE_KEYS.trainings, []); },
  set trainings(v){ write(STORAGE_KEYS.trainings, v); notify(); },

  get userParams(){ return read(STORAGE_KEYS.userParams, DEFAULT_USER_PARAMS); },
  set userParams(v){ write(STORAGE_KEYS.userParams, v); notify(); },

  get goals(){ return read(STORAGE_KEYS.goals, { weeklySessions: 3, weeklyCalories: 2000 }); },
  set goals(v){ write(STORAGE_KEYS.goals, v); notify(); }
};

export function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
function notify(){ for(const fn of listeners) fn(); }

export function createUser({ email, password }){
  const users = state.users;
  if(users.some(u => u.email === email)) throw new Error('Email déjà utilisé');
  users.push({ id: crypto.randomUUID(), email, password });
  state.users = users;
}

export function login({ email, password }){
  const user = state.users.find(u => u.email === email && u.password === password);
  if(!user) throw new Error('Identifiants invalides');
  state.session = { userId: user.id, email: user.email };
  return state.session;
}

export function logout(){ state.session = null; }

export function addTraining(t){
  const trainings = state.trainings;
  trainings.push({ id: crypto.randomUUID(), ...t });
  state.trainings = trainings;
}

export function updateTraining(id, updates){
  const trainings = state.trainings.map(t => t.id === id ? { ...t, ...updates } : t);
  state.trainings = trainings;
}

export function deleteTraining(id){
  const trainings = state.trainings.filter(t => t.id !== id);
  state.trainings = trainings;
}

export function getUserTrainings(){
  const s = state.session; if(!s) return [];
  return state.trainings.filter(t => t.userId === s.userId);
}

export function ensureSeed(){
  if(!localStorage.getItem(STORAGE_KEYS.users)) write(STORAGE_KEYS.users, []);
  if(!localStorage.getItem(STORAGE_KEYS.trainings)) write(STORAGE_KEYS.trainings, []);
  if(!localStorage.getItem(STORAGE_KEYS.session)) write(STORAGE_KEYS.session, null);
  if(!localStorage.getItem(STORAGE_KEYS.userParams)) write(STORAGE_KEYS.userParams, DEFAULT_USER_PARAMS);
  if(!localStorage.getItem(STORAGE_KEYS.goals)) write(STORAGE_KEYS.goals, { weeklySessions: 3, weeklyCalories: 2000 });
}

export default state;
