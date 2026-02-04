"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

export type CardItem = {
  id: number;
  title: string;
  description: string;
  status: string;
  statusColor: string;
  statusDot: string;
};

interface CardProps {
  item: CardItem;
  clickable?: boolean;
}

/**
 * CARD COMPONENT
 * Matches the deep shadow look without the border.
 * Uses Clash Display font.
 * Optionally clickable - navigates to pool detail page when clickable is true.
 */
export const Card = ({ item, clickable = true }: CardProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (clickable) {
      router.push(`/pool/${item.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
      group
      relative 
      flex-shrink-0 
      w-[420px] h-[340px] 
      bg-white 
      rounded-[40px] 
      p-8 
      flex flex-col justify-between
      shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]
      mr-16
      ${clickable ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"}
      transition-transform duration-300
    `}
      style={{ fontFamily: "'Clash Display', sans-serif" }}
    >
      <div>
        <h3 className="text-3xl font-medium leading-tight tracking-tight text-black mb-4">{item.title}</h3>
        <p className="text-gray-500 text-lg leading-relaxed font-normal">{item.description}</p>
      </div>

      <div className="flex items-end justify-between mt-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${item.statusDot}`} />
          <span className="font-medium text-black text-base tracking-wide">{item.status}</span>
        </div>

        {/* Arrow Icon Button */}
        <div className="bg-[#a88ff0] p-3 rounded-2xl text-white transform transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110">
          <ArrowUpRight size={28} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};
