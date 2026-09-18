import { getOccupationById, type KrOccupation } from "@/data/kr/occupations";
import { estimateTopPercentLogNormal, ratioToMeanPercent } from "@/lib/krIncomeCalc";
import type { KrInput } from "@/lib/krInput";

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
    estimatedTopPercent: estimateTopPercentLogNormal(annualIncomeManwon, occupation.mean),
  };
}

export function adjustedOccupationMean(baseMean: number, occupationId: string, ageBand: KrInput["ageBand"], maritalStatus: KrInput["maritalStatus"]): number {
  const ageFactor = { "20s": 0.82, "30s": 1, "40s": 1.12, "50s": 1.08 }[ageBand];
  const maritalFactor = maritalStatus === "married" ? 1.04 : 0.98;
  return Math.round(baseMean * ageFactor * maritalFactor);
}
