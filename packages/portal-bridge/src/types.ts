export type PortalMessage =
  | {
      type: 'AUTH_TOKEN';
      payload: { token: string; expiresAt: string };
    }
  | {
      type: 'NAVIGATE';
      payload: { path: string };
    }
  | {
      type: 'NOTIFICATION';
      payload: { level: 'info' | 'success' | 'warning' | 'error'; message: string };
    }
  | {
      type: 'MODULE_READY';
      payload: { moduleId: string };
    }
  | {
      type: 'CROSS_MODULE_EVENT';
      payload: { event: string; data: unknown };
    };

export type PortalMessageType = PortalMessage['type'];
