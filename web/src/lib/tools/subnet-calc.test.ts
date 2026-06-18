import { describe, it, expect } from 'vitest';
import { parseIpv4, formatIpv4, computeSubnet } from './subnet-calc';

describe('parseIpv4 / formatIpv4', () => {
  it('점-십진 ↔ 정수 왕복', () => {
    const v = parseIpv4('192.168.0.1')!;
    expect(formatIpv4(v)).toBe('192.168.0.1');
  });
  it('0.0.0.0 / 255.255.255.255', () => {
    expect(parseIpv4('0.0.0.0')).toBe(0);
    expect(parseIpv4('255.255.255.255')).toBe(0xffffffff >>> 0);
  });
  it('범위 초과 옥텟 거부', () => {
    expect(parseIpv4('256.0.0.1')).toBeNull();
    expect(parseIpv4('192.168.0')).toBeNull();
  });
  it('선행 0 거부', () => {
    expect(parseIpv4('192.168.01.1')).toBeNull();
  });
});

describe('computeSubnet', () => {
  it('/24 표준 (호스트 254)', () => {
    const r = computeSubnet(parseIpv4('192.168.0.1')!, 24);
    expect(r.netmask).toBe('255.255.255.0');
    expect(r.wildcard).toBe('0.0.0.255');
    expect(r.network).toBe('192.168.0.0');
    expect(r.broadcast).toBe('192.168.0.255');
    expect(r.firstHost).toBe('192.168.0.1');
    expect(r.lastHost).toBe('192.168.0.254');
    expect(r.usableHosts).toBe(254);
  });
  it('/16 호스트 65534', () => {
    const r = computeSubnet(parseIpv4('10.0.5.9')!, 16);
    expect(r.netmask).toBe('255.255.0.0');
    expect(r.network).toBe('10.0.0.0');
    expect(r.broadcast).toBe('10.0.255.255');
    expect(r.usableHosts).toBe(65534);
  });
  it('/0 전체 주소공간', () => {
    const r = computeSubnet(parseIpv4('1.2.3.4')!, 0);
    expect(r.netmask).toBe('0.0.0.0');
    expect(r.usableHosts).toBe(2 ** 32 - 2);
  });
  it('/31, /32 는 사용 호스트 0', () => {
    expect(computeSubnet(parseIpv4('192.168.0.1')!, 31).usableHosts).toBe(0);
    expect(computeSubnet(parseIpv4('192.168.0.1')!, 32).usableHosts).toBe(0);
  });
});
