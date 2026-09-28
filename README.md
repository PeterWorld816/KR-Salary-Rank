# 🇰🇷 내 소득 상위 몇 %?

지도에서 시/도(또는 시군구)를 고르고 연 소득을 입력하면, 국세청 국세통계 기준 지역 평균과
비교해 내 소득이 어디쯤인지 바로 확인할 수 있는 사이트입니다. 모든 계산은 브라우저 안에서만
이뤄집니다 — API 호출도, 백엔드도 없습니다.

---

## 데이터 & 계산 로직

- `data/kr/regionIncome.json` — 전국·17개 시/도·KOSIS 2023년 귀속 상세표의 228개 행
  (217개는 지도 코드와 직접 연결되고, 11개는 공식 자료가 시 전체 평균으로만 제공), 그리고
  단일 시 경계인 세종에 시/도 총계를 표시하기 위한 지역 행 1개.
  대구·경북 23개 기존 구/군 수치만 더 최신인 2024년 귀속값을 유지합니다.
  모든 평균은 급여총계 금액(백만원)을 신고 인원(명)으로 나누고 만원 단위로 반올림했습니다.
- `data/kr/kosis-income-summary-2023.tsv`, `data/kr/kosis-sgg-income-2023.tsv` —
  KOSIS 표 `DT_133001N_4215`의 공식 집계행 및 시군구 원자료 스냅샷.
- `scripts/update-kr-kosis-income.mjs` — 원자료 스냅샷에서 지역 평균과 지도 코드 연결을 재생성합니다.
- `data/kr/regionMeta.ts` — 17개 시/도 코드와 라우팅 슬러그. 구/시 상세 메타데이터는
  `regionIncome.json`에서 생성되며, 2023년 7월 대구로 편입된 군위군도 현재 시도에 연결합니다.
- `data/kr/skorea-provinces-2018-topo-simple.json` — 시/도 경계 지도.
  출처: [southkorea/southkorea-maps](https://github.com/southkorea/southkorea-maps)
  (통계청 SGIS 원자료를 공공누리 제1유형 라이선스로 가공).
- `lib/krIncomeCalc.ts` — 지역 평균 대비 소득 비교, 추정 백분위 계산.
- `lib/krInput.ts` — 입력 소득을 쿼리 스트링에 담아 `/` → `/[region]` → `/result` 이동 간
  값을 유지하는 코덱.

## 데이터 추가 가이드

KOSIS 표의 최신 수록 연도는 2023년 귀속(자료갱신일 2026-02-20)입니다. 현재 228개 상세 행을
반영했으며, 고양·성남·수원·안산·안양·용인·청주·천안·전주·포항·창원은 공식 표가 구별이 아닌
시 전체 평균만 제공하므로 목록에 시 평균으로 표시합니다. 세종은 하위 구분이 없는 단일 시 경계에
시/도 총계를 그대로 연결합니다. 구별 통계가 없는 평균을 하위 구 경계에 복사하지 않습니다.
읍·면·동별 근로소득 평균은 이 표에서 제공되지 않습니다.

새 KOSIS 자료를 반영할 때에는 원표에서 지역명·급여총계 인원·급여총계 금액을 확인한 후 TSV
스냅샷을 갱신하고 `node scripts/update-kr-kosis-income.mjs`를 실행하세요. 스크립트는 모든
지역명이 현재 시군구 지도 코드와 정확히 매칭되는지 검사하고, 일대일 폴리곤이 없는 시 전체 값은
`aggregation: "city"`로 분리합니다. 집계 단위가 다른 통계를 지도 구별 값처럼 보이게 해서는 안 됩니다.
그 다음 `npm run build`와 E2E를 실행해 지도·목록·결과 화면을 검증합니다.

**주의 — 통계 기준**: `DT_133001N_4215`는 주소지 기준(거주지) 근로소득입니다. 사업체 소재지
기준 통계나 민간 앱의 자체 표본 통계와 섞지 마세요. 이 사이트는 공개 KOSIS 표를 정적으로
스냅샷해 사용하므로 서비스 실행 중 외부 API를 호출하지 않으며, API 키도 포함하지 않습니다.
현재 시군구 지도 경계는 2018년판이라 2026년 행정경계 업데이트와 별도로 관리됩니다.

**주의 — 통계 기준(주소지 vs 근무지) 확인 필수**: 이 사이트가 쓰는 KOSIS 표(DT_133001N_4215)는
"주소지 기준"(거주지) 근로소득입니다. 언론에 자주 나오는 "○○구 평균연봉 1위" 기사 중에는
"근무지(사업체 소재지) 기준"이거나, 핀크·잡코리아 같은 민간 서비스의 자체 유저 설문(전 국민
표본이 아님)인 경우가 섞여 있어 수치가 크게 다릅니다 — 예: 서울 중구는 거주지 기준으로는
이 데이터셋에 아직 없지만, "직장을 둔 회사원 평균 9722만원" 식의 기사는 핀크 자사 앱 설문
(근무지 기준, 3만명 표본)이라 이 표와 기준 자체가 다릅니다. 새 수치를 추가하기 전에 반드시
그 통계가 KOSIS DT_133001N_4215(또는 국세청 보도자료가 직접 인용하는 동일 표)의 "주소지 기준"
수치인지 확인하세요.
- KOSIS 조회 페이지(https://kosis.kr/statHtml/statHtml.do?tblId=DT_133001N_4215&orgId=133)는
  SSO 로그인 리다이렉트가 걸려 있어 자동화된 fetch로는 값을 못 읽습니다 — 브라우저로 직접
  로그인해서 확인해야 합니다.

## 구조

```
app/
  page.tsx / KrHomeClient.tsx        # 홈 — 시/도 지도
  [region]/page.tsx / KrRegionClient.tsx  # 시/도별 시군구 지도 + 결과 진입점
  result/page.tsx                    # 결과 대시보드 (?region=&gu=&d= 로 답변 유지)
  about/ · privacy/ · contact/       # 정적 안내 페이지
data/kr/
  regionIncome.json / regionMeta.ts / skorea-provinces-2018-topo-simple.json
lib/
  krIncomeCalc.ts / krInput.ts / krFormat.ts / krGeo.ts
  i18n.ts                            # 한국어 카피
components/kr/
  KrMap.tsx / KrGeoList.tsx / KrInputPanel.tsx / KrResultCard.tsx
  KrResultDashboard.tsx / KrShell.tsx / KrIncomeLegend.tsx / KrShareCard.tsx
components/
  ShareButtons.tsx                    # Web Share / 이미지 저장 / 카카오톡 공유
```

## 로컬 개발

```bash
npm install
npm run dev
```

http://localhost:3000 을 열면 바로 한국 홈 화면이 뜹니다.

## 배포 (Netlify)

Git 저장소를 Netlify에 연결하면 Next.js 런타임을 자동 감지해 빌드/배포합니다.
CLI로 직접 배포하려면:

```bash
netlify deploy --build --prod
```

**환경변수 체크리스트** (Netlify 대시보드 → Site configuration → Environment variables):

- `NEXT_PUBLIC_SITE_URL` — 없으면 canonical/OG URL이 `http://localhost:3000`으로
  빌드됩니다(빌드 로그에 경고 출력). Netlify가 자동으로 채워주는 `URL`/`DEPLOY_PRIME_URL`이
  fallback으로 쓰이지만(`lib/site-url.ts`), 커스텀 도메인을 쓴다면 이 값을 명시적으로
  설정해야 og:url/canonical이 그 도메인을 가리킵니다.
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` — `lib/ads.ts` 기준, 이게 없으면 프로덕션에서도
  광고가 전혀 렌더링되지 않습니다.

**순서 주의**: 도메인을 Netlify에 먼저 연결한 뒤, 그 실제 도메인 기준으로
위 두 값(특히 `NEXT_PUBLIC_SITE_URL`)을 설정하세요 — 순서가 바뀌면 배포 도메인과
`NEXT_PUBLIC_SITE_URL`이 어긋나 OG 이미지/광고 게이트가 잘못된 호스트를 가리키게 됩니다.

## 의존성 보안

`next`는 14.x 라인의 최신 patch(`14.2.35`)로 고정돼 있습니다 — 이 저장소가 겪던 critical
CVE(및 postcss 취약점 일부)는 이 버전에서 해결됩니다. `d3-color`(react-simple-maps가
내부적으로 쓰는 d3-zoom의 전이 의존성)는 `package.json`의 `overrides`로 3.1.0+에 고정해
ReDoS 취약점(GHSA-36jr-mh4h-2g58)을 막았습니다 — 같은 3.x 라인 안의 minor 업데이트라
호환성 문제가 없습니다.

`npm audit`에 남아있는 나머지 항목은 **의도적으로 미해결 상태**입니다:

- `next`/`postcss`의 남은 high 등급 취약점들은 Next.js **16.x**(메이저 업그레이드)에서만
  고쳐집니다. Next 15/16은 React 19를 요구하므로, 이 업그레이드는 `react`/`react-dom`
  메이저 업그레이드 + `react-simple-maps`/`d3-geo`와의 호환성 재검증이 함께 필요한 별도
  작업입니다.
- `eslint-config-next`/`@next/eslint-plugin-next`/`glob`도 `eslint-config-next@16.x`로
  올려야 해결되는데, 이 버전은 ESLint 9 flat config를 전제로 해서 현재의 `eslint@^8` +
  `.eslintrc` 구조를 함께 마이그레이션해야 합니다. (참고: 이 저장소는 `.eslintrc` 자체가
  아직 커밋되어 있지 않아 `npm run lint`가 최초 설정 프롬프트를 띄웁니다 — 이번 보안
  업데이트와는 무관한 기존 상태입니다.)

두 항목 모두 배포 중인 프로덕션 코드가 아니라 빌드/개발 도구 체인에 걸친 메이저 업그레이드라
별도 작업으로 분리했습니다. 진행하려면 `npm audit fix --force`가 적용할 변경 사항(Next 16 +
React 19 + eslint-config-next 16)을 먼저 검토하세요.

## 공유 기능

`/result`의 결과 카드는 `components/kr/KrShareCard.tsx`(고정 픽셀 크기의 오프스크린
카드 두 종 — 와이드/스토리 9:16)와 `components/ShareButtons.tsx`(Web Share API 공유,
`html-to-image`로 카드/스토리 PNG 저장, 카카오톡 공유)로 구성됩니다.

**카카오톡 공유는 아직 클립보드 복사 폴백입니다.** 카카오 JS SDK로 KakaoTalk 공유 시트를
직접 여는 "카카오톡 공유하기" 버튼(`Kakao.Link.sendDefault`)을 붙이려면:

1. [Kakao Developers](https://developers.kakao.com)에서 앱을 등록하고 **JavaScript 키**를 발급받습니다.
2. 앱 설정의 **플랫폼 → Web**에 배포 도메인(`NEXT_PUBLIC_SITE_URL`과 동일)을 등록합니다.
3. 발급받은 JS 키를 `NEXT_PUBLIC_KAKAO_JS_KEY` 같은 환경변수로 넣고, Kakao SDK 스크립트를
   로드한 뒤 `components/ShareButtons.tsx`의 `handleKakaoShare`를 `Kakao.Link.sendDefault(...)`
   호출로 교체합니다.

키 발급 전까지는 공유 문구 + 링크를 클립보드에 복사하고 "카카오톡에서 붙여넣기"로
안내하는 현재 방식을 유지합니다.

## AdSense

- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 환경변수 — 실제 광고가 로드되는 AdSense 퍼블리셔 ID
  (`lib/ads.ts` 참고; `NEXT_PUBLIC_SITE_URL`이 가리키는 호스트에서만 광고가 렌더링됩니다).
- `public/ads.txt` — 퍼블리셔 ID(`pub-7379794980536826`)가 반영되어 있습니다.
  `NEXT_PUBLIC_ADSENSE_CLIENT_ID`와 항상 동일하게 유지하세요.
