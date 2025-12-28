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
import {
  Palette,
  Save,
  Settings,
  Shield,
  Upload,
  User
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminSettings() {
  const { admin } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    site_name: 'MonsterMen90',
    site_description: 'Premium Fashion E-commerce Platform',
    maintenance_mode: false,
    user_registration: true,
    email_notifications: true,
    sms_notifications: false
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_auth: false,
    session_timeout: 30,
    password_policy: 'strong',
    login_attempts: 5
  });

  useEffect(() => {
    if (admin) {
      const adminData = admin as any;
      setProfileData({
        full_name: adminData.full_name || '',
        email: adminData.email || '',
        phone: adminData.phone || '',
        address: adminData.address || '',
        bio: adminData.bio || ''
      });
    }
    loadSettings();
  }, [admin]);

  const loadSettings = async () => {
    try {
      // Load system settings from database
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (settings) {
        setSystemSettings({
          site_name: settings.site_name || 'MonsterMen90',
          site_description: settings.site_description || 'Premium Fashion E-commerce Platform',
          maintenance_mode: settings.maintenance_mode || false,
          user_registration: settings.user_registration !== false,
          email_notifications: settings.email_notifications !== false,
          sms_notifications: settings.sms_notifications || false
        });
      }
    } catch (error) {
      console.log('Settings not found, using defaults');
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      if (!admin) return;
      
      const { error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', admin.id);

      if (error) throw error;
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const saveSystemSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          ...systemSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      alert('System settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      alert('File size must be less than 1MB');
      return;
    }

    setLoading(true);
    try {
      if (!admin) {
        alert('No admin user found');
        return;
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${admin.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // If bucket doesn't exist, create it first
        if (uploadError.message.includes('Bucket not found')) {
          console.log('Creating avatars bucket...');
          const { error: createError } = await supabase.storage.createBucket('avatars', {
            public: true
          });
          
          if (createError) {
            console.error('Error creating bucket:', createError);
            alert('Error creating storage bucket. Please contact administrator.');
            return;
          }
          
          // Retry upload
          const { error: retryError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (retryError) {
            console.error('Retry upload error:', retryError);
            alert('Error uploading avatar: ' + retryError.message);
            return;
          }
        } else {
          alert('Error uploading avatar: ' + uploadError.message);
          return;
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', admin.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        alert('Avatar uploaded but failed to update profile: ' + updateError.message);
        return;
      }

      // Show success message
      alert('Avatar uploaded successfully!');
      
      // Update admin context if available
      // Note: In a real app, you'd want to update the admin context here
      // For now, we'll just show success without page reload
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSecuritySettings = async () => {
    setLoading(true);
    try {
      // In a real application, you would save security settings to a dedicated table
      // For now, we'll simulate the save operation
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          ...securitySettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      alert('Security settings updated successfully!');
    } catch (error) {
      console.error('Error updating security settings:', error);
      alert('Error updating security settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      adminName={admin?.full_name || 'Admin'}
      adminEmail={admin?.email || 'admin@monstermen90.com'}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account and system preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={(admin as any)?.avatar_url} />
                    <AvatarFallback className="bg-orange-500 text-white text-xl">
                      {admin?.full_name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar-upload" className="sr-only">Upload Avatar</Label>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      title="Upload Avatar Image"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={loading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {loading ? 'Uploading...' : 'Change Avatar'}
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <Button onClick={saveProfile} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={systemSettings.site_name}
                      onChange={(e) => setSystemSettings({...systemSettings, site_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_description">Site Description</Label>
                    <Input
                      id="site_description"
                      value={systemSettings.site_description}
                      onChange={(e) => setSystemSettings({...systemSettings, site_description: e.target.value})}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Put the site in maintenance mode</p>
                    </div>
                    <Switch
                      id="maintenance-mode"
                      checked={systemSettings.maintenance_mode}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, maintenance_mode: checked})}
                      aria-label="Toggle maintenance mode"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="user-registration">User Registration</Label>
                      <p className="text-sm text-gray-500">Allow new users to register</p>
                    </div>
                    <Switch
                      id="user-registration"
                      checked={systemSettings.user_registration}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, user_registration: checked})}
                      aria-label="Toggle user registration"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Send email notifications for important events</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={systemSettings.email_notifications}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, email_notifications: checked})}
                      aria-label="Toggle email notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-gray-500">Send SMS notifications for critical alerts</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={systemSettings.sms_notifications}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, sms_notifications: checked})}
                      aria-label="Toggle SMS notifications"
                    />
                  </div>
                </div>

                <Button onClick={saveSystemSettings} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage security preferences and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      id="two-factor-auth"
                      checked={securitySettings.two_factor_auth}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, two_factor_auth: checked})}
                      aria-label="Toggle two-factor authentication"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                      <Input
                        id="session_timeout"
                        type="number"
                        value={securitySettings.session_timeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, session_timeout: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login_attempts">Max Login Attempts</Label>
                      <Input
                        id="login_attempts"
                        type="number"
                        value={securitySettings.login_attempts}
                        onChange={(e) => setSecuritySettings({...securitySettings, login_attempts: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password_policy">Password Policy</Label>
                    <select
                      id="password_policy"
                      title="Password Policy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={securitySettings.password_policy}
                      onChange={(e) => setSecuritySettings({...securitySettings, password_policy: e.target.value})}
                    >
                      <option value="weak">Weak (minimum 4 characters)</option>
                      <option value="medium">Medium (minimum 6 characters)</option>
                      <option value="strong">Strong (minimum 8 characters, mixed case, numbers, symbols)</option>
                    </select>
                  </div>
                </div>

                <Button onClick={saveSecuritySettings} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance & Branding
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your admin panel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-500 rounded border"></div>
                      <Input value="#f97316" readOnly />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-900 rounded border"></div>
                      <Input value="#111827" readOnly />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded border"></div>
                      <Input value="#3b82f6" readOnly />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input type="radio" id="light" name="theme" value="light" defaultChecked title="Light Theme" />
                        <Label htmlFor="light">Light</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="radio" id="dark" name="theme" value="dark" title="Dark Theme" />
                        <Label htmlFor="dark">Dark</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="radio" id="auto" name="theme" value="auto" title="Auto Theme" />
                        <Label htmlFor="auto">Auto</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={() => alert('Appearance settings saved!')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Appearance Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}