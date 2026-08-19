import type { Tier } from "@/lib/tier";

const COLOR_CLASSES: Record<Tier["color"], string> = {
  gold: "border-warn-line bg-warn-tint text-warn",
  mint: "border-accent-line bg-accent-tint text-accent",
};

export default function TierBadge({ tier, className = "" }: { tier: Tier; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-caption font-bold ${COLOR_CLASSES[tier.color]} ${className}`}
    >
      <span>{tier.emoji}</span>
      <span>{tier.label}</span>
    </span>
  );
}
