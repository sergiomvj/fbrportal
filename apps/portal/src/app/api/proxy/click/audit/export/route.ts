import { exportAuditCsv } from '@/lib/click/store';
import { contextOrResponse } from '../../_shared';

export async function GET(request: Request) {
  const context = await contextOrResponse(request);
  if (context instanceof Response) return context;

  return new Response(exportAuditCsv(context), {
    headers: {
      'content-disposition': 'attachment; filename="click-audit.csv"',
      'content-type': 'text/csv; charset=utf-8',
    },
  });
}
