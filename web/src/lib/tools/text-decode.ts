/**
 * 텍스트 파일을 인코딩을 추정해 읽는다(CSV·vCard 등 문서 도구용).
 *
 * 한국어 엑셀·구형 프로그램이 저장한 CSV/VCF 는 CP949(EUC-KR)인 경우가 많아 `file.text()`(UTF-8)로
 * 읽으면 한글이 "���" 로 깨진다. UTF-8 로 먼저 해석하고, 깨짐 문자(U+FFFD)가 나오면 EUC-KR 로 다시
 * 해석한다. 앞의 BOM 은 제거한다.
 */
export async function readTextAutoEncoding(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text = new TextDecoder('utf-8').decode(bytes);
  if (text.includes('�')) {
    try {
      const alt = new TextDecoder('euc-kr').decode(bytes);
      // EUC-KR 해석이 깨짐 문자를 더 적게 만들 때만 채택
      const bad = (s: string) => s.split('�').length - 1;
      if (bad(alt) < bad(text)) text = alt;
    } catch {
      /* 디코더 미지원 시 UTF-8 결과 유지 */
    }
  }
  return text.replace(/^﻿/, '');
}
