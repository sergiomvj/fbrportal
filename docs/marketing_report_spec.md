# Especificação Técnica: Report de Marketing (Markdown)

Este documento descreve a estrutura de dados e o formato de saída do **Report de Marketing** gerado pelo sistema Builder Business. O objetivo é fornecer ao time de desenvolvimento o mapeamento necessário para integrar esses dados em plataformas de execução e gestão de campanhas.

## 1. Origem dos Dados
Os dados são extraídos do objeto `metadata` da tabela `projects` no Supabase, especificamente das chaves `marketing_strategy` e `lead_generation_strategy`.

## 2. Mapeamento de Campos (JSON -> MD)

| Seção no Report | Campo JSON (Path) | Tipo de Dado | Descrição |
| :--- | :--- | :--- | :--- |
| **UVP** | `marketing_strategy.value_proposition` | `String` ou `Object` | Proposta de Valor Única do negócio. |
| **Público-Alvo** | `marketing_strategy.target_audience` | `Object` | Contém `primary` e `secondary`. |
| **Estratégia** | `marketing_strategy.approach_strategy` | `String` | Visão geral da abordagem de mercado. |
| **Canais** | `marketing_strategy.channels` | `Array<Object>` | Lista de canais (nome, descrição, prioridade). |
| **Táticas** | `marketing_strategy.tactics` | `Array<Object>` | Lista de táticas (tática, descrição, timeline). |
| **Lead Magnets** | `lead_generation_strategy.lead_magnets` | `Array<Object>` | Iscas digitais sugeridas. |
| **Conversão** | `lead_generation_strategy.conversion_tactics` | `Array<Object>` | Táticas para converter visitantes em leads. |

---

## 3. Exemplo de Estrutura JSON (Input)

```json
{
  "marketing_strategy": {
    "value_proposition": "Plataforma SaaS para automação de micro-logística com IA.",
    "target_audience": {
      "primary": "Donos de e-commerce de pequeno porte",
      "secondary": "Empresas de entrega local"
    },
    "approach_strategy": "Focar em eficiência operacional e redução de custos logísticos através de algoritmos preditivos.",
    "channels": [
      { "name": "Google Ads", "description": "Focar em palavras-chave de intenção de compra.", "priority": "High" }
    ],
    "tactics": [
      { "tactic": "Webinar Semanal", "description": "Demonstração ao vivo da plataforma.", "timeline": "Mês 1" }
    ]
  },
  "lead_generation_strategy": {
    "lead_magnets": [
      { "name": "Calculadora de ROI Logístico", "description": "Ferramenta para estimar economia." }
    ],
    "conversion_tactics": [
      { "tactic": "Trial de 14 dias", "description": "Acesso total sem cartão de crédito." }
    ]
  }
}
```

---

## 4. Exemplo de Report Gerado (Output MD)

# Report de Marketing: [Nome do Projeto]

**Data de Geração:** 15/05/2026
**Status:** Estratégico Aprovado

## 1. Proposta de Valor Única (UVP)
Plataforma SaaS para automação de micro-logística com IA.

## 2. Público-Alvo
- **Primário:** Donos de e-commerce de pequeno porte
- **Secundário:** Empresas de entrega local

## 3. Estratégia de Abordagem
Focar em eficiência operacional e redução de custos logísticos através de algoritmos preditivos.

## 4. Canais Prioritários
- **Google Ads** (Prioridade: High): Focar em palavras-chave de intenção de compra.

## 5. Táticas de Marketing
### Webinar Semanal
Demonstração ao vivo da plataforma.
**Timeline:** Mês 1

## 6. Estratégia de Geração de Leads
### Lead Magnets
- **Calculadora de ROI Logístico**: Ferramenta para estimar economia.

### Táticas de Conversão
- **Trial de 14 dias**: Acesso total sem cartão de crédito.

---

## 5. Notas para Implementação
1. **Tratamento de Strings/Objetos**: A IA pode retornar campos como `value_proposition` tanto como uma string direta quanto como um objeto `{ "content": "..." }`. O mapeamento deve prever ambos os casos.
2. **Sanitização**: Remova tags Markdown indesejadas (como code blocks extras) antes de processar os dados para a plataforma de destino.
3. **Identificadores**: Utilize o `project_id` como chave primária para vincular o report à conta do cliente no sistema de Marketing.
