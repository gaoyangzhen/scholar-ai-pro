import React from 'react';
import { History, FileText, BookOpen, Trash2 } from 'lucide-react';
import { HistoryRecord } from '../types';

interface HistoryModuleProps {
  savedRecords: HistoryRecord[];
}

const HistoryModule: React.FC<HistoryModuleProps> = ({ savedRecords }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 p-8 overflow-y-auto animate-fade-in">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">历史记录 (History)</h2>
        <p className="text-slate-500">查看您过往的审稿报告和写作草稿。</p>
      </header>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium text-sm">
            <tr>
              <th className="px-6 py-4">项目名称 (Title)</th>
              <th className="px-6 py-4">类型 (Type)</th>
              <th className="px-6 py-4">时间 (Date)</th>
              <th className="px-6 py-4">状态/详情</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {savedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-700">{record.title}</div>
                  <div className="text-xs text-slate-400">ID: {record.id}</div>
                </td>
                <td className="px-6 py-4">
                  {record.type === 'review' ? (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"><FileText size={12}/> Review</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs"><BookOpen size={12}/> Editor</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{record.date}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {record.type === 'review' ? `Score: ${record.score || 'N/A'}` : `Words: ${record.words || 'N/A'}`}
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">查看</button>
                  <button className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {savedRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <History size={48} className="mb-2 opacity-20"/>
                    暂无历史记录
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryModule;