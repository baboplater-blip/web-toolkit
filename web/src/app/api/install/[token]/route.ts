import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // service_role key for server-side token validation
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // 토큰 형식 검증 (32자 16진수만 허용 — 인젝션 방지)
  if (!/^[a-f0-9]{16,64}$/i.test(token)) {
    return new NextResponse('Write-Host "ERROR: Invalid token format." -ForegroundColor Red\npause', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    return new NextResponse(
      'Write-Host "ERROR: Server configuration missing." -ForegroundColor Red\npause',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  // 토큰 유효성 확인
  const { data: tokenData, error } = await supabase
    .from('install_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (error || !tokenData) {
    return new NextResponse(
      'Write-Host "ERROR: Invalid or expired token." -ForegroundColor Red\n' +
      'Write-Host "Generate a new one from the web panel."\n' +
      'pause',
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  // 만료 확인
  if (new Date(tokenData.expires_at) < new Date()) {
    return new NextResponse(
      'Write-Host "ERROR: Token expired." -ForegroundColor Red\n' +
      'Write-Host "Generate a new one from the web panel."\n' +
      'pause',
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const pcName = String(tokenData.pc_name).replace(/[^\w가-힣\-_ ]/g, '').slice(0, 40);
  const apiKey = String(tokenData.api_key);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // serviceKey는 위에서 env 존재 확인 완료

  // 토큰을 사용 완료로 마킹
  await supabase
    .from('install_tokens')
    .update({ used: true })
    .eq('id', tokenData.id);

  // PowerShell 설치 스크립트 생성
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

# 1. Check Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVer = node --version 2>&1
    Write-Host "       Node.js $nodeVer found" -ForegroundColor Green
} catch {
    Write-Host "       Node.js not found. Installing..." -ForegroundColor Yellow
    # Download and install Node.js LTS
    $nodeUrl = "https://nodejs.org/dist/v22.16.0/node-v22.16.0-x64.msi"
    $nodeInstaller = "$env:TEMP\\node-installer.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /quiet /norestart"
    Remove-Item $nodeInstaller
    $env:PATH = "$env:ProgramFiles\\nodejs;$env:PATH"
    Write-Host "       Node.js installed" -ForegroundColor Green
}

# 2. Create agent directory
$agentDir = "$env:USERPROFILE\\agent-control-panel"
Write-Host "[2/5] Setting up $agentDir..." -ForegroundColor Yellow
if (Test-Path $agentDir) {
    Write-Host "       Directory exists, updating..." -ForegroundColor Yellow
} else {
    New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
}

# 3. Download agent files from GitHub
Write-Host "[3/5] Downloading agent files..." -ForegroundColor Yellow
$repoUrl = "https://raw.githubusercontent.com/baboplater-blip/agent-control-panel/master/agent-package"
$files = @(
    "package.json",
    "tsconfig.json",
    "ecosystem.config.js",
    "src/index.ts",
    "src/executor.ts",
    "src/heartbeat.ts",
    "src/harness.ts",
    "src/lock.ts",
    "src/logger.ts",
    "src/scheduler.ts",
    "src/register.ts",
    "src/setup.ts"
)

New-Item -ItemType Directory -Path "$agentDir\\src" -Force | Out-Null

foreach ($file in $files) {
    $url = "$repoUrl/$file"
    $dest = "$agentDir\\$file"
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    } catch {
        Write-Host "       Warning: Failed to download $file" -ForegroundColor Yellow
    }
}
Write-Host "       Files downloaded" -ForegroundColor Green

# 4. Create .env file
Write-Host "[4/5] Configuring..." -ForegroundColor Yellow
@"
SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_KEY=${serviceKey}
AGENT_API_KEY=${apiKey}
"@ | Out-File -FilePath "$agentDir\\.env" -Encoding utf8 -NoNewline

# Register agent in DB
$headers = @{
    "apikey" = "${serviceKey}"
    "Authorization" = "Bearer ${serviceKey}"
    "Content-Type" = "application/json"
    "Prefer" = "return=minimal"
}
$body = @{
    name = "${pcName}"
    api_key = "${apiKey}"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "${supabaseUrl}/rest/v1/agents" -Method Post -Headers $headers -Body $body | Out-Null
    Write-Host "       PC registered" -ForegroundColor Green
} catch {
    Write-Host "       PC may already be registered" -ForegroundColor Yellow
}

# 5. Install npm packages
Write-Host "[5/5] Installing packages (this may take a minute)..." -ForegroundColor Yellow
Set-Location $agentDir
npm install --silent 2>&1 | Out-Null
Write-Host "       Packages installed" -ForegroundColor Green

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Agent directory: $agentDir" -ForegroundColor White
Write-Host ""
Write-Host "  To start the agent, run:" -ForegroundColor White
Write-Host "    cd $agentDir" -ForegroundColor Cyan
Write-Host "    npx tsx src/index.ts" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Or double-click start.bat in the agent folder." -ForegroundColor White
Write-Host ""

# Create start.bat
@"
@echo off
title Agent Control Panel - Running
echo.
echo ================================================================
echo   Agent Control Panel - PC Agent
echo ================================================================
echo.
echo   Close this window to stop the agent.
echo   Web: https://agent-control-panel-phi.vercel.app
echo.
cd /d "%~dp0"
npx tsx src/index.ts
pause
"@ | Out-File -FilePath "$agentDir\\start.bat" -Encoding ascii

Write-Host "  Starting agent now..." -ForegroundColor Yellow
Write-Host ""

# Start agent
npx tsx src/index.ts
`;

  return new NextResponse(script, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
