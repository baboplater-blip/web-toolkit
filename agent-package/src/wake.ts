import { networkInterfaces } from 'node:os';
import { createSocket } from 'node:dgram';
import type { SupabaseClient } from '@supabase/supabase-js';
import { log } from './logger';

/**
 * 시작 시 자기 PC 의 primary NIC 에서 MAC + IPv4 를 뽑는다.
 * - 루프백 · 가상 NIC (VMware/VirtualBox) 제외하고 첫 번째 유효 NIC 사용.
 * - 실패해도 null 반환 (WoL 을 못 할 뿐, 에이전트 동작에는 영향 없음).
 */
export function detectPrimaryNetwork(): { mac: string | null; ipv4: string | null } {
  const ifaces = networkInterfaces();
  for (const [name, infos] of Object.entries(ifaces)) {
    if (!infos) continue;
    // VM/가상 NIC 스킵 (MAC 는 있지만 깨울 대상 아님).
    if (/vmware|virtualbox|vEthernet|Hyper-V|Loopback/i.test(name)) continue;
    for (const info of infos) {
      if (
        info.family === 'IPv4' &&
        !info.internal &&
        info.mac &&
        info.mac !== '00:00:00:00:00:00'
      ) {
        return { mac: info.mac.toLowerCase(), ipv4: info.address };
      }
    }
  }
  return { mac: null, ipv4: null };
}

/** MAC 문자열을 6바이트 Buffer 로. 지원 포맷: AA:BB:CC:DD:EE:FF, AA-BB-CC-DD-EE-FF */
function macToBytes(mac: string): Buffer | null {
  const bytes = mac.split(/[:-]/).map((h) => parseInt(h, 16));
  if (bytes.length !== 6 || bytes.some((n) => Number.isNaN(n))) return null;
  return Buffer.from(bytes);
}

/** 표준 Magic Packet: 0xFF 6개 + MAC 16회 반복 = 102 바이트. UDP 9번 포트 브로드캐스트. */
export async function sendMagicPacket(
  targetMac: string,
  broadcast = '255.255.255.255',
): Promise<void> {
  const macBuf = macToBytes(targetMac);
  if (!macBuf) throw new Error(`잘못된 MAC 형식: ${targetMac}`);

  const header = Buffer.alloc(6, 0xff);
  const body = Buffer.concat(Array.from({ length: 16 }, () => macBuf));
  const packet = Buffer.concat([header, body]);

  await new Promise<void>((resolve, reject) => {
    const sock = createSocket('udp4');
    sock.once('error', (err) => {
      sock.close();
      reject(err);
    });
    sock.bind(() => {
      try {
        sock.setBroadcast(true);
      } catch {}
      sock.send(packet, 0, packet.length, 9, broadcast, (err) => {
        sock.close();
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

/** 같은 /24 서브넷인지 검사 (a.b.c.d vs a.b.c.e → true). 둘 중 하나라도 파싱 실패 시 false. */
function sameSubnet(a: string, b: string): boolean {
  const sa = a.split('.');
  const sb = b.split('.');
  if (sa.length !== 4 || sb.length !== 4) return false;
  return sa[0] === sb[0] && sa[1] === sb[1] && sa[2] === sb[2];
}

/**
 * 이 에이전트를 helper 로 가동. 같은 사용자의 다른 에이전트가
 * wake_request_at 을 갱신하면, 내 local_ip 와 타겟의 local_ip 가 같은 서브넷일 때 매직 패킷 전송.
 *
 * Supabase Realtime UPDATE 이벤트 기반. 큰 오버헤드 없이 조용히 돈다.
 */
export function startWakeHelper(
  client: SupabaseClient,
  selfAgentId: string,
  selfLocalIp: string | null,
  userId: string,
): () => void {
  if (!selfLocalIp) {
    log('WoL helper: 내 local_ip 미감지 — 비활성', 'warn');
    return () => {};
  }

  const lastSeenByAgent = new Map<string, number>();

  const channel = client
    .channel(`wake-helper-${selfAgentId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'agents',
      },
      async (payload) => {
        const row = payload.new as {
          id: string;
          user_id?: string;
          mac_address?: string | null;
          local_ip?: string | null;
          wake_request_at?: string | null;
          wake_last_sent_at?: string | null;
          name?: string;
        };

        if (!row.id || row.id === selfAgentId) return;
        if (row.user_id && row.user_id !== userId) return;
        if (!row.wake_request_at) return;
        if (!row.mac_address || !row.local_ip) return;

        // 중복 트리거 억제: 같은 wake_request_at 값은 한 번만 처리.
        const reqTs = new Date(row.wake_request_at).getTime();
        const prev = lastSeenByAgent.get(row.id) ?? 0;
        if (reqTs <= prev) return;
        lastSeenByAgent.set(row.id, reqTs);

        if (!sameSubnet(selfLocalIp, row.local_ip)) {
          log(
            `WoL 요청 수신 but 서브넷 불일치 (me=${selfLocalIp} target=${row.local_ip}) — 스킵`,
          );
          return;
        }

        try {
          await sendMagicPacket(row.mac_address);
          log(`WoL 매직 패킷 전송 → ${row.name ?? row.id} (${row.mac_address})`);
          await client
            .from('agents')
            .update({ wake_last_sent_at: new Date().toISOString() })
            .eq('id', row.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          log(`WoL 전송 실패: ${msg}`, 'warn');
        }
      },
    )
    .subscribe();

  return () => {
    try {
      client.removeChannel(channel);
    } catch {}
  };
}
