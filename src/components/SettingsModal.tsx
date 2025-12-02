import React, { useState } from 'react';
import { Settings, Trash2, Key, X, ChevronDown, ChevronRight, Link as LinkIcon, Activity, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Model } from '../types';
import { api } from '../api';

interface SettingsModalProps {
  models: Model[];
  apiKeys: Record<string, string>;
  onClose: () => void;
  onUpdateApiKey: (modelId: string, value: string) => void;
  onAddModel: (model: Model & { key?: string }) => void;
  onDeleteModel: (id: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ models, apiKeys, onClose, onUpdateApiKey, onAddModel, onDeleteModel }) => {
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModel, setNewModel] = useState({ name: '', desc: '', key: '', baseUrl: '' });
  
  // Test Connection States
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});

  const handleAdd = () => {
    if(newModel.name.trim()) {
        const modelId = newModel.name.toLowerCase().replace(/\s+/g, '-');
        const model = { 
          id: modelId, 
          name: newModel.name, 
          desc: newModel.desc || 'Custom Model', 
          badge: 'Custom',
          isDefault: false,
          key: newModel.key
        };
        onAddModel(model);
        setIsAddingModel(false);
        setNewModel({ name: '', desc: '', key: '', baseUrl: '' });
    }
  };

  const handleTestConnection = async (modelId: string, key: string) => {
      if (!key) return;
      setTestingModelId(modelId);
      setTestResults(prev => ({...prev, [modelId]: null}));
      
      try {
          const success = await api.testConnection(modelId, key);
          setTestResults(prev => ({...prev, [modelId]: success ? 'success' : 'error'}));
      } catch (e) {
          setTestResults(prev => ({...prev, [modelId]: 'error'}));
      } finally {
          setTestingModelId(null);
      }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
             <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                   <Settings size={20} className="text-slate-500"/> 模型与API设置 (Models & APIs)
                </h3>
                <p className="text-xs text-slate-500 mt-1">配置 AI 模型接入点。支持 OpenAI 兼容格式。</p>
             </div>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
             <div className="space-y-4">
                {models.map((model) => (
                   <div key={model.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                               {model.name}
                               {model.isDefault && <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">System</span>}
                               {!model.isDefault && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Custom</span>}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">{model.desc}</p>
                         </div>
                         {!model.isDefault && (
                            <button 
                               onClick={() => onDeleteModel(model.id)}
                               className="text-slate-400 hover:text-red-500 p-1"
                               title="删除模型"
                            >
                               <Trash2 size={16}/>
                            </button>
                         )}
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                           <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                              <Key size={14}/>
                           </div>
                           <input 
                             type="password" 
                             value={apiKeys[model.id] || ''}
                             onChange={(e) => {
                                 onUpdateApiKey(model.id, e.target.value);
                                 setTestResults(prev => ({...prev, [model.id]: null})); // clear test result on change
                             }}
                             placeholder={`Enter API Key for ${model.name}...`}
                             className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                           />
                           {apiKeys[model.id] && (
                             <button onClick={() => onUpdateApiKey(model.id, '')} className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500">
                               <X size={14} />
                             </button>
                           )}
                        </div>
                        <button 
                           onClick={() => handleTestConnection(model.id, apiKeys[model.id])}
                           disabled={!apiKeys[model.id] || testingModelId === model.id}
                           className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-1.5 min-w-[80px] justify-center
                             ${testResults[model.id] === 'success' 
                               ? 'bg-green-50 text-green-600 border-green-200' 
                               : testResults[model.id] === 'error'
                                 ? 'bg-red-50 text-red-600 border-red-200'
                                 : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                             }
                           `}
                        >
                           {testingModelId === model.id ? (
                               <Loader2 size={14} className="animate-spin"/>
                           ) : testResults[model.id] === 'success' ? (
                               <><CheckCircle size={14}/> OK</>
                           ) : testResults[model.id] === 'error' ? (
                               <><AlertCircle size={14}/> Fail</>
                           ) : (
                               <><Activity size={14}/> Test</>
                           )}
                        </button>
                      </div>
                   </div>
                ))}
             </div>

             {/* Add New Model Section */}
             <div className="border-t border-dashed border-slate-300 pt-6">
                <button 
                   onClick={() => setIsAddingModel(!isAddingModel)}
                   className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                   {isAddingModel ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                   添加自定义模型 (Add Custom Model)
                </button>
                
                {isAddingModel && (
                   <div className="mt-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4 animate-fade-in">
                      {/* Quick Fill Buttons */}
                      <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        <span className="text-xs font-semibold text-slate-500 flex items-center shrink-0">快速预设:</span>
                        <button 
                          onClick={() => setNewModel({ name: 'DeepSeek V3', desc: 'DeepSeek Official API', key: '', baseUrl: 'https://api.deepseek.com' })}
                          className="px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:border-blue-400 hover:text-blue-600 transition-colors whitespace-nowrap"
                        >
                          DeepSeek
                        </button>
                        <button 
                          onClick={() => setNewModel({ name: 'Qwen 2.5 (SiliconFlow)', desc: 'Via SiliconFlow', key: '', baseUrl: 'https://api.siliconflow.cn/v1' })}
                          className="px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:border-blue-400 hover:text-blue-600 transition-colors whitespace-nowrap"
                        >
                          SiliconFlow
                        </button>
                        <button 
                          onClick={() => setNewModel({ name: 'OpenRouter', desc: 'Aggregated Models', key: '', baseUrl: 'https://openrouter.ai/api/v1' })}
                          className="px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:border-blue-400 hover:text-blue-600 transition-colors whitespace-nowrap"
                        >
                          OpenRouter
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">模型名称 (Name)</label>
                            <input 
                               type="text" 
                               placeholder="e.g. Gemini 1.5 Pro"
                               value={newModel.name}
                               onChange={e => setNewModel({...newModel, name: e.target.value})}
                               className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">描述 (Description)</label>
                            <input 
                               type="text" 
                               placeholder="e.g. Via Google AI Studio"
                               value={newModel.desc}
                               onChange={e => setNewModel({...newModel, desc: e.target.value})}
                               className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                         </div>
                      </div>
                      <div>
                         <label className="block text-xs font-semibold text-slate-600 mb-1">Base URL (Optional)</label>
                         <div className="relative">
                            <LinkIcon size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                            <input 
                               type="text" 
                               placeholder="e.g. https://generativelanguage.googleapis.com/v1beta/openai/"
                               value={newModel.baseUrl}
                               onChange={e => setNewModel({...newModel, baseUrl: e.target.value})}
                               className="w-full pl-9 p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                         </div>
                         <p className="text-[10px] text-slate-400 mt-1">Leave empty for default OpenAI endpoint. Use custom URL for LocalLLM, Azure, or Gemini Adapter.</p>
                      </div>
                      <div>
                         <label className="block text-xs font-semibold text-slate-600 mb-1">API Key</label>
                         <div className="relative">
                            <Key size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                            <input 
                               type="password" 
                               placeholder="sk-..."
                               value={newModel.key}
                               onChange={e => setNewModel({...newModel, key: e.target.value})}
                               className="w-full pl-9 p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                         </div>
                      </div>
                      <div className="flex justify-end pt-2">
                         <button 
                            onClick={handleAdd}
                            disabled={!newModel.name.trim()}
                            className={`px-4 py-2 rounded text-sm font-medium text-white shadow-sm ${
                               newModel.name.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
                            }`}
                         >
                            确认添加 (Add Model)
                         </button>
                      </div>
                   </div>
                )}
             </div>
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
             <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">完成</button>
          </div>
       </div>
    </div>
  );
};

export default SettingsModal;