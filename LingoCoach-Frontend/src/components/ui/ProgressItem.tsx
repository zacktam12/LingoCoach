interface ProgressItemProps {
  title: string;
  value: string;
  active?: boolean;
}

export function ProgressItem({ title, value, active = false }: ProgressItemProps) {
  return (
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full mr-3 ${active ? 'bg-primary' : 'bg-secondary'}`}></div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}
