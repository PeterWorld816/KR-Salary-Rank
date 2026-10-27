"use client";
// Fixed header shown on every /kr page — same collapsed/expanded top-bar
// pattern as components/us/UsInputPanel.tsx, scoped down to the one field
// /kr actually has data to compare (annual income). Gender/marital status/age
// band are shown as disabled pills with a "준비중" badge rather than left out
// entirely, so visitors can see what's coming rather than wondering why /kr
// looks thinner than /us — see data/kr/regionIncome.json's meta.note for why
// no per-demographic regional data exists yet.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Home } from "lucide-react";
import { translations } from "@/lib/i18n";
import { formatManwonCompact } from "@/lib/krFormat";
import type { KrInput } from "@/lib/krInput";
import { consumeKrInputFromUrl, getKrInputState, setKrInput, useKrInput } from "@/lib/krInputStore";
import { KR_OCCUPATIONS } from "@/data/kr/occupations";

const HEADER_HEIGHT = 56;

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

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

  // The store can change underneath us (sessionStorage/share link loaded
  // after the first render) — follow it unless it already matches the text.
  useEffect(() => {
    if (Number(digitsOf(text)) !== Math.round(value)) setText(formatDigits(String(Math.round(value))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Commits on every keystroke (not just onBlur) so the shared input store
  // always matches what's on screen. Committing only on blur raced with
  // map/list clicks: clicking a region blurs the input and navigates in the
  // same event tick, so the next page could read the pre-commit value.
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

function OccupationField({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const t = translations.ko;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = KR_OCCUPATIONS.find((occupation) => occupation.id === value) ?? KR_OCCUPATIONS[0];

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <FieldLabel>{t.krFieldOccupation}</FieldLabel>
      <button
        type="button"
        data-testid="kr-occupation-select"
        role="combobox"
        aria-expanded={open}
        aria-controls="kr-occupation-options"
        onClick={() => setOpen((current) => !current)}
        className="input flex items-center justify-between text-left font-semibold"
      >
        <span>{selected.name}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id="kr-occupation-options" role="listbox" className="absolute inset-x-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border-strong bg-bg shadow-lg">
          {KR_OCCUPATIONS.map((occupation) => (
            <button
              key={occupation.id}
              type="button"
              role="option"
              aria-selected={occupation.id === selected.id}
              onClick={() => {
                onCommit(occupation.id);
                setOpen(false);
              }}
              className={`block min-h-0 w-full px-4 py-3 text-left text-body transition-colors ${
                occupation.id === selected.id
                  ? "bg-accent-tint font-bold text-accent"
                  : "text-text-secondary hover:bg-bg-subtle hover:text-text"
              }`}
            >
              {occupation.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KrInputPanel() {
  const t = translations.ko;
  const form = useKrInput();
  // Open until the visitor has entered something. Starts open to match the
  // server HTML, then collapses before paint once the store says otherwise.
  const [expanded, setExpanded] = useState(true);
  // Collapsed by default — these three fields are all "준비중" (no data
  // behind them yet), so leading with them above the one field that actually
  // does something pushed the real income input below the fold on mobile.
  const [showDemographics, setShowDemographics] = useState(false);

  useIsomorphicLayoutEffect(() => {
    // Share links / old `?d=` links: load into the store, then clean the URL.
    consumeKrInputFromUrl();
    if (getKrInputState().touched) setExpanded(false);
  }, []);

  // Values only go into React state + sessionStorage, never the address bar.
  function apply(next: KrInput) {
    setKrInput(next);
  }

  const summary = formatManwonCompact(form.annualIncome);
  const homeHref = "/";

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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <OccupationField value={form.occupationId} onCommit={(occupationId) => apply({ ...form, occupationId })} />
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
