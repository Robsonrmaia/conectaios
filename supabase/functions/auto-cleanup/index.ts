import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting auto-cleanup process...');

    // Handle property status changes (when marked as sold/rented)
    const { property_id, status, user_id } = await req.json().catch(() => ({}));

    if (property_id && status && user_id) {
      // Mark property with auto-delete date (7 days from now)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const updateData: any = {
        sale_status: status,
        auto_delete_at: sevenDaysFromNow.toISOString(),
        is_public: false, // Hide from public immediately
      };

      if (status === 'sold') {
        updateData.marked_as_sold_at = new Date().toISOString();
      } else if (status === 'rented') {
        updateData.marked_as_rented_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property_id)
        .eq('user_id', user_id);

      if (updateError) {
        throw updateError;
      }

      // Send immediate notification to user
      const statusText = status === 'sold' ? 'vendido' : 'alugado';
      const { data: property } = await supabase
        .from('properties')
        .select('titulo')
        .eq('id', property_id)
        .single();

      await supabase.rpc('send_notification', {
        _user_id: user_id,
        _type: 'info',
        _title: `Imóvel marcado como ${statusText}`,
        _message: `Seu imóvel "${property?.titulo || 'Sem título'}" foi marcado como ${statusText} e será automaticamente removido do sistema em 7 dias (${sevenDaysFromNow.toLocaleDateString('pt-BR')}). Você pode cancelar esta ação se necessário.`,
        _data: {
          property_id,
          status,
          auto_delete_at: sevenDaysFromNow.toISOString()
        }
      });

      return new Response(JSON.stringify({
        success: true,
        message: `Property marked as ${status} and will be deleted in 7 days`,
        auto_delete_at: sevenDaysFromNow.toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find properties to delete (auto_delete_at reached)
    const now = new Date().toISOString();
    const { data: propertiesToDelete, error: fetchError } = await supabase
      .from('properties')
      .select('id, titulo, user_id')
      .lte('auto_delete_at', now)
      .not('auto_delete_at', 'is', null);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${propertiesToDelete?.length || 0} properties to delete`);

    let deletedCount = 0;
    for (const property of propertiesToDelete || []) {
      // Delete property media first
      const { error: mediaError } = await supabase
        .from('media')
        .delete()
        .eq('property_id', property.id);

      if (mediaError) {
        console.error('Error deleting media:', mediaError);
      }

      // Delete property analytics
      const { error: analyticsError } = await supabase
        .from('property_analytics')
        .delete()
        .eq('property_id', property.id);

      if (analyticsError) {
        console.error('Error deleting analytics:', analyticsError);
      }

      // Delete the property
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (deleteError) {
        console.error('Error deleting property:', deleteError);
      } else {
        deletedCount++;

        // Notify user about deletion
        await supabase.rpc('send_notification', {
          _user_id: property.user_id,
          _type: 'info',
          _title: 'Imóvel removido automaticamente',
          _message: `O imóvel "${property.titulo}" foi removido do sistema conforme programado após ser marcado como vendido/alugado há 7 dias.`,
          _data: {
            property_id: property.id,
            deleted_at: now
          }
        });
      }
    }

    console.log(`Deleted ${deletedCount} properties`);

    return new Response(JSON.stringify({
      success: true,
      properties_deleted: deletedCount,
      properties_checked: propertiesToDelete?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-cleanup:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});