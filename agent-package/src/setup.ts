/**
 * PC 등록 + .env 자동 생성 스크립트
 * install.bat에서 호출됨
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { writeFileSync, existsSync } from 'fs';
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
  console.log('  Agent Control Panel - PC 등록');
  console.log('================================================================');
  console.log('');

  // 이미 .env가 있고 AGENT_API_KEY가 설정되어 있으면 스킵
  if (existsSync(envPath)) {
    const existing = require('fs').readFileSync(envPath, 'utf-8');
    const match = existing.match(/AGENT_API_KEY=(.+)/);
    if (match && match[1].trim()) {
      console.log('이미 등록된 PC입니다.');
      console.log(`API Key: ${match[1].trim().substring(0, 20)}...`);
      const answer = await ask('다시 등록하시겠습니까? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('설치 완료. start.bat으로 실행하세요.');
        process.exit(0);
      }
    }
  }

  // PC 이름 입력
  let pcName = process.argv[2];
  if (!pcName) {
    pcName = await ask('이 PC의 이름을 입력하세요 (예: 집PC, 회사PC): ');
  }

  if (!pcName) {
    console.error('PC 이름을 입력해주세요.');
    process.exit(1);
  }

  // Supabase에 등록
  console.log('');
  console.log(`"${pcName}" 등록 중...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const apiKey = `acp_${randomBytes(24).toString('hex')}`;

  const { data, error } = await supabase
    .from('agents')
    .insert({ name: pcName, api_key: apiKey })
    .select()
    .single();

  if (error) {
    console.error('등록 실패:', error.message);
    process.exit(1);
  }

  // .env 파일 생성
  const envContent = [
    `SUPABASE_URL=${SUPABASE_URL}`,
    `SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}`,
    `AGENT_API_KEY=${apiKey}`,
    '',
  ].join('\n');

  writeFileSync(envPath, envContent, 'utf-8');

  console.log('');
  console.log('================================================================');
  console.log('  등록 완료!');
  console.log('================================================================');
  console.log('');
  console.log(`  PC 이름: ${pcName}`);
  console.log(`  PC ID:   ${data.id}`);
  console.log(`  API 키:  ${apiKey.substring(0, 20)}...`);
  console.log('');
  console.log('  .env 파일이 자동 생성되었습니다.');
  console.log('  start.bat 를 더블클릭하면 Agent가 시작됩니다.');
  console.log('');
  console.log('  웹: https://agent-control-panel-phi.vercel.app');
  console.log('  이메일: admin@acp.local');
  console.log('  비밀번호: AcpAdmin2026!');
  console.log('');
}

main().catch((err) => {
  console.error('오류:', err.message);
  process.exit(1);
});
