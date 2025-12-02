import React from 'react';
import { 
  Sparkles, FileText, BookOpen, Database, Clock, 
  Cpu, ChevronDown, CheckCircle, Plus, Settings, LogOut,
  Languages, Book
} from 'lucide-react';
import { NavigationState, UserMode, Model } from '../types';

interface SidebarProps {
  currentView: NavigationState;
  navigateTo: (view: NavigationState) => void;
  userMode: UserMode;
  models: Model[];
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  showModelMenu: boolean;
  setShowModelMenu: (show: boolean) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, navigateTo, userMode, models, selectedModel, 
  setSelectedModel, showModelMenu, setShowModelMenu, onOpenSettings, onLogout 
}) => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-blue-400" size={24} />
            ScholarAI <span className="text-xs bg-blue-600 px-1.5 rounded text-white">PRO</span>
          </h1>
          <p className="text-xs mt-2 text-slate-400">SCI/EI 投稿辅助系统</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<FileText size={20}/>} 
            label="模拟审稿 (Reviewer)" 
            active={currentView.module === 'reviewer'} 
            onClick={() => navigateTo({ ...currentView, module: 'reviewer', step: currentView.module === 'reviewer' ? currentView.step : 'upload' })}
          />
          <SidebarItem 
            icon={<BookOpen size={20}/>} 
            label="写作工作台 (Editor)" 
            active={currentView.module === 'editor'} 
            onClick={() => navigateTo({ ...currentView, module: 'editor', editorMode: currentView.module === 'editor' ? currentView.editorMode : 'none' })}
          />
          <SidebarItem 
            icon={<Languages size={20}/>} 
            label="翻译助手 (Translator)" 
            active={currentView.module === 'translator'} 
            onClick={() => navigateTo({ ...currentView, module: 'translator' })}
          />
          <SidebarItem 
            icon={<Book size={20}/>} 
            label="术语库 (Glossary)" 
            active={currentView.module === 'glossary'} 
            onClick={() => navigateTo({ ...currentView, module: 'glossary' })}
          />
          <SidebarItem 
            icon={<Database size={20}/>} 
            label="知识库 (Knowledge)" 
            active={currentView.module === 'kb'} 
            onClick={() => navigateTo({ ...currentView, module: 'kb' })}
          />
          <div className="h-px bg-slate-700 my-2 mx-2"></div>
          <SidebarItem 
            icon={<Clock size={20}/>} 
            label="历史记录 (History)" 
            active={currentView.module === 'history'} 
            onClick={() => navigateTo({ ...currentView, module: 'history' })}
          />
        </nav>

        {/* Model Selector & User Profile */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          {/* AI Model Selector */}
          <div className="mb-4 relative">
            <label className="text-xs text-slate-400 font-semibold mb-1 block flex items-center gap-1">
              <Cpu size={12}/> AI Model Engine
            </label>
            <button 
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white flex justify-between items-center hover:bg-slate-700 transition-colors"
            >
              <span className="truncate">{selectedModel.name}</span>
              <ChevronDown size={14} className="text-slate-400"/>
            </button>
            
            {showModelMenu && (
              <div className="absolute bottom-full left-0 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl mb-2 overflow-hidden z-30 max-h-80 overflow-y-auto">
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModel(model); setShowModelMenu(false); }}
                    className={`w-full text-left p-3 hover:bg-slate-700 border-b border-slate-700 last:border-0 group relative ${
                      selectedModel.id === model.id ? 'bg-slate-700' : ''
                    }`}
                  >
                    <div className="text-sm font-medium text-white flex justify-between pr-4">
                      {model.name}
                      {selectedModel.id === model.id && <CheckCircle size={14} className="text-blue-400"/>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{model.desc}</div>
                  </button>
                ))}
                <button 
                  onClick={onOpenSettings}
                  className="w-full py-2 text-xs flex items-center justify-center gap-1 text-blue-400 hover:text-blue-300 border-t border-slate-700 bg-slate-900"
                >
                  <Plus size={12}/> Manage / Add Models
                </button>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-700">
            {userMode === 'account' ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                DR
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 font-bold text-xs shadow-lg border border-slate-500">
                G
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">
                {userMode === 'account' ? 'Dr. Researcher' : 'Guest User'}
              </p>
              <div className="flex items-center gap-2">
                 <button onClick={onOpenSettings} className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors">
                    <Settings size={10}/> 设置 API
                 </button>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="text-slate-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut size={16}/>
            </button>
          </div>
        </div>
      </aside>
  );
};

export default Sidebar;