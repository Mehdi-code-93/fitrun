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
  subscribeTrainings,
  updateUserEmail,
  updateUserPassword
} from './supabase.js';

// Système de state management simple avec pattern observer
const listeners = new Set();
let _session = null;
let _trainings = [];
let _userParams = DEFAULT_USER_PARAMS;
let _goals = { weeklySessions: 3, weeklyCalories: 2000 };
let unsubscribeRealtime = () => {};

// State global avec getters/setters qui notifient les listeners
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

// Permet aux composants de s'abonner aux changements d'état
export function subscribe(fn){ 
  listeners.add(fn); 
  return () => listeners.delete(fn); // retourne une fonction unsubscribe
}
function notify(){ 
  for(const fn of listeners) fn(); // on notifie tous les composants abonnés
}

// Charge toutes les données utilisateur depuis Supabase en parallèle
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

export async function createUser({ email, password, firstName, lastName }){
  await signUp(email, password);
  await login({ email, password });
  const s = state.session;
  if(!s) throw new Error('Inscription échouée');
  
  // Créer les paramètres utilisateur avec prénom et nom
  const newUserParams = { ...DEFAULT_USER_PARAMS, firstName, lastName };
  const newGoals = { weeklySessions: 3, weeklyCalories: 2000 };
  
  // Enregistrer dans Supabase
  await Promise.all([
    upsertProfile(s.userId, newUserParams),
    upsertGoals(s.userId, newGoals)
  ]);
  
  // Mettre à jour immédiatement le state local pour éviter les problèmes de timing
  _userParams = newUserParams;
  _goals = newGoals;
  notify();
  
  // Charger le reste des données
  await loadAll();
}

export async function login({ email, password }){
  const s = await signIn(email, password);
  if(!s) throw new Error('Identifiants invalides');
  state.session = s;
  await loadAll();
  setupRealtime(); // on active les mises à jour en temps réel après connexion
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
}

export async function updateTraining(id, updates){
  await updateTrainingRow(id, updates);
}

export async function deleteTraining(id){
  await deleteTrainingRow(id);
}

export function getUserTrainings(){
  if(!_session) return [];
  return state.trainings;
}

// Initialise l'app et restaure la session si elle existe
export async function ensureSeed(){
  const s = await getCurrentSession();
  state.session = s;
  if(s){ await loadAll(); setupRealtime(); }
  
  // On écoute les changements d'auth pour se reconnecter automatiquement
  onAuthChange((session)=>{
    state.session = session;
    if(session){ 
      loadAll(); 
      setupRealtime(); 
    } else { 
      // déconnexion : on nettoie tout
      unsubscribeRealtime(); 
      state.trainings=[]; 
      state.userParams=DEFAULT_USER_PARAMS; 
      state.goals={ weeklySessions:3, weeklyCalories:2000 }; 
    }
  });
}

// Configure l'écoute en temps réel des changements sur la table trainings
function setupRealtime(){
  unsubscribeRealtime(); // on désabonne d'abord pour éviter les doublons
  if(!_session) return;
  
  // Supabase nous notifie de chaque changement (insert/update/delete)
  unsubscribeRealtime = subscribeTrainings(_session.userId, (payload)=>{
    const { eventType, new: newRow, old: oldRow } = payload;
    
    if(eventType === 'INSERT'){
      // On ajoute en début de liste pour avoir les plus récents en premier
      const t = { id: newRow.id, userId: newRow.user_id, category: newRow.category, type: newRow.type, durationMin: newRow.duration_min, date: newRow.date, note: newRow.note||'' };
      state.trainings = [t, ...state.trainings];
    } else if(eventType === 'UPDATE'){
      // On remplace l'ancien par le nouveau
      const t = { id: newRow.id, userId: newRow.user_id, category: newRow.category, type: newRow.type, durationMin: newRow.duration_min, date: newRow.date, note: newRow.note||'' };
      state.trainings = state.trainings.map(x=> x.id===t.id ? t : x);
    } else if(eventType === 'DELETE'){
      // On supprime de la liste
      const id = oldRow.id;
      state.trainings = state.trainings.filter(x=> x.id !== id);
    }
  });
}

// On override les setters pour auto-sauvegarder dans Supabase à chaque modification
Object.defineProperty(state, 'goals', {
  get(){ return _goals; },
  set(v){ 
    _goals = v; 
    if(_session){ 
      upsertGoals(_session.userId, v).then(()=>notify()); // sauvegarde async, puis notifie
    } else { 
      notify(); 
    } 
  }
});

Object.defineProperty(state, 'userParams', {
  get(){ return _userParams; },
  set(v){ 
    _userParams = v; 
    if(_session){ 
      upsertProfile(_session.userId, v).then(()=>notify()); 
    } else { 
      notify(); 
    } 
  }
});

export async function updateEmail(newEmail){
  if(!_session) throw new Error('Non connecté');
  const updated = await updateUserEmail(newEmail);
  if(updated){
    state.session = { userId: updated.userId, email: updated.email };
  }
  return updated;
}

export async function updatePassword(newPassword){
  if(!_session) throw new Error('Non connecté');
  if(!newPassword || newPassword.length < 4) throw new Error('Le mot de passe doit contenir au moins 4 caractères');
  await updateUserPassword(newPassword);
}

export default state;
