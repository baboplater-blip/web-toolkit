import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const LOCK_FILE = join(__dirname, '..', 'agent.pid');

/** PID 파일로 싱글 인스턴스 보장. 이미 실행 중이면 프로세스 종료. */
export function acquireLock(): void {
  if (existsSync(LOCK_FILE)) {
    const oldPid = parseInt(readFileSync(LOCK_FILE, 'utf-8').trim(), 10);
    if (oldPid && isProcessRunning(oldPid)) {
      console.error(`[잠금] Agent가 이미 실행 중입니다 (PID: ${oldPid}).`);
      console.error('       기존 프로세스를 종료하거나 agent.pid 파일을 삭제하세요.');
      process.exit(1);
    }
    // 이전 프로세스가 죽었으면 잠금 파일 정리
    unlinkSync(LOCK_FILE);
  }

  writeFileSync(LOCK_FILE, String(process.pid), 'utf-8');
  console.log(`[잠금] PID ${process.pid} 등록`);
}

export function releaseLock(): void {
  try {
    if (existsSync(LOCK_FILE)) {
      unlinkSync(LOCK_FILE);
    }
  } catch {}
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
