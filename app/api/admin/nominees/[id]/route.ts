import { NextRequest, NextResponse } from 'next/server';
import { getNomineeById, updateNominee, deleteNominee } from '@/lib/db';
import { requireAdmin } from '../../middleware';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

// PUT update nominee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const body = await request.json();
    const { name, description, imageUrl, displayOrder } = body;

    const nominee = await updateNominee(params.id, {
      name,
      description,
      imageUrl,
      displayOrder,
    });

    if (!nominee) {
      return NextResponse.json(
        { success: false, error: 'Nominee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: nominee,
    });
  } catch (error) {
    console.error('Update nominee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update nominee' },
      { status: 500 }
    );
  }
}

// DELETE nominee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const deleted = await deleteNominee(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Nominee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Nominee deleted successfully',
    });
  } catch (error) {
    console.error('Delete nominee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete nominee' },
      { status: 500 }
    );
  }
}
