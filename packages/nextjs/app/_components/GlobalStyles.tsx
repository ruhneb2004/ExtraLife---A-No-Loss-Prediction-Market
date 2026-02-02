"use client";

/**
 * GLOBAL STYLES COMPONENT
 * Client component for styled-jsx global styles
 */
export const GlobalStyles = () => {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap");
      @import url("https://fonts.cdnfonts.com/css/vtks-insone");
      @import url("https://fonts.cdnfonts.com/css/clash-display");

      body {
        font-family: "Space Grotesk", sans-serif;
      }

      @keyframes scroll {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(0%);
        }
      }

      .animate-marquee {
        /* Runs once (1) and stops at the end (forwards) */
        animation: scroll 100s linear 1 forwards;
      }
      .animate-marquee:hover {
        animation-play-state: paused;
      }

      @keyframes spin-slow {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      .animate-spin-slow {
        animation: spin-slow 20s linear infinite;
      }
    `}</style>
  );
};
