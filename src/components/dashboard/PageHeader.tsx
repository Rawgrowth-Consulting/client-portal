interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-medium tracking-tight text-[rgba(255,255,255,0.92)]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.5)]">
            {description}
          </p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
