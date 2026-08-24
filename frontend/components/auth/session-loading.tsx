export function SessionLoading({ message = "Validando sesión" }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6">
      <div className="flex items-center gap-3 text-sm font-medium text-[#475569]" role="status">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#2563EB]" />
        {message}
      </div>
    </div>
  );
}
