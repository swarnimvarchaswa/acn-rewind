import { NextRequest, NextResponse } from 'next/server';
import { getAgentData } from '@/lib/sheets';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mobile = searchParams.get('mobile');

  if (!mobile) {
    return NextResponse.json(
      { found: false, error: 'Mobile number is required' },
      { status: 400 }
    );
  }

  try {
    const data = await getAgentData(mobile);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { found: false, error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
