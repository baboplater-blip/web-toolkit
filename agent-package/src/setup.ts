import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

const SUPABASE_URL = 'https://prrmddwsduibyplsijfq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycm1kZHdzZHVpYnlwbHNpamZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwNzA3MSwiZXhwIjoyMDkxMzgzMDcxfQ.MNjp5Cfoge2ooboU-A8zarupOx0pNMjRCIokWuOn1lw';

const envPath = join(__dirname, '..', '.env');

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('');
  console.log('================================================================');
  console.log('  Agent Control Panel - Register PC');
  console.log('================================================================');
  console.log('');

  if (existsSync(envPath)) {
    const existing = readFileSync(envPath, 'utf-8');
    const match = existing.match(/AGENT_API_KEY=(.+)/);
    if (match && match[1].trim()) {
      console.log('Already registered.');
      console.log(`API Key: ${match[1].trim().substring(0, 20)}...`);
      const answer = await ask('Re-register? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Done. Run start.bat to start.');
        process.exit(0);
      }
    }
  }

  let pcName = process.argv[2];
  if (!pcName) {
    pcName = await ask('Enter PC name (e.g. HomePC, OfficePC): ');
  }

  if (!pcName) {
    console.error('PC name is required.');
    process.exit(1);
  }

  console.log('');
  console.log(`Registering "${pcName}"...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const apiKey = `acp_${randomBytes(24).toString('hex')}`;

  const { data, error } = await supabase
    .from('agents')
    .insert({ name: pcName, api_key: apiKey })
    .select()
    .single();

  if (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }

  const envContent = [
    `SUPABASE_URL=${SUPABASE_URL}`,
    `SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}`,
    `AGENT_API_KEY=${apiKey}`,
    '',
  ].join('\n');

  writeFileSync(envPath, envContent, 'utf-8');

  console.log('');
  console.log('================================================================');
  console.log('  Registration Complete!');
  console.log('================================================================');
  console.log('');
  console.log(`  PC Name : ${pcName}`);
  console.log(`  PC ID   : ${data.id}`);
  console.log(`  API Key : ${apiKey.substring(0, 20)}...`);
  console.log('');
  console.log('  .env file created automatically.');
  console.log('  Double-click start.bat to start the agent.');
  console.log('');
  console.log('  Web: https://agent-control-panel-phi.vercel.app');
  console.log('');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
