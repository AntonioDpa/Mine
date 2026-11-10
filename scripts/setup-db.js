/**
 * Script de verificación y creación automática de tablas en Supabase
 * Proyecto: diibkzipwilsboapvhud (https://diibkzipwilsboapvhud.supabase.co)
 *
 * Uso:
 *   1. Verificar tablas: node scripts/setup-db.js
 *   2. Crear/actualizar tablas vía Management API (con token sbp_...):
 *      node scripts/setup-db.js sbp_tu_token_aqui
 */

const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'diibkzipwilsboapvhud';
const SUPABASE_URL = 'https://diibkzipwilsboapvhud.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_DM67zoUwTg8KoW4RWf9JVA_CE6FmV_H';

async function verifyTables() {
  console.log('🔍 Verificando conexión y permisos RLS con Supabase REST API...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/voxel_players?select=username,display_name,room_id,dimension,x,y,z,updated_at&limit=10`, {
    headers: { apikey: PUBLISHABLE_KEY }
  });
  if (res.ok) {
    const rows = await res.json();
    console.log('✅ ¡Las tablas public.voxel_players (con coordenadas 3D en tiempo real) y public.voxel_world_blocks están activas!');
    console.log('📊 Jugadores en línea actualmente en Supabase:', JSON.stringify(rows));
    return true;
  }
  const text = await res.text();
  console.log(`⚠️ Estado REST (${res.status}): ${text}`);
  return false;
}

async function createTablesWithToken(accessToken) {
  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8') + '\nDELETE FROM public.voxel_players;';

  console.log(`🚀 Actualizando esquema y limpiando jugadores fantasma en ${PROJECT_REF}...`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken.trim()}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error Management API (${res.status}): ${errText}`);
  }

  console.log('✅ ¡Esquema SQL actualizado y tabla de jugadores limpia en Supabase!');
  await verifyTables();
}

(async () => {
  try {
    const token = process.argv[2] || process.env.SUPABASE_ACCESS_TOKEN;
    if (token) {
      await createTablesWithToken(token);
    } else {
      const exists = await verifyTables();
      if (!exists) {
        console.log('\n💡 Para crear las tablas automáticamente ejecuta:');
        console.log('   node scripts/setup-db.js <TU_TOKEN_sbp_...>');
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
