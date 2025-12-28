// Admin API Integration Management Page
// Interface for managing external API integrations and synchronization

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { 
  RefreshCw, 
  Plus, 
  Play, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface APIIntegration {
  id: string;
  name: string;
  provider: string;
  api_url?: string;
  is_active: boolean;
  last_sync_at?: string;
  sync_interval_minutes: number;
  created_at: string;
}

interface SyncLog {
  id: string;
  integration_id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  products_created: number;
  products_updated: number;
  products_failed: number;
  error_message?: string;
}

interface SyncResult {
  success: boolean;
  products_created: number;
  products_updated: number;
  products_failed: number;
  errors: Array<{
    timestamp: string;
    integration_id: string;
    error_type: string;
    message: string;
    external_product_id?: string;
  }>;
  started_at: string;
  completed_at?: string;
}

const AdminAPIIntegration: React.FC = () => {
  const [integrations, setIntegrations] = useState<APIIntegration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/api-integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch integrations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchSyncLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/api-integrations/sync-logs');
      if (response.ok) {
        const data = await response.json();
        setSyncLogs(data);
      }
    } catch {
      console.error('Failed to fetch sync logs');
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
    fetchSyncLogs();
  }, [fetchIntegrations, fetchSyncLogs]);

  const runSync = async (integrationId: string) => {
    try {
      setSyncing(integrationId);
      
      const response = await fetch(`/api/admin/api-integrations/${integrationId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'manual' })
      });

      if (response.ok) {
        const result: SyncResult = await response.json();
        setSyncResult(result);
        
        if (result.success) {
          toast({
            title: "Sync Completed",
            description: `Successfully synced ${result.products_created} new products and updated ${result.products_updated} existing products.`,
          });
        } else {
          toast({
            title: "Sync Completed with Errors",
            description: `${result.products_failed} products failed to sync. Check logs for details.`,
            variant: "destructive"
          });
        }

        // Refresh data
        await fetchIntegrations();
        await fetchSyncLogs();
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const testConnection = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/admin/api-integrations/${integrationId}/test`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Connection Successful",
            description: "API connection test passed successfully.",
          });
        } else {
          throw new Error(result.message);
        }
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getProviderIcon = () => {
    return <ExternalLink className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Integrations</h1>
          <p className="text-muted-foreground">
            Manage external API integrations and synchronize product data
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Sync Results */}
      {syncResult && (
        <Alert className={syncResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sync Results:</strong> {syncResult.products_created} created, {syncResult.products_updated} updated, {syncResult.products_failed} failed
            {syncResult.errors.length > 0 && (
              <div className="mt-2">
                <strong>Errors:</strong>
                <ul className="list-disc list-inside">
                  {syncResult.errors.slice(0, 3).map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                  {syncResult.errors.length > 3 && (
                    <li>... and {syncResult.errors.length - 3} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Integrations</CardTitle>
              <CardDescription>
                Configure and manage your external API integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {getProviderIcon()}
                          <span>{integration.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{integration.provider}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {integration.last_sync_at ? formatDate(integration.last_sync_at) : "Never"}
                      </TableCell>
                      <TableCell>{integration.sync_interval_minutes} min</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testConnection(integration.id)}
                            disabled={syncing === integration.id}
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => runSync(integration.id)}
                            disabled={syncing === integration.id || !integration.is_active}
                          >
                            {syncing === integration.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>
                View recent synchronization logs and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Results</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log) => {
                    const integration = integrations.find(i => i.id === log.integration_id);
                    const duration = log.completed_at ? 
                      `${Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s` : 
                      '-';
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {integration?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.sync_type}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>{formatDate(log.started_at)}</TableCell>
                        <TableCell>{duration}</TableCell>
                        <TableCell>
                          {log.status === 'completed' ? (
                            <div className="text-sm">
                              <div>{log.products_created} created</div>
                              <div>{log.products_updated} updated</div>
                              {log.products_failed > 0 && (
                                <div className="text-red-600">{log.products_failed} failed</div>
                              )}
                            </div>
                          ) : log.status === 'failed' ? (
                            <div className="text-sm text-red-600 truncate max-w-xs">
                              {log.error_message}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>
                Configure global API integration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Default Sync Interval</label>
                  <p className="text-sm text-muted-foreground">60 minutes</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Retries</label>
                  <p className="text-sm text-muted-foreground">3 attempts</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Rate Limiting</label>
                  <p className="text-sm text-muted-foreground">10 requests/second</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Auto Sync</label>
                  <p className="text-sm text-muted-foreground">Enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAPIIntegration;