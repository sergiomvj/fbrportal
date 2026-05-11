import { beforeEach, describe, expect, it } from 'vitest';
import { resetDesignStoreForTests } from '@/lib/design/store';

function request(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'operator-1',
      'x-workspace-id': '11111111-1111-4111-8111-111111111111',
      ...init.headers,
    },
  });
}

describe('Design proxy routes', () => {
  beforeEach(() => resetDesignStoreForTests());

  it('returns dashboard, formats and templates payloads', async () => {
    const dashboard = await import('./dashboard/route');
    const formats = await import('./formats/route');
    const templates = await import('./templates/route');

    const dashboardBody = await (await dashboard.GET(request('/api/proxy/design/dashboard'))).json();
    const formatsBody = await (await formats.GET(request('/api/proxy/design/formats'))).json();
    const templatesBody = await (await templates.GET(request('/api/proxy/design/templates'))).json();

    expect(dashboardBody.kpis.brand_kits_ativos).toBeGreaterThan(0);
    expect(dashboardBody.agents).toHaveLength(3);
    expect(formatsBody.formats.length).toBeGreaterThanOrEqual(26);
    expect(templatesBody.templates.length).toBeGreaterThan(0);
  });

  it('creates brand kits and jobs, then exposes review payloads', async () => {
    const brandKits = await import('./brand-kits/route');
    const jobs = await import('./jobs/route');
    const review = await import('./jobs/[id]/review/route');

    const brandKitResponse = await brandKits.POST(
      request('/api/proxy/design/brand-kits', {
        body: JSON.stringify({
          client_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          nome: 'Nova marca',
          empresa: 'Nova Marca',
          segmento: 'education',
          cores: { primary: '#112233' },
          fontes: {
            heading: { family: 'Outfit', weight: '700' },
            body: { family: 'Inter', weight: '400' },
          },
          guidelines: {
            logo_min_size_px: 80,
            logo_clear_space_px: 20,
            do_not_distort_logo: true,
            preferred_photo_style: 'flat',
            tone_of_voice: 'formal',
            banned_words: [],
            max_text_area_percent: 40,
          },
        }),
        method: 'POST',
      }),
    );

    const brandKitBody = await brandKitResponse.json();
    const jobResponse = await jobs.POST(
      request('/api/proxy/design/jobs', {
        body: JSON.stringify({
          brand_kit_id: brandKitBody.brand_kit.id,
          nome: 'Novo job',
          cliente_nome: 'Nova Marca',
          objetivo: 'Testar pipeline',
          requested_formats: ['ig-feed-square'],
          briefing_text: 'Criar peca institucional.',
          tone: 'formal',
          headline: 'Nova headline',
          body: 'Texto principal',
        }),
        method: 'POST',
      }),
    );
    const jobBody = await jobResponse.json();

    const reviewBody = await (
      await review.GET(request(`/api/proxy/design/jobs/${jobBody.job.id}/review`), {
        params: Promise.resolve({ id: jobBody.job.id }),
      })
    ).json();

    expect(brandKitResponse.status).toBe(201);
    expect(jobResponse.status).toBe(201);
    expect(reviewBody.review.rules).toHaveLength(8);
  });

  it('serves brand kit previews, webhook contracts, exports and sales approval checks', async () => {
    const brandKit = await import('./brand-kits/[id]/route');
    const webhook = await import('./webhooks/social-preview/route');
    const exportRoute = await import('./jobs/[id]/export/route');
    const approve = await import('./criativos/[id]/aprovar-para-campanha/route');

    const brandKitBody = await (
      await brandKit.GET(request('/api/proxy/design/brand-kits/dddddddd-dddd-4ddd-8ddd-dddddddddd01'), {
        params: Promise.resolve({ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddd01' }),
      })
    ).json();

    const webhookBody = await (
      await webhook.POST(
        request('/api/proxy/design/webhooks/social-preview', {
          body: JSON.stringify({ brand_kit_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddd01' }),
          method: 'POST',
        }),
      )
    ).json();

    const exportBody = await (
      await exportRoute.POST(
        request('/api/proxy/design/jobs/eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03/export', {
          body: JSON.stringify({ format: 'pdf' }),
          method: 'POST',
        }),
        { params: Promise.resolve({ id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03' }) },
      )
    ).json();

    const approvalBody = await (
      await approve.POST(request('/api/proxy/design/criativos/aaaa1111-1111-4111-8111-111111111111-png/aprovar-para-campanha', { method: 'POST' }), {
        params: Promise.resolve({ id: 'aaaa1111-1111-4111-8111-111111111111-png' }),
      })
    ).json();

    expect(brandKitBody.social_webhook_preview.event).toBe('brand_kit.updated');
    expect(webhookBody.webhook.signature).toHaveLength(64);
    expect(exportBody.export.url).toContain('.pdf');
    expect(approvalBody.approval.status).toBe('aprovado');
  });
});
