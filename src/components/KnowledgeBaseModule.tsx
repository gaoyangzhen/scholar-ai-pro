import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, CloudOff, Plus, Trash2, Database, FileUp, Search, FileText, Book, X, Save, Loader2 } from 'lucide-react';
import { UserMode, GlossaryTerm, ReferenceDocument } from '../types';
import { api } from '../api';

interface KnowledgeBaseModuleProps {
  userMode: UserMode;
}

const KnowledgeBaseModule: React.FC<KnowledgeBaseModuleProps> = ({ userMode }) => {
  const [activeTab, setActiveTab] = useState<'glossary' | 'references'>('glossary');
  
  // Glossary State
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // References State
  const [references, setReferences] = useState<ReferenceDocument[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'glossary') {
      loadGlossary();
    } else {
      loadReferences();
    }
  }, [activeTab]);

  // --- Glossary Functions ---

  const loadGlossary = async () => {
    setLoadingTerms(true);
    try {
      const data = await api.getGlossary();
      setTerms(data);
    } catch (error) {
      console.error("Failed to load glossary", error);
    } finally {
      setLoadingTerms(false);
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
    if (!window.confirm("Delete this term?")) return;
    try {
      await api.deleteGlossaryTerm(id);
      setTerms(terms.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete term", error);
    }
  };

  // --- References Functions ---

  const loadReferences = async () => {
    setLoadingRefs(true);
    try {
      const data = await api.getReferences();
      setReferences(data);
    } catch (error) {
      console.error("Failed to load references", error);
    } finally {
      setLoadingRefs(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleUploadReference(file);
    }
  };

  const handleUploadReference = async (file: File) => {
    setUploading(true);
    try {
      const newDoc = await api.uploadReference(file);
      setReferences([newDoc, ...references]);
    } catch (error) {
      console.error("Failed to upload reference", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteReference = async (id: string) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await api.deleteReference(id);
      setReferences(references.filter(r => r.id !== id));
    } catch (error) {
      console.error("Failed to delete reference", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
      <header className="mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
           <Database className="text-blue-600"/> 知识库 (Knowledge Base)
        </h2>
        <p className="text-slate-500">管理您的专业术语和参考文献，增强AI的专业准确度。</p>
        {userMode === 'guest' && <div className="mt-2 inline-flex items-center gap-2 text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded border border-amber-200"><CloudOff size={12}/> 游客模式下数据仅存储在本地。</div>}
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6 shrink-0">
        <button 
          onClick={() => setActiveTab('glossary')}
          className={`pb-3 px-1 font-medium text-sm flex items-center gap-2 transition-colors relative ${activeTab === 'glossary' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Book size={18}/> 专业术语 (Glossary)
          {activeTab === 'glossary' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('references')}
          className={`pb-3 px-1 font-medium text-sm flex items-center gap-2 transition-colors relative ${activeTab === 'references' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={18}/> 参考文献 (References)
          {activeTab === 'references' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        
        {/* GLOSSARY TAB */}
        {activeTab === 'glossary' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="relative max-w-xs w-full">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                 <input type="text" placeholder="搜索术语..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"/>
               </div>
               <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm">
                 <Plus size={16}/> 添加术语
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 border-b border-slate-100">原文 (Source)</th>
                    <th className="px-6 py-3 border-b border-slate-100">译文 (Target)</th>
                    <th className="px-6 py-3 border-b border-slate-100">分类 (Category)</th>
                    <th className="px-6 py-3 border-b border-slate-100 w-20">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {terms.map((term) => (
                    <tr key={term.id} className="hover:bg-slate-50 group">
                      <td className="px-6 py-4 font-medium text-slate-800">{term.source}</td>
                      <td className="px-6 py-4 text-blue-600 font-mono">{term.target}</td>
                      <td className="px-6 py-4"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs">{term.category}</span></td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDeleteTerm(term.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {terms.length === 0 && !loadingTerms && (
                    <tr><td colSpan={4} className="p-12 text-center text-slate-400">暂无术语，请添加。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REFERENCES TAB */}
        {activeTab === 'references' && (
          <div className="flex flex-col h-full">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="relative max-w-xs w-full">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                 <input type="text" placeholder="搜索文献..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"/>
               </div>
               <div className="flex gap-2">
                 <input 
                   type="file" 
                   ref={fileInputRef}
                   onChange={handleFileSelect}
                   className="hidden" 
                   accept=".pdf,.txt,.md"
                 />
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   disabled={uploading}
                   className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                 >
                   {uploading ? <Loader2 size={16} className="animate-spin"/> : <FileUp size={16}/>} 
                   上传文献
                 </button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {loadingRefs ? (
                 <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div>
               ) : references.length === 0 ? (
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-300 transition-all cursor-pointer"
                 >
                    <FileUp size={32} className="mb-2 opacity-50"/>
                    <p className="font-medium">点击上传新的参考文献</p>
                    <p className="text-xs mt-1">支持 PDF, TXT, MD</p>
                 </div>
               ) : (
                 references.map((doc) => (
                   <div key={doc.id} className="flex items-center p-4 border border-slate-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all cursor-pointer bg-white group">
                      <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-500 mr-4 shrink-0">
                        <FileText size={24}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate mb-1">{doc.filename}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded uppercase">{doc.fileType}</span>
                          <span>{doc.size || 'Unknown Size'}</span>
                          <span>Uploaded: {doc.uploadDate}</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteReference(doc.id); }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}
      </div>

      {/* Add Term Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">添加新术语</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">原文 (Source)</label>
                <input type="text" value={newSource} onChange={e => setNewSource(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" autoFocus/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">译文 (Target)</label>
                <input type="text" value={newTarget} onChange={e => setNewTarget(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">分类 (Category)</label>
                <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="General" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">取消</button>
              <button onClick={handleAddTerm} disabled={!newSource || !newTarget} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"><Save size={18}/> 保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseModule;