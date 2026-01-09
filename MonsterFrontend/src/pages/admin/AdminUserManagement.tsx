import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Search, UserCheck, Shield, ShoppingBag, DollarSign,
  Eye, Edit, Trash2, Mail, Phone, MapPin, Loader2, FilterX
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { adminUserService } from '@/lib/services/admin.service';

// --- Types ---
interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  user_type: 'buyer' | 'wholeseller' | 'admin';
  avatar_url?: string;
  created_at: string;
  user_addresses?: any[];
  orders?: { id: string; total_amount: number; status: string; }[];
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogs, setDialogs] = useState({ detail: false, edit: false });
  const [isUpdating, setIsUpdating] = useState(false);

  const [editFormData, setEditFormData] = useState({ full_name: '', phone: '', user_type: 'buyer' as any });

  // --- Logic: Data Fetching ---
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await adminUserService.getUsers();
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast({ title: "Fetch Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // --- Logic: Analytics (Performance Optimized) ---
  const stats = useMemo(() => ({
    total: users.length,
    buyers: users.filter(u => u.user_type === 'buyer').length,
    wholesalers: users.filter(u => u.user_type === 'wholeseller').length,
    revenue: users.reduce((acc, u) => acc + (u.orders?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0), 0)
  }), [users]);

  // --- Logic: Filtering ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const searchStr = (u.full_name + u.email + u.phone).toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesType = userTypeFilter === 'all' || u.user_type === userTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [users, searchTerm, userTypeFilter]);

  // --- Actions ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsUpdating(true);
    try {
      const { error } = await adminUserService.updateUser(selectedUser.id, editFormData);
      if (error) throw error;

      // Optimistic Update
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editFormData } : u));
      toast({ title: "Updated ✅", description: "User details update ho gayi hain." });
      setDialogs({ ...dialogs, edit: false });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.user_type === 'admin') return toast({ title: "Action Denied", description: "Admins ko yahan se delete nahi kiya ja sakta." });
    if (!confirm(`Kya aap ${user.full_name || 'is user'} ko deactivate karna chahte hain?`)) return;

    try {
      await adminUserService.deactivateUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast({ title: "Deactivated", description: "User account deactivate kar diya gaya." });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">User Base</h1>
          <p className="text-muted-foreground">Accounts aur permissions manage karein.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <Input 
             className="max-w-[300px] shadow-sm" 
             placeholder="Search name, email..." 
             value={searchTerm} 
             onChange={e => setSearchTerm(e.target.value)} 
           />
           <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
             <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Roles</SelectItem>
               <SelectItem value="buyer">Buyers</SelectItem>
               <SelectItem value="wholeseller">Wholesalers</SelectItem>
               <SelectItem value="admin">Admins</SelectItem>
             </SelectContent>
           </Select>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={stats.total} icon={<Users size={20}/>} />
        <StatsCard title="Buyers" value={stats.buyers} icon={<UserCheck className="text-blue-500" size={20}/>} />
        <StatsCard title="Wholesalers" value={stats.wholesalers} icon={<ShoppingBag className="text-purple-500" size={20}/>} />
        <StatsCard title="Total LT Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={<DollarSign className="text-green-600" size={20}/>} />
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Customer Profile</TableHead>
              <TableHead>Account Type</TableHead>
              <TableHead className="hidden md:table-cell">LTV (Spent)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.full_name[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{user.full_name || 'Unnamed'}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize px-3 py-1 ${
                    user.user_type === 'admin' ? 'border-red-200 bg-red-50 text-red-700' : 
                    user.user_type === 'wholeseller' ? 'border-purple-200 bg-purple-50 text-purple-700' : 
                    'border-blue-200 bg-blue-50 text-blue-700'
                  }`}>
                    {user.user_type}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell font-medium">
                  ₹{(user.orders?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setDialogs({...dialogs, detail: true}); }}><Eye size={16}/></Button>
                    <Button variant="ghost" size="sm" onClick={() => { 
                      setSelectedUser(user); 
                      setEditFormData({ full_name: user.full_name, phone: user.phone || '', user_type: user.user_type });
                      setDialogs({...dialogs, edit: true}); 
                    }}><Edit size={16}/></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user)} className="text-red-500 hover:bg-red-50"><Trash2 size={16}/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-2">
            <FilterX className="text-muted-foreground" size={40} />
            <p className="text-muted-foreground">Koi user nahi mila. Filter reset karein.</p>
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      <Dialog open={dialogs.edit} onOpenChange={(o) => setDialogs({...dialogs, edit: o})}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Account</DialogTitle>
            <DialogDescription>Profile info aur user role update karein.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editFormData.full_name} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>User Role</Label>
              <Select value={editFormData.user_type} onValueChange={v => setEditFormData({...editFormData, user_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer (Default)</SelectItem>
                  <SelectItem value="wholeseller">Wholesaler</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-11" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin mr-2" /> : <Shield className="mr-2" size={16}/>}
              Update Account Permissions
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Sub-Components ---
function StatsCard({ title, value, icon }: any) {
  return (
    <Card className="border-none shadow-sm bg-muted/20 hover:bg-muted/40 transition-colors">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black mt-1">{value}</h3>
        </div>
        <div className="p-3 bg-background rounded-2xl shadow-sm">{icon}</div>
      </CardContent>
    </Card>
  );
}