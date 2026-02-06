import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/db';
import { requireAdmin } from '../middleware';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

// GET all categories
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const categories = await getAllCategories();
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST create new category
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const body = await request.json();
    const { name, description, displayOrder } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const category = await createCategory({
      name,
      description,
      displayOrder: displayOrder || 0,
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
