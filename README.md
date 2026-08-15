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
