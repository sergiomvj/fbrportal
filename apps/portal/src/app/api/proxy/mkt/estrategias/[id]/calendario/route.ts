import { contextOrResponse, jsonError } from '../../../_shared';
import { listCalendarByEstrategia } from '@/lib/mkt/store';
import { withSecurityHeaders } from '@/lib/mkt/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const items = await listCalendarByEstrategia(id, context);
    return withSecurityHeaders(Response.json({ calendario: items }));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = contextOrResponse(request);
  if (context instanceof Response) return context;

  try {
    const { id } = await params;
    const items = await listCalendarByEstrategia(id, context);
    const headers = ['Data', 'Canal', 'Tipo', 'Tema', 'Copy', 'Status', 'Quick Win'];
    const rows = items.map((i) => [
      i.data, i.canal, i.tipo, i.tema, i.copy_resumo, i.status, i.is_quick_win ? 'Sim' : 'Nao',
    ]);

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const bom = '\uFEFF';
    return new Response(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=calendario_${id}.csv`,
        ...withSecurityHeaders(new Response()).headers,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
