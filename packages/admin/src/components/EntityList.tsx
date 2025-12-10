import type { EntityDefinition } from "@baas-workers/usecore";

import { Edit, Eye, Plus, Trash2 } from "lucide-react";

import type { EntityFormData } from "../lib/types";

import { useEntityDelete, useEntityList } from "../hooks/useEntity";
import { usePagination } from "../hooks/usePagination";
import { formatDate, formatDateTime } from "../lib/utils";
import { shouldShowField } from "../lib/validation";
import { Button } from "./shared/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./shared/Card";
import { Spinner } from "./shared/Spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./shared/Table";

interface EntityListProps {
  entity: EntityDefinition;
  onCreateClick: () => void;
  onViewClick: (id: string) => void;
  onEditClick: (id: string) => void;
}

export function EntityList({ entity, onCreateClick, onViewClick, onEditClick }: EntityListProps) {
  const pagination = usePagination();
  const { data, isLoading } = useEntityList<EntityFormData>(entity.name, pagination);
  const deleteMutation = useEntityDelete(entity.name);

  const visibleFields = entity.fields.filter((field) => shouldShowField(field, "view") && !field.sensitive);

  const handleDelete = (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${entity.name}?`)) {
      deleteMutation.mutate(id);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{entity.name}</h2>
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create {entity.name}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {data?.total ?? 0} {entity.name}{(data?.total ?? 0) !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.data || data.data.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No {entity.name.toLowerCase()}s found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleFields.slice(0, 5).map((field) => (
                      <TableHead key={field.name}>{field.name}</TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((item) => (
                    <TableRow key={String(item["id"])}>
                      {visibleFields.slice(0, 5).map((field) => (
                        <TableCell key={field.name}>{formatValue(item[field.name], field.type)}</TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => onViewClick(String(item["id"]))}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onEditClick(String(item["id"]))}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleDelete(String(item["id"]));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((data?.page ?? 1) - 1) * (data?.pageSize ?? 20) + 1} to{" "}
                  {Math.min((data?.page ?? 1) * (data?.pageSize ?? 20), data?.total ?? 0)} of {data?.total ?? 0} results
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={pagination.prevPage} disabled={pagination.page === 1}>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={pagination.nextPage}
                    disabled={pagination.page >= (data?.totalPages ?? 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
