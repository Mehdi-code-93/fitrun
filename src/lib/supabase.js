// Use jsDelivr ESM transform for browser-compatible modules
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = (typeof window !== 'undefined' && window.__FITDASH_ENV) ? window.__FITDASH_ENV : {};
export const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

export async function getCurrentSession(){
  const { data } = await supabase.auth.getSession();
  const s = data?.session || null;
  if(!s) return null;
  return { userId: s.user.id, email: s.user.email };
}

export async function signUp(email, password){
  const { data, error } = await supabase.auth.signUp({ email, password });
  if(error) throw error;
  return data?.user ? { userId: data.user.id, email: data.user.email } : null;
}

export async function signIn(email, password){
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data?.user ? { userId: data.user.id, email: data.user.email } : null;
}

export async function signOut(){
  const { error } = await supabase.auth.signOut();
  if(error) throw error;
}

export function onAuthChange(callback){
  return supabase.auth.onAuthStateChange((_ev, session)=>{
    const s = session ? { userId: session.user.id, email: session.user.email } : null;
    callback(s);
  });
}

// Data access helpers
export async function upsertProfile(userId, { weightKg, heightCm, age, firstName, lastName }){
  const profile = { id: userId, weight_kg: weightKg, height_cm: heightCm, age };
  if(firstName !== undefined) profile.first_name = firstName;
  if(lastName !== undefined) profile.last_name = lastName;
  const { error } = await supabase.from('profiles').upsert(profile);
  if(error) throw error;
}

export async function getProfile(userId){
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if(error) throw error;
  if(!data) return null;
  return { 
    weightKg: data.weight_kg, 
    heightCm: data.height_cm, 
    age: data.age,
    firstName: data.first_name || null,
    lastName: data.last_name || null
  };
}

export async function upsertGoals(userId, { weeklySessions, weeklyCalories }){
  const { error } = await supabase.from('goals').upsert({ user_id: userId, weekly_sessions: weeklySessions, weekly_calories: weeklyCalories });
  if(error) throw error;
}

export async function getGoals(userId){
  const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId).maybeSingle();
  if(error) throw error;
  if(!data) return null;
  return { weeklySessions: data.weekly_sessions, weeklyCalories: data.weekly_calories };
}

export async function listTrainings(userId){
  const { data, error } = await supabase.from('trainings').select('*').eq('user_id', userId).order('date', { ascending: false });
  if(error) throw error;
  return (data||[]).map(r=>({ id: r.id, userId: r.user_id, category: r.category, type: r.type, durationMin: r.duration_min, date: r.date, note: r.note||'' }));
}

export async function insertTraining(userId, t){
  const row = { user_id: userId, category: t.category, type: t.type, duration_min: t.durationMin, date: t.date, note: t.note||'' };
  const { data, error } = await supabase.from('trainings').insert(row).select('*').single();
  if(error) throw error;
  return { id: data.id, userId: data.user_id, category: data.category, type: data.type, durationMin: data.duration_min, date: data.date, note: data.note||'' };
}

export async function updateTrainingRow(id, updates){
  const patch = { category: updates.category, type: updates.type, duration_min: updates.durationMin, date: updates.date, note: updates.note||'' };
  const { data, error } = await supabase.from('trainings').update(patch).eq('id', id).select('*').single();
  if(error) throw error;
  return { id: data.id, userId: data.user_id, category: data.category, type: data.type, durationMin: data.duration_min, date: data.date, note: data.note||'' };
}

export async function deleteTrainingRow(id){
  const { error } = await supabase.from('trainings').delete().eq('id', id);
  if(error) throw error;
}

export function subscribeTrainings(userId, onChange){
  const channel = supabase.channel('trainings-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trainings', filter: `user_id=eq.${userId}` }, (payload)=>{
      onChange(payload);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
