/**
 * (site) altında keçid — header/footer qalır, yalnız `main` içi dəyişən kontent üçün gözləmə UI.
 */
export default function SiteMainLoading() {
  return (
    <div
      className="flex min-h-[45vh] w-full flex-1 flex-col items-center justify-center px-4 py-12"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-5">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-jsyellow/80 border-t-transparent motion-reduce:animate-none"
          role="presentation"
        />
        <div
          className="h-2 w-36 max-w-[70vw] rounded-full bg-jsyellow/25 motion-reduce:animate-none animate-pulse"
          aria-hidden
        />
      </div>
    </div>
  );
}
