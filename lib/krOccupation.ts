import { getOccupationById, type KrOccupation } from "@/data/kr/occupations";
import { estimateTopPercentLogNormal, ratioToMeanPercent } from "@/lib/krIncomeCalc";
import { clampDisplayPercent } from "@/lib/percentileTable";

export type KrOccupationComparison = {
  occupation: KrOccupation;
  ratioPercent: number;
  estimatedTopPercent: number;
};

export function buildKrOccupationComparison(annualIncomeManwon: number, occupationId: string): KrOccupationComparison {
  const occupation = getOccupationById(occupationId);
  return {
    occupation,
    ratioPercent: ratioToMeanPercent(annualIncomeManwon, occupation.mean),
    estimatedTopPercent: clampDisplayPercent(estimateTopPercentLogNormal(annualIncomeManwon, occupation.mean)),
  };
}
