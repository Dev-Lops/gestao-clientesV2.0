export default function MediaPage() {
  return (
    <div className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 p-6">
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mídia</h1>
            <p className="text-sm text-slate-600 mt-1">Gerenciamento de mídias</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
            <h3 className="font-medium">Uploads recentes</h3>
            <p className="text-sm text-slate-500 mt-2">Nenhum upload recente</p>
          </div>
          <div className="p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
            <h3 className="font-medium">Integrações</h3>
            <p className="text-sm text-slate-500 mt-2">Conecte Instagram ou outras fontes</p>
          </div>
          <div className="p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
            <h3 className="font-medium">Biblioteca</h3>
            <p className="text-sm text-slate-500 mt-2">Organize seus ativos por tags</p>
          </div>
        </div>
      </div>
    </div>
  );
}
