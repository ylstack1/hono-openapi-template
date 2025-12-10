import type { EntityDefinition } from "@baas-workers/usecore";

import { EntityForm } from "../components/EntityForm";

interface EntityCreatePageProps {
  entity: EntityDefinition;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EntityCreatePage({ entity, onSuccess, onCancel }: EntityCreatePageProps) {
  return <EntityForm entity={entity} mode="create" onSuccess={onSuccess} onCancel={onCancel} />;
}
