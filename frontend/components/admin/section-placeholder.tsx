export function SectionPlaceholder({ title, description, phase }: { title: string; description: string; phase: string }) {
  return (
    <section>
      <h2 className="sr-only">{title}</h2>
      <p className="max-w-2xl text-sm leading-6 text-[#475569]">{description}</p>
      <div className="mt-4 rounded-xl border border-dashed border-[#CBD5E1] bg-white px-6 py-10 text-center">
        <p className="text-sm font-medium text-[#0F172A]">Base de navegación disponible</p>
        <p className="mt-1 text-sm text-[#64748B]">La funcionalidad de este módulo se implementará en {phase}.</p>
      </div>
    </section>
  );
}
