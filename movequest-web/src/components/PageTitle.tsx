interface PageTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function PageTitle({ title, subtitle, className = '' }: PageTitleProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}