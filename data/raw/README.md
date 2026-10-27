# data/raw — 원자료 넣는 곳

여기에 CSV를 넣고 `npm run build:region-data`(= `node scripts/build-region-data.mjs`)를 실행하면
`data/kr/regionIncome.json`이 다시 만들어집니다. 이 폴더에 파일이 없으면 스크립트는
`data/kr/kosis-*-2023.tsv`의 2023년 스냅샷을 씁니다. KOSIS 조회 화면은 로그인 리다이렉트가 걸려 있어
자동으로 받을 수 없으므로, 새 연도가 나오면 브라우저에서 직접 받아야 합니다.

## 1. 시군구별 근로소득 (필수 — 지역 평균의 유일한 출처)

| 항목 | 내용 |
|---|---|
| 사이트 | KOSIS 국가통계포털 — https://kosis.kr/statHtml/statHtml.do?tblId=DT_133001N_4215&orgId=133 |
| 메뉴 경로 | 국내통계 → 주제별 통계 → 노동·임금(또는 기관별 → 국세청) → 국세통계 → 4. 근로소득 → 4-2-15 시군구별 근로소득 연말정산 신고현황(주소지) |
| 표 ID | `DT_133001N_4215` (orgId 133) |
| 조회 설정 | **행**: 주소지(시도, 시군구 — 전체 선택, 전국·시도 합계 포함) / **열**: 항목에서 `급여총계: 인원`, `급여총계: 금액` 두 개만 / **시점**: 최신 연도 하나 |
| 다운로드 | 다운로드 → CSV, UTF-8 |
| 저장할 파일 이름 | `data/raw/kosis-sgg-income-<귀속연도>.csv` (예: `kosis-sgg-income-2024.csv`) |

여러 연도 파일이 있으면 가장 최신 연도 하나만 씁니다.

스크립트가 KOSIS CSV 헤더를 알아보지 못하면 오류 메시지에 실제 헤더를 출력합니다. 이때는
아래 형식으로 바꿔 저장해도 됩니다(구분자는 `,` `|` 탭 모두 가능):

```
parent,name,workerCount,totalPayMillionWon
전국,,20852234,922596468
서울,,4083312,210973264
서울,강남구,238731,20649805
```

- `parent`: `전국` 또는 시/도 약칭(서울·경기·충북…), `name`: 시군구(시/도 합계 행은 빈칸)
- `workerCount`: 급여총계 인원(명), `totalPayMillionWon`: 급여총계 금액(백만원)

KOSIS 다운로드 형식으로는 아직 실제 파일로 테스트하지 않았습니다. 처음 넣을 때 출력 요약
(`realGuRows`, `estimateRows`, `mapPolygonsWithoutValue: 0`)과 `git diff data/kr/regionIncome.json`을 확인하세요.

## 실행 결과

- 실제값: 전국, 17개 시/도, KOSIS에 있는 모든 시군구(`isEstimate: false`)
- 시 전체만 공개된 11개 시는 `aggregation: "city"` 행 하나로 두고, 그 아래 일반구 지도 경계에는
  같은 시 평균을 `isEstimate: true`로 넣습니다. 계산 방식은 스크립트 맨 위 주석과
  `/insights/how-income-percentile-estimate-works`에 설명되어 있습니다.
- 지도 경계 중 값이 없는 곳이 하나라도 남으면 스크립트가 실패합니다.

## 쓰지 않는 자료

- **통계청 지역소득(시도별 1인당 개인소득)**: 근로소득만이 아니라 재산·이전소득까지 포함한
  개념이라 연말정산 평균과 섞지 않습니다.
- **연령대·성별·혼인상태별 지역 소득**: 시군구 단위 공식 표가 없어 화면에서 "준비중"으로 둡니다.
