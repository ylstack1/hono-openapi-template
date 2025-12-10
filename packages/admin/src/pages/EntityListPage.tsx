import type { EntityDefinition } from "@baas-workers/usecore";

import { EntityList } from "../components/EntityList";

interface EntityListPageProps {
  entity: EntityDefinition;
  onCreateClick: () => void;
  onViewClick: (id: string) => void;
  onEditClick: (id: string) => void;
}

export function EntityListPage({ entity, onCreateClick, onViewClick, onEditClick }: EntityListPageProps) {
  return <EntityList entity={entity} onCreateClick={onCreateClick} onViewClick={onViewClick} onEditClick={onEditClick} />;
}
