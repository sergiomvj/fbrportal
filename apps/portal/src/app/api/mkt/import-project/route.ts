import { NextResponse } from 'next/server';
import { getMktRequestContext } from '@/lib/mkt/context';
import { importProjectToMarketing } from '@/lib/mkt/importer';

export async function POST(request: Request) {
  try {
    const context = await getMktRequestContext(request);
    if (context instanceof Response) return context;

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const result = await importProjectToMarketing(projectId, context);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import failed:', error);
    return NextResponse.json({ 
      error: 'Failed to import project', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
