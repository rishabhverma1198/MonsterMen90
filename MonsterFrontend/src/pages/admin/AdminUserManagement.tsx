import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserCheck, 
  Shield, 
  ShoppingBag, 
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { adminUserService } from '@/lib/services/admin.service';
import { AuthorizationError, ForbiddenError } from '@/lib/services/authorization.service';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  user_type: 'buyer' | 'wholeseller' | 'admin';
  created_at: string;
  updated_at: string;
  user_addresses?: {
    id: string;
    address_line_1: string;
    city: string;
    state: string;
    pincode: string;
    is_default: boolean;
  }[];
  orders?: {
    id: string;
    total_amount: number;
    status: string;
  }[];
}

interface UserStats {
  totalUsers: number;
  buyers: number;
  wholesalers: number;
  admins: number;
  activeUsers: number;
  totalSpent: number;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    phone: '',
    user_type: 'buyer' as 'buyer' | 'wholeseller' | 'admin'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await adminUserService.getUsers();

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Handle authorization errors
      if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view users.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      // Check if this update includes changing to admin role
      if (updates.user_type === 'admin') {
        // This requires special permission for admin promotion
        toast({
          title: "Permission Required",
          description: "Admin promotion requires super admin privileges.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await adminUserService.updateUser(userId, updates);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully"
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Handle authorization errors
      if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to update users.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update user",
          variant: "destructive"
        });
      }
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const { error } = await adminUserService.deactivateUser(userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deactivated successfully"
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      
      // Handle authorization errors
      if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to deactivate users.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to deactivate user",
          variant: "destructive"
        });
      }
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name,
      phone: user.phone || '',
      user_type: user.user_type
    });
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    await updateUser(selectedUser.id, editFormData);
    setIsEditDialogOpen(false);
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'buyer': return 'bg-blue-100 text-blue-800';
      case 'wholeseller': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'buyer': return <UserCheck className="h-4 w-4" />;
      case 'wholeseller': return <ShoppingBag className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm);
    const matchesUserType = userTypeFilter === 'all' || user.user_type === userTypeFilter;
    return matchesSearch && matchesUserType;
  });

  const userStats: UserStats = {
    totalUsers: users.length,
    buyers: users.filter(u => u.user_type === 'buyer').length,
    wholesalers: users.filter(u => u.user_type === 'wholeseller').length,
    admins: users.filter(u => u.user_type === 'admin').length,
    activeUsers: users.filter(u => u.orders && u.orders.length > 0).length,
    totalSpent: users.reduce((sum, user) => 
      sum + (user.orders?.reduce((orderSum, order) => orderSum + (order.total_amount || 0), 0) || 0), 0
    )
  };

  const getTotalSpent = (user: User) => {
    return user.orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading users...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-600">Manage customer accounts and user types</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buyers</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{userStats.buyers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wholesellers</CardTitle>
            <ShoppingBag className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{userStats.wholesalers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{userStats.totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="buyer">Buyers</SelectItem>
                <SelectItem value="wholeseller">Wholesellers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getUserTypeColor(user.user_type)}>
                      <div className="flex items-center space-x-1">
                        {getUserTypeIcon(user.user_type)}
                        <span className="capitalize">{user.user_type}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>{user.orders?.length || 0}</TableCell>
                  <TableCell>₹{getTotalSpent(user).toLocaleString()}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.user_type !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || userTypeFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Users will appear here when they register'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete user information and activity
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Basic Info */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {selectedUser.full_name?.charAt(0).toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.full_name || 'No name'}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <Badge className={getUserTypeColor(selectedUser.user_type)}>
                    <div className="flex items-center space-x-1">
                      {getUserTypeIcon(selectedUser.user_type)}
                      <span className="capitalize">{selectedUser.user_type}</span>
                    </div>
                  </Badge>
                </div>
              </div>
              
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>Member since {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Addresses */}
              {selectedUser.user_addresses && selectedUser.user_addresses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Addresses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedUser.user_addresses.map((address) => (
                      <div key={address.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{address.address_line_1}</p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                          </div>
                          {address.is_default && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              {/* Order Summary */}
              {selectedUser.orders && selectedUser.orders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedUser.orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-2 border rounded">
                          <span>Order #{order.id.slice(-8)}</span>
                          <span className="font-medium">₹{order.total_amount}</span>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total Spent:</span>
                        <span>₹{getTotalSpent(selectedUser).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user_type">User Type</Label>
              <Select 
                value={editFormData.user_type} 
                onValueChange={(value: 'buyer' | 'wholeseller' | 'admin') => 
                  setEditFormData({ ...editFormData, user_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="wholeseller">Wholeseller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update User</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}