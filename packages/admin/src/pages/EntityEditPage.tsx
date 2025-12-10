import type { EntityDefinition } from "@baas-workers/usecore";

import { EntityForm } from "../components/EntityForm";

interface EntityEditPageProps {
  entity: EntityDefinition;
  id: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EntityEditPage({ entity, id, onSuccess, onCancel }: EntityEditPageProps) {
  return <EntityForm entity={entity} mode="edit" id={id} onSuccess={onSuccess} onCancel={onCancel} />;
}
