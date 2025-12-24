export const CATEGORIES = [
  { id: 'musculation', label: 'Musculation', met: 5 },
  { id: 'cardio', label: 'Cardio', met: 10 },
  { id: 'yoga', label: 'Yoga', met: 3 },
  { id: 'natation', label: 'Natation', met: 8 }
];

export const STORAGE_KEYS = {
  users: 'fitdash_users',
  session: 'fitdash_session',
  trainings: 'fitdash_trainings',
  userParams: 'fitdash_user_params',
  goals: 'fitdash_goals'
};

export const DEFAULT_USER_PARAMS = { weightKg: 70, heightCm: 175, age: 25 };

export function getMetByCategory(categoryId){
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat ? cat.met : 5;
}
