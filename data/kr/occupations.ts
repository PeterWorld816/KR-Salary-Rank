export type KrOccupation = {
  id: string;
  name: string;
  mean: number; // 만원, approximate pre-tax annual average
};

// Broad occupation groups keep the picker useful without pretending to have
// precise salary data for every individual job title.
export const KR_OCCUPATIONS: KrOccupation[] = [
  { id: "general", name: "전체 직업 평균", mean: 4425 },
  { id: "software", name: "소프트웨어 개발자", mean: 5600 },
  { id: "data", name: "데이터·AI 전문가", mean: 5900 },
  { id: "doctor", name: "의사", mean: 12500 },
  { id: "nurse", name: "간호사", mean: 4300 },
  { id: "pharmacist", name: "약사", mean: 6800 },
  { id: "teacher", name: "교사", mean: 5200 },
  { id: "accountant", name: "회계·세무 전문가", mean: 5400 },
  { id: "designer", name: "디자이너", mean: 3900 },
  { id: "marketer", name: "마케팅·홍보 전문가", mean: 4500 },
  { id: "sales", name: "영업·판매 종사자", mean: 4100 },
  { id: "public", name: "공무원", mean: 4700 },
  { id: "engineer", name: "기계·전기 엔지니어", mean: 5200 },
  { id: "researcher", name: "연구원", mean: 5700 },
  { id: "service", name: "서비스 종사자", mean: 3200 },
  { id: "manufacturing", name: "생산·제조 종사자", mean: 4000 },
];

export function getOccupationById(id: string): KrOccupation {
  return KR_OCCUPATIONS.find((occupation) => occupation.id === id) ?? KR_OCCUPATIONS[0];
}
