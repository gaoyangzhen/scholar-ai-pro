import React from 'react';
import { BookOpen, CloudOff, Plus, Trash2, Database, FileUp, Search, FileText } from 'lucide-react';
import { UserMode } from '../types';
import { mockGlossary, mockFiles } from '../constants';

interface KnowledgeBaseModuleProps {
  userMode: UserMode;
}

const KnowledgeBaseModule: React.FC<KnowledgeBaseModuleProps> = ({ userMode }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 p-8 overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">个性化知识库 (Knowledge Base)</h2>
        <p className="text-slate-500">管理您的专业术语和参考文献，增强AI的专业准确度。</p>
        {userMode === 'guest' && <div className="mt-2 inline-flex items-center gap-2 text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded border border-amber-200"><CloudOff size={12}/> 游客模式下数据仅存储在本地，刷新后可能丢失。请登录账户以启用云同步。</div>}
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20} className="text-blue-500"/> 专业词汇库 (Glossary)</h3><button className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded flex items-center gap-1"><Plus size={14}/> 添加词汇</button></div>
          <div className="flex-1 overflow-auto p-0"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500 font-medium"><tr><th className="px-6 py-3">中文术语</th><th className="px-6 py-3">指定英文翻译</th><th className="px-6 py-3">备注</th><th className="px-6 py-3 w-10"></th></tr></thead><tbody className="divide-y divide-slate-100">{mockGlossary.map((item) => (<tr key={item.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-medium">{item.cn}</td><td className="px-6 py-4 text-blue-600 font-mono">{item.en}</td><td className="px-6 py-4 text-slate-400 text-xs">{item.note}</td><td className="px-6 py-4"><Trash2 size={14} className="text-slate-300 hover:text-red-500 cursor-pointer"/></td></tr>))}</tbody></table></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><Database size={20} className="text-emerald-500"/> 参考文档 (RAG Database)</h3><button className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded flex items-center gap-1"><FileUp size={14}/> 上传文档</button></div>
          <div className="p-4"><div className="relative mb-4"><Search className="absolute left-3 top-2.5 text-slate-400" size={16}/><input type="text" placeholder="搜索已上传的参考文献..." className="w-full pl-9 pr-4 py-2 border rounded-lg bg-slate-50 text-sm outline-none focus:ring-1 focus:ring-blue-500"/></div><div className="space-y-3">{mockFiles.map((file) => (<div key={file.id} className="flex items-center p-3 border border-slate-100 rounded-lg hover:shadow-sm hover:border-blue-200 transition-all cursor-pointer bg-slate-50 group"><div className="w-10 h-10 bg-white rounded flex items-center justify-center border border-slate-200 text-slate-500 mr-3"><FileText size={20}/></div><div className="flex-1 overflow-hidden"><p className="font-medium text-slate-700 truncate text-sm">{file.name}</p><p className="text-xs text-slate-400">{file.type} • {file.size}</p></div><div className="opacity-0 group-hover:opacity-100"><button className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button></div></div>))}<div className="flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm hover:bg-slate-50 cursor-pointer transition-colors">+ 点击上传新的参考文献 (PDF/Word)</div></div></div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseModule;