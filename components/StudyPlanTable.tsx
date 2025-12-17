import React from 'react';
import { AnalysisResult } from '../types';
import { Library, Calendar, Link, FileText, Info } from 'lucide-react';

interface StudyPlanTableProps {
  data: AnalysisResult[];
}

const StudyPlanTable: React.FC<StudyPlanTableProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
        <Library size={48} className="mb-4 opacity-20" />
        <p>O acervo está vazio.</p>
        <p className="text-xs">Processe arquivos para gerar o relatório da biblioteca.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Doc.</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Resumo</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Data Acesso</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Referência</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Arquivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Library size={14} />
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{row.tipo}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs truncate" title={row.resumo}>
                    {row.resumo}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Calendar size={12} className="text-slate-500" />
                    {row.data}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 max-w-sm">
                    <Link size={14} className="text-indigo-400 shrink-0" />
                    <span className="text-xs text-slate-400 truncate w-32" title={row.referencia}>{row.referencia}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <FileText size={12} className="text-slate-600" />
                    {row.nome_original}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-800/20 px-6 py-3 border-t border-slate-800 flex justify-between items-center">
        <span className="text-[10px] text-slate-500 font-medium italic">
          Relatório de Acervo • {data.length} documentos catalogados
        </span>
        <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
          <span>Sistema Acadêmico Ativo</span>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default StudyPlanTable;