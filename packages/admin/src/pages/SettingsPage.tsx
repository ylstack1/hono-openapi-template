import { Button } from "../components/shared/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/shared/Card";
import { useAuth } from "../hooks/useAuth";

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Settings</h2>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="font-medium">Name:</span> {user?.name ?? "-"}
          </div>
          <div>
            <span className="font-medium">Email:</span> {user?.email ?? "-"}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {user?.phoneNumber ?? "-"}
          </div>
          <div>
            <span className="font-medium">Role:</span> {user?.role ?? "-"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Account management</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
