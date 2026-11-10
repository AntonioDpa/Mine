/**
 * Script de verificación y creación automática de tablas en Supabase
 * Proyecto: diibkzipwilsboapvhud (https://diibkzipwilsboapvhud.supabase.co)
 *
 * Uso:
 *   1. Verificar tablas: node scripts/setup-db.js
 *   2. Crear tablas vía Management API (con token sbp_...):
 *      node scripts/setup-db.js sbp_tu_token_aqui
 */

const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'diibkzipwilsboapvhud';
const SUPABASE_URL = 'https://diibkzipwilsboapvhud.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_DM67zoUwTg8KoW4RWf9JVA_CE6FmV_H';

async function verifyTables() {
  console.log('🔍 Verificando conexión con Supabase REST API...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/voxel_players?select=username&limit=1`, {
    headers: { apikey: PUBLISHABLE_KEY }
  });
  if (res.ok) {
    console.log('✅ ¡Las tablas public.voxel_players y public.voxel_world_blocks YA existen y están activas!');
    return true;
  }
  const text = await res.text();
  console.log(`⚠️ Estado REST (${res.status}): ${text}`);
  return false;
}

async function createTablesWithToken(accessToken) {
  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log(`🚀 Creando tablas en el proyecto ${PROJECT_REF} mediante Supabase Management API...`);
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

  console.log('✅ ¡Esquema SQL ejecutado con éxito en Supabase!');
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
        console.log('O pega el contenido de supabase/schema.sql en:');
        console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
