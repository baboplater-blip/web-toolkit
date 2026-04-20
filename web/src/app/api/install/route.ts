import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp, rateLimitedResponse } from '@/lib/rate-limit';

/**
 * POST /api/install
 *
 * 헤더 기반 변형 — install_token 을 Authorization: Bearer <token> 으로 받아서
 * PowerShell 설치 스크립트를 반환. URL 경로에 토큰이 남아 서버·프록시 로그에 새는 것을 방지.
 *
 * 기존 GET /api/install/[token] 은 하위 호환을 위해 유지되지만, 신규 설치 UI 는
 * 이 POST 경로를 우선 사용한다.
 *
 * 권장 curl:
 *   curl -X POST -H "Authorization: Bearer <TOKEN>" https://.../api/install | iex
 */

export const runtime = 'nodejs';

function psError(message: string, status = 400) {
  const body = `Write-Host "[ERROR] ${message.replace(/"/g, '`"')}" -ForegroundColor Red\npause\nexit 1\n`;
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function buildScript(
  req: NextRequest,
  token: string,
): Promise<NextResponse> {
  if (!/^[a-f0-9]{16,64}$/i.test(token)) {
    return psError('Invalid token format.');
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return psError('Server configuration missing.', 500);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: row, error } = await admin
    .from('install_tokens')
    .select('pc_name, used, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (error) return psError('Lookup failed.', 500);
  if (!row) return psError('Invalid token. Generate a new one from the web panel.');
  if (row.used) return psError('Token already used. Generate a new one.');
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return psError('Token expired. Generate a new one.');
  }

  const pcName = String(row.pc_name).replace(/[^\w가-힣\-_ ]/g, '').slice(0, 40);
  const apiBase = new URL(req.url).origin;

  const script = `
$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Agent Control Panel - Installing"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Agent Control Panel - Auto Installer" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PC Name: ${pcName}" -ForegroundColor Green
Write-Host ""

# 1. Node.js
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVer = node --version 2>&1
    Write-Host "       $nodeVer OK" -ForegroundColor Green
} catch {
    Write-Host "       Node.js not found. Installing LTS..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v22.16.0/node-v22.16.0-x64.msi"
    $nodeInstaller = "$env:TEMP\\node-installer.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /quiet /norestart"
    Remove-Item $nodeInstaller
    $env:PATH = "$env:ProgramFiles\\nodejs;$env:PATH"
    Write-Host "       Node.js installed" -ForegroundColor Green
}

# 2. Agent folder
$agentDir = "$env:USERPROFILE\\agent-control-panel"
Write-Host "[2/6] Preparing $agentDir ..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
New-Item -ItemType Directory -Path "$agentDir\\src" -Force | Out-Null

# 3. Download agent source — Vercel 앱 자체가 /_agent 아래에 에이전트 소스를 서빙한다.
Write-Host "[3/6] Downloading agent files..." -ForegroundColor Yellow
$repoUrl = "${apiBase}/_agent"
$files = @(
    "package.json", "tsconfig.json", "ecosystem.config.js",
    "src/index.ts", "src/executor.ts", "src/heartbeat.ts", "src/harness.ts",
    "src/lock.ts", "src/logger.ts", "src/scheduler.ts", "src/register.ts",
    "src/setup.ts", "src/auth.ts", "src/catchup.ts", "src/cron-parser.ts",
    "src/push-notify.ts", "src/wake.ts"
)
$failed = @()
foreach ($file in $files) {
    try {
        Invoke-WebRequest -Uri "$repoUrl/$file" -OutFile "$agentDir\\$file" -UseBasicParsing
    } catch {
        Write-Host "       Warning: Failed to download $file" -ForegroundColor Yellow
        $failed += $file
    }
}
if ($failed.Count -gt 0) {
    Write-Host "       $($failed.Count) file(s) failed: $($failed -join ', ')" -ForegroundColor Red
    Write-Host "       Installation aborted. Re-generate install token and retry." -ForegroundColor Red
    pause; exit 1
}
Write-Host "       Files downloaded ($($files.Count) files)" -ForegroundColor Green

# 4. Exchange install token for api_key
Write-Host "[4/6] Registering PC..." -ForegroundColor Yellow
$registerBody = @{ install_token = "${token}" } | ConvertTo-Json -Compress
try {
    $reg = Invoke-RestMethod -Uri "${apiBase}/api/agent/register" \`
        -Method Post -ContentType "application/json" -Body $registerBody
} catch {
    Write-Host "       Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    pause; exit 1
}
Write-Host "       PC registered (agent_id=$($reg.agent_id))" -ForegroundColor Green

# 5. Write .env
Write-Host "[5/6] Writing .env ..." -ForegroundColor Yellow
@"
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${anonKey}
API_BASE_URL=${apiBase}
AGENT_API_KEY=$($reg.api_key)
AGENT_USER_ID=$($reg.user_id)
"@ | Out-File -FilePath "$agentDir\\.env" -Encoding utf8 -NoNewline

# 6. Install packages + start.bat + launch
Write-Host "[6/6] Installing packages (this may take a minute)..." -ForegroundColor Yellow
Set-Location $agentDir
npm install --silent 2>&1 | Out-Null
Write-Host "       Packages installed" -ForegroundColor Green

@"
@echo off
title Agent Control Panel - Running
cd /d "%~dp0"
npx tsx src/index.ts
pause
"@ | Out-File -FilePath "$agentDir\\start.bat" -Encoding ascii

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Installation complete! Starting agent..." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
npx tsx src/index.ts
`;
  return new NextResponse(script, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  // 설치 스크립트 다운로드 연타 방어 — IP 당 분당 20회.
  const rl = rateLimit({
    key: clientIp(req),
    limit: 20,
    windowMs: 60_000,
    namespace: 'install',
  });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  // Authorization: Bearer <token> 우선, 없으면 요청 body { token } 도 허용.
  const authHeader = req.headers.get('authorization') ?? '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    try {
      const body = (await req.json()) as { token?: string };
      token = String(body?.token ?? '').trim();
    } catch {
      // ignore
    }
  }
  return buildScript(req, token);
}
