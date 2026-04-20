import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/install/[token]
 *
 * 원클릭 PowerShell 설치 스크립트를 반환한다.
 * 예전 구현은 스크립트 안에 Service Role Key 를 박아서 PC 에 내려보냈지만,
 * 현재는 토큰 유효성만 확인 후, 스크립트가 `/api/agent/register` 로 api_key 를 받아오도록 바뀌었다.
 *
 * 설치 PC 에 저장되는 값은: SUPABASE_URL, SUPABASE_ANON_KEY, AGENT_API_KEY, AGENT_USER_ID, API_BASE_URL.
 * Service Role Key / JWT Secret 은 서버 밖으로 나가지 않는다.
 */

export const runtime = 'nodejs';

function psError(message: string, status = 400) {
  const body = `Write-Host "[ERROR] ${message.replace(/"/g, '`"')}" -ForegroundColor Red\npause\nexit 1\n`;
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!/^[a-f0-9]{16,64}$/i.test(token)) {
    return psError('Invalid token format.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return psError('Server configuration missing.', 500);
  }

  // 토큰 존재/만료만 확인 — 실제 소비(used=true)는 /api/agent/register 가 담당
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
  const apiBase = new URL(_req.url).origin;

  // 스크립트는 runtime 에 /api/agent/register 를 호출해 api_key 를 돌려받고,
  // 첫 기동 시 /api/agent/auth 로 짧은 수명의 JWT 를 교환한다.
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

# 4. Exchange install token for api_key (no secrets downloaded)
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

# 5. Write .env (anon key + api_key only — no service role key)
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
