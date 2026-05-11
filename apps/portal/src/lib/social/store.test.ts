import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildSocialWebhookSignature,
  createJob,
  generateZipPackage,
  getBrandKitCacheSnapshotForTests,
  getDashboardSnapshot,
  getSocialTestCompanyIds,
  invalidateBrandKitCache,
  listFormatCatalog,
  listQualityChecks,
  listTemplateVersions,
  parseAndValidateBrandKitWebhook,
  resetSocialStoreForTests,
  updateTemplate,
} from './store';

describe('social store', () => {
  const ids = getSocialTestCompanyIds();
  const context = { companyId: ids.alpha, moduleSource: 'fbr-portal', userId: ids.user, role: 'admin' };

  beforeEach(() => resetSocialStoreForTests());

  it('exposes the complete supported format catalog with eight networks', () => {
    const formats = listFormatCatalog();
    const networks = new Set(formats.map((item) => item.network));

    expect(formats.length).toBeGreaterThan(40);
    expect(networks.size).toBe(8);
    const waSticker = formats.find((item) => item.slug === 'wa-sticker');
    const ytChannel = formats.find((item) => item.slug === 'yt-channel');

    expect(waSticker).toBeDefined();
    expect(ytChannel).toBeDefined();
    expect(waSticker?.safe_zone.width).toBe(450);
    expect(ytChannel?.safe_zone.height).toBe(423);
  });

  it('creates package manifests using social storage naming conventions', () => {
    const zip = generateZipPackage(context, 'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3');

    expect(zip.zip_name).toContain('portal-premium');
    expect(zip.manifest.total_files).toBe(3);
    expect(zip.manifest.files[0]?.file).toMatch(/^[a-z_]+\/.+_v1\.(png|jpg)$/);
    expect(zip.manifest.total_size_bytes).toBeGreaterThan(0);
  });

  it('invalidates brand kit cache and validates webhook signatures', () => {
    const payload = JSON.stringify({
      event: 'brand_kit.updated',
      data: { brand_kit_id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', versao: 2 },
    });
    const signature = buildSocialWebhookSignature(payload);
    const parsed = parseAndValidateBrandKitWebhook(payload, signature);

    expect(parsed.data).toBeDefined();
    expect(parsed.data?.brand_kit_id).toBe('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1');
    invalidateBrandKitCache(parsed);

    const cache = getBrandKitCacheSnapshotForTests();
    expect(cache.find((item) => item.id === 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1')?.stale).toBe(true);
  });

  it('creates jobs with queue metadata and keeps quality checks aligned to artefacts', () => {
    const job = createJob(context, {
      product_name: 'Novo Produto',
      brand_kit_id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      content_type: 'promo',
      tone: 'direto',
      headline: 'Mensagem valida para teaser',
      subheadline: 'Subheadline curta',
      cta_text: 'Saiba mais',
      target_networks: ['instagram', 'whatsapp'],
      format_slugs: ['ig-feed-square', 'wa-status'],
    });

    expect(job.queue_position).toBeGreaterThan(0);
    expect(job.eta_minutes).toBe(8);
    expect(listQualityChecks(context).length).toBeGreaterThan(0);
  });

  it('versions templates by cloning a new active record', () => {
    const updated = updateTemplate(context, 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', {
      name: 'IG Square Launch v3',
        config: {
          layers: [
          { id: 'background', type: 'background', x: 0, y: 0, width: '100%', height: '100%', safe_zone: false },
          { id: 'headline', type: 'text', x: 'center', y: 'center', width: 860, safe_zone: true },
          ],
        },
      });
    const versions = listTemplateVersions(context, updated.id);

    expect(updated.version).toBe(3);
    expect(versions[0]?.active).toBe(true);
    expect(versions.some((item) => item.version === 2 && item.active === false)).toBe(true);
  });

  it('builds dashboard snapshots with package preview and agent feed', () => {
    const dashboard = getDashboardSnapshot(context);

    expect(dashboard.kpis.redes_ativas).toBeGreaterThan(1);
    expect(dashboard.package_preview).toBeDefined();
    expect(dashboard.package_preview?.total_files).toBeGreaterThan(0);
    expect(dashboard.agent_events.length).toBeGreaterThan(0);
  });
});
