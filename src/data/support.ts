import { supabase } from '@/integrations/supabase/client';

export interface SupportTicket {
  id: string;
  user_id?: string;
  broker_id?: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  assignee_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketInput {
  subject: string;
  body: string;
  priority?: 'low' | 'normal' | 'high';
}

export const supportService = {
  async listMine(): Promise<SupportTicket[]> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error listing support tickets:', error);
      throw error;
    }
  },

  async create(input: CreateTicketInput): Promise<SupportTicket> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: input.subject,
          body: input.body,
          priority: input.priority || 'normal'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  },

  async updateStatus(id: string, status: string): Promise<SupportTicket> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  },

  async assign(id: string, userId: string): Promise<SupportTicket> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ assignee_id: userId })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      throw error;
    }
  }
};