import { beforeEach, describe, expect, it } from 'vitest';
import { buildSocialWebhookSignature, getSocialTestCompanyIds, resetSocialStoreForTests } from '@/lib/social/store';

function request(path: string, init: RequestInit = {}) {
  const ids = getSocialTestCompanyIds();
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-user-id': ids.user,
      'x-user-role': 'admin',
      'x-workspace-id': ids.alpha,
      ...init.headers,
    },
  });
}

describe('Social proxy routes', () => {
  beforeEach(() => resetSocialStoreForTests());

  it('returns a dashboard snapshot aligned to the social PRD', async () => {
    const { GET } = await import('./dashboard/route');
    const response = await GET(request('/api/proxy/social/dashboard'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.dashboard.kpis.formatos_suportados).toBeGreaterThan(40);
    expect(body.dashboard.network_matrix).toHaveLength(8);
  });

  it('creates jobs and exports ZIP manifests', async () => {
    const jobs = await import('./jobs/route');
    const zip = await import('./gallery/zip/route');

    const created = await jobs.POST(request('/api/proxy/social/jobs', {
      method: 'POST',
      body: JSON.stringify({
        product_name: 'Studio Nova',
        brand_kit_id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
        content_type: 'promo',
        tone: 'direto',
        headline: 'Studio Nova na palma da mao',
        subheadline: 'Variantes para feed e status.',
        cta_text: 'Ver agora',
        target_networks: ['instagram', 'whatsapp'],
        format_slugs: ['ig-feed-square', 'wa-status'],
      }),
    }));
    const createdBody = await created.json();
    const exported = await zip.POST(request('/api/proxy/social/gallery/zip', {
      method: 'POST',
      body: JSON.stringify({ job_id: 'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3' }),
    }));
    const exportedBody = await exported.json();

    expect(created.status).toBe(201);
    expect(createdBody.job.queue_position).toBeGreaterThan(0);
    expect(exported.status).toBe(200);
    expect(exportedBody.zip_name).toMatch(/_social\.zip$/);
    expect(exportedBody.manifest.total_files).toBe(3);
  });

  it('guards template mutation for admin and versions templates on update', async () => {
    const createRoute = await import('./templates/route');
    const updateRoute = await import('./templates/[id]/route');
    const versionsRoute = await import('./templates/[id]/versions/route');

    const forbidden = await createRoute.POST(request('/api/proxy/social/templates', {
      method: 'POST',
      headers: { 'x-user-role': 'operator' },
      body: JSON.stringify({
        brand_kit_id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
        name: 'Blocked template',
        network: 'instagram',
        format_slug: 'ig-feed-square',
        content_type: 'promo',
        config: { layers: [{ id: 'background', type: 'background', x: 0, y: 0, width: '100%', height: '100%', safe_zone: false }] },
      }),
    }));

    expect(forbidden.status).toBe(403);

    const updated = await updateRoute.PUT(request('/api/proxy/social/templates/bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'IG Square Launch v3',
        config: {
          layers: [
            { id: 'background', type: 'background', x: 0, y: 0, width: '100%', height: '100%', safe_zone: false },
            { id: 'headline', type: 'text', x: 'center', y: 'center', width: 860, safe_zone: true },
          ],
        },
      }),
    }), { params: Promise.resolve({ id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2' }) });
    const updatedBody = await updated.json();
    const versions = await versionsRoute.GET(request('/api/proxy/social/templates/bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2/versions'), {
      params: Promise.resolve({ id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2' }),
    });
    const versionsBody = await versions.json();

    expect(updatedBody.template.version).toBe(3);
    expect(versionsBody.versions[0].version).toBe(3);
  });

  it('validates HMAC signatures and invalidates brand kit cache via webhook', async () => {
    const { POST } = await import('./webhooks/brand-kit-updated/route');
    const payload = JSON.stringify({
      event: 'brand_kit.updated',
      data: { brand_kit_id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', versao: 3 },
    });
    const invalid = await POST(new Request('http://localhost/api/proxy/social/webhooks/brand-kit-updated', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-webhook-signature': 'bad-signature' },
      body: payload,
    }));
    const valid = await POST(new Request('http://localhost/api/proxy/social/webhooks/brand-kit-updated', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-webhook-signature': buildSocialWebhookSignature(payload) },
      body: payload,
    }));
    const body = await valid.json();

    expect(invalid.status).toBe(401);
    expect(valid.status).toBe(200);
    expect(body).toMatchObject({ invalidated: true, brand_kit_id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2' });
  });

  it('streams agent status as SSE', async () => {
    const { GET } = await import('./agent/stream/route');
    const response = await GET(request('/api/proxy/social/agent/stream'));
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(text).toContain('event: agent_status');
  });
});
