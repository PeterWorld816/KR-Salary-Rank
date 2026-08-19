// Shared dark/neon page shell for the whole /kr section — same visual system
// as components/us/UsShell.tsx (kept as its own file rather than imported
// from there so /kr never depends on /us internals, per the "make /kr a
// real, independent section" goal of this rewrite). Applies `.kr-theme`
// (app/globals.css), which re-points the site's shared --color-* tokens at
// dark values for everything nested here — every components/kr/** file reads
// color through those tokens instead of hardcoding hex, while /us and the
// marketing pages keep the light palette untouched.
export default function KrShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="kr-theme min-h-screen font-sans"
      // A multi-stop gradient backdrop can't be expressed as one --color-bg
      // token, so this one decorative background stays inline — every other
      // color in the /kr section still resolves through the theme tokens.
      style={{ background: "linear-gradient(160deg, #08090A 0%, #101316 55%, #08090A 100%)" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-48 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, var(--color-accent-tint) 0%, transparent 70%)" }}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
