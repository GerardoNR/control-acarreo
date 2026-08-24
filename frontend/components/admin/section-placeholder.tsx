export function SectionPlaceholder({ title, description, phase }: { title: string; description: string; phase: string }) {
  return (
    <section>
      <p className="text-sm font-semibold text-[#2563EB]">Panel administrativo</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0F172A]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#475569]">{description}</p>
      <div className="mt-8 rounded-xl border border-dashed border-[#CBD5E1] bg-white px-6 py-10 text-center">
        <p className="text-sm font-medium text-[#0F172A]">Base de navegación disponible</p>
        <p className="mt-1 text-sm text-[#64748B]">La funcionalidad de este módulo se implementará en {phase}.</p>
      </div>
    </section>
  );
}
