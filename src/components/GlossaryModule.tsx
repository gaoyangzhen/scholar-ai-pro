import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Book, Save, X } from 'lucide-react';
import { api } from '../api';
import { GlossaryTerm } from '../types';

const GlossaryModule: React.FC = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Term State
  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadGlossary();
  }, []);

  const loadGlossary = async () => {
    setLoading(true);
    try {
      const data = await api.getGlossary();
      setTerms(data);
    } catch (error) {
      console.error("Failed to load glossary", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTerm = async () => {
    if (!newSource || !newTarget) return;
    
    try {
      const addedTerm = await api.addGlossaryTerm({
        source: newSource,
        target: newTarget,
        category: newCategory || 'General'
      });
      setTerms([addedTerm, ...terms]);
      setShowAddModal(false);
      setNewSource('');
      setNewTarget('');
      setNewCategory('');
    } catch (error) {
      console.error("Failed to add term", error);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (!window.confirm("确定要删除这个术语吗？(Are you sure?)")) return;
    
    try {
      await api.deleteGlossaryTerm(id);
      setTerms(terms.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete term", error);
    }
  };

  const filteredTerms = terms.filter(term => 
    term.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    term.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    term.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Book className="text-blue-600" size={24} />
            个人术语库 (Glossary)
          </h2>
          <p className="text-slate-500 text-sm">管理您的专业术语，确保翻译的一致性。</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          添加术语 (Add Term)
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜索术语 (Search terms)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400">
            加载中... (Loading...)
          </div>
        ) : filteredTerms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Book size={48} className="mb-4 opacity-20" />
            <p>暂无术语 (No terms found)</p>
            <button onClick={() => setShowAddModal(true)} className="mt-2 text-blue-600 hover:underline">
              添加第一个术语
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map(term => (
              <div key={term.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeleteTerm(term.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {term.category || 'General'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-medium text-slate-800 text-lg">{term.source}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="text-sm">→</span>
                  <span className="font-medium text-slate-700">{term.target}</span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  Added: {new Date(term.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">添加新术语 (Add New Term)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">原文 (Source Text)</label>
                <input 
                  type="text" 
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g., Neural Network"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">译文 (Target Text)</label>
                <input 
                  type="text" 
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="e.g., 神经网络"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">分类 (Category) - Optional</label>
                <input 
                  type="text" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Computer Science"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                取消 (Cancel)
              </button>
              <button 
                onClick={handleAddTerm}
                disabled={!newSource || !newTarget}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={18} />
                保存 (Save)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlossaryModule;
