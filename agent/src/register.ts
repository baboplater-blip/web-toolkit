/**
 * 새 PC를 Agent로 등록하는 유틸리티 스크립트
 * 사용법: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx src/register.ts "PC 이름"
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const AGENT_USER_ID = process.env.AGENT_USER_ID;
const PC_NAME = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('환경변수를 설정하세요: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

if (!PC_NAME) {
  console.error('사용법: npx tsx src/register.ts "PC 이름"');
  process.exit(1);
}

if (!AGENT_USER_ID) {
  console.error('환경변수 AGENT_USER_ID 가 필요합니다.');
  console.error('.env 파일에 AGENT_USER_ID=<소유자 UUID> 를 추가하세요.');
  process.exit(1);
}

async function register() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const apiKey = `acp_${randomBytes(24).toString('hex')}`;

  const { data, error } = await supabase
    .from('agents')
    .insert({
      name: PC_NAME,
      api_key: apiKey,
      user_id: AGENT_USER_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('등록 실패:', error.message);
    process.exit(1);
  }

  console.log('=== PC 등록 완료 ===');
  console.log(`이름: ${data.name}`);
  console.log(`ID: ${data.id}`);
  console.log(`API 키: ${apiKey}`);
  console.log('');
  console.log('이 API 키를 해당 PC의 .env 파일에 설정하세요:');
  console.log(`AGENT_API_KEY=${apiKey}`);
}

register();
