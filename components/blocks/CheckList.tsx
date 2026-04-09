interface CheckListProps {
  items: string[];
  columns?: 1 | 2 | 4;
}

export function CheckList({ items, columns = 1 }: CheckListProps) {
  const gridClass =
    columns === 4
      ? "grid sm:grid-cols-2 md:grid-cols-4 gap-6"
      : columns === 2
        ? "grid md:grid-cols-2 gap-x-16 gap-y-4"
        : "space-y-3";

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <div key={item} className="flex gap-3 items-start">
          <span className="text-gold text-lg mt-0.5 shrink-0">✓</span>
          <span className="text-[15px] text-body leading-[1.6] font-body">
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}
