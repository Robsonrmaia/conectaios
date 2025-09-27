import { supabase } from '@/integrations/supabase/client';

export interface Testimonial {
  id: string;
  user_id: string;
  author_name: string;
  rating: number;
  content: string;
  source?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTestimonialInput {
  author_name: string;
  rating: number;
  content: string;
  source?: string;
  published?: boolean;
}

export const testimonialsService = {
  async listMine(): Promise<Testimonial[]> {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error listing testimonials:', error);
      throw error;
    }
  },

  async create(input: CreateTestimonialInput): Promise<Testimonial> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('testimonials')
        .insert({
          user_id: user.id,
          author_name: input.author_name,
          rating: input.rating,
          content: input.content,
          source: input.source,
          published: input.published ?? true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating testimonial:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<CreateTestimonialInput>): Promise<Testimonial> {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating testimonial:', error);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing testimonial:', error);
      throw error;
    }
  },

  async togglePublished(id: string, published: boolean): Promise<Testimonial> {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .update({ published })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling testimonial published status:', error);
      throw error;
    }
  }
};