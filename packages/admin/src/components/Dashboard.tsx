import { useManifest } from "../hooks/useManifest";
import { Card, CardContent, CardHeader, CardTitle } from "./shared/Card";
import { Spinner } from "./shared/Spinner";

interface DashboardProps {
  onEntityClick: (entityName: string) => void;
}

export function Dashboard({ onEntityClick }: DashboardProps) {
  const { manifest, loading } = useManifest();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to {manifest?.metadata?.name ?? "Admin"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {manifest?.entities?.map((entity) => (
          <Card
            key={entity.name}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => {
              onEntityClick(entity.name);
            }}
          >
            <CardHeader>
              <CardTitle>{entity.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage {entity.name.toLowerCase()} records
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {entity.fields.length} fields
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {manifest && (
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Version:</span> {manifest.metadata?.version}
            </div>
            <div>
              <span className="font-medium">Description:</span> {manifest.metadata?.description}
            </div>
            <div>
              <span className="font-medium">Entities:</span> {manifest.entities?.length ?? 0}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
