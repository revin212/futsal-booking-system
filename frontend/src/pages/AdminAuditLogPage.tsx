import { useState } from "react";

import { useAdminAuditLogQuery } from "@/features/admin/queries";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminAuditLogPage() {
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const auditQ = useAdminAuditLogQuery({
    limit: 300,
    enabled: true,
    action: action || undefined,
    entityType: entityType || undefined,
    actorUserId: actorUserId || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const audits = auditQ.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-lexend text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-2">Filter aksi admin & sistem.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Input className="rounded-lg" placeholder="Action" value={action} onChange={(e) => setAction(e.target.value)} />
          <Input className="rounded-lg" placeholder="Entity type" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
          <Input className="rounded-lg" placeholder="Actor user ID" value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} />
          <Input type="date" className="rounded-lg" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" className="rounded-lg" value={to} onChange={(e) => setTo(e.target.value)} />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {audits.map((a) => (
          <Card key={a.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {a.action} • {a.actorRole ?? "-"}
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                #{a.id} • {a.entityType}:{a.entityId} • {a.createdAt}
              </div>
            </CardHeader>
            {a.metadata ? <CardContent className="pt-0 text-sm text-muted-foreground font-mono text-xs">{a.metadata}</CardContent> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
