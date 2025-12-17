import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Download, 
  Menu, 
  X, 
  Cpu, 
  Image as ImageIcon,
  FileText,
  Folder,
  Play,
  Loader2,
  List,
  ChevronDown,
  ChevronUp,
  Box,
  LayoutDashboard,
  MessageSquare,
  Table as TableIcon,
  ArrowLeft,
  Library
} from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

import { Message, MessageRole, Attachment, UsageStat, AnalysisResult, GeminiModelInfo } from './types';
import { streamGeminiResponse, estimateTokens, analyzeDocument } from './services/geminiService';
import ChatMessageItem from './components/ChatMessageItem';
import UsageChart from './components/UsageChart';
import StudyPlanTable from './components/StudyPlanTable';

// Mock files updated to match the latest Python script
const MOCK_FILES = [
  { name: 'starwars.pdf', content: 'Enredo do filme Star Wars: Guerra nas estrelas. A jornada de Luke Skywalker contra o Império Galáctico.' },
  { name: 'doc_final.pdf', content: 'Como ter a massa de bolo perfeita, 3 dicas rápidas e facéis. Use ingredientes em temperatura ambiente e bata bem as claras.' },
  { name: 'artigo.pdf', content: 'Artigo de opinião sobre as terras indigenas no Brasil. Uma análise profunda sobre demarcação e direitos constitucionais.' }
];

const DISCOVERED_MODELS: GeminiModelInfo[] = [
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', description: 'Leve, estável e otimizado para automação rápida.', methods: ['generateContent'] },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Otimizado para velocidade e eficiência.', methods: ['generateContent', 'stream'] },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Máxima inteligência para tarefas complexas.', methods: ['generateContent', 'stream', 'caching'] },
  { id: 'gemma-3-27b-it', name: 'Gemma 3 27B', description: 'Modelo aberto de alta performance.', methods: ['generateContent'] }
];

const App: React.FC = () => {
  // UI State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [usageData, setUsageData] = useState<UsageStat[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-lite');
  const [activeView, setActiveView] = useState<'chat' | 'plan'>('chat');
  const [analysisProgress, setAnalysisProgress] = useState<{current: number, total: number} | null>(null);
  const [showModels, setShowModels] = useState(false);
  
  // Data State - Derived from messages for persistent report
  const studyPlanData = useMemo(() => {
    const allResults: AnalysisResult[] = [];
    messages.forEach(msg => {
      if (msg.analysisResults) {
        allResults.push(...msg.analysisResults);
      }
    });
    return allResults;
  }, [messages]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'init-1',
        role: MessageRole.SYSTEM,
        text: 'Sistema de Catalogação Universitário iniciado. Módulo: gemini-2.5-flash-lite.',
        timestamp: Date.now() - 3000
      },
      {
        id: 'init-1-5',
        role: MessageRole.SYSTEM,
        text: '📂 Pasta "meus_downloads" sincronizada. 3 novos PDFs detectados.',
        timestamp: Date.now() - 2500
      },
      {
        id: 'init-2',
        role: MessageRole.MODEL,
        text: 'Olá! Sou seu Assistente de Biblioteca. \n\nAcabo de localizar os arquivos no diretório de downloads. Estou pronto para extrair os resumos, referências e datas para o nosso acervo digital. \n\nPosso começar a catalogação?',
        timestamp: Date.now(),
        modelId: 'gemini-2.5-flash-lite'
      }
    ]);
  }, []);

  useEffect(() => {
    if (activeView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, analysisProgress, activeView]);

  const handleSendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isGenerating) return;

    const userMessageId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMessageId,
      role: MessageRole.USER,
      text: input,
      attachments: [...attachments],
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setAttachments([]);
    setIsGenerating(true);
    setActiveView('chat');

    const botMessageId = (Date.now() + 1).toString();
    let fullResponseText = '';
    
    setMessages(prev => [
      ...prev,
      {
        id: botMessageId,
        role: MessageRole.MODEL,
        text: '', 
        timestamp: Date.now(),
        modelId: selectedModel
      }
    ]);

    const startTime = Date.now();

    try {
      const stream = await streamGeminiResponse(messages, newUserMessage.text, selectedModel, newUserMessage.attachments);

      for await (const chunk of stream) {
        const chunkText = (chunk as GenerateContentResponse).text || '';
        fullResponseText += chunkText;

        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, text: fullResponseText } 
              : msg
          )
        );
      }

      const latency = Date.now() - startTime;
      const tokens = estimateTokens(fullResponseText);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, tokenCount: tokens } 
            : msg
        )
      );

      setUsageData(prev => [
        ...prev, 
        { 
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit', second:'2-digit'}), 
          tokens, 
          latency 
        }
      ].slice(-20));

    } catch (error) {
      console.error("Failed to generate", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: MessageRole.SYSTEM,
          text: `Erro de Processamento: ${error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeAll = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setActiveView('chat');
    setAnalysisProgress({ current: 0, total: MOCK_FILES.length });
    
    const results: AnalysisResult[] = [];
    const botMessageId = Date.now().toString();

    setMessages(prev => [...prev, {
      id: botMessageId,
      role: MessageRole.MODEL,
      text: `🏛️ Iniciando catalogação sistemática de ${MOCK_FILES.length} documentos para a biblioteca...`,
      timestamp: Date.now(),
      modelId: selectedModel
    }]);

    try {
      for (let i = 0; i < MOCK_FILES.length; i++) {
        const file = MOCK_FILES[i];
        setAnalysisProgress({ current: i + 1, total: MOCK_FILES.length });
        
        setMessages(prev => prev.map(m => m.id === botMessageId ? {
          ...m,
          text: m.text + `\n📑 Processando acervo: ${file.name}...`
        } : m));

        const result = await analyzeDocument(file.name, file.content, selectedModel);
        results.push(result);

        setMessages(prev => prev.map(m => m.id === botMessageId ? {
          ...m,
          text: m.text + ` Catalogado. ✅`
        } : m));
      }

      setMessages(prev => prev.map(m => m.id === botMessageId ? {
        ...m,
        text: m.text + `\n\n✨ Processo de catalogação finalizado. Os dados estão disponíveis na aba de Acervo.`,
        analysisResults: results
      } : m));

    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsGenerating(false);
      setAnalysisProgress(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          mimeType: file.type,
          data: base64String,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMockFileClick = (file: typeof MOCK_FILES[0]) => {
    const base64Content = btoa(file.content);
    setAttachments(prev => [...prev, {
      mimeType: 'application/mock-pdf', 
      data: base64Content,
      name: file.name
    }]);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden relative">
      
      {isSidebarOpen && (
        <div className="absolute inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`absolute md:relative z-30 w-72 h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Library size={22} />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-sm">Library AI</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Archive Sync v1.0</p>
            </div>
          </div>
          <UsageChart data={usageData} />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {/* Navigation */}
          <div>
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 px-2">Monitoramento</h2>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveView('chat')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeView === 'chat' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <MessageSquare size={18} />
                <span className="text-sm font-medium">Chat Assistente</span>
              </button>
              <button 
                onClick={() => setActiveView('plan')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  activeView === 'plan' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={18} />
                  <span className="text-sm font-medium">Acervo Digital</span>
                </div>
                {studyPlanData.length > 0 && (
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[18px] text-center">
                    {studyPlanData.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Files */}
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Diretório: meus_downloads</h2>
              <button 
                onClick={handleAnalyzeAll}
                disabled={isGenerating}
                className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors disabled:opacity-30"
                title="Catalogar todos os documentos"
              >
                <Play size={14} fill="currentColor" />
              </button>
            </div>
            <div className="space-y-2">
              {MOCK_FILES.map((file, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleMockFileClick(file)}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all group"
                >
                  <FileText size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-slate-300 text-xs truncate flex-1">{file.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Models */}
          <div>
            <button 
                onClick={() => setShowModels(!showModels)}
                className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2 mb-3"
             >
               <div className="flex items-center gap-2">
                 <Box size={12} />
                 <span>Motores Analíticos</span>
               </div>
               {showModels ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
             </button>
             {showModels && (
               <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                 {DISCOVERED_MODELS.map((m) => (
                   <div key={m.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/50">
                      <div className="text-[11px] font-bold text-slate-200">{m.name}</div>
                      <div className="text-[9px] text-slate-500 mt-1 leading-relaxed">{m.description}</div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800">
           <button onClick={() => { setMessages([]); setActiveView('chat'); }} className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-red-400 transition-colors text-xs font-semibold">
             <Trash2 size={14} />
             <span>Limpar Histórico</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Animated Header */}
        <header className="h-16 border-b border-slate-800/50 flex items-center px-6 justify-between bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white transition-colors">
               <Menu size={20} />
             </button>
             
             {activeView === 'plan' ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveView('chat')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all mr-2">
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <TableIcon size={18} className="text-emerald-500" />
                    Relatório de Acervo Digital
                  </h2>
                </div>
             ) : (
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                   {['gemini-2.5-flash-lite', 'gemini-3-flash-preview'].map((m) => (
                      <button 
                        key={m}
                        onClick={() => setSelectedModel(m)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          selectedModel === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {m === 'gemini-2.5-flash-lite' ? 'LITE (Padrão)' : 'FLASH'}
                      </button>
                   ))}
                </div>
             )}
           </div>
           
           <div className="hidden sm:flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Sincronização</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 font-mono">ESTÁVEL</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
           </div>
        </header>

        {/* Dynamic Content View */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-5xl mx-auto p-4 md:p-10 h-full">
            {activeView === 'chat' ? (
              <div className="max-w-3xl mx-auto">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-6 border border-indigo-500/20 shadow-2xl">
                      <Library size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">Assistente de Acervo</h3>
                    <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                      Sincronizado com a pasta "meus_downloads". Use o poder do Gemini Lite para catalogar referências bibliográficas instantaneamente.
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <ChatMessageItem key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} className="h-10" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100">Acervo Catalogado</h2>
                    <p className="text-slate-500 text-sm">Dados extraídos via <span className="text-indigo-400 font-mono text-xs uppercase">{selectedModel}</span></p>
                  </div>
                  <button onClick={handleAnalyzeAll} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all">
                    <Play size={16} />
                    Recatalogar Acervo
                  </button>
                </div>
                <StudyPlanTable data={studyPlanData} />
              </div>
            )}
          </div>
        </div>

        {/* Global Progress Indicator */}
        {analysisProgress && (
           <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm bg-indigo-600/90 backdrop-blur-xl rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl border border-indigo-400/50 animate-in slide-in-from-top-4">
              <div className="relative">
                <Loader2 size={24} className="animate-spin text-white opacity-40" />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                  {Math.round((analysisProgress.current / analysisProgress.total) * 100)}%
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-white font-bold uppercase mb-1">
                  <span>Catalogação Acadêmica</span>
                  <span>{analysisProgress.current} / {analysisProgress.total}</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-white h-full transition-all duration-500 ease-out" style={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }} />
                </div>
              </div>
           </div>
        )}

        {/* Chat Input Bar - Only visible in Chat mode */}
        {activeView === 'chat' && (
          <div className="p-6 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/50">
            <div className="max-w-3xl mx-auto relative">
              {attachments.length > 0 && (
                <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scroll-smooth">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group shrink-0">
                      <div className="h-16 w-16 rounded-xl border border-slate-700/50 overflow-hidden flex items-center justify-center bg-slate-800/50 shadow-lg">
                        {att.mimeType.startsWith('image/') ? (
                           <img src={`data:${att.mimeType};base64,${att.data}`} className="h-full w-full object-cover" alt="prev" />
                        ) : (
                           <div className="flex flex-col items-center justify-center h-full w-full p-2 bg-indigo-500/10">
                             <FileText size={20} className="text-indigo-400 mb-1" />
                             <span className="text-[8px] text-slate-500 truncate w-full text-center px-1">{att.name}</span>
                           </div>
                        )}
                      </div>
                      <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-slate-900 text-slate-400 rounded-full p-1 border border-slate-700 hover:text-red-400 shadow-xl transition-colors">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative flex items-end gap-2 bg-slate-900 rounded-2xl border border-slate-800 p-2 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-2xl">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-3 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all shrink-0"
                >
                  <ImageIcon size={20} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileSelect} />

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Consultar Assistente (${selectedModel.includes('lite') ? 'Lite' : 'Flash'})...`}
                  className="w-full bg-transparent text-slate-200 placeholder-slate-600 resize-none outline-none py-3 px-1 min-h-[48px] max-h-60 text-sm leading-relaxed"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 240)}px`;
                  }}
                />

                <button 
                  onClick={handleSendMessage}
                  disabled={(!input.trim() && attachments.length === 0) || isGenerating}
                  className={`p-3 rounded-xl shrink-0 transition-all duration-300 ${
                    (!input.trim() && attachments.length === 0) || isGenerating
                      ? 'bg-slate-800 text-slate-600'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 active:scale-95'
                  }`}
                >
                  {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
              <p className="mt-3 text-[10px] text-slate-600 text-center uppercase tracking-widest font-bold">
                Archive Engine • Multimodal Library Sync
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;