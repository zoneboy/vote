'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetcher } from '@/lib/utils';
import type { Category, Nominee } from '@/types';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Record<string, Nominee[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showNomineeModal, setShowNomineeModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingNominee, setEditingNominee] = useState<Nominee | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    displayOrder: 0,
  });
  const [nomineeForm, setNomineeForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    displayOrder: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadCategories();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const result = await fetcher('/api/auth/me');
      if (result.success && result.user?.isAdmin) {
        setIsAdmin(true);
      } else {
        router.push('/vote');
      }
    } catch {
      router.push('/vote');
    }
  };

  const loadCategories = async () => {
    try {
      const result = await fetcher('/api/admin/categories');
      setCategories(result.data || []);
      
      // Load nominees for each category
      const nomineesData: Record<string, Nominee[]> = {};
      for (const category of result.data || []) {
        const nomineeResult = await fetcher(`/api/admin/nominees?categoryId=${category.id}`);
        nomineesData[category.id] = nomineeResult.data || [];
      }
      setNominees(nomineesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', displayOrder: categories.length });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder,
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingCategory) {
        await fetcher(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(categoryForm),
        });
      } else {
        await fetcher('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(categoryForm),
        });
      }
      
      setShowCategoryModal(false);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure? This will delete all nominees in this category.')) return;
    
    try {
      await fetcher(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleCreateNominee = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditingNominee(null);
    setNomineeForm({
      name: '',
      description: '',
      imageUrl: '',
      displayOrder: (nominees[categoryId] || []).length,
    });
    setShowNomineeModal(true);
  };

  const handleEditNominee = (nominee: Nominee) => {
    setSelectedCategoryId(nominee.categoryId);
    setEditingNominee(nominee);
    setNomineeForm({
      name: nominee.name,
      description: nominee.description || '',
      imageUrl: nominee.imageUrl || '',
      displayOrder: nominee.displayOrder,
    });
    setShowNomineeModal(true);
  };

  const handleSaveNominee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingNominee) {
        await fetcher(`/api/admin/nominees/${editingNominee.id}`, {
          method: 'PUT',
          body: JSON.stringify(nomineeForm),
        });
      } else {
        await fetcher('/api/admin/nominees', {
          method: 'POST',
          body: JSON.stringify({
            ...nomineeForm,
            categoryId: selectedCategoryId,
          }),
        });
      }
      
      setShowNomineeModal(false);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save nominee');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNominee = async (nomineeId: string) => {
    if (!confirm('Are you sure you want to delete this nominee?')) return;
    
    try {
      await fetcher(`/api/admin/nominees/${nomineeId}`, {
        method: 'DELETE',
      });
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete nominee');
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
              <p className="text-gray-600 text-sm mt-1">Create and manage voting categories and nominees</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/dashboard" className="btn btn-secondary">
                ← Back to Dashboard
              </Link>
              <button onClick={handleCreateCategory} className="btn btn-primary">
                + Add Category
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {categories.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No categories yet. Create your first category to get started.</p>
            <button onClick={handleCreateCategory} className="btn btn-primary">
              Create First Category
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.id} className="card">
                {/* Category Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                    {category.description && (
                      <p className="text-gray-600 mt-1">{category.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Display Order: {category.displayOrder}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="btn btn-secondary text-sm"
                    >
                      Edit Category
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="btn btn-danger text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Nominees */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Nominees ({(nominees[category.id] || []).length})
                    </h3>
                    <button
                      onClick={() => handleCreateNominee(category.id)}
                      className="btn btn-primary text-sm"
                    >
                      + Add Nominee
                    </button>
                  </div>

                  {(nominees[category.id] || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">No nominees yet. Add nominees to this category.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {(nominees[category.id] || []).map((nominee) => (
                        <div
                          key={nominee.id}
                          className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{nominee.name}</h4>
                              {nominee.description && (
                                <p className="text-sm text-gray-600 mt-1">{nominee.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">Order: {nominee.displayOrder}</p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => handleEditNominee(nominee)}
                                className="text-blue-600 hover:text-blue-700 text-sm px-2 py-1"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteNominee(nominee.id)}
                                className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h2>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) })}
                  className="input"
                  min="0"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nominee Modal */}
      {showNomineeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingNominee ? 'Edit Nominee' : 'Add Nominee'}
            </h2>
            <form onSubmit={handleSaveNominee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nominee Name *
                </label>
                <input
                  type="text"
                  value={nomineeForm.name}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={nomineeForm.description}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, description: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={nomineeForm.imageUrl}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, imageUrl: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={nomineeForm.displayOrder}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, displayOrder: parseInt(e.target.value) })}
                  className="input"
                  min="0"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingNominee ? 'Save Changes' : 'Add Nominee'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNomineeModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
