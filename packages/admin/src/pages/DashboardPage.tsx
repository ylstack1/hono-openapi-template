import { Dashboard } from "../components/Dashboard";

interface DashboardPageProps {
  onEntityClick: (entityName: string) => void;
}

export function DashboardPage({ onEntityClick }: DashboardPageProps) {
  return <Dashboard onEntityClick={onEntityClick} />;
}
