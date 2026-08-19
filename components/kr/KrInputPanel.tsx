"use client";
// Fixed header shown on every /kr page — same collapsed/expanded top-bar
// pattern as components/us/UsInputPanel.tsx, scoped down to the one field
// /kr actually has data to compare (annual income). Gender/marital status/age
// band are shown as disabled pills with a "준비중" badge rather than left out
// entirely, so visitors can see what's coming rather than wondering why /kr
// looks thinner than /us — see data/kr/regionIncome.json's meta.note for why
// no per-demographic regional data exists yet.
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Home } from "lucide-react";
import { translations } from "@/lib/i18n";
import { formatManwonCompact } from "@/lib/krFormat";
import { readKrInputFromSearch, buildKrSearchParams, type KrInput } from "@/lib/krInput";

const HEADER_HEIGHT = 56;

export { readKrInputFromSearch };

// All-caps eyebrow micro-label — one of the few spots allowed below
// `caption` (tailwind.config.ts's fontSize comment): at full caption size
// these read as competing body text rather than a label.
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{children}</label>;
}

function ComingSoonBadge({ label }: { label: string }) {
  // Same micro-label exception as FieldLabel — a badge pill, not body copy.
  return (
    <span className="rounded-full border border-border bg-bg-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
      {label}
    </span>
  );
}

function DisabledPillGroup({ label, options, badge }: { label: string; options: string[]; badge: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <FieldLabel>{label}</FieldLabel>
        <ComingSoonBadge label={badge} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <span
            key={o}
            aria-disabled
            className="cursor-not-allowed rounded-full border border-border bg-surface px-3 py-1.5 text-caption font-semibold text-text-tertiary"
          >
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}

function digitsOf(text: string): string {
  return text.replace(/\D/g, "");
}

function formatDigits(digits: string): string {
  return digits ? Number(digits).toLocaleString("ko-KR") : "";
}

function IncomeField({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [text, setText] = useState(() => formatDigits(String(Math.round(value))));

  // Commits on every keystroke (not just onBlur) so `form` state/the URL's
  // `?d=` always match what's on screen. This used to commit only on blur,
  // which raced with map/list clicks: clicking a region blurs the input and
  // navigates in the same event tick, so the click's handler could read the
  // pre-commit URL before React ever applied the blur's state update. See
  // app/KrHomeClient.tsx's handleSelect / app/[region]/KrRegionClient.tsx's
  // handleSelectGu, which build their destination URL from the current
  // search params — committing immediately means those params are already
  // current by the time any click can happen.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = digitsOf(input.value.slice(0, caret)).length;
    const digits = digitsOf(input.value);
    const formatted = formatDigits(digits);

    input.value = formatted;
    let newCaret = formatted.length;
    if (digitsBeforeCaret === 0) {
      newCaret = 0;
    } else {
      let seen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/[0-9]/.test(formatted[i])) seen++;
        if (seen === digitsBeforeCaret) {
          newCaret = i + 1;
          break;
        }
      }
    }
    input.setSelectionRange(newCaret, newCaret);
    setText(formatted);

    const n = Number(digits);
    if (digits !== "" && Number.isFinite(n) && n > 0) {
      onCommit(n);
    }
  }

  // Only handles the "left the field empty" cleanup now — real commits
  // already happened in handleChange above.
  function handleBlur() {
    const digits = digitsOf(text);
    const n = Number(digits);
    const committed = digits !== "" && Number.isFinite(n) && n > 0 ? n : value;
    setText(formatDigits(String(committed)));
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          data-testid="kr-income-input"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          className="input font-semibold tabular-nums"
        />
        <span className="text-body font-semibold text-text-tertiary">만원</span>
      </div>
    </div>
  );
}

export default function KrInputPanel() {
  const t = translations.ko;
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const [form, setForm] = useState<KrInput>(() => readKrInputFromSearch(sp));
  const [expanded, setExpanded] = useState(() => !sp.get("d"));
  // Collapsed by default — these three fields are all "준비중" (no data
  // behind them yet), so leading with them above the one field that actually
  // does something pushed the real income input below the fold on mobile.
  const [showDemographics, setShowDemographics] = useState(false);

  function apply(next: KrInput) {
    setForm(next);
    const params = new URLSearchParams(sp.toString());
    params.set("d", String(next.annualIncome));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const summary = formatManwonCompact(form.annualIncome);
  const homeHref = `/?${buildKrSearchParams(form, "ko").toString()}`;

  return (
    <>
      <div
        className={`inset-x-0 top-0 z-40 border-b border-border bg-overlay backdrop-blur-md ${expanded ? "relative" : "fixed"}`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 sm:px-6" style={{ height: HEADER_HEIGHT }}>
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href={homeHref}
              aria-label={t.home}
              className="touch-target flex shrink-0 items-center justify-center rounded-full px-1.5 text-text-secondary transition-colors hover:bg-bg-subtle hover:text-accent"
            >
              <Home className="h-4 w-4" />
            </Link>
            <Link href={homeHref} className="group flex min-w-0 items-baseline gap-2">
              <span className="truncate text-body font-extrabold tracking-tight text-text transition-colors group-hover:text-accent">
                {t.krAppTitle}
              </span>
              <span className="hidden truncate text-caption text-text-tertiary sm:inline">{t.krMastheadTagline}</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse input panel" : "Expand input panel"}
            className="touch-target flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-bg-subtle px-3 text-caption font-semibold text-text-secondary transition-colors hover:border-accent/40 hover:text-text"
          >
            <span data-testid="kr-income-summary" className="max-w-[140px] truncate sm:max-w-[280px]">{summary}</span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {expanded && (
          <div className="mx-auto max-w-5xl px-4 pb-5 sm:px-6">
            <div className="flex flex-col gap-5 border-t border-border pt-4">
              <h2 className="text-caption font-bold uppercase tracking-wide text-accent">{t.krInputTitle}</h2>

              <div>
                <h3 className="mb-2.5 text-caption font-semibold text-text-secondary">{t.krGroupMoney}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <IncomeField
                    label={t.krFieldIncome}
                    value={form.annualIncome}
                    onCommit={(v) => apply({ ...form, annualIncome: v })}
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowDemographics((v) => !v)}
                  aria-expanded={showDemographics}
                  className="flex items-center gap-1.5 text-caption font-semibold text-text-secondary transition-colors hover:text-text"
                >
                  {t.krGroupWho}
                  <ComingSoonBadge label={t.krComingSoonBadge} />
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDemographics ? "rotate-180" : ""}`} />
                  <span className="text-text-tertiary">{showDemographics ? t.krDemographicToggleHide : t.krDemographicToggleShow}</span>
                </button>
                {showDemographics && (
                  <>
                    <div className="mt-2.5 flex flex-col gap-3 sm:flex-row sm:gap-6">
                      <DisabledPillGroup label={t.krFieldGender} options={["남성", "여성"]} badge={t.krComingSoonBadge} />
                      <DisabledPillGroup label={t.krFieldMarital} options={["미혼", "기혼"]} badge={t.krComingSoonBadge} />
                      <DisabledPillGroup
                        label={t.krFieldAgeBand}
                        options={["20대", "30대", "40대", "50대+"]}
                        badge={t.krComingSoonBadge}
                      />
                    </div>
                    <p className="mt-2 text-caption text-text-tertiary">{t.krDemographicComingSoonNote}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {!expanded && <div style={{ height: HEADER_HEIGHT }} aria-hidden />}
    </>
  );
}
