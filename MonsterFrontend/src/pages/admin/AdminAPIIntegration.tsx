import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, Plus, Play, Settings, AlertTriangle, CheckCircle, Clock, ExternalLink, Loader2 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Types for production grade safety
interface APIIntegration {
  id: string;
  name: string;
  provider: string;
  api_url?: string;
  is_active: boolean;
  last_sync_at?: string;
  sync_interval_minutes: number;
}

const AdminAPIIntegration: React.FC = () => {
  const [integrations, setIntegrations] = useState<APIIntegration[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Data Fetching Logic
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // In a real app, use your centralized adminService here
      const [intRes, logRes] = await Promise.all([
        fetch('/api/admin/api-integrations').then(r => r.json()),
        fetch('/api/admin/api-integrations/sync-logs').then(r => r.json())
      ]);
      setIntegrations(intRes);
      setSyncLogs(logRes);
    } catch (err) {
      toast({ title: "Fetch Failed", description: "Integrations data load nahi ho paya.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Enhanced Sync Action
  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      const response = await fetch(`/api/admin/api-integrations/${id}/sync`, { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        toast({ 
          title: "Sync Successful! ✅", 
          description: `${result.products_created} naye products add hue.` 
        });
        loadData(); // Refresh logs
      } else {
        throw new Error(result.message || "Sync failed with errors");
      }
    } catch (error: any) {
      toast({ title: "Sync Error", description: error.message, variant: "destructive" });
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Integrations fetch ho rahi hain...</p>
    </div>
  );

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-gray-50 p-6 rounded-2xl border border-dashed">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">API Sync Center</h1>
          <p className="text-muted-foreground">External suppliers se products automatically import aur update karein.</p>
        </div>
        <Button className="rounded-xl shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Add Connection
        </Button>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="integrations" className="rounded-lg">Connections</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg">Sync History</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg">Advanced Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="border-none shadow-md hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">{integration.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">{integration.provider}</Badge>
                  </div>
                  <Badge className={integration.is_active ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500"}>
                    {integration.is_active ? "Active" : "Disabled"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock size={14} /> Last Sync: {integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString() : "Never"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <RefreshCw size={14} /> Interval: Every {integration.sync_interval_minutes} mins
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="default" 
                      className="flex-1 rounded-lg" 
                      onClick={() => handleSync(integration.id)}
                      disabled={syncingId === integration.id || !integration.is_active}
                    >
                      {syncingId === integration.id ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      Sync Now
                    </Button>
                    <Button variant="outline" className="rounded-lg">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border-none shadow-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Started At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-semibold">{log.integration_name || "API"}</TableCell>
                    <TableCell>
                       <Badge variant={log.status === 'completed' ? 'default' : 'destructive'} className="rounded-md">
                         {log.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-green-600">+{log.products_created}</TableCell>
                    <TableCell className="text-blue-600">~{log.products_updated}</TableCell>
                    <TableCell className="text-xs">{new Date(log.started_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAPIIntegration;