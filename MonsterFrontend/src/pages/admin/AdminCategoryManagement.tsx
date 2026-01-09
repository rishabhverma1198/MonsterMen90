import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Tags, Edit, Trash2, Search, Folder, FolderOpen, 
  ChevronRight, Package, Plus, Loader2 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// --- Types ---
interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  products_count: number;
}

export default function AdminCategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: 'none',
    status: 'active' as 'active' | 'inactive'
  });

  // --- Data Fetching ---
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products:products(count)
        `)
        .order('name');

      if (error) throw error;
      
      const formatted = data?.map(cat => ({
        ...cat,
        products_count: cat.products?.[0]?.count || 0
      })) || [];
      
      setCategories(formatted);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // --- Tree Logic ---
  const rootCategories = useMemo(() => 
    categories.filter(c => !c.parent_id && c.name.toLowerCase().includes(searchTerm.toLowerCase())),
  [categories, searchTerm]);

  const getSubcategories = (id: string) => categories.filter(c => c.parent_id === id);

  // --- Form Logic ---
  const resetForm = () => {
    setFormData({ name: '', description: '', parent_id: 'none', status: 'active' });
    setEditingCategory(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      parent_id: formData.parent_id === 'none' ? null : formData.parent_id,
      status: formData.status,
    };

    try {
      if (editingCategory) {
        // Prevent circular reference
        if (payload.parent_id === editingCategory.id) throw new Error("Category khud ki parent nahi ho sakti.");

        const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id);
        if (error) throw error;
        toast({ title: "Updated", description: "Category update ho gayi hai." });
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
        toast({ title: "Created", description: "Nayi category add ho gayi." });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.products_count > 0) {
      return toast({ title: "Cannot Delete", description: "Is category mein products hain.", variant: "destructive" });
    }

    if (!confirm(`Kya aap "${cat.name}" ko delete karna chahte hain?`)) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', cat.id);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      toast({ title: "Deleted", description: "Category delete ho gayi." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      parent_id: cat.parent_id || 'none',
      status: cat.status
    });
    setIsDialogOpen(true);
  };

  // --- Render Helpers ---
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Category Center</h1>
          <p className="text-muted-foreground">Catalog hierarchy aur grouping manage karein.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg"><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Winter Wear" />
              </div>
              <div className="space-y-2">
                <Label>Parent Category</Label>
                <Select value={formData.parent_id} onValueChange={v => setFormData({...formData, parent_id: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Root)</SelectItem>
                    {categories.filter(c => c.id !== editingCategory?.id && !c.parent_id).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                {editingCategory ? 'Update Category' : 'Save Category'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <StatsCard title="Total" value={categories.length} icon={<Tags size={16}/>} />
         <StatsCard title="Live" value={categories.filter(c => c.status === 'active').length} icon={<CheckCircle size={16}/>} color="text-green-600" />
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-full" placeholder="Quick search categories..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
      </div>

      <Card className="border-none shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[40%]">Category Name</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rootCategories.map(cat => (
              <CategoryRow 
                key={cat.id} 
                cat={cat} 
                level={0} 
                expandedRows={expandedRows} 
                toggleRow={toggleRow}
                getSubcategories={getSubcategories}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// --- Sub-Components ---

function CategoryRow({ cat, level, expandedRows, toggleRow, getSubcategories, onEdit, onDelete }: any) {
  const subs = getSubcategories(cat.id);
  const isExpanded = expandedRows.has(cat.id);
  
  return (
    <>
      <TableRow className={level > 0 ? "bg-muted/20" : ""}>
        <TableCell style={{ paddingLeft: `${level * 2 + 1}rem` }}>
          <div className="flex items-center gap-2">
            {subs.length > 0 ? (
              <button onClick={() => toggleRow(cat.id)} className="hover:bg-muted p-1 rounded">
                <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
            ) : <div className="w-6" />}
            {isExpanded ? <FolderOpen size={16} className="text-blue-500" /> : <Folder size={16} className="text-blue-400" />}
            <span className="font-medium">{cat.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Package size={14} /> {cat.products_count}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={cat.status === 'active' ? 'default' : 'secondary'}>{cat.status}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(cat)}><Edit size={14}/></Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(cat)} className="text-red-500"><Trash2 size={14}/></Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && subs.map((s: any) => (
        <CategoryRow 
          key={s.id} 
          cat={s} 
          level={level + 1} 
          expandedRows={expandedRows} 
          toggleRow={toggleRow} 
          getSubcategories={getSubcategories}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

function StatsCard({ title, value, icon, color }: any) {
  return (
    <Card className="p-4 flex items-center justify-between border-none shadow-sm bg-muted/30">
      <div>
        <p className="text-xs text-muted-foreground uppercase font-bold">{title}</p>
        <h3 className={`text-xl font-bold ${color}`}>{value}</h3>
      </div>
      <div className="p-2 bg-background rounded-full">{icon}</div>
    </Card>
  );
}