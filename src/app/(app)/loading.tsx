// Shown instantly on navigation inside the app while the next screen streams
// in. The server is in the US (Firestore nam5), so a round trip from India takes
// a few hundred ms. The nav stays interactive and the page answers at once.
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-32 rounded-full bg-paper-2" />
      <div className="mt-3 h-9 w-64 max-w-full rounded-xl bg-paper-2" />
      <div className="mt-8 grid gap-5 md:grid-cols-[1.1fr_1fr]">
        <div className="aspect-[4/5] rounded-3xl bg-paper-2" />
        <div className="space-y-4">
          <div className="h-36 rounded-3xl bg-paper-2" />
          <div className="h-28 rounded-3xl bg-paper-2" />
          <div className="h-20 rounded-3xl bg-paper-2" />
        </div>
      </div>
    </div>
  );
}
