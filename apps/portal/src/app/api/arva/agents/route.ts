import { listAgents } from '@fbr/arva-integration';
import { ArvaIntegrationError } from '@fbr/arva-integration';
import { createArvaServerHeaders } from '@fbr/arva-integration/server';
import { NextResponse } from 'next/server';

function statusForError(error: unknown): number {
  if (error instanceof ArvaIntegrationError) {
    return error.status ?? 502;
  }

  return 500;
}

export async function GET(request: Request) {
  const companyId = new URL(request.url).searchParams.get('company_id');

  if (!companyId) {
    return NextResponse.json({ code: 'COMPANY_ID_MISSING', message: 'company_id is required.' }, { status: 400 });
  }

  try {
    const serverHeaders = createArvaServerHeaders();
    const agents = await listAgents(companyId, {
      fetcher: (input, init) =>
        fetch(input, {
          ...init,
          headers: {
            ...Object.fromEntries(new Headers(init?.headers).entries()),
            ...serverHeaders,
          },
        }),
    });

    return NextResponse.json({ agents });
  } catch (error) {
    const status = statusForError(error);
    const message = error instanceof Error ? error.message : 'Unable to list Arva agents.';

    return NextResponse.json({ code: 'ARVA_AGENTS_ERROR', message }, { status });
  }
}
