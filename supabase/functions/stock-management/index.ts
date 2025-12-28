// supabase/functions/stock-management/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const pid = url.searchParams.get('pid');
      const size = url.searchParams.get('size');

      if (!pid || !size) {
        return new Response(JSON.stringify({ error: 'Missing pid or size' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const { data, error } = await supabase
        .from('product_stock')
        .select('quantity')
        .eq('product_id', pid)
        .eq('size', size)
        .single();

      if (error) {
        // If the row doesn't exist, single() returns an error.
        // We'll treat this as 0 available stock.
        if (error.code === 'PGRST116') {
             return new Response(JSON.stringify({ available: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
             });
        }
        console.error('Supabase error:', error);
        return new Response(JSON.stringify({ error: 'Stock fetch failed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
      }

      return new Response(JSON.stringify({ available: data?.quantity ?? 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (req.method === 'POST') {
      const { productId, size, quantity } = await req.json();

      if (!productId || !size || quantity === undefined) {
        return new Response(JSON.stringify({ error: 'Missing productId, size, or quantity' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const { error } = await supabase
        .from('product_stock')
        .upsert({ product_id: productId, size, quantity });

      if (error) {
        console.error('Supabase error:', error);
        return new Response(JSON.stringify({ error: 'Stock update failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      return new Response('Method Not Allowed', {
        headers: { ...corsHeaders },
        status: 405,
      });
    }
  } catch (err) {
    console.error('Main error:', err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
