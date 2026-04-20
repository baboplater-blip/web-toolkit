import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

/**
 * 수동 설치(또는 install.bat) 진입점.
 * 더는 Service Role Key 를 알지 않는다. install_token 을 웹에서 생성 후 입력한다.
 *
 * 플로우:
 *   1) API_BASE_URL 확인 (.env 에 없으면 질문)
 *   2) install_token 입력
 *   3) POST {API_BASE_URL}/api/agent/register → api_key / user_id 수신
 *   4) Supabase URL + anon key 는 같은 엔드포인트 응답 혹은 구성 파일에서 가져오기
 *
 * 현재는 단순화를 위해 .env 에 SUPABASE_URL / SUPABASE_ANON_KEY 를 이미 입력 받은 상태를 가정하고,
 * 누락된 경우 공개 기본값(웹앱이 배포된 Vercel 도메인) 도 사용자에게 물어본다.
 */

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

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function writeEnv(data: Record<string, string>) {
  const body =
    Object.entries(data)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n';
  writeFileSync(envPath, body, 'utf-8');
}

async function main() {
  console.log('');
  console.log('================================================================');
  console.log('  Agent Control Panel - Register PC (secure mode)');
  console.log('================================================================');
  console.log('');

  const existing = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf-8')) : {};

  // 기존 등록 확인
  if (existing.AGENT_API_KEY && existing.AGENT_USER_ID) {
    console.log(`이미 등록됨: ${existing.AGENT_API_KEY.substring(0, 20)}...`);
    const answer = await ask('다시 등록할까요? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('완료. start.bat 을 실행하세요.');
      process.exit(0);
    }
  }

  // API_BASE_URL
  let apiBase = existing.API_BASE_URL || process.env.API_BASE_URL || '';
  if (!apiBase) {
    apiBase = await ask('웹 주소 (예: https://agent-control-panel-phi.vercel.app): ');
  }
  apiBase = apiBase.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(apiBase)) {
    console.error('API_BASE_URL 이 올바르지 않습니다.');
    process.exit(1);
  }

  // install_token
  const token = (await ask('설치 토큰 입력 (웹 > PC 추가 에서 받은 16자): ')).trim();
  if (!/^[a-f0-9]{16,64}$/i.test(token)) {
    console.error('토큰 형식이 올바르지 않습니다.');
    process.exit(1);
  }

  // 서버에 등록
  console.log('서버에 등록 중...');
  const res = await fetch(`${apiBase}/api/agent/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ install_token: token }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`등록 실패 (${res.status}): ${body}`);
    process.exit(1);
  }
  const { api_key, user_id, agent_id } = (await res.json()) as {
    api_key: string;
    user_id: string;
    agent_id: string;
  };

  // Supabase 공개 값 확인
  let supabaseUrl = existing.SUPABASE_URL || '';
  let anonKey = existing.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl) {
    supabaseUrl = await ask('SUPABASE_URL (예: https://xxx.supabase.co): ');
  }
  if (!anonKey) {
    anonKey = await ask('SUPABASE_ANON_KEY (공개 값): ');
  }

  writeEnv({
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: anonKey,
    API_BASE_URL: apiBase,
    AGENT_API_KEY: api_key,
    AGENT_USER_ID: user_id,
    // 구형 키는 기록하지 않는다 — 이전 .env 가 있었다면 덮어씀
  });

  console.log('');
  console.log('================================================================');
  console.log('  등록 완료!');
  console.log('================================================================');
  console.log(`  agent_id : ${agent_id}`);
  console.log(`  api_key  : ${api_key.substring(0, 20)}...`);
  console.log('');
  console.log('  start.bat 을 실행하세요.');
  console.log('');
}

main().catch((err) => {
  console.error('오류:', err?.message ?? err);
  process.exit(1);
});
