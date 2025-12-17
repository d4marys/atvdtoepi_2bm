import React from 'react';
import { AnalysisResult } from '../types';
import { BookMarked, Calendar, Link, FileText, Info } from 'lucide-react';

interface AnalysisResultCardProps {
  result: AnalysisResult;
}

const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ result }) => {
  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3 shadow-sm hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <BookMarked size={16} />
          </div>
          <span className="text-sm font-semibold text-slate-200">{result.tipo}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[9px] text-slate-400 font-medium">
          <Calendar size={10} />
          <span>{result.data}</span>
        </div>
      </div>

      <div>
        <h4 className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Resumo de Acervo</h4>
        <p className="text-slate-300 text-xs leading-relaxed italic">"{result.resumo}"</p>
      </div>

      <div className="flex items-start gap-2 bg-slate-800/30 p-2 rounded-lg border border-slate-700/30">
        <Link size={14} className="text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[10px] uppercase text-slate-500 font-bold mb-0.5 tracking-wider">Referência Temática</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">{result.referencia}</p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 truncate max-w-[200px]">
          <FileText size={12} />
          <span>{result.nome_original}</span>
        </div>
        <Info size={12} className="text-slate-700" />
      </div>
    </div>
  );
};

export default AnalysisResultCard;