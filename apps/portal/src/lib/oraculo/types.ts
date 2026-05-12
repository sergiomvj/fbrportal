export interface OraculoEntityContext {
  type: string;
  id: string;
}

export interface OraculoContext {
  module: string;
  moduleLabel: string;
  screen: string;
  screenLabel: string;
  pathname: string;
  entity?: OraculoEntityContext;
  suggestedQuestions: string[];
}

export interface OraculoSource {
  filePath: string;
  title: string;
  lineStart: number;
  lineEnd: number;
  excerpt: string;
}

export interface OraculoQueryRequest {
  question: string;
  context: OraculoContext;
}

export interface OraculoQueryResponse {
  answer: string;
  context: OraculoContext;
  sources: OraculoSource[];
}
