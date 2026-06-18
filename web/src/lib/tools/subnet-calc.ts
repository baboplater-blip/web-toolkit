/**
 * IPv4 서브넷 계산 — 넷마스크·네트워크·브로드캐스트·호스트 범위.
 * (subnet-calc 도구 page.tsx 에서 추출 — 동작 동일)
 */

export interface SubnetResult {
  netmask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  usableHosts: number;
}

const OCTET_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** 점-십진 IPv4 문자열을 32비트 부호 없는 정수로 변환. 형식·범위 오류 시 null. */
export function parseIpv4(ip: string): number | null {
  const match = OCTET_PATTERN.exec(ip.trim());
  if (!match) return null;

  let value = 0;
  for (let i = 1; i <= 4; i += 1) {
    const octet = Number(match[i]);
    if (octet > 255) return null;
    // 선행 0 (예: 01) 은 모호하므로 거부.
    if (match[i].length > 1 && match[i].startsWith('0')) return null;
    value = value * 256 + octet;
  }
  return value >>> 0;
}

/** 32비트 부호 없는 정수를 점-십진 IPv4 문자열로 변환. */
export function formatIpv4(value: number): string {
  const v = value >>> 0;
  return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff].join('.');
}

export function computeSubnet(ipValue: number, prefix: number): SubnetResult {
  // prefix 0 일 때 0xFFFFFFFF << 32 는 JS 에서 정의되지 않으므로 분기 처리.
  const maskValue = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcardValue = (~maskValue) >>> 0;
  const networkValue = (ipValue & maskValue) >>> 0;
  const broadcastValue = (networkValue | wildcardValue) >>> 0;

  // /31, /32 는 사용 가능 호스트 관례가 다르다(호스트 비트 0~1개).
  const totalAddresses = prefix === 32 ? 1 : 2 ** (32 - prefix);
  const usableHosts = totalAddresses > 2 ? totalAddresses - 2 : 0;

  const hasUsableRange = usableHosts > 0;
  const firstHostValue = hasUsableRange ? (networkValue + 1) >>> 0 : networkValue;
  const lastHostValue = hasUsableRange ? (broadcastValue - 1) >>> 0 : broadcastValue;

  return {
    netmask: formatIpv4(maskValue),
    wildcard: formatIpv4(wildcardValue),
    network: formatIpv4(networkValue),
    broadcast: formatIpv4(broadcastValue),
    firstHost: formatIpv4(firstHostValue),
    lastHost: formatIpv4(lastHostValue),
    usableHosts,
  };
}
