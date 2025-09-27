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

    console.log('Starting market analytics calculation...');

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    // Get all properties from last week
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .gte('created_at', lastWeek.toISOString())
      .lte('created_at', today.toISOString());

    if (propertiesError) {
      throw propertiesError;
    }

    console.log(`Analyzing ${properties?.length || 0} properties from last week`);

    // Group by different criteria
    const stats = new Map();

    for (const property of properties || []) {
      const keys = [
        `${property.property_type}|${property.listing_type}|all|all`, // Type + Listing
        `all|${property.listing_type}|${property.city}|all`, // Listing + City
        `${property.property_type}|all|${property.city}|all`, // Type + City
        `${property.property_type}|${property.listing_type}|${property.city}|${property.neighborhood}`, // Full combination
      ];

      for (const key of keys) {
        const [type, listing, city, neighborhood] = key.split('|');
        
        if (!stats.has(key)) {
          stats.set(key, {
            property_type: type === 'all' ? null : type,
            listing_type: listing === 'all' ? null : listing,
            city: city === 'all' ? null : city,
            neighborhood: neighborhood === 'all' ? null : neighborhood,
            total_count: 0,
            sold_count: 0,
            rented_count: 0,
            prices: [],
            days_to_sell: []
          });
        }

        const stat = stats.get(key);
        stat.total_count++;

        if (property.valor) {
          stat.prices.push(parseFloat(property.valor));
        }

        if (property.sale_status === 'sold') {
          stat.sold_count++;
          if (property.marked_as_sold_at && property.created_at) {
            const daysToSell = Math.floor(
              (new Date(property.marked_as_sold_at).getTime() - new Date(property.created_at).getTime()) 
              / (1000 * 60 * 60 * 24)
            );
            stat.days_to_sell.push(daysToSell);
          }
        } else if (property.sale_status === 'rented') {
          stat.rented_count++;
        }
      }
    }

    // Calculate averages and save to database
    let savedCount = 0;
    for (const [key, stat] of stats) {
      const avg_price = stat.prices.length > 0 
        ? stat.prices.reduce((a, b) => a + b, 0) / stat.prices.length 
        : null;
        
      const avg_days_to_sell = stat.days_to_sell.length > 0
        ? Math.round(stat.days_to_sell.reduce((a, b) => a + b, 0) / stat.days_to_sell.length)
        : null;

      // Only save if we have meaningful data
      if (stat.total_count >= 1) {
        const { error: insertError } = await supabase
          .from('market_stats')
          .upsert({
            period_start: lastWeek.toISOString().split('T')[0],
            period_end: today.toISOString().split('T')[0],
            property_type: stat.property_type,
            listing_type: stat.listing_type,
            city: stat.city,
            neighborhood: stat.neighborhood,
            total_count: stat.total_count,
            sold_count: stat.sold_count,
            rented_count: stat.rented_count,
            avg_price: avg_price,
            avg_days_to_sell: avg_days_to_sell
          });

        if (insertError) {
          console.error('Error inserting market stat:', insertError);
        } else {
          savedCount++;
        }
      }
    }

    console.log(`Saved ${savedCount} market statistics`);

    return new Response(JSON.stringify({
      success: true,
      stats_calculated: savedCount,
      properties_analyzed: properties?.length || 0,
      period_start: lastWeek.toISOString().split('T')[0],
      period_end: today.toISOString().split('T')[0]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in market analytics:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});