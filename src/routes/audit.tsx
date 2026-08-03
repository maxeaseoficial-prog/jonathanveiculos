import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAuditData } from "@/lib/audit.functions";

export const Route = createFileRoute("/audit")({
  component: AuditPage,
});

function AuditPage() {
  const getAuditDataFn = useServerFn(getAuditData);
  const { data, isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: () => getAuditDataFn(),
  });

  if (isLoading) return <div>Carregando auditoria...</div>;

  return (
    <div className="p-8 font-mono bg-slate-900 text-slate-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Auditoria de Usuários</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <section>
          <h2 className="text-xl font-bold mb-4 text-blue-400">Profiles</h2>
          <pre className="bg-slate-800 p-4 rounded overflow-auto text-xs max-h-[500px]">
            {JSON.stringify(data?.profiles, null, 2)}
          </pre>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-4 text-red-400">User Roles</h2>
          <pre className="bg-slate-800 p-4 rounded overflow-auto text-xs max-h-[500px]">
            {JSON.stringify(data?.roles, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}
