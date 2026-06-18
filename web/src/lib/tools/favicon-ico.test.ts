import { describe, it, expect } from 'vitest';
import { packIco } from './favicon-ico';

async function bytesOf(blob: Blob): Promise<DataView> {
  const buf = await blob.arrayBuffer();
  return new DataView(buf);
}

describe('packIco (ICO 컨테이너)', () => {
  it('빈 입력은 throw', () => {
    expect(() => packIco([])).toThrow();
  });

  it('ICONDIR 헤더가 올바르다(type=1, count)', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
    const blob = packIco([{ size: 16, png }]);
    expect(blob.type).toBe('image/x-icon');
    const v = await bytesOf(blob);
    expect(v.getUint16(0, true)).toBe(0); // reserved
    expect(v.getUint16(2, true)).toBe(1); // type icon
    expect(v.getUint16(4, true)).toBe(1); // count
  });

  it('엔트리 크기·오프셋·데이터가 정확하다', async () => {
    const png = new Uint8Array([10, 20, 30, 40, 50]);
    const blob = packIco([{ size: 32, png }]);
    const v = await bytesOf(blob);
    const entry = 6; // ICONDIR 다음
    expect(v.getUint8(entry + 0)).toBe(32); // width
    expect(v.getUint8(entry + 1)).toBe(32); // height
    expect(v.getUint16(entry + 4, true)).toBe(1); // color planes
    expect(v.getUint16(entry + 6, true)).toBe(32); // bpp
    expect(v.getUint32(entry + 8, true)).toBe(png.byteLength); // 데이터 크기
    const dataOffset = v.getUint32(entry + 12, true);
    expect(dataOffset).toBe(6 + 16); // 헤더 + 엔트리 1개
    // 실제 PNG 바이트가 오프셋 위치에 복사됨
    for (let i = 0; i < png.length; i += 1) {
      expect(v.getUint8(dataOffset + i)).toBe(png[i]);
    }
  });

  it('256px 이상은 width/height 0 으로 기록(스펙)', async () => {
    const blob = packIco([{ size: 256, png: new Uint8Array([1, 2]) }]);
    const v = await bytesOf(blob);
    expect(v.getUint8(6)).toBe(0);
    expect(v.getUint8(7)).toBe(0);
  });

  it('다중 엔트리는 count 와 누적 오프셋이 맞다', async () => {
    const a = new Uint8Array([1, 1, 1]);
    const b = new Uint8Array([2, 2, 2, 2]);
    const blob = packIco([
      { size: 16, png: a },
      { size: 32, png: b },
    ]);
    const v = await bytesOf(blob);
    expect(v.getUint16(4, true)).toBe(2);
    const header = 6 + 16 * 2;
    expect(v.getUint32(6 + 12, true)).toBe(header); // 첫 데이터 오프셋
    expect(v.getUint32(6 + 16 + 12, true)).toBe(header + a.byteLength); // 둘째
  });
});
