import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatSidebar } from './ChatSidebar';

const estrategiaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function sseResponse(text: string) {
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ delta: text })}\n\n`));
      controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
      controller.close();
    },
  }), {
    headers: { 'content-type': 'text/event-stream; charset=utf-8' },
  });
}

describe('MKT ChatSidebar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return sseResponse('Resposta em streaming com contexto combinado.');
      }

      return Response.json({
        messages: [],
        suggestions: ['priorizar quick win do calendario'],
        inconsistencyFlags: ['campanhas sem copy vinculada: Diagnostico Executivo'],
      });
    }));
    HTMLElement.prototype.scrollTo = vi.fn();
  });

  it('opens from the PRD keyboard shortcut', async () => {
    const onToggle = vi.fn();

    render(<ChatSidebar estrategiaId={estrategiaId} isOpen={false} onToggle={onToggle} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders contextual suggestions and consumes assistant SSE deltas', async () => {
    render(<ChatSidebar estrategiaId={estrategiaId} isOpen onToggle={vi.fn()} />);

    const suggestion = await screen.findByRole('button', { name: 'priorizar quick win do calendario' });
    expect(screen.getByRole('button', { name: 'Corrigir campanhas sem copy vinculada: Diagnostico Executivo' })).toBeInTheDocument();

    fireEvent.click(suggestion);

    await waitFor(() => {
      expect(screen.getByText('Resposta em streaming com contexto combinado.')).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith(
      `/api/proxy/mkt/estrategias/${estrategiaId}/chat`,
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
