import { describe, expect, it } from 'vitest';
import { clickSourceSchema, clickStageSchema, normalizeLeadQualified, scoreSchema } from './schemas';
import type {
  ClickAgent,
  ClickAgentActionLog,
  ClickAgentApprovalRequest,
  ClickAgentMarkdownCache,
  ClickChannel,
  ClickDeal,
  ClickDealHistory,
  ClickKpi,
  ClickMessage,
  ClickMicroserviceContract,
  ClickSecurityLayer,
  ClickSpace,
  ClickTask,
  ClickUser,
  ClickWorkspace,
} from './types';

describe('Click typed contracts', () => {
  it('represents all Click entities plus service, security, and LLM concepts', () => {
    const entities: [
      ClickWorkspace,
      ClickUser,
      ClickSpace,
      ClickChannel,
      ClickMessage,
      ClickTask,
      ClickDeal,
      ClickDealHistory,
      ClickAgent,
      ClickAgentMarkdownCache,
      ClickAgentActionLog,
      ClickAgentApprovalRequest,
      ClickKpi,
    ] = [
      { id: 'workspace-1', name: 'FBR', createdAt: '2026-05-03T00:00:00.000Z' },
      { id: 'user-1', workspaceId: 'workspace-1', email: 'a@b.com', role: 'admin' },
      { id: 'space-1', workspaceId: 'workspace-1', name: 'Comercial' },
      { id: 'channel-1', workspaceId: 'workspace-1', spaceId: 'space-1', type: 'internal', name: 'Geral' },
      { id: 'message-1', workspaceId: 'workspace-1', dealId: 'deal-1', authorId: 'user-1', actorType: 'human', body: 'Oi', createdAt: '2026-05-03T00:00:00.000Z' },
      { id: 'task-1', workspaceId: 'workspace-1', dealId: 'deal-1', title: 'Follow-up', status: 'open' },
      { id: 'deal-1', workspaceId: 'workspace-1', userId: 'user-1', empresaId: 'workspace-1', title: 'Venda', companyName: 'ACME', valueCents: 1, stage: 'contato_inicial', score: 50, source: 'manual', priority: 'media', createdAt: '2026-05-03T00:00:00.000Z', updatedAt: '2026-05-03T00:00:00.000Z' },
      { id: 'history-1', workspaceId: 'workspace-1', dealId: 'deal-1', type: 'created', actorId: 'user-1', actorType: 'human', description: 'Criado', createdAt: '2026-05-03T00:00:00.000Z' },
      { id: 'agent-1', workspaceId: 'workspace-1', slot: 'sdr', name: 'SDR', status: 'online', paused: false },
      { id: 'cache-1', workspaceId: 'workspace-1', agentId: 'agent-1', markdown: '# SDR', refreshedAt: '2026-05-03T00:00:00.000Z' },
      { id: 'log-1', workspaceId: 'workspace-1', dealId: 'deal-1', agentId: 'agent-1', action: 'trigger', createdAt: '2026-05-03T00:00:00.000Z' },
      { id: 'approval-1', workspaceId: 'workspace-1', dealId: 'deal-1', agentId: 'agent-1', status: 'pending', requestedAt: '2026-05-03T00:00:00.000Z' },
      { id: 'kpi-1', workspaceId: 'workspace-1', name: 'Deals', value: 1, trend: 0 },
    ];

    const service: ClickMicroserviceContract = {
      name: 'portal-proxy',
      requiresUserContext: true,
      transport: 'rest',
    };
    const security: ClickSecurityLayer = {
      enforcedBy: 'portal',
      invariant: 'workspace isolation',
      name: 'workspace-isolation',
    };

    expect(entities).toHaveLength(13);
    expect(service.requiresUserContext).toBe(true);
    expect(security.name).toBe('workspace-isolation');
  });

  it('guards stage, score, and source values', () => {
    expect(clickStageSchema.safeParse('contato_inicial').success).toBe(true);
    expect(clickStageSchema.safeParse('perdido').success).toBe(false);
    expect(scoreSchema.safeParse(100).success).toBe(true);
    expect(scoreSchema.safeParse(101).success).toBe(false);
    expect(clickSourceSchema.safeParse('fbr_leads').success).toBe(true);
    expect(clickSourceSchema.safeParse('importado').success).toBe(false);
  });

  it('normalizes lead.qualified payload to an initial Click deal', () => {
    expect(
      normalizeLeadQualified({
        lead_id: 'lead-42',
        empresa_nome: 'ACME',
        contato_nome: 'Ana',
        contato_email: 'ana@acme.example',
        score: 91,
      }),
    ).toMatchObject({
      companyName: 'ACME',
      leadId: 'lead-42',
      priority: 'alta',
      source: 'fbr_leads',
      stage: 'contato_inicial',
    });
  });
});

