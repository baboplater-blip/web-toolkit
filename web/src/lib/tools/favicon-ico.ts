/**
 * PNG-in-ICO 패커. favicon 도구 전용.
 *
 * ICO 컨테이너는 ICONDIR(6바이트) + ICONDIRENTRY(16바이트 × N) + 이미지 데이터(연속)로 구성된다.
 * 각 엔트리의 이미지 데이터로 BMP 대신 PNG 바이트를 그대로 넣을 수 있다(Vista+ 표준, PNG-in-ICO).
 * 16·32·48px 처럼 작은 크기만 패킹하므로 호환성이 가장 좋다.
 */

interface IcoEntry {
  /** 정사각 변 길이(px). 256 이상은 0으로 기록(스펙). */
  size: number;
  /** 해당 크기의 PNG 바이트. */
  png: Uint8Array;
}

const ICONDIR_SIZE = 6;
const ICONDIRENTRY_SIZE = 16;

/**
 * 여러 PNG(16/32/48 등)를 하나의 .ico 컨테이너로 패킹한다.
 *
 * @param entries 크기별 PNG. 비어 있으면 예외.
 * @returns image/x-icon Blob
 */
export function packIco(entries: IcoEntry[]): Blob {
  if (entries.length === 0) {
    throw new Error('ICO 로 패킹할 이미지가 없습니다.');
  }

  const headerSize = ICONDIR_SIZE + ICONDIRENTRY_SIZE * entries.length;
  const totalSize = entries.reduce((sum, entry) => sum + entry.png.byteLength, headerSize);

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type 1 = icon
  view.setUint16(4, entries.length, true); // image count

  let entryOffset = ICONDIR_SIZE;
  let imageOffset = headerSize;

  for (const entry of entries) {
    // 256px 이상은 0 으로 표기하는 것이 스펙.
    const dim = entry.size >= 256 ? 0 : entry.size;
    view.setUint8(entryOffset + 0, dim); // width
    view.setUint8(entryOffset + 1, dim); // height
    view.setUint8(entryOffset + 2, 0); // color palette (0 = no palette)
    view.setUint8(entryOffset + 3, 0); // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel
    view.setUint32(entryOffset + 8, entry.png.byteLength, true); // image data size
    view.setUint32(entryOffset + 12, imageOffset, true); // image data offset

    bytes.set(entry.png, imageOffset);

    entryOffset += ICONDIRENTRY_SIZE;
    imageOffset += entry.png.byteLength;
  }

  return new Blob([buffer], { type: 'image/x-icon' });
}
