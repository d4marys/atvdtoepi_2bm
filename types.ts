export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64
  name?: string;
}

export interface AnalysisResult {
  tipo: string;
  resumo: string;
  data: string;
  referencia: string;
  nome_original: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  attachments?: Attachment[];
  timestamp: number;
  tokenCount?: number;
  modelId?: string; // Tracks which model was used
  analysisResults?: AnalysisResult[];
}

export interface UsageStat {
  timestamp: string;
  tokens: number;
  latency: number;
}

export interface GeminiModelInfo {
  id: string;
  name: string;
  description: string;
  methods: string[];
}