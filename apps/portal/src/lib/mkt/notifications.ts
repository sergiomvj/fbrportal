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

const notifications: MktNotification[] = [];

export function emitNotification(
  empresaId: string,
  tipo: MktNotificationType,
  titulo: string,
  mensagem: string,
  opts: { userId?: string | undefined; entidadeId?: string | undefined; entidadeTipo?: string | undefined } = {},
): MktNotification {
  const notification: MktNotification = {
    id: crypto.randomUUID(),
    empresaId,
    userId: opts.userId,
    tipo,
    titulo,
    mensagem,
    entidadeId: opts.entidadeId,
    entidadeTipo: opts.entidadeTipo,
    lida: false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(notification);
  return notification;
}

export function listNotifications(
  empresaId: string,
  opts: { userId?: string; unreadOnly?: boolean } = {},
): MktNotification[] {
  return notifications.filter((n) => {
    if (n.empresaId !== empresaId) return false;
    if (opts.userId && n.userId && n.userId !== opts.userId) return false;
    if (opts.unreadOnly && n.lida) return false;
    return true;
  });
}

export function markNotificationRead(notificationId: string): boolean {
  const n = notifications.find((item) => item.id === notificationId);
  if (n) {
    n.lida = true;
    return true;
  }
  return false;
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
  notifications.length = 0;
}
