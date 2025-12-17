import React from 'react';
import { Message, MessageRole } from '../types';
import { User, Bot, Paperclip, Terminal, FileCheck, BrainCircuit } from 'lucide-react';
import AnalysisResultCard from './AnalysisResultCard';

interface ChatMessageItemProps {
  message: Message;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;
  const isSystem = message.role === MessageRole.SYSTEM;

  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-6">
        <div className="bg-slate-800/50 text-slate-400 text-xs py-1 px-4 rounded-full flex items-center gap-2 border border-slate-700">
          <Terminal size={12} />
          <span>{message.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${isUser ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Model Tag */}
          {!isUser && message.modelId && (
            <div className={`flex items-center gap-1.5 mb-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
              message.modelId.includes('pro') 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              <BrainCircuit size={10} />
              <span>{message.modelId.replace('models/', '')}</span>
            </div>
          )}

          <div className={`rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10' 
              : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none shadow-black/20'
          }`}>
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att, idx) => (
                  <div key={idx} className="relative group overflow-hidden rounded-lg border border-white/20">
                    {att.mimeType.startsWith('image/') ? (
                      <img 
                        src={`data:${att.mimeType};base64,${att.data}`} 
                        alt="attachment" 
                        className="h-24 w-24 object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-white/10 flex items-center justify-center">
                        <Paperclip size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {message.text}

            {/* Analysis Results Display */}
            {message.analysisResults && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-xs uppercase">
                  <FileCheck size={14} />
                  <span>Relatório de Análise Gerado</span>
                </div>
                {message.analysisResults.map((result, idx) => (
                  <AnalysisResultCard key={idx} result={result} />
                ))}
              </div>
            )}
          </div>
          
          {/* Metadata */}
          <div className="mt-1 flex items-center gap-2 px-1">
             <span className="text-[10px] text-slate-500">
               {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
             </span>
             {!isUser && message.tokenCount && (
               <span className="text-[10px] text-slate-600 bg-slate-800 px-1 rounded border border-slate-700">
                 {message.tokenCount} tokens
               </span>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageItem;