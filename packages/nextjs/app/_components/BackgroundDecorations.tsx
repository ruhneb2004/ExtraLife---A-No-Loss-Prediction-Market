/**
 * BACKGROUND DECORATIONS
 * Server component - no interactivity needed
 * - Uses 'fixed' to pin elements to the viewport (screen) bottom.
 * - 'bottom-0' ensures it stays at the bottom.
 */
export const BackgroundDecorations = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 flex flex-col justify-end pb-0">
      <div className="relative w-full flex gap-0 justify-end items-end">
        {/* The Star (Start) - Pinned near bottom */}
        <div className="absolute bottom-0px] left-[15%] text-[#e5e5e5] animate-spin-slow">
          <svg width="180" height="180" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>

        {/* The Text - Pinned to bottom, translated down to crop partially */}
        <h1
          className="text-[280px] leading-none text-[#e5e5e5] select-none tracking-tight whitespace-nowrap translate-y-[35%]"
          style={{
            fontFamily: "'VTKS INSONE', sans-serif",
            fontWeight: 400,
            fontStyle: "normal",
            fontSize: "300px",
            lineHeight: "100%",
            letterSpacing: "0%",
            textAlign: "center",
          }}
        >
          CREATE
        </h1>
      </div>
    </div>
  );
};
