export default function TopCircle() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes gradientShift {
              0%, 100% { opacity: 0.74; }
              50% { opacity: 0.55; }
            }
          `,
        }}
      />
      {/* Sol yuxarı künc: gradient mərkəzi 0% 0% — səhifənin sol üst tərəfi */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 z-0 pointer-events-none"
        style={{
          width: "min(85vw, 560px)",
          height: "min(55vh, 440px)",
          background:
            "radial-gradient(ellipse 95% 90% at 0% 0%, rgba(252, 174, 30, 0.62) 0%, rgba(252, 174, 30, 0.28) 38%, rgba(252, 174, 30, 0.14) 58%, transparent 72%)",
          animation: "gradientShift 7s ease-in-out infinite",
        }}
      />
    </>
  );
}
