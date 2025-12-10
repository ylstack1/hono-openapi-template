import type { EntityFormData } from "../lib/types";

import { useEntityList } from "../hooks/useEntity";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shared/Select";
import { Spinner } from "./shared/Spinner";

interface RelationPickerProps {
  entityName: string;
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RelationPicker({
  entityName,
  value,
  onChange,
  placeholder = "Select...",
}: RelationPickerProps) {
  const { data, isLoading } = useEntityList<EntityFormData>(entityName, {
    page: 1,
    pageSize: 100,
  });

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {data?.data.map((item) => (
          <SelectItem key={String(item["id"])} value={String(item["id"])}>
            {String(item["name"] ?? item["id"])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
