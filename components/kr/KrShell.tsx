// Shared dark/neon page shell for the whole /kr section — same visual system
// as components/us/UsShell.tsx (kept as its own file rather than imported
// from there so /kr never depends on /us internals, per the "make /kr a
// real, independent section" goal of this rewrite).
export default function KrShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen font-sans text-white"
      style={{ background: "linear-gradient(160deg, #08090A 0%, #101316 55%, #08090A 100%)" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-48 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.10) 0%, transparent 70%)" }}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
