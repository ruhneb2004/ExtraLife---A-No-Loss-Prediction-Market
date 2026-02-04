"use client";

import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
}

/**
 * Full-page loading spinner used during initial page loads,
 * navigation, and while checking wallet connection status.
 */
export const PageLoader = ({ message }: PageLoaderProps) => {
  return (
    <div className="flex min-h-screen w-full bg-white items-center justify-center">
      <style jsx global>{`
        @import url("https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap");
      `}</style>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[#a88ff0]" size={48} />
        {message && (
          <p className="text-gray-400 text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};
