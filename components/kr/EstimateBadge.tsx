// Small "추정" pill for regions whose value is borrowed from a wider area
// (KrRegionIncome.isEstimate). Hover/focus shows `note`; inside buttons or
// scroll containers pass `inline` to fall back to the native title tooltip,
// since a nested focusable element / absolutely-positioned popup would be
// invalid or clipped there.
export default function EstimateBadge({ note, inline = false }: { note: string; inline?: boolean }) {
  const pill = (
    <span className="shrink-0 rounded-full border border-warn-line bg-warn-tint px-1.5 py-0.5 text-[10px] font-bold leading-none text-warn">
      추정
    </span>
  );
  if (inline) {
    return (
      <span title={note} aria-label={`추정치: ${note}`} className="inline-flex">
        {pill}
      </span>
    );
  }
  return (
    <span tabIndex={0} aria-label={`추정치: ${note}`} className="group relative inline-flex cursor-help align-middle outline-none">
      {pill}
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-50 mt-1.5 w-60 rounded-lg border border-border-strong bg-bg px-3 py-2 text-caption font-normal leading-relaxed text-text-secondary opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100"
      >
        {note}
      </span>
    </span>
  );
}
