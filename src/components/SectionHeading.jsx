export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  dark = false,
}) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  const titleColor = dark ? 'text-white' : 'text-ink';
  const subColor = dark ? 'text-[#c9c4dd]' : 'text-ink-soft';
  const eyebrowColor = dark ? 'text-brand-200' : 'text-brand-600';
  return (
    <div className={`max-w-2xl ${alignClass} mb-10 md:mb-12`}>
      {eyebrow && (
        <p className={`text-xs font-bold uppercase tracking-[0.18em] mb-3 ${eyebrowColor}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${titleColor}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base md:text-lg leading-relaxed ${subColor}`}>{subtitle}</p>
      )}
    </div>
  );
}
