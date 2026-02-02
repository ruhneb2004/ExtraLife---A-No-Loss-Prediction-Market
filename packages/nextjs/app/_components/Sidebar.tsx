import { Plus } from "lucide-react";

/**
 * SIDEBAR COMPONENT
 * Server component - static sidebar with logo and add button
 */
export const Sidebar = () => {
  return (
    <aside className="w-[150px] h-full border-r border-gray-100 flex flex-col justify-between items-center py-10 z-20 bg-white/80 backdrop-blur-sm fixed left-0 top-0">
      <div className="mt-8 whitespace-nowrap">
        <span
          className="text-gray-400"
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 500,
            fontSize: "24px",
            fontStyle: "normal",
            lineHeight: "100%",
            letterSpacing: "0",
          }}
        >
          nomono.
        </span>
      </div>

      <button className="w-16 h-16 bg-[#050505] rounded-2xl flex items-center justify-center text-white hover:scale-105 hover:bg-black transition-all shadow-xl cursor-pointer mb-4">
        <Plus size={36} strokeWidth={3} />
      </button>
    </aside>
  );
};
