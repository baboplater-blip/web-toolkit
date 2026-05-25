# 검색엔진 색인 가속 가이드

Web Toolkit 의 페이지를 Google·Naver·Bing 검색에 빠르게 노출시키는 절차.

> 이 작업은 한 번만 하면 된다. 이후 새 페이지가 추가되면 GitHub Actions `seo-ping.yml` 이 IndexNow 로 자동 통보한다.

## 0. 시작 전 준비

| 항목 | 위치 |
|------|------|
| 사이트 URL | `https://agent-control-panel-phi.vercel.app` (또는 사용자 도메인) |
| sitemap | `https://agent-control-panel-phi.vercel.app/sitemap.xml` |
| robots | `https://agent-control-panel-phi.vercel.app/robots.txt` |
| verification 환경변수 | Vercel `Project Settings → Environment Variables` |
| GitHub secrets | 저장소 `Settings → Secrets and variables → Actions` |

## 1. Google Search Console (GSC)

가장 중요. 한국 사용자도 Google 점유율이 절반 이상.

### 1-1. 소유권 확인

1. [https://search.google.com/search-console](https://search.google.com/search-console) 접속 → **속성 추가** → **URL 접두어**
2. URL 입력: `https://agent-control-panel-phi.vercel.app`
3. 확인 방법 중 **HTML 태그** 선택, content 값 복사 (예: `abc123…`)
4. Vercel Dashboard → 프로젝트 → Settings → Environment Variables 에 추가:

   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = abc123...
   ```

5. 변경 사항 반영 위해 master 에 임의 커밋 push (또는 Vercel `Redeploy` 클릭)
6. 배포 완료 후 GSC 의 **확인** 클릭

> 메타 태그는 본 프로젝트의 `web/src/app/layout.tsx` 가 환경변수를 읽어 자동 삽입한다.

### 1-2. sitemap 제출

1. GSC 좌측 메뉴 **Sitemaps**
2. 새 사이트맵 추가: `sitemap.xml` 입력
3. **제출** 클릭
4. 1–3일 안에 "성공 — 122 URL 발견" 상태로 갱신됨

이후 사이트맵 변경은 자동 감지된다. **Google 의 sitemap ping URL 은 2023년 deprecated 됐으니** 수동 재제출 불필요.

### 1-3. URL 검사 (즉시 색인 요청)

특정 페이지를 즉시 색인 큐에 넣고 싶을 때:

1. GSC 상단 검색창에 URL 입력 (예: `https://agent-control-panel-phi.vercel.app/tools/pdf/merge`)
2. **색인 생성 요청** 클릭
3. 하루 ~10개 한도

## 2. Naver Search Advisor

한국 트래픽 비중이 크다면 필수. Google 보다 색인 속도가 느려 더 일찍 등록할수록 좋다.

### 2-1. 소유권 확인

1. [https://searchadvisor.naver.com](https://searchadvisor.naver.com) 로그인 (네이버 계정)
2. **웹마스터도구 → 사이트 등록**
3. 사이트 URL 입력 → **확인** → **HTML 태그** 방식 선택
4. content 값 복사 (예: `xyz789…`)
5. Vercel 환경변수에 추가:

   ```
   NEXT_PUBLIC_NAVER_SITE_VERIFICATION = xyz789...
   ```

6. master push → 배포 완료 후 Naver 의 **확인** 클릭

### 2-2. 사이트맵 제출

1. 등록 완료 후 좌측 **요청 → 사이트맵 제출**
2. URL: `sitemap.xml` 입력 → **확인**
3. 약 1주일 이내 색인 시작

### 2-3. RSS 제출 (선택)

본 프로젝트는 RSS 가 없으므로 스킵.

### 2-4. 모바일 친화성 검사

1. 좌측 **진단 → 모바일 친화성**
2. URL 입력 → **확인**
3. 통과 여부 확인 — 본 프로젝트는 모바일 first 설계라 통과

## 3. Bing Webmaster Tools

Bing 점유율은 낮지만 ChatGPT·Copilot·DuckDuckGo 등이 Bing 색인을 활용해 LLM 답변에 인용된다.

### 3-1. GSC 에서 일괄 가져오기 (가장 쉬움)

1. [https://www.bing.com/webmasters](https://www.bing.com/webmasters) → **Sign in with Google**
2. GSC 소유 사이트 목록이 자동으로 표시됨 → **Import**
3. 사이트맵·소유권 확인까지 자동 완료

### 3-2. 직접 등록 (대안)

1. **Add a site** → URL 입력
2. **HTML Meta Tag** 방식 → content 값 복사
3. Vercel 환경변수:

   ```
   NEXT_PUBLIC_MS_VALIDATE_01 = ...
   ```
4. master push → 배포 완료 후 Bing 의 **Verify** 클릭

## 4. IndexNow 자동 ping

배포 직후 변경 사항을 Bing·Yandex·Seznam·DuckDuckGo 에 즉시 통보한다. Google 은 IndexNow 미지원이므로 GSC 사용.

### 4-1. 키 발급·키 파일 배치

1. 키 생성 — 32자 이상 hex. 예: 터미널에서

   ```bash
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```

   결과 예: `a3b1c2d4e5f6...`

2. `web/public/{KEY}.txt` 파일 생성. 안에는 KEY 와 정확히 동일한 한 줄만 입력. 예:

   ```
   web/public/a3b1c2d4e5f6....txt
   ```

   내용:

   ```
   a3b1c2d4e5f6...
   ```

3. master 에 커밋·푸시 → Vercel 배포 후 `https://agent-control-panel-phi.vercel.app/{KEY}.txt` 로 접근해 키가 노출되는지 확인

### 4-2. GitHub secret 등록

저장소 `Settings → Secrets and variables → Actions → New repository secret`:

```
Name:  INDEXNOW_KEY
Value: a3b1c2d4e5f6...
```

(선택) Variable 도 같이:

```
Name:  NEXT_PUBLIC_SITE_URL
Value: https://agent-control-panel-phi.vercel.app
```

### 4-3. 자동 ping 작동 확인

- master 푸시 후 GitHub Actions 의 **SEO IndexNow ping** workflow 가 실행됨
- 90초 sleep 후 sitemap 을 가져와 IndexNow 에 POST
- 성공 시 로그에 `OK 200` 또는 `OK 202` 표시

### 4-4. 수동 ping (로컬)

대규모 도구 추가·이름 변경 후 즉시 통보하고 싶을 때:

```bash
export INDEXNOW_KEY=a3b1c2d4e5f6...
cd web
npm run seo:ping
```

## 5. 색인 진행 모니터링

### Google

- GSC → **색인 → 페이지**: 색인된 페이지 수와 제외 사유 확인
- GSC → **실적**: 검색 노출·클릭·CTR·평균 게재순위. 첫 데이터는 등록 후 1–2주

### Naver

- Search Advisor → **리포트 → 사이트 통계**: 노출·클릭. 첫 데이터는 등록 후 1–2주
- **요청 → 색인 현황**: 색인된 URL 수

### Bing

- Bing Webmaster → **Reports & data → Page reports**: URL 별 색인 상태
- **Search performance**: 노출·클릭·CTR

## 6. 일반 권장사항

- **신규 도구 추가 후 1–2일 안에는 GSC 의 URL 검사로 즉시 색인 요청**. 그래야 sitemap 자동 발견 (수일~수주) 보다 빠름
- **canonical 충돌 주의**: `/`·`/tools` 둘 다 자기 자신을 canonical 로 함. 같은 콘텐츠가 두 URL 에 노출되면 canonical 위반
- **JSON-LD 구조화 데이터** 는 이미 모든 페이지에 박힘 (WebSite·SearchAction·Organization·BreadcrumbList·ItemList·WebApplication)
- **OG image**: 카테고리별 12장 (`/og/*.png`). 공유 시 자동 표시
- **속도가 색인 순위에 영향**: `docs/lighthouse.md` 의 회귀 점검 절차 준수

## 7. 자주 묻는 문제

### Q. GSC 확인이 안 됨

- Vercel 환경변수 적용 후 **재배포 필수**. 환경변수만 바꾸고 배포 안 하면 메타 태그 안 박힘
- 브라우저 캐시 영향 가능 → 시크릿 창에서 페이지 소스 보기로 `<meta name="google-site-verification">` 확인

### Q. IndexNow 가 403

- 키 파일 (`/{KEY}.txt`) 의 내용과 GHA secret 의 `INDEXNOW_KEY` 가 정확히 일치하는지 확인
- 키 파일이 `https://agent-control-panel-phi.vercel.app/{KEY}.txt` 로 접근 가능한지 (404 면 캐시·배포 누락)

### Q. Naver 색인이 너무 느림

- 정상. 신규 사이트는 2–4주 걸린다
- Search Advisor → **요청 → URL 색인 요청** 으로 핵심 페이지만 우선 등록
- 사이트맵 외에 페이지 간 내부 링크 (랜딩 → 카테고리 → 도구) 가 풍부할수록 빠름. 이미 그렇게 설계됨

### Q. 같은 도구가 두 URL 로 노출됨

- `/tools/compress` 와 `/tools/compress/` (trailing slash) 가 둘 다 색인되면 canonical 충돌
- Vercel 기본 설정상 trailing slash 가 자동 정리됨. GSC 의 **인덱스 > 페이지** 에서 "Alternate page with proper canonical tag" 상태가 정상

## 변경 이력

- _아직 색인 등록 전_ — 본 가이드를 따라 등록 후 첫 등록 일자 기록
