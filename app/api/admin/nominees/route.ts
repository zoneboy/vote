import { NextRequest, NextResponse } from 'next/server';
import {
  getNomineesByCategory,
  createNominee,
  updateNominee,
  deleteNominee,
} from '@/lib/db';
import { requireAdmin } from '../middleware';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

// GET nominees (optionally by category)
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const nominees = await getNomineesByCategory(categoryId);
    return NextResponse.json({
      success: true,
      data: nominees,
    });
  } catch (error) {
    console.error('Get nominees error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch nominees' },
      { status: 500 }
    );
  }
}

// POST create new nominee
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const body = await request.json();
    const { categoryId, name, description, imageUrl, displayOrder } = body;

    if (!categoryId || !name) {
      return NextResponse.json(
        { success: false, error: 'Category ID and name are required' },
        { status: 400 }
      );
    }

    const nominee = await createNominee({
      categoryId,
      name,
      description,
      imageUrl,
      displayOrder: displayOrder || 0,
    });

    return NextResponse.json({
      success: true,
      data: nominee,
    });
  } catch (error) {
    console.error('Create nominee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create nominee' },
      { status: 500 }
    );
  }
}
