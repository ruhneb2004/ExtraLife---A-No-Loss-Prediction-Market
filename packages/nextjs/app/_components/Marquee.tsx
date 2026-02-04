"use client";

import { Card, CardItem } from "./Card";

/**
 * MARQUEE COMPONENT
 * Infinite seamless marquee - cards fill screen and loop continuously
 * Cards are not clickable (demo purposes only on landing page)
 */
export const Marquee = ({ items }: { items: CardItem[] }) => {
  // Double the items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden py-10">
      <div className="flex w-max animate-marquee">
        {/* First set of cards - not clickable on landing page */}
        {duplicatedItems.map((item, index) => (
          <Card key={`${item.id}-${index}`} item={item} clickable={false} />
        ))}
      </div>
    </div>
  );
};
