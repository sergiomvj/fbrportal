import { beforeEach, describe, expect, it } from 'vitest';
import {
  approveCreativeForCampaign,
  createBrandKit,
  exportCreative,
  getDesignModuleSnapshot,
  getDesignTestCompanyIds,
  getReviewPack,
  listFormats,
  previewBrandKitWebhook,
  resetDesignStoreForTests,
} from './store';

const ids = getDesignTestCompanyIds();
const context = { companyId: ids.alpha, userId: ids.user, moduleSource: 'fbr-portal' };

describe('design store', () => {
  beforeEach(() => resetDesignStoreForTests());

  it('exposes the full format catalog and snapshot payload', () => {
    const snapshot = getDesignModuleSnapshot(context);

    expect(listFormats().length).toBeGreaterThanOrEqual(26);
    expect(snapshot.brand_kits.length).toBe(3);
    expect(snapshot.review_packs.length).toBeGreaterThan(0);
  });

  it('computes blocked review packs for variants that violate spam and safe-zone rules', () => {
    const review = getReviewPack(context, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'aaaa1111-1111-4111-8111-111111111122');
    const spamRule = review.rules.find((rule) => rule.key === 'no_spam_words');
    const safeZoneRule = review.rules.find((rule) => rule.key === 'safe_zone');

    expect(review.overall_status).toBe('blocked');
    expect(spamRule?.status).toBe('fail');
    expect(safeZoneRule?.status).toBe('fail');
  });

  it('creates signed Social webhook previews and enforces brand kit validation', () => {
    const webhook = previewBrandKitWebhook(context, 'dddddddd-dddd-4ddd-8ddd-dddddddddd01');

    expect(webhook.event).toBe('brand_kit.updated');
    expect(webhook.signature).toHaveLength(64);

    expect(() =>
      createBrandKit(context, {
        client_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        nome: 'Broken',
        empresa: 'Broken Co',
        segmento: 'test',
      }),
    ).toThrow('Required fields are missing.');
  });

  it('returns campaign approval payloads only for approved creatives and supports exports', () => {
    const approval = approveCreativeForCampaign(context, 'aaaa1111-1111-4111-8111-111111111111-png');
    const exportPayload = exportCreative(context, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03', { format: 'pptx' });

    expect(approval.status).toBe('aprovado');
    expect(approval.urls.png).toContain('.png');
    expect(exportPayload.url).toContain('.pptx');
    expect(() => approveCreativeForCampaign(context, 'aaaa1111-1111-4111-8111-111111111121-png')).toThrow(
      'Creative requires approval before campaign handoff.',
    );
  });
});
