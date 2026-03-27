export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-gema-gray-200 border-t-gema-black rounded-full animate-spin" />
        <p className="mt-4 text-small text-gema-gray-500">Cargando...</p>
      </div>
    </div>
  );
}
