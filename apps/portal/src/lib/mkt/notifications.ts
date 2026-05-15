export type MktNotificationType =
  | 'strategy_ready'
  | 'export_ready'
  | 'critical_failure'
  | 'upload_completed'
  | 'diagnostico_ready';

export interface MktNotification {
  id: string;
  empresaId: string;
  userId?: string | undefined;
  tipo: MktNotificationType;
  titulo: string;
  mensagem: string;
  entidadeId?: string | undefined;
  entidadeTipo?: string | undefined;
  lida: boolean;
  createdAt: string;
}

type MktNotificationRow = {
  id: string;
  empresa_id: string;
  user_id?: string | null;
  tipo: MktNotificationType;
  titulo: string;
  mensagem: string;
  entidade_id?: string | null;
  entidade_tipo?: string | null;
  lida: boolean;
  created_at: string;
};

export async function emitNotification(
  empresaId: string,
  tipo: MktNotificationType,
  titulo: string,
  mensagem: string,
  opts: { userId?: string | undefined; entidadeId?: string | undefined; entidadeTipo?: string | undefined } = {},
): Promise<MktNotification> {
  const row = {
    id: crypto.randomUUID(),
    empresa_id: empresaId,
    user_id: opts.userId ?? null,
    tipo,
    titulo,
    mensagem,
    entidade_id: opts.entidadeId ?? null,
    entidade_tipo: opts.entidadeTipo ?? null,
    lida: false,
    created_at: new Date().toISOString(),
  };

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from('mkt_notifications').insert(row).select().single();
  if (error) throw new Error(error.message);
  return mapNotification(data as MktNotificationRow);
}

export async function listNotifications(
  empresaId: string,
  opts: { userId?: string; unreadOnly?: boolean } = {},
): Promise<MktNotification[]> {
  const supabase = await getSupabaseClient();
  let query = supabase
    .from('mkt_notifications')
    .select('*')
    .eq('empresa_id', empresaId);

  if (opts.userId) {
    query = query.or(`user_id.is.null,user_id.eq.${opts.userId}`);
  }

  if (opts.unreadOnly) {
    query = query.eq('lida', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
  if (error) throw new Error(error.message);
  return ((data as MktNotificationRow[] | null) ?? []).map(mapNotification);
}

export async function markNotificationRead(notificationId: string, empresaId: string): Promise<boolean> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('mkt_notifications')
    .update({ lida: true })
    .eq('id', notificationId)
    .eq('empresa_id', empresaId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export function notifyStrategyReady(empresaId: string, estrategiaId: string, nome: string) {
  return emitNotification(
    empresaId,
    'strategy_ready',
    'Estrategia Pronta',
    `A estrategia "${nome}" esta pronta para revisao.`,
    { entidadeId: estrategiaId, entidadeTipo: 'estrategia' },
  );
}

export function notifyExportReady(empresaId: string, estrategiaId: string, formato: string) {
  return emitNotification(
    empresaId,
    'export_ready',
    'Exportacao Concluida',
    `Seu ${formato.toUpperCase()} esta pronto para download.`,
    { entidadeId: estrategiaId, entidadeTipo: 'export' },
  );
}

export function notifyCriticalFailure(empresaId: string, mensagem: string, entidadeId?: string) {
  return emitNotification(
    empresaId,
    'critical_failure',
    'Falha Critica',
    mensagem,
    { entidadeId, entidadeTipo: 'job' },
  );
}

export function notifyUploadCompleted(empresaId: string, estrategiaId: string, filename: string) {
  return emitNotification(
    empresaId,
    'upload_completed',
    'Upload Concluido',
    `Documento "${filename}" enviado com sucesso. Processamento iniciado.`,
    { entidadeId: estrategiaId, entidadeTipo: 'estrategia' },
  );
}

export function notifyDiagnosticoReady(empresaId: string, estrategiaId: string) {
  return emitNotification(
    empresaId,
    'diagnostico_ready',
    'Diagnostico Extraido',
    'O diagnostico esta pronto para revisao e aprovacao.',
    { entidadeId: estrategiaId, entidadeTipo: 'diagnostico' },
  );
}

export function resetNotificationsForTests() {
  // Notifications are persisted through Supabase; kept for test compatibility.
}

function mapNotification(row: MktNotificationRow): MktNotification {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    userId: row.user_id ?? undefined,
    tipo: row.tipo,
    titulo: row.titulo,
    mensagem: row.mensagem,
    entidadeId: row.entidade_id ?? undefined,
    entidadeTipo: row.entidade_tipo ?? undefined,
    lida: row.lida,
    createdAt: row.created_at,
  };
}

async function getSupabaseClient() {
  const { createSupabaseServerClient } = await import('../supabase-admin');
  return createSupabaseServerClient();
}
