// Minisite Configuration types
export interface MinisiteConfig {
  id?: string;
  user_id: string;
  broker_id?: string;
  title: string;
  description?: string;
  primary_color: string;
  secondary_color: string;
  template_id: string;
  show_properties: boolean;
  show_contact: boolean;
  show_contact_form: boolean;
  show_about: boolean;
  is_active: boolean;
  custom_domain?: string | null;
  config_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingStatus {
  tourCompleted: boolean;
  completedAt: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  message?: string | null;
  data?: any;
  meta?: any;
  read: boolean;
  created_at: string;
  updated_at?: string;
}