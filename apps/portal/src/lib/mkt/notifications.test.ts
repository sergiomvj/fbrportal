import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emitNotification, listNotifications, markNotificationRead, resetNotificationsForTests } from './notifications';

type NotificationRow = {
  id: string;
  empresa_id: string;
  user_id: string | null;
  tipo: string;
  titulo: string;
  mensagem: string;
  entidade_id: string | null;
  entidade_tipo: string | null;
  lida: boolean;
  created_at: string;
};

const supabaseState = vi.hoisted(() => ({
  rows: [] as NotificationRow[],
}));

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseServerClient: () => ({
    from: (table: string) => {
      if (table !== 'mkt_notifications') throw new Error(`Unexpected table: ${table}`);
      return createNotificationsQuery();
    },
  }),
}));

function createNotificationsQuery(updateValues?: Partial<NotificationRow>) {
  const filters: Array<{ column: string; value: unknown }> = [];
  let userScope: string | null = null;

  const query = {
    insert: (row: NotificationRow) => ({
      select: () => ({
        single: async () => {
          supabaseState.rows.push(row);
          return { data: row, error: null };
        },
      }),
    }),
    select: () => query,
    update: (values: Partial<NotificationRow>) => createNotificationsQuery(values),
    eq: (column: string, value: unknown) => {
      filters.push({ column, value });
      return query;
    },
    or: (expression: string) => {
      const match = expression.match(/user_id\.is\.null,user_id\.eq\.([^,]+)/);
      userScope = match?.[1] ?? null;
      return query;
    },
    order: () => query,
    limit: async (limit: number) => {
      return {
        data: applyFilters(filters, userScope)
          .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
          .slice(0, limit),
        error: null,
      };
    },
    maybeSingle: async () => {
      const row = applyFilters(filters, userScope)[0] ?? null;
      if (row && updateValues) Object.assign(row, updateValues);
      return { data: row ? { id: row.id } : null, error: null };
    },
  };

  return query;
}

function applyFilters(filters: Array<{ column: string; value: unknown }>, userScope: string | null) {
  return supabaseState.rows.filter((row) => {
    const matchesFilters = filters.every(({ column, value }) => row[column as keyof NotificationRow] === value);
    const matchesUserScope = !userScope || row.user_id === null || row.user_id === userScope;
    return matchesFilters && matchesUserScope;
  });
}

describe('MKT persisted notifications', () => {
  beforeEach(() => {
    supabaseState.rows = [];
    resetNotificationsForTests();
  });

  it('persists notifications in Supabase and maps them back to the API contract', async () => {
    const notification = await emitNotification(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'strategy_ready',
      'Estrategia pronta',
      'Plano pronto para revisao.',
      {
        userId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        entidadeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        entidadeTipo: 'estrategia',
      },
    );

    expect(notification).toMatchObject({
      empresaId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      userId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      tipo: 'strategy_ready',
      titulo: 'Estrategia pronta',
      mensagem: 'Plano pronto para revisao.',
      entidadeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      entidadeTipo: 'estrategia',
      lida: false,
    });
    expect(supabaseState.rows).toHaveLength(1);
  });

  it('lists only company-scoped notifications for the current user and unread filter', async () => {
    const companyId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const userId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const otherUserId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

    const global = await emitNotification(companyId, 'diagnostico_ready', 'Diagnostico', 'Global.');
    const userScoped = await emitNotification(companyId, 'export_ready', 'Export', 'User.', { userId });
    await emitNotification(companyId, 'critical_failure', 'Falha', 'Outro usuario.', { userId: otherUserId });
    await emitNotification('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'strategy_ready', 'Outra empresa', 'Nao listar.');

    expect(await markNotificationRead(global.id, companyId)).toBe(true);

    const unread = await listNotifications(companyId, { userId, unreadOnly: true });
    const all = await listNotifications(companyId, { userId });

    expect(unread.map((item) => item.id)).toEqual([userScoped.id]);
    expect(all.map((item) => item.id).sort()).toEqual([global.id, userScoped.id].sort());
    expect(await markNotificationRead(userScoped.id, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')).toBe(false);
  });
});
