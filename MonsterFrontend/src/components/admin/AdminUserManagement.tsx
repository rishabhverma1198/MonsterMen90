import { useState, useEffect } from 'react';
import { Plus, Edit, Download, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { adminUserService, AdminUserUpdate } from '@/lib/services/admin.service';

interface User {
  id: string;
  full_name: string;
  email: string;
  user_type: 'buyer' | 'wholeseller' | 'admin' | 'moderator';
  is_active: boolean;
}

interface UserFormData {
  full_name: string;
  email: string;
  user_type: 'buyer' | 'wholeseller' | 'admin' | 'moderator';
}

const AdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    full_name: '',
    email: '',
    user_type: 'buyer'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await adminUserService.getUsers();
      if (error) throw error;
      // Filter out users without id to match User interface
      const validUsers = (data || []).filter((user): user is User => !!user.id);
      setUsers(validUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (data: UserFormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!data.full_name.trim()) {
      errors.full_name = 'Name is required';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!['admin', 'buyer', 'wholeseller', 'moderator'].includes(data.user_type)) {
      errors.user_type = 'Invalid role selected';
    }
    
    return errors;
  };

  const handleCreateUser = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const { error } = await adminUserService.createUser({
        ...formData,
        is_active: true
      });
      if (error) throw error;
      setIsCreateDialogOpen(false);
      setFormData({ full_name: '', email: '', user_type: 'buyer' });
      setErrors({});
      loadUsers();
      toast({
        title: "Success",
        description: "User created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const { error } = await adminUserService.updateUser(editingUser.id, formData as AdminUserUpdate);
      if (error) throw error;
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData({ full_name: '', email: '', user_type: 'buyer' });
      setErrors({});
      loadUsers();
      toast({
        title: "Success",
        description: "User updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const { error } = await adminUserService.deactivateUser(userId);
      if (error) throw error;
      loadUsers();
      toast({
        title: "Success",
        description: "User deactivated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate user",
        variant: "destructive"
      });
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      const { error } = await adminUserService.reactivateUser(userId);
      if (error) throw error;
      loadUsers();
      toast({
        title: "Success",
        description: "User reactivated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate user",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (query.trim()) {
      // We need to reload users and filter on the client side
      const { data } = await adminUserService.getUsers();
      const allUsers = (data || []).filter((user): user is User => !!user.id);
      const filtered = allUsers.filter(user => 
        (user.full_name?.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()))
      );
      setUsers(filtered);
    } else {
      loadUsers();
    }
  };

  const handleExport = async () => {
    toast({
      title: "Success",
      description: "Export started"
    });
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email,
      user_type: user.user_type
    });
    setIsEditDialogOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? user.is_active : !user.is_active);
    const matchesRole = roleFilter === 'all' || user.user_type === roleFilter;
    return matchesStatus && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter user name"
                  />
                  {errors.full_name && <p className="text-sm text-red-500">{errors.full_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.user_type} onValueChange={(value: string) => setFormData(prev => ({ ...prev, user_type: value as UserFormData['user_type'] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="wholeseller">Wholeseller</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.user_type && <p className="text-sm text-red-500">{errors.user_type}</p>}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateUser} className="flex-1">
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status Filter</Label>
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role-filter">Role Filter</Label>
              <Select value={roleFilter} onValueChange={(value: string) => setRoleFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="wholeseller">Wholeseller</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.user_type === 'admin' ? 'default' : 'secondary'}>
                      {user.user_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.is_active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivateUser(user.id)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReactivateUser(user.id)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter user name"
              />
              {errors.full_name && <p className="text-sm text-red-500">{errors.full_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.user_type} onValueChange={(value: string) => setFormData(prev => ({ ...prev, user_type: value as UserFormData['user_type'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="wholeseller">Wholeseller</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
              {errors.user_type && <p className="text-sm text-red-500">{errors.user_type}</p>}
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateUser} className="flex-1">
                Update
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
