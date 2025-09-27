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

    console.log('Starting property monitoring...');

    // Find properties with no activity for 15+ days
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const { data: inactiveProperties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        titulo,
        user_id,
        created_at,
        property_analytics (
          last_activity,
          views_count,
          contacts_count
        )
      `)
      .eq('sale_status', 'available')
      .eq('is_public', true);

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      throw propertiesError;
    }

    console.log(`Found ${inactiveProperties?.length || 0} active properties`);

    const notifications = [];

    for (const property of inactiveProperties || []) {
      const analytics = property.property_analytics?.[0];
      const lastActivity = analytics?.last_activity ? new Date(analytics.last_activity) : new Date(property.created_at);
      const daysSinceActivity = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceActivity >= 15) {
        // Generate suggestions based on analytics
        const suggestions = [];
        
        if ((analytics?.views_count || 0) < 5) {
          suggestions.push("📸 Experimente trocar a foto de capa - fotos atrativas geram mais visualizações");
        }
        
        if (!property.titulo || property.titulo.length < 20) {
          suggestions.push("✏️ Torne o título mais descritivo e atrativo");
        }
        
        suggestions.push("💰 Verifique se o preço está condizente com o mercado");
        suggestions.push("📞 Confirme com o proprietário se ainda está disponível");
        
        const message = `Seu imóvel "${property.titulo}" está há ${daysSinceActivity} dias sem atividade.\n\nSugestões para melhorar a performance:\n${suggestions.map(s => `• ${s}`).join('\n')}`;

        // Send notification
        const { error: notificationError } = await supabase.rpc('send_notification', {
          _user_id: property.user_id,
          _type: 'warning',
          _title: 'Imóvel sem atividade - Ação necessária',
          _message: message,
          _data: {
            property_id: property.id,
            days_inactive: daysSinceActivity,
            views_count: analytics?.views_count || 0,
            contacts_count: analytics?.contacts_count || 0
          }
        });

        if (notificationError) {
          console.error('Error sending notification:', notificationError);
        } else {
          notifications.push({
            property_id: property.id,
            user_id: property.user_id,
            days_inactive: daysSinceActivity
          });
        }
      }
    }

    console.log(`Sent ${notifications.length} inactive property notifications`);

    return new Response(JSON.stringify({
      success: true,
      notifications_sent: notifications.length,
      properties_checked: inactiveProperties?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in property monitoring:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});