import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Palette, Save, Settings, Shield, Upload, User, Loader2 } from 'lucide-react';

// Form Data ke types define karein
interface SystemSettings {
  site_name: string;
  site_description: string;
  maintenance_mode: boolean;
  user_registration: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

export default function AdminSettings() {
  const { admin } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // States
  const [profileData, setProfileData] = useState({
    full_name: '', email: '', phone: '', address: '', bio: '', avatar_url: ''
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    site_name: 'MonsterMen90',
    site_description: 'Premium Fashion E-commerce Platform',
    maintenance_mode: false,
    user_registration: true,
    email_notifications: true,
    sms_notifications: false
  });

  // Settings Load karne ka logic
  const loadInitialData = useCallback(async () => {
    if (!admin) return;

    try {
      // Admin Profile set karein
      setProfileData({
        full_name: admin.full_name || '',
        email: admin.email || '',
        phone: admin.phone || '',
        address: admin.address || '',
        bio: admin.bio || '',
        avatar_url: (admin as any).avatar_url || ''
      });

      // DB se System Settings uthayein
      const { data, error } = await supabase.from('admin_settings').select('*').single();
      if (data && !error) {
        setSystemSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  }, [admin]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // Generic Save Function (Robust Approach)
  const handleSave = async (table: string, data: any, id?: string) => {
    setLoading(true);
    try {
      const query = id 
        ? supabase.from(table).update(data).eq('id', id)
        : supabase.from(table).upsert({ ...data, updated_at: new Date().toISOString() });

      const { error } = await query;
      if (error) throw error;

      toast({ title: "Success", description: "Settings saved successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Avatar Upload Logic (Refined)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !admin) return;

    if (file.size > 1024 * 1024) return toast({ title: "File too large", description: "Max 1MB allowed", variant: "destructive" });

    setLoading(true);
    try {
      const filePath = `avatars/${admin.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      // 1. Storage mein upload karein
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      // 2. Public URL lein
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // 3. User Table update karein
      await handleSave('users', { avatar_url: publicUrl }, admin.id);
      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout adminName={admin?.full_name} adminEmail={admin?.email}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Apne account aur system preferences ko manage karein.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User size={20}/> Profile Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6 p-4 border rounded-xl bg-gray-50/50">
                  <Avatar className="w-24 h-24 border-2 border-white shadow-sm">
                    <AvatarImage src={profileData.avatar_url} />
                    <AvatarFallback className="text-xl bg-orange-100 text-orange-600">{profileData.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label className="cursor-pointer">
                      <div className="flex items-center gap-2 bg-white px-4 py-2 border rounded-md shadow-sm hover:bg-gray-50 transition-all">
                        <Upload size={16}/> {loading ? "Uploading..." : "Change Avatar"}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={loading} />
                    </Label>
                    <p className="text-xs text-muted-foreground">JPG, PNG or WEBP. Max 1MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={profileData.full_name} onChange={e => setProfileData({...profileData, full_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profileData.email} disabled className="bg-gray-100" />
                  </div>
                </div>

                <Button onClick={() => handleSave('users', profileData, admin?.id)} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>} Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <Card>
              <CardHeader><CardTitle>System Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input value={systemSettings.site_name} onChange={e => setSystemSettings({...systemSettings, site_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={systemSettings.site_description} onChange={e => setSystemSettings({...systemSettings, site_description: e.target.value})} />
                  </div>
                </div>

                <Separator className="my-4"/>

                <div className="space-y-4">
                  <ToggleSetting 
                    label="Maintenance Mode" 
                    desc="Site ko temporary offline karein" 
                    checked={systemSettings.maintenance_mode}
                    onCheckedChange={(val) => setSystemSettings({...systemSettings, maintenance_mode: val})}
                  />
                  <ToggleSetting 
                    label="User Registration" 
                    desc="Naye users ko sign-up karne dein" 
                    checked={systemSettings.user_registration}
                    onCheckedChange={(val) => setSystemSettings({...systemSettings, user_registration: val})}
                  />
                </div>

                <Button onClick={() => handleSave('admin_settings', systemSettings)} disabled={loading} className="mt-4">
                  Save System Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Reusable Toggle Component
function ToggleSetting({ label, desc, checked, onCheckedChange }: any) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-all">
      <div className="space-y-0.5">
        <Label className="text-base">{label}</Label>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}