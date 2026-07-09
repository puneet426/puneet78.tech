type EyebrowProps = {
  index: string;
  label: string;
};

export default function Eyebrow({ index, label }: EyebrowProps) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="font-mono text-xs text-accent">{index}</span>
      <span className="h-px w-8 bg-line" />
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
    </div>
  );
}
