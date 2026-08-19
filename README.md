# 🇰🇷 내 소득 상위 몇 %?

지도에서 시/도(또는 시군구)를 고르고 연 소득을 입력하면, 국세청 국세통계 기준 지역 평균과
비교해 내 소득이 어디쯤인지 바로 확인할 수 있는 사이트입니다. 모든 계산은 브라우저 안에서만
이뤄집니다 — API 호출도, 백엔드도 없습니다.

---

## 데이터 & 계산 로직

- `data/kr/regionIncome.json` — 시/도·시군구별 평균 소득. 출처: 국세청 국세통계 4.2.15
  (시군구별 근로소득 연말정산 신고현황, 2023년 귀속) 및 국세청 2024.12 4차 국세통계 브리핑.
  아직 실측치가 없는 지역은 추정치로 채우지 않고 "준비중"으로만 표시합니다.
- `data/kr/regionMeta.ts` — 17개 시/도 및 시군구 라우팅 슬러그, KOSIS/SGIS 2자리 지역 코드.
- `data/kr/skorea-provinces-2018-topo-simple.json` — 시/도 경계 지도.
  출처: [southkorea/southkorea-maps](https://github.com/southkorea/southkorea-maps)
  (통계청 SGIS 원자료를 공공누리 제1유형 라이선스로 가공).
- `lib/krIncomeCalc.ts` — 지역 평균 대비 소득 비교, 추정 백분위 계산.
- `lib/krInput.ts` — 입력 소득을 쿼리 스트링에 담아 `/` → `/[region]` → `/result` 이동 간
  값을 유지하는 코덱.

## 데이터 추가 가이드

지금은 17개 시/도 중 서울·인천·울산·경기 4곳만 시군구(구/시) 단위 데이터가 있고,
나머지는 시/도 전체 평균만 있습니다 (`data/kr/regionMeta.ts`의 `KR_GU` 참고). 새 시군구
수치를 확보했다면 아래 순서대로 반영하세요 — 시군구 지도(`skorea-municipalities-2018-topo-simple.json`)는
이미 전국 단위로 들어 있어서, 처음 추가하는 시/도라도 지도 데이터를 따로 구할 필요는 없습니다.

1. **출처 확인 및 표기** — KOSIS/국세청 등 실측 자료의 정확한 표(예: "국세통계 4.2.15
   시군구별 근로소득 연말정산 신고현황")와 귀속연도를 확인하고, `data/kr/regionIncome.json`의
   `meta.source`/`meta.asOf`에 기존 표기 형식(표 이름 + tblId/orgId + 교차확인한 보도자료가
   있다면 함께)을 맞춰 이어붙이세요. **추정치로 빈 칸을 채우지 마세요** — 수치가 없으면
   "준비중"으로 남겨두는 게 이 사이트의 원칙입니다 (`meta.note` 참고).
2. **`regionIncome.json`에 행 추가** — `regions` 배열에
   `{ "name": "...", "level": "gu", "parent": "<시/도 정식 명칭>", "mean": <만원> }`을 추가합니다.
   `name`은 `regionMeta.ts`의 `GuMeta.name`과, `parent`는 해당 시/도의 `SidoMeta.name`과
   반드시 문자 그대로 일치해야 합니다 (조회가 이름 매칭 기반이라 — `lib/krIncomeCalc.ts`의
   `getRegionIncomeByName`).
3. **`meta.note` 갱신** — 어떤 구를 새로 확보했고 어떤 구가 아직 "준비중"으로 남아있는지
   설명을 최신 상태로 고치세요.
4. **`regionMeta.ts`의 `KR_GU` 갱신** — 이미 `available: false`로 등록된 구라면 `available: true`로
   바꾸고, 아예 새로운 구(또는 새로운 시/도의 첫 구)라면 항목을 추가하세요. `code`는 시군구
   topojson feature의 5자리 코드(앞 2자리가 그 시/도의 `SidoMeta.code`와 일치)여야 합니다 —
   `data/kr/skorea-municipalities-2018-topo-simple.json`에서 해당 구의 `properties.code`를
   확인하면 됩니다.
5. **순서가 중요합니다**: 2·4번을 같이 반영하지 않으면 화면에 "준비중"과 실제 평균이 어긋나게
   표시됩니다 — `getAvailableGusForSido()`(`lib/krIncomeCalc.ts`)가 `KR_GU`의 `available: true`
   항목 중 `regionIncome.json`에 실제로 값이 있는 것만 골라내는 구조라, 둘 중 하나만 바꾸면
   그 구가 계속 "준비중"으로 보이거나(코드만 available) 조용히 목록에서 빠집니다(데이터만 추가).
6. `npm run build`로 새 시/도·구가 정적 페이지로 잘 빌드되는지 확인하세요 — `app/[region]/page.tsx`의
   `generateStaticParams`는 `available: true`인 시/도만 미리 빌드합니다.

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
  KrResultDashboard.tsx / KrShell.tsx / KrIncomeLegend.tsx
```

## 로컬 개발

```bash
npm install
npm run dev
```

http://localhost:3000 을 열면 바로 한국 홈 화면이 뜹니다.

## 배포 (Vercel)

```bash
vercel
```

## AdSense

- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 환경변수 — 실제 광고가 로드되는 AdSense 퍼블리셔 ID
  (`lib/ads.ts` 참고; `NEXT_PUBLIC_SITE_URL`이 가리키는 호스트에서만 광고가 렌더링됩니다).
- `public/ads.txt` — 퍼블리셔 ID(`pub-7379794980536826`)가 반영되어 있습니다.
  `NEXT_PUBLIC_ADSENSE_CLIENT_ID`와 항상 동일하게 유지하세요.
