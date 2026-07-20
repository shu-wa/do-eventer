import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const token = authorization.slice('Bearer '.length);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  // auth.users の削除により、外部キーの ON DELETE CASCADE で関連データも削除されます。
  const { error } = await admin.auth.admin.deleteUser(userData.user.id, false);
  if (error) return new Response(JSON.stringify({ error: 'deletion_failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ deleted: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
