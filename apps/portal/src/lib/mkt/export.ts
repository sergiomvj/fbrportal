import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type {
  MktBranding,
  MktCalendarItem,
  MktCopyVariant,
  MktDiagnostico,
  MktEstrategia,
  MktEstrategiaVersao,
  MktLeadMagnet,
  MktRoadmapTask,
} from './types';

export interface MktExportBundle {
  estrategia: MktEstrategia;
  versao: MktEstrategiaVersao;
  diagnostico: MktDiagnostico | null;
  copy: MktCopyVariant[];
  leadMagnets: MktLeadMagnet[];
  calendario: MktCalendarItem[];
  roadmap: MktRoadmapTask[];
  branding: MktBranding | null;
}

export interface StrategyExportedEvent {
  event: 'strategy.exported';
  data: {
    estrategia_id: string;
    nome: string;
    nicho: string;
    documento_original: string;
    score_viabilidade: number;
    canais_sugeridos: string[];
    exportado_por: string;
  };
}

export type ClickBridgeResult =
  | { status: 'sent'; statusCode: number }
  | { status: 'skipped'; reason: 'MKT_CLICK_BRIDGE_URL_NOT_CONFIGURED' }
  | { status: 'failed'; statusCode?: number; message: string };

export function resolveClickBridgeEndpoint(
  explicitEndpoint = process.env.MKT_CLICK_BRIDGE_URL,
  baseUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL,
): string | null {
  if (explicitEndpoint && explicitEndpoint.trim().length > 0) {
    return explicitEndpoint;
  }

  if (!baseUrl || baseUrl.trim().length === 0) {
    return null;
  }

  const normalizedBase = /^https?:\/\//i.test(baseUrl) ? baseUrl : `https://${baseUrl}`;
  return new URL('/api/proxy/click/events', normalizedBase).toString();
}

export async function generateMktPdfBuffer(bundle: MktExportBundle): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const primary = hexToRgb(bundle.branding?.cor_primaria ?? '#0EA5E9');
  const sections = buildExportSections(bundle);

  let page = pdf.addPage([595.28, 841.89]);
  let y = 785;

  const drawLine = (text: string, size = 10, isTitle = false) => {
    if (y < 60) {
      page = pdf.addPage([595.28, 841.89]);
      y = 785;
    }

    page.drawText(text, {
      x: 48,
      y,
      size,
      font: isTitle ? bold : regular,
      color: isTitle ? rgb(primary.r, primary.g, primary.b) : rgb(0.08, 0.1, 0.14),
    });
    y -= isTitle ? 24 : 15;
  };

  drawLine(bundle.estrategia.nome, 22, true);
  drawLine(`Empresa: ${bundle.branding?.nome_empresa ?? bundle.estrategia.empresa_id}`, 11);
  drawLine(`Versao: ${bundle.versao.versao}`, 11);
  drawLine(`Nicho: ${bundle.estrategia.nicho ?? 'Nao informado'}`, 11);
  y -= 10;

  for (const section of sections) {
    drawLine(section.title, 14, true);
    for (const line of section.lines.flatMap((item) => wrapText(item, 88))) {
      drawLine(line);
    }
    y -= 8;
  }

  return Buffer.from(await pdf.save());
}

export function generateMktPptxBuffer(bundle: MktExportBundle): Buffer {
  const sections = buildExportSections(bundle);
  const slides = [
    { title: bundle.estrategia.nome, lines: [`Versao ${bundle.versao.versao}`, bundle.estrategia.nicho ?? 'Nicho nao informado'] },
    ...sections.map((section) => ({ title: section.title, lines: section.lines.slice(0, 8) })),
    { title: 'Proximos Passos', lines: bundle.roadmap.slice(0, 6).map((item) => `${item.fase}: ${item.item}`) },
  ].slice(0, 15);

  const files: Record<string, string | Buffer> = {
    '[Content_Types].xml': contentTypesXml(slides.length),
    '_rels/.rels': rootRelsXml(),
    'ppt/presentation.xml': presentationXml(slides.length),
    'ppt/_rels/presentation.xml.rels': presentationRelsXml(slides.length),
  };

  slides.forEach((slide, index) => {
    files[`ppt/slides/slide${index + 1}.xml`] = slideXml(slide.title, slide.lines);
  });

  return createZip(files);
}

export function buildStrategyExportedEvent(bundle: MktExportBundle, userId: string): StrategyExportedEvent {
  return {
    event: 'strategy.exported',
    data: {
      estrategia_id: bundle.estrategia.id!,
      nome: bundle.estrategia.nome,
      nicho: bundle.estrategia.nicho ?? 'Geral',
      documento_original: bundle.estrategia.doc_path ?? '',
      score_viabilidade: bundle.diagnostico?.score_viab ?? 0,
      canais_sugeridos: bundle.versao.conteudo.mix_canais.map((canal) => canal.nome),
      exportado_por: userId,
    },
  };
}

export async function emitStrategyExportedEvent(
  event: StrategyExportedEvent,
  context: { userId: string; companyId: string; moduleSource?: string },
  endpoint = resolveClickBridgeEndpoint(),
): Promise<ClickBridgeResult> {
  if (!endpoint) {
    return { status: 'skipped', reason: 'MKT_CLICK_BRIDGE_URL_NOT_CONFIGURED' };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': context.userId,
        'x-company-id': context.companyId,
        'x-workspace-id': context.companyId,
        'x-module-source': context.moduleSource ?? 'fbr-mkt',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      return { status: 'failed', statusCode: response.status, message: await response.text() };
    }

    return { status: 'sent', statusCode: response.status };
  } catch (error) {
    return { status: 'failed', message: error instanceof Error ? error.message : 'Unknown bridge error' };
  }
}

function buildExportSections(bundle: MktExportBundle) {
  const strategy = bundle.versao.conteudo;
  return [
    {
      title: 'Diagnostico',
      lines: [
        `UVP: ${bundle.diagnostico?.uvp ?? strategy.posicionamento.uvp}`,
        `Score de viabilidade: ${bundle.diagnostico?.score_viab ?? 0}`,
        `Persona: ${bundle.diagnostico?.persona.nome ?? 'Nao informada'}`,
      ],
    },
    {
      title: 'Posicionamento',
      lines: [
        `Arquetipo: ${strategy.posicionamento.brand_archetype}`,
        `Tom de voz: ${strategy.posicionamento.tom_de_voz}`,
        strategy.posicionamento.posicionamento_mercado,
      ],
    },
    {
      title: 'Mix de Canais',
      lines: strategy.mix_canais.map((canal) => `${canal.nome} - ${canal.percentual_alocacao}% - ${canal.justificativa}`),
    },
    {
      title: 'KPIs',
      lines: strategy.kpis.map((kpi) => `${kpi.canal}: CAC ${kpi.cac ?? '-'}, LTV ${kpi.ltv ?? '-'}, ROI ${kpi.roi ?? '-'}`),
    },
    {
      title: 'Campanhas Prioritarias',
      lines: strategy.campanhas.map((campanha) => `${campanha.nome}: ${campanha.objetivo_smart}`),
    },
    {
      title: 'Copy e Captacao',
      lines: [
        ...bundle.copy.slice(0, 8).map((item) => `${item.tipo}/${item.canal}: ${item.conteudo}`),
        ...bundle.leadMagnets.slice(0, 5).map((item) => `Lead magnet: ${item.nome} (${item.funil_estagio})`),
      ],
    },
    {
      title: 'Calendario Editorial',
      lines: bundle.calendario.slice(0, 10).map((item) => `${item.data} ${item.canal} ${item.tipo}: ${item.tema}`),
    },
    {
      title: 'Roadmap Operacional',
      lines: bundle.roadmap.slice(0, 10).map((item) => `${item.fase}: ${item.item} - ${item.responsavel ?? 'Sem responsavel'}`),
    },
  ];
}

function wrapText(text: string, maxLength: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : ['-'];
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const value = Number.parseInt(clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean, 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
  };
}

function xmlEscape(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function contentTypesXml(slideCount: number) {
  const slides = Array.from({ length: slideCount }, (_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>${slides}</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`;
}

function presentationXml(slideCount: number) {
  const ids = Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 1}"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldIdLst>${ids}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/></p:presentation>`;
}

function presentationRelsXml(slideCount: number) {
  const rels = Array.from({ length: slideCount }, (_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}

function slideXml(title: string, lines: string[]) {
  const body = lines.length > 0 ? lines : ['Sem dados disponiveis'];
  const paragraphs = body.map((line) => `<a:p><a:r><a:rPr lang="pt-BR" sz="1800"/><a:t>${xmlEscape(line)}</a:t></a:r></a:p>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="pt-BR" sz="3200" b="1"/><a:t>${xmlEscape(title)}</a:t></a:r></a:p>${paragraphs}</p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;
}

function createZip(files: Record<string, string | Buffer>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBuffer = Buffer.from(name);
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    localParts.push(local, nameBuffer, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuffer);

    offset += local.length + nameBuffer.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function crc32(buffer: Buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0);
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});
