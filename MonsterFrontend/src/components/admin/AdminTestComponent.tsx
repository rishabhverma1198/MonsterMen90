import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminTestComponent() {
  const { admin, loading, isAdmin, logout } = useAdmin();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Admin Status Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Loading:</p>
              <p className={`text-sm ${loading ? 'text-orange-600' : 'text-green-600'}`}>
                {loading ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Is Admin:</p>
              <p className={`text-sm ${isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                {isAdmin ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Admin Data:</p>
              <p className="text-sm text-gray-600">
                {admin ? 'Available' : 'None'}
              </p>
            </div>
          </div>
          
            {admin && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800 mb-2">Admin Information:</p>
                <div className="text-xs text-green-700 space-y-1">
                  <p>ID: {admin.id}</p>
                  <p>Email: {admin.email}</p>
                  <p>User Type: {(admin as any).user_type || 'admin'}</p>
                </div>
              </div>
            )}
          
          <div className="flex gap-2">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Reload Page
            </Button>
            <Button
              onClick={logout}
              variant="destructive"
              size="sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}