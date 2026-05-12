export type PortalMessage =
  | {
      type: 'AUTH_TOKEN';
      payload: { userId: string; role: string };
    }
  | {
      type: 'NAVIGATE';
      payload: { module: string; path: string };
    }
  | {
      type: 'NOTIFICATION';
      payload: { title: string; body: string; level: 'info' | 'warn' | 'error' };
    }
  | {
      type: 'MODULE_READY';
      payload: { module: string };
    }
  | {
      type: 'CROSS_MODULE_EVENT';
      payload: { event: string; data: unknown };
    }
  | {
      type: 'ORACULO_CONTEXT';
      payload: { module: string; screen: string; pathname?: string; entity?: { type: string; id: string } };
    };

export type PortalMessageType = PortalMessage['type'];
