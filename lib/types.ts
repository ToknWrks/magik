// lib/types.ts
export interface ConspiracyTemplate {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  prompt_template: string;
  key_facts: string[];
  debunking_points: string[];
  sources: string[];
  difficulty_level: string;
  is_active: boolean;
  view_count: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface GeneratedContent {
  id: string;
  template_id: string;
  user_id?: string;
  content: string;
  debunking_content?: string;
  sources?: any;
  image_url?: string;
  expires_at?: Date;
  created_at: Date;
}