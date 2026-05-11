import type { ArvaAgent } from '@fbr/arva-integration';

const COMPANY_ALPHA = '11111111-1111-4111-8111-111111111111';
const USER_SYSTEM = '33333333-3333-4333-8333-333333333333';

export function getSocialTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, user: USER_SYSTEM };
}

export const arvaSocialAgents: ArvaAgent[] = [
  { id: 'arva-compositor', name: 'Compositor', role: 'Render HTML/CSS', tags: ['social media', 'design'], status: 'active' },
  { id: 'arva-assetfinder', name: 'AssetFinder', role: 'Assets licenciados', tags: ['social media', 'conteudo visual'], status: 'active' },
  { id: 'arva-brandsync', name: 'BrandSync', role: 'Brand kit proxy', tags: ['design', 'conteudo visual'], status: 'active' },
  { id: 'arva-thumbsmith', name: 'Thumbsmith', role: 'Capas de video', tags: ['conteudo visual'], status: 'inactive' },
  { id: 'arva-support', name: 'Suporte IA', role: 'Atendimento tecnico', tags: ['suporte'], status: 'active' },
];
