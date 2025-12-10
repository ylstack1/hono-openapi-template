import { Home } from "lucide-react";

import { Button } from "../components/shared/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/shared/Card";

interface NotFoundPageProps {
  onBackHome: () => void;
}

export function NotFoundPage({ onBackHome }: NotFoundPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>404 - Not Found</CardTitle>
          <CardDescription>The page you're looking for doesn't exist</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBackHome} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
