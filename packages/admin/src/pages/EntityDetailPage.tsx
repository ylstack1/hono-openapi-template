import type { EntityDefinition } from "@baas-workers/usecore";

import { EntityDetail } from "../components/EntityDetail";

interface EntityDetailPageProps {
  entity: EntityDefinition;
  id: string;
  onEdit: () => void;
  onBack: () => void;
}

export function EntityDetailPage({ entity, id, onEdit, onBack }: EntityDetailPageProps) {
  return <EntityDetail entity={entity} id={id} onEdit={onEdit} onBack={onBack} />;
}
