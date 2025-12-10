import type { EntityDefinition } from "@baas-workers/usecore";

import { Edit, Trash2 } from "lucide-react";

import type { EntityFormData } from "../lib/types";

import { useEntityDelete, useEntityDetail } from "../hooks/useEntity";
import { formatDate, formatDateTime } from "../lib/utils";
import { shouldShowField } from "../lib/validation";
import { Button } from "./shared/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./shared/Card";
import { Spinner } from "./shared/Spinner";

interface EntityDetailProps {
  entity: EntityDefinition;
  id: string;
  onEdit: () => void;
  onBack: () => void;
}

export function EntityDetail({ entity, id, onEdit, onBack }: EntityDetailProps) {
  const { data, isLoading } = useEntityDetail<EntityFormData>(entity.name, id);
  const deleteMutation = useEntityDelete(entity.name);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${entity.name}?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          onBack();
        },
      });
    }
  };

  const formatValue = (value: unknown, fieldType: string): string => {
    if (value === null || value === undefined) return "-";

    switch (fieldType) {
      case "boolean":
        return value ? "Yes" : "No";
      case "date":
        return formatDate(String(value));
      case "datetime":
      case "timestamp":
        return formatDateTime(String(value));
      case "decimal":
        return typeof value === "number" ? value.toFixed(2) : String(value);
      default:
        return String(value);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {entity.name} not found
        </CardContent>
      </Card>
    );
  }

  const visibleFields = entity.fields.filter((field) => shouldShowField(field, "view"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {entity.name} Details
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{String(data["name"] ?? data["id"] ?? entity.name)}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleFields.map((field) => (
              <div key={field.name} className="border-b pb-3">
                <dt className="text-sm font-medium text-muted-foreground">{field.name}</dt>
                <dd className="mt-1 text-sm">{formatValue(data[field.name], field.type)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
