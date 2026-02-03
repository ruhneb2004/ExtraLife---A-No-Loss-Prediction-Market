"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";

/**
 * SIDEBAR COMPONENT
 * Client component - shows plus icon or back arrow based on current page
 */
export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isCreatePage = pathname === "/create";

  return (
    <aside className="w-[150px] h-full border-r border-gray-100 flex flex-col justify-between items-center py-10 z-20 bg-white/80 backdrop-blur-sm fixed left-0 top-0">
      <div className="mt-8 whitespace-nowrap">
        <Link
          href="/"
          className="text-black hover:text-[#a88ff0] transition-colors"
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            fontStyle: "normal",
            lineHeight: "100%",
            letterSpacing: "-0.5px",
          }}
        >
          ExtraLife
        </Link>
      </div>

      {isCreatePage ? (
        <button
          onClick={() => router.back()}
          className="w-16 h-16 bg-[#050505] rounded-2xl flex items-center justify-center text-white hover:scale-105 hover:bg-black transition-all shadow-xl cursor-pointer mb-4"
        >
          <ChevronLeft size={36} strokeWidth={3} />
        </button>
      ) : (
        <Link
          href="/create"
          className="w-16 h-16 bg-[#050505] rounded-2xl flex items-center justify-center text-white hover:scale-105 hover:bg-black transition-all shadow-xl cursor-pointer mb-4"
        >
          <Plus size={36} strokeWidth={3} />
        </Link>
      )}
    </aside>
  );
};
