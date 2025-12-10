import type { EntityDefinition, EntityField } from "@baas-workers/usecore";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { EntityFormData } from "../lib/types";

import { useEntityCreate, useEntityDetail, useEntityList, useEntityUpdate } from "../hooks/useEntity";
import {
  createEntitySchema,
  getFieldLabel,
  getFieldPlaceholder,
  getRelatedEntityName,
  isRelationField,
  shouldShowField,
} from "../lib/validation";
import { Button } from "./shared/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./shared/Card";
import { Input } from "./shared/Input";
import { Label } from "./shared/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shared/Select";
import { Spinner } from "./shared/Spinner";
import { Textarea } from "./shared/Textarea";

interface EntityFormProps {
  entity: EntityDefinition;
  mode: "create" | "edit";
  id?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EntityForm({ entity, mode, id, onSuccess, onCancel }: EntityFormProps) {
  const schema = createEntitySchema(entity);
  const createMutation = useEntityCreate(entity.name);
  const updateMutation = mode === "edit" && id ? useEntityUpdate(entity.name, id) : null;
  const { data: existingData, isLoading: isLoadingData } = useEntityDetail(entity.name, mode === "edit" ? id : undefined);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<EntityFormData>({
    resolver: zodResolver(schema),
    defaultValues: existingData ?? {},
  });

  useEffect(() => {
    if (existingData && mode === "edit") {
      for (const [key, value] of Object.entries(existingData)) {
        setValue(key, value);
      }
    }
  }, [existingData, mode, setValue]);

  const onSubmit = async (data: EntityFormData) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
      } else if (updateMutation) {
        await updateMutation.mutateAsync(data);
      }
      onSuccess();
    } catch {
      // Error already handled by mutation hooks
    }
  };

  const renderField = (field: EntityField) => {
    if (!shouldShowField(field, mode)) return null;

    const fieldError = errors[field.name];
    const errorMessage = fieldError?.message ? String(fieldError.message) : undefined;

    // Relation field - render select dropdown
    if (isRelationField(field)) {
      const relatedEntityName = getRelatedEntityName(field);
      return <RelationSelect key={field.name} field={field} relatedEntityName={relatedEntityName} setValue={setValue} watch={watch} error={errorMessage} />;
    }

    // Enum field - render select dropdown
    if (field.type === "enum" && field.values) {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{getFieldLabel(field)}</Label>
          <Select
            value={String(watch(field.name) ?? field.default ?? "")}
            onValueChange={(value) => {
              setValue(field.name, value);
            }}
          >
            <SelectTrigger id={field.name}>
              <SelectValue placeholder={`Select ${field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.values.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>
      );
    }

    // Boolean field - render checkbox
    if (field.type === "boolean") {
      return (
        <div key={field.name} className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={field.name}
            {...register(field.name)}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor={field.name}>{getFieldLabel(field)}</Label>
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>
      );
    }

    // Text field - render textarea
    if (field.type === "text") {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{getFieldLabel(field)}</Label>
          <Textarea
            id={field.name}
            placeholder={getFieldPlaceholder(field)}
            {...register(field.name)}
            rows={4}
          />
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>
      );
    }

    // Number fields
    if (field.type === "number" || field.type === "integer" || field.type === "decimal") {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{getFieldLabel(field)}</Label>
          <Input
            id={field.name}
            type="number"
            step={field.type === "decimal" ? "0.01" : "1"}
            placeholder={getFieldPlaceholder(field)}
            {...register(field.name, { valueAsNumber: true })}
          />
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>
      );
    }

    // Date/datetime fields
    if (field.type === "date" || field.type === "datetime" || field.type === "timestamp") {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{getFieldLabel(field)}</Label>
          <Input
            id={field.name}
            type={field.type === "date" ? "date" : "datetime-local"}
            placeholder={getFieldPlaceholder(field)}
            {...register(field.name)}
          />
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>
      );
    }

    // Default: string input
    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name}>{getFieldLabel(field)}</Label>
        <Input
          id={field.name}
          type={field.validation === "email" ? "email" : "text"}
          placeholder={getFieldPlaceholder(field)}
          {...register(field.name)}
        />
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      </div>
    );
  };

  if (isLoadingData && mode === "edit") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Create" : "Edit"} {entity.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {entity.fields.map((field) => renderField(field))}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Update"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface RelationSelectProps {
  field: EntityField;
  relatedEntityName: string | null;
  setValue: (name: string, value: unknown) => void;
  watch: (name: string) => unknown;
  error?: string;
}

function RelationSelect({ field, relatedEntityName, setValue, watch, error }: RelationSelectProps) {
  const { data } = useEntityList(relatedEntityName ?? "", { page: 1, pageSize: 100 });

  if (!relatedEntityName) return null;

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{getFieldLabel(field)}</Label>
      <Select
        value={String(watch(field.name) ?? "")}
        onValueChange={(value) => {
          setValue(field.name, value);
        }}
      >
        <SelectTrigger id={field.name}>
          <SelectValue placeholder={`Select ${relatedEntityName}`} />
        </SelectTrigger>
        <SelectContent>
          {data?.data.map((item) => (
            <SelectItem key={String(item["id"])} value={String(item["id"])}>
              {String(item["name"] ?? item["id"])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
