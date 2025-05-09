export interface Skill {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export type NewSkill = Omit<Skill, 'id' | 'created_at' | 'updated_at'>; 