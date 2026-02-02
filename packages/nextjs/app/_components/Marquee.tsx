"use client";

import { Card, CardItem } from "./Card";

/**
 * MARQUEE COMPONENT
 * Client component for CSS animation interaction (hover pause)
 */
export const Marquee = ({ items }: { items: CardItem[] }) => {
  return (
    <div className="relative w-full overflow-hidden py-10">
      <div className="flex w-max animate-marquee pl-10">
        {/* Set 1 */}
        {items.map(item => (
          <Card key={`a-${item.id}`} item={item} />
        ))}
        {/* Set 2 */}
        {items.map(item => (
          <Card key={`b-${item.id}`} item={item} />
        ))}
        {/* Set 3 */}
        {items.map(item => (
          <Card key={`c-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
};
