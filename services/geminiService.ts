import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, MessageRole, Attachment, AnalysisResult } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Prepares the conversation history for the API call.
 */
const prepareHistory = (messages: Message[]) => {
  return messages.map((msg) => {
    const realAttachments = msg.attachments?.filter(a => !a.mimeType.includes('mock')) || [];
    const mockAttachments = msg.attachments?.filter(a => a.mimeType.includes('mock')) || [];

    let textContent = msg.text;
    if (mockAttachments.length > 0) {
      mockAttachments.forEach(att => {
        try {
          const decodedContent = atob(att.data);
          textContent += `\n\n[Conteúdo do arquivo ${att.name || 'anexo'}]:\n${decodedContent}`;
        } catch (e) {
          console.warn('Failed to decode mock attachment', e);
        }
      });
    }

    const parts: any[] = [{ text: textContent }];
    
    if (realAttachments.length > 0) {
      realAttachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }

    return {
      role: msg.role === MessageRole.USER ? 'user' : 'model',
      parts: parts
    };
  });
};

/**
 * Sends a message to the Gemini model and returns a stream.
 */
export const streamGeminiResponse = async (
  currentHistory: Message[],
  prompt: string,
  modelId: string,
  attachments: Attachment[] = []
) => {
  try {
    const formattedHistory = prepareHistory(currentHistory.filter(m => m.role !== MessageRole.SYSTEM));

    const chat = ai.chats.create({
      model: modelId,
      history: formattedHistory,
    });

    const realAttachments = attachments.filter(a => !a.mimeType.includes('mock'));
    const mockAttachments = attachments.filter(a => a.mimeType.includes('mock'));

    let finalPrompt = prompt;
    if (mockAttachments.length > 0) {
        mockAttachments.forEach(att => {
            try {
                const decodedContent = att.data.startsWith('data:') ? att.data.split(',')[1] : att.data;
                const decodedText = atob(decodedContent);
                finalPrompt += `\n\n[Arquivo anexado: ${att.name}]:\n${decodedText}`;
            } catch (e) { console.error(e); }
        });
    }

    const currentParts: any[] = [{ text: finalPrompt }];
    realAttachments.forEach(att => {
      currentParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });

    const resultStream = await chat.sendMessageStream({
      message: currentParts
    });

    return resultStream;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Specialized function for structured analysis of a single document
 */
export const analyzeDocument = async (fileName: string, fileContent: string, modelId: string): Promise<AnalysisResult> => {
  const prompt = `Você é um assistente universitário que faz resumos de documentos para incluir no acervo da biblioteca. Analise este documento e retorne um JSON com:
  
  DOCUMENTO: ${fileName}
  CONTEÚDO: ${fileContent}`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tipo: { type: Type.STRING, description: "O tipo de documento" },
          resumo: { type: Type.STRING, description: "Uma frase resumindo o conteúdo" },
          data: { type: Type.STRING, description: "Data do acesso (ex: 20/05/2024)" },
          referencia: { type: Type.STRING, description: "Referência bibliográfica ou temática" }
        },
        required: ["tipo", "resumo", "data", "referencia"]
      }
    }
  });

  const result = JSON.parse(response.text || '{}');
  return {
    ...result,
    nome_original: fileName
  };
};

/**
 * Helper to estimate token count
 */
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};