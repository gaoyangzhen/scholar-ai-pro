import React, { useState } from 'react';
import { 
  FileText, BookOpen, Database, History, ChevronLeft, ChevronRight, 
  Sparkles, Lock, Settings, LogOut, Cpu, Plus, CheckCircle, ChevronDown,
  AlertTriangle, Languages, Book
} from 'lucide-react';

import AuthScreen from './components/AuthScreen';
import ReviewerModule from './components/ReviewerModule';
import EditorModule from './components/EditorModule';
import KnowledgeBaseModule from './components/KnowledgeBaseModule';
import HistoryModule from './components/HistoryModule';
import TranslatorModule from './components/TranslatorModule';
import GlossaryModule from './components/GlossaryModule';
import SettingsModal from './components/SettingsModal';
import Sidebar from './components/Sidebar';
import { initialModels, mockHistoryData } from './constants';
import { Model, NavigationState, UserMode, HistoryRecord } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMode, setUserMode] = useState<UserMode>('guest');
  
  // State for Guest Limits
  const [guestUsage, setGuestUsage] = useState({ reviewer: 0, editor: 0 });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Navigation State & History
  const [history, setHistory] = useState<NavigationState[]>([{ module: 'reviewer', step: 'upload', editorMode: 'none' }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Data History (Saved Records) - with localStorage persistence
  const [savedRecords, setSavedRecords] = useState<HistoryRecord[]>(() => {
    const saved = localStorage.getItem('scholar-ai-history');
    return saved ? JSON.parse(saved) : mockHistoryData;
  });

  // Models State
  const [models, setModels] = useState<Model[]>(initialModels);
  const [selectedModel, setSelectedModel] = useState<Model>(initialModels[0]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  // Settings & API Keys - with localStorage persistence
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('scholar-ai-apikeys');
    return saved ? JSON.parse(saved) : {};
  });

  const currentView = history[historyIndex];

  // Helper to get the API Key for the currently selected model
  const currentApiKey = apiKeys[selectedModel.id];

  const navigateTo = (newView: NavigationState) => {
    if (JSON.stringify(newView) === JSON.stringify(currentView)) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newView);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  };

  const handleLogin = (mode: UserMode) => {
    setUserMode(mode);
    setIsLoggedIn(true);
    setShowLoginPrompt(false);
  };

  // --- Guest Limitation Logic ---
  const checkGuestLimit = (feature: 'reviewer' | 'editor') => {
    if (userMode === 'account') return true;
    if (guestUsage[feature] >= 1) {
      setShowLoginPrompt(true);
      return false;
    }
    setGuestUsage(prev => ({ ...prev, [feature]: prev[feature] + 1 }));
    return true;
  };

  // --- API Key & Model Management Logic ---
  const handleUpdateApiKey = (modelId: string, value: string) => {
    const updatedKeys = {...apiKeys, [modelId]: value};
    setApiKeys(updatedKeys);
    localStorage.setItem('scholar-ai-apikeys', JSON.stringify(updatedKeys));
  };

  const handleAddModel = (newModel: Model & { key?: string }) => {
     setModels([...models, newModel]);
     if (newModel.key) {
        handleUpdateApiKey(newModel.id, newModel.key);
     }
  };

  const handleDeleteModel = (id: string) => {
      const newModels = models.filter(m => m.id !== id);
      setModels(newModels);
      
      const newKeys = {...apiKeys};
      delete newKeys[id];
      setApiKeys(newKeys);

      if (selectedModel.id === id && newModels.length > 0) {
          setSelectedModel(newModels[0]);
      }
  };

  // --- Saving History Logic ---
  const saveToHistory = (type: 'review' | 'editor', data: Partial<HistoryRecord>) => {
    const newRecord: HistoryRecord = {
      id: Date.now(),
      type: type,
      title: data.title || 'Untitled Session',
      date: new Date().toLocaleString(),
      score: data.score,
      words: data.words
    };
    const updatedRecords = [newRecord, ...savedRecords];
    setSavedRecords(updatedRecords);
    localStorage.setItem('scholar-ai-history', JSON.stringify(updatedRecords));
    alert("已保存到历史记录！(Saved to History)");
  };

  if (!isLoggedIn) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      <Sidebar 
        currentView={currentView}
        navigateTo={navigateTo}
        userMode={userMode}
        models={models}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        showModelMenu={showModelMenu}
        setShowModelMenu={setShowModelMenu}
        onOpenSettings={() => { setShowModelMenu(false); setShowSettings(true); }}
        onLogout={() => setIsLoggedIn(false)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-12 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-10">
            <div className="flex items-center gap-2">
                <button 
                    onClick={goBack} 
                    disabled={historyIndex <= 0}
                    className={`p-1.5 rounded-full transition-colors ${historyIndex > 0 ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-300 cursor-not-allowed'}`}
                    title="Go Back"
                >
                    <ChevronLeft size={20}/>
                </button>
                <button 
                    onClick={goForward} 
                    disabled={historyIndex >= history.length - 1}
                    className={`p-1.5 rounded-full transition-colors ${historyIndex < history.length - 1 ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-300 cursor-not-allowed'}`}
                    title="Go Forward"
                >
                    <ChevronRight size={20}/>
                </button>
                
                <div className="h-4 w-px bg-slate-300 mx-2"></div>
                
                <span className="text-sm font-medium text-slate-500 capitalize flex items-center gap-2">
                    {currentView.module === 'reviewer' && <><FileText size={16}/> Reviewer</>}
                    {currentView.module === 'editor' && <><BookOpen size={16}/> Editor</>}
                    {currentView.module === 'translator' && <><Languages size={16}/> Translator</>}
                    {currentView.module === 'glossary' && <><Book size={16}/> Glossary</>}
                    {currentView.module === 'kb' && <><Database size={16}/> Knowledge Base</>}
                    {currentView.module === 'history' && <><History size={16}/> History</>}
                    
                    {currentView.step && <><span className="text-slate-300">/</span> {currentView.step}</>}
                    {currentView.editorMode && currentView.editorMode !== 'none' && <><span className="text-slate-300">/</span> {currentView.editorMode}</>}
                </span>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  <span className={`w-2 h-2 rounded-full ${currentApiKey ? 'bg-green-500' : 'bg-amber-400'}`}></span>
                  <span className="font-medium">{selectedModel.name}</span>
               </div>
               
               {!currentApiKey && (
                 <div className="group relative flex items-center" onClick={() => setShowSettings(true)}>
                    <AlertTriangle size={18} className="text-amber-500 cursor-pointer hover:text-amber-600 transition-colors" />
                    <div className="absolute right-0 top-full mt-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                       API Key未配置 (点击设置)
                       <div className="absolute -top-1 right-2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                 </div>
               )}
            </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
            {currentView.module === 'reviewer' && (
                <ReviewerModule 
                    selectedModel={selectedModel} 
                    apiKey={currentApiKey}
                    step={currentView.step || 'upload'} 
                    setStep={(newStep) => navigateTo({ ...currentView, step: newStep })}
                    checkGuestLimit={() => checkGuestLimit('reviewer')}
                    onSave={(data) => saveToHistory('review', data)}
                />
            )}
            {currentView.module === 'editor' && (
                <EditorModule 
                    selectedModel={selectedModel} 
                    apiKey={currentApiKey}
                    docMode={currentView.editorMode || 'none'}
                    setDocMode={(newMode) => navigateTo({ ...currentView, editorMode: newMode })}
                    checkGuestLimit={() => checkGuestLimit('editor')}
                    onSave={(data) => saveToHistory('editor', data)}
                />
            )}
            {currentView.module === 'translator' && (
                <TranslatorModule 
                    selectedModel={selectedModel} 
                    apiKey={currentApiKey}
                    checkGuestLimit={() => checkGuestLimit('editor')}
                />
            )}
            {currentView.module === 'glossary' && <GlossaryModule />}
            {currentView.module === 'kb' && <KnowledgeBaseModule userMode={userMode} />}
            {currentView.module === 'history' && <HistoryModule savedRecords={savedRecords} />}
        </div>
      </main>

      {/* Guest Login Limit Modal */}
      {showLoginPrompt && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                 <Lock size={32}/>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">试用次数已用完</h3>
              <p className="text-slate-500 text-sm mb-6">
                 游客模式每项功能仅限免费体验 1 次。请登录或注册账户以解锁无限使用权限。
              </p>
              <button 
                 onClick={() => setIsLoggedIn(false)}
                 className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                 去登录 / 注册
              </button>
              <button 
                 onClick={() => setShowLoginPrompt(false)}
                 className="mt-3 text-sm text-slate-400 hover:text-slate-600"
              >
                 暂时取消 (仅浏览)
              </button>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          models={models}
          apiKeys={apiKeys}
          onClose={() => setShowSettings(false)}
          onUpdateApiKey={handleUpdateApiKey}
          onAddModel={handleAddModel}
          onDeleteModel={handleDeleteModel}
        />
      )}
    </div>
  );
};

export default App;