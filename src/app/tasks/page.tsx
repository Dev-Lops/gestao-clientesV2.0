import Link from "next/link";

export default function TasksPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tarefas</h1>
      <p className="text-sm text-slate-600 mb-4">
        Lista de tarefas do sistema (placeholder).
      </p>
      <Link href="/" className="text-blue-600">
        Voltar ao dashboard
      </Link>
    </div>
  );
}
