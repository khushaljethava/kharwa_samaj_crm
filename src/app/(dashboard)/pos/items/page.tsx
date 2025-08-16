"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { SalesItem, CreateSalesItemRequest, UpdateSalesItemRequest } from "@/lib/types/sales";
import { 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  Grid3X3, 
  List, 
  Download, 
  Upload,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Tag,
  Calendar,
  User
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SalesItemsPage() {
  const [items, setItems] = useState<SalesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<CreateSalesItemRequest>({
    name: "",
    description: "",
    category: "",
    is_active: true,
  });
  const [categories, setCategories] = useState<Array<{id: string, name: string, color?: string}>>([]);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const response = await fetch("/api/sales/categories?is_active=true");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  async function fetchItems() {
    try {
      const response = await fetch("/api/sales/items");
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        toast.error("Failed to fetch items");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
        toast.error("Error loading items");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Please provide a valid name");
      return;
    }

    try {
      const url = editingItem ? `/api/sales/items/${editingItem.id}` : "/api/sales/items";
      const method = editingItem ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingItem ? "Item updated successfully!" : "Item created successfully!");
        setShowForm(false);
        setEditingItem(null);
        setFormData({
          name: "",
          description: "",
          category: "",
          is_active: true,
        });
        fetchItems();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save item");
      }
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Error saving item");
    }
  }

  function handleEdit(item: SalesItem) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      is_active: item.is_active,
    });
    setShowForm(true);
  }

  async function handleDelete(itemId: string) {
    try {
      const response = await fetch(`/api/sales/items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Item deleted successfully!");
        fetchItems();
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Error deleting item");
    }
  }

  async function toggleItemStatus(item: SalesItem) {
    try {
      const response = await fetch(`/api/sales/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });

      if (response.ok) {
        toast.success(`Item ${!item.is_active ? "activated" : "deactivated"} successfully!`);
        fetchItems();
      } else {
        toast.error("Failed to update item status");
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      toast.error("Error updating item status");
    }
  }

  async function bulkToggleStatus(active: boolean) {
    if (selectedItems.size === 0) {
      toast.error("Please select items first");
      return;
    }

    try {
      const promises = Array.from(selectedItems).map(itemId => 
        fetch(`/api/sales/items/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: active }),
        })
      );

      await Promise.all(promises);
      toast.success(`${selectedItems.size} items ${active ? "activated" : "deactivated"} successfully!`);
      setSelectedItems(new Set());
      fetchItems();
    } catch (error) {
      console.error("Error updating items status:", error);
      toast.error("Error updating items status");
    }
  }

  async function bulkDelete() {
    if (selectedItems.size === 0) {
      toast.error("Please select items first");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
      return;
    }

    try {
      const promises = Array.from(selectedItems).map(itemId => 
        fetch(`/api/sales/items/${itemId}`, {
          method: "DELETE",
        })
      );

      await Promise.all(promises);
      toast.success(`${selectedItems.size} items deleted successfully!`);
      setSelectedItems(new Set());
      fetchItems();
    } catch (error) {
      console.error("Error deleting items:", error);
      toast.error("Error deleting items");
    }
  }

  function cancelForm() {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      category: "",
      is_active: true,
    });
  }

  function toggleItemSelection(itemId: string) {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  }

  function selectAll() {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const itemCategories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));
  const activeItems = items.filter(item => item.is_active).length;
  const inactiveItems = items.filter(item => !item.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/pos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to POS
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Sales Items</h1>
                <p className="text-muted-foreground">Manage items available for sale</p>
              </div>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Items</div>
                <div className="text-2xl font-bold text-foreground">{items.length}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Items</div>
                <div className="text-2xl font-bold text-green-500">{activeItems}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Inactive Items</div>
                <div className="text-2xl font-bold text-yellow-500">{inactiveItems}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FolderOpen className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Categories</div>
                <div className="text-2xl font-bold text-purple-500">{categories.length}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <Card className="p-4 mb-6 shadow-sm border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">
                  {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkToggleStatus(true)}
                  className="border-green-500/30 text-green-500 hover:bg-green-500/10"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activate All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkToggleStatus(false)}
                  className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Deactivate All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={bulkDelete}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedItems(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Form */}
        {showForm && (
          <Card className="p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <Button variant="ghost" onClick={cancelForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-muted-foreground">Category</Label>
                  <select
                    id="category"
                    className="w-full px-3 py-2 border border-border rounded-md mt-1 bg-background"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter item description"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-border"
                />
                <Label htmlFor="is_active" className="text-sm text-muted-foreground">Active (available for sale)</Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingItem ? 'Update Item' : 'Create Item'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="px-3"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <div className="flex border border-border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none border-r-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          {showFilters && (
            <div className="pt-4 border-t border-border">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItems(new Set(filteredItems.map(item => item.id)))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItems(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Items Display */}
        <Card className="p-6 shadow-sm">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-2">
                {items.length === 0 
                  ? 'No items found. Create your first item to get started.'
                  : 'No items match your search criteria.'
                }
              </p>
              {items.length === 0 && (
                <Button onClick={() => setShowForm(true)} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    selectedItems.has(item.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-foreground mb-1">{item.name}</div>
                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="rounded border-border ml-2"
                    />
                  </div>
                  
                  {item.description && (
                    <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.created_by || 'System'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={item.is_active ? 'default' : 'secondary'}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleItemStatus(item)}
                        className="h-8 w-8 p-0"
                        title={item.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {item.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                            handleDelete(item.id);
                          }
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View
            <Table>
              <thead>
                <tr>
                  <th className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onChange={selectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-muted">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="font-medium">{item.name}</td>
                    <td>
                      {item.category && (
                        <Badge variant="secondary">{item.category}</Badge>
                      )}
                    </td>
                    <td className="text-muted-foreground max-w-xs">
                      <div className="truncate" title={item.description || ''}>
                        {item.description || '-'}
                      </div>
                    </td>
                    <td>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleItemStatus(item)}
                          title={item.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {item.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                              handleDelete(item.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
