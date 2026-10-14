export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500">
        <p>Patagonix Shop — Proyecto academico AI Driven E-Commerce © {new Date().getFullYear()}</p>
        <p className="mt-1 text-xs text-slate-400">
          Desarrollado para Patagonix Tech · React + Firebase + AWS S3 + Vercel
        </p>
      </div>
    </footer>
  );
}
