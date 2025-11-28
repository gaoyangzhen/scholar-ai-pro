import React, { useState, useRef } from 'react';
import { 
  UploadCloud, Cpu, Loader2, FileUp, Edit3, RefreshCw, X, Bookmark, 
  Save, ArrowRight, CheckCircle, AlertTriangle, MessageSquare
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Model, SavedPrompt, HistoryRecord } from '../types';
import { defaultPrompt, mockSavedPrompts, mockPaperContent, initialDiffs, mockReviewScore } from '../constants';
import { api } from '../api';

interface ReviewerModuleProps {
  selectedModel: Model;
  apiKey?: string;
  step: 'upload' | 'dashboard' | 'detail';
  setStep: (step: 'upload' | 'dashboard' | 'detail') => void;
  checkGuestLimit: () => boolean;
  onSave: (data: Partial<HistoryRecord>) => void;
}

const ReviewerModule: React.FC<ReviewerModuleProps> = ({ selectedModel, apiKey, step, setStep, checkGuestLimit, onSave }) => {
  const [selectedIssue, setSelectedIssue] = useState(1);
  const [chatOpen, setChatOpen] = useState<number | null>(null); 
  const [isUploading, setIsUploading] = useState(false);
  const [instructionText, setInstructionText] = useState(defaultPrompt);
  const [savedInstructions, setSavedInstructions] = useState(mockSavedPrompts);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
  const [paperContent, setPaperContent] = useState(mockPaperContent);
  const [diffs, setDiffs] = useState(initialDiffs);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 1. Guest Check
      if (!checkGuestLimit()) return;

      // 2. Start Loading
      setIsUploading(true);

      try {
        // --- Feature: Client-side content reading ---
        // Try to read the file content to display it in the view, instead of using mock content
        if (file.type === "text/plain" || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
             const reader = new FileReader();
             reader.onload = (event) => {
                 if (event.target?.result) {
                     setPaperContent(event.target.result as string);
                 }
             };
             reader.readAsText(file);
        } else {
            // For binary files (PDF/Word), we can't easily parse them in browser without heavy libraries.
            // We set a placeholder text to indicate the file is being processed by the backend.
            setPaperContent(`[File: ${file.name}]\n\nProcessing binary content...\n\n(Note: In this web demo, client-side preview is limited to text files. The backend analysis will process the full document.)\n\n...[Content Analysis in progress]...`);
        }

        // 3. Call API (Pass Model ID and Key)
        const result = await api.uploadManuscript(file, selectedModel.id, apiKey);

        if (result.success) {
          // Future: setDiffs(result.data.diffs);
          setStep('dashboard');
        } else {
          alert("Upload failed. Please ensure backend is running or check API Key.");
        }
      } catch (error) {
        console.error("Upload error", error);
        alert("An error occurred during upload.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      const newPreset: SavedPrompt = { id: Date.now(), name: newPresetName, content: instructionText, isSystem: false };
      setSavedInstructions([...savedInstructions, newPreset]);
      setNewPresetName('');
      setShowSaveInput(false);
    }
  };

  const handleDeletePreset = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedInstructions(savedInstructions.filter(p => p.id !== id));
  };

  const loadPreset = (preset: SavedPrompt) => {
    setInstructionText(preset.content);
  };
  
  const handleAcceptRevision = (issue: typeof diffs[0]) => {
      const newContent = paperContent.replace(issue.original, issue.revised);
      setPaperContent(newContent);
      const newDiffs = diffs.map(d => 
        d.id === issue.id ? { ...d, resolved: true, highlight: false } : d
      );
      setDiffs(newDiffs);
  };

  if (step === 'upload') {
    return (
      <div className="flex-1 flex overflow-hidden h-full">
        <div className="flex-1 bg-slate-50 p-12 overflow-y-auto">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 h-full flex flex-col justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UploadCloud size={32} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-800">上传论文初稿</h2>
                <p className="text-slate-500 mb-6">AI 将基于您的指令进行模拟审稿。</p>
                <div className="inline-flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-medium mb-8 border border-indigo-100 mx-auto">
                  <Cpu size={12}/> 当前引擎: <span className="font-bold">{selectedModel.name}</span>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.txt,.md" />
                <div onClick={handleUploadTrigger} className={`border-2 border-dashed rounded-xl p-8 mb-6 transition-all cursor-pointer group relative flex-1 flex flex-col justify-center items-center ${isUploading ? 'bg-blue-50 border-blue-300 cursor-wait' : 'border-slate-300 hover:bg-slate-50 hover:border-blue-400'}`}>
                  {isUploading ? (
                    <div className="flex flex-col items-center animate-pulse">
                      <Loader2 className="animate-spin text-blue-600 mb-3" size={32}/>
                      <p className="text-blue-600 font-medium">正在上传并分析文档...</p>
                      <p className="text-xs text-blue-400 mt-1">
                        {apiKey ? 'API Key 配置正常' : '⚠️ 未检测到 API Key (使用 Mock 数据)'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <FileUp className="text-slate-400 group-hover:text-blue-500 transition-colors" size={32}/>
                      <p className="text-slate-400 group-hover:text-slate-600 font-medium">点击上传 Word / PDF / TXT</p>
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <label className="block text-sm font-semibold mb-2 text-slate-700">目标期刊 (Target Journal)</label>
                  <input type="text" placeholder="e.g. Nature Communications..." className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                   <h3 className="font-bold text-slate-700 flex items-center gap-2"><Edit3 size={16} className="text-indigo-600"/> 审稿指令配置 (System Prompt)</h3>
                   <button onClick={() => setInstructionText(defaultPrompt)} className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200 transition-colors"><RefreshCw size={12}/> 重置</button>
                </div>
                <div className="px-4 py-3 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto">
                   {savedInstructions.map(preset => (
                     <button key={preset.id} onClick={() => loadPreset(preset)} className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200 flex items-center gap-2 group">
                       {preset.name}
                       {!preset.isSystem && <span onClick={(e) => handleDeletePreset(preset.id, e)} className="text-slate-400 hover:text-red-500 rounded-full p-0.5 hover:bg-slate-200"><X size={10} /></span>}
                     </button>
                   ))}
                </div>
                <div className="flex-1 p-0 relative">
                  <textarea value={instructionText} onChange={(e) => setInstructionText(e.target.value)} className="w-full h-full p-5 resize-none outline-none text-sm font-mono text-slate-700 leading-relaxed bg-white" placeholder="Enter system instructions for the AI reviewer here..." />
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  {showSaveInput ? (
                    <div className="flex gap-2 items-center animate-fade-in">
                       <input type="text" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} placeholder="输入预设名称" className="flex-1 text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" autoFocus />
                       <button onClick={handleSavePreset} className="text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">保存</button>
                       <button onClick={() => setShowSaveInput(false)} className="text-sm text-slate-500 hover:text-slate-700 px-2">取消</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowSaveInput(true)} className="w-full py-2 border border-dashed border-slate-300 rounded text-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><Bookmark size={14}/> 将当前指令保存为预设</button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-5xl mx-auto mt-8">
             <button onClick={() => handleFileChange({ target: { files: [new File([""], "manual_trigger.pdf")] } } as any)} disabled={isUploading} className={`w-full py-4 rounded-xl font-bold text-lg transition-colors shadow-xl ${isUploading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-200 hover:scale-[1.01] transform transition-transform'}`}>
              {isUploading ? '正在分析...' : '确认指令并开始审稿 (Start Review)'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'dashboard') {
    return (
      <div className="flex-1 overflow-y-auto p-8 animate-fade-in h-full">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">审稿评估报告</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-slate-500 text-sm">Target: IEEE Transactions on Pattern Analysis</span>
               <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">Powered by {selectedModel.name}</span>
            </div>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={() => onSave({ title: 'Review Report (Saved)', score: 81.3 })}
               className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 flex items-center gap-2"
             >
               <Save size={16}/> 保存记录
             </button>
             <button onClick={() => setStep('detail')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm">查看详细修改方案 <ArrowRight size={18}/></button>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
            <h3 className="font-bold text-lg mb-4">综合评分维度</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockReviewScore}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{fontSize: 10}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="My Paper" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <span className="text-3xl font-bold text-blue-600">81.3</span>
              <span className="text-sm text-slate-400">/100</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg mb-4">主要审稿意见摘要 (Executive Summary)</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18}/>
                  <div>
                    <h4 className="font-semibold text-green-800">强项 (Strengths)</h4>
                    <p className="text-sm text-green-700">实验设计严谨，对照组设置合理；数据集规模较大，具有统计学意义。</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertTriangle className="text-amber-600 mt-1 flex-shrink-0" size={18}/>
                  <div>
                    <h4 className="font-semibold text-amber-800">弱项 (Weaknesses)</h4>
                    <p className="text-sm text-amber-700">Introduction部分对最新文献（2023-2024）的引用不足；语言表达存在多处中式英语（Chinglish），需深度润色。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep('dashboard')} className="text-slate-400 hover:text-slate-600">&larr; 返回概览</button>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <h2 className="font-bold text-slate-700">交互式审稿修改 (Interactive Review)</h2>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => onSave({ title: 'Revised Manuscript', score: 85 })} 
             className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded flex items-center gap-1"
           >
             <Save size={14}/> 保存修改进度
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document View */}
        <div className="flex-1 bg-white p-8 overflow-y-auto border-r border-slate-200">
          <div className="max-w-3xl mx-auto font-serif text-lg leading-relaxed text-slate-800 whitespace-pre-wrap">
             {diffs.filter(d => !d.resolved).reduce((acc, issue) => {
                return acc.split(issue.original).join(`<<<${issue.id}>>>`);
             }, paperContent).split(/(<<<.*?>>>)/).map((part, index) => {
                 if (part.startsWith('<<<') && part.endsWith('>>>')) {
                     const id = parseInt(part.replace(/[<>]/g, ''));
                     const issue = diffs.find(d => d.id === id);
                     if (!issue) return null;
                     return (
                         <span 
                            key={index}
                            className={`cursor-pointer transition-colors px-1 rounded ${selectedIssue === id ? 'bg-red-100 border-b-2 border-red-400' : 'bg-red-50'}`}
                            onClick={() => setSelectedIssue(id)}
                         >
                            {issue.original}
                         </span>
                     )
                 }
                 if (part.includes("superior efficacy") && diffs[0].resolved) {
                     return <span key={index} className="bg-green-100 text-green-900 px-1 rounded transition-colors">{part}</span>
                 }
                 return <span key={index}>{part}</span>
             })}
          </div>
        </div>

        {/* Right: Revision Cards */}
        <div className="w-96 bg-slate-50 flex flex-col border-l border-slate-200 overflow-hidden">
          <div className="p-4 bg-white border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
            <span>审稿意见 (Review Comments)</span>
            <span className="text-xs text-slate-400 font-normal">{selectedModel.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {diffs.map((issue) => (
              !issue.resolved && (
              <div 
                key={issue.id}
                onClick={() => setSelectedIssue(issue.id)}
                className={`rounded-xl p-4 border transition-all cursor-pointer ${
                  selectedIssue === issue.id 
                    ? 'bg-white border-blue-400 shadow-md ring-1 ring-blue-100' 
                    : 'bg-white border-slate-200 hover:border-blue-300 opacity-80'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{issue.type}</span>
                   {issue.severity === 'High' && <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={10}/> High Priority</span>}
                </div>
                <div className="mb-3 space-y-2">
                  <div className="text-sm text-red-700 bg-red-50 p-2 rounded line-through decoration-red-300 decoration-2">
                    {issue.original}
                  </div>
                  <div className="text-sm text-green-800 bg-green-50 p-2 rounded font-medium">
                    {issue.revised}
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-2 border-l-2 border-blue-200 pl-2">
                   <p className="mb-1"><span className="font-semibold">Reason (CN):</span> {issue.reasonCN}</p>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
                   <button onClick={(e) => { e.stopPropagation(); setChatOpen(chatOpen === issue.id ? null : issue.id); }} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                     <MessageSquare size={12}/> {chatOpen === issue.id ? '收起对话' : '追问/Discuss'}
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleAcceptRevision(issue); }} 
                     className="text-xs flex items-center gap-1 text-green-600 hover:text-green-800 font-medium border border-green-200 px-2 py-1 rounded hover:bg-green-50"
                   >
                     <CheckCircle size={12}/> 采纳修改 (Accept)
                   </button>
                </div>
                {chatOpen === issue.id && (
                  <div className="mt-3 bg-slate-50 p-3 rounded-lg text-xs space-y-2 border border-slate-200">
                    <div className="flex gap-2 justify-end">
                       <div className="bg-blue-100 text-blue-800 p-2 rounded-t-lg rounded-bl-lg max-w-[90%]">
                         这里的 "fast" 为什么不合适？
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] flex-shrink-0">AI</div>
                       <div className="bg-white border border-slate-200 p-2 rounded-t-lg rounded-br-lg text-slate-700 shadow-sm">
                         "Fast" 是一个相对主观且简单的词。在描述算法性能时，使用 "Computational Efficiency" (计算效率) 或 "Low Latency" (低延迟) 更具定义性和专业度。
                       </div>
                    </div>
                    <div className="relative mt-2">
                      <input type="text" placeholder="继续追问..." className="w-full pl-2 pr-8 py-1.5 border rounded bg-white" />
                      <ArrowRight size={14} className="absolute right-2 top-2 text-slate-400"/>
                    </div>
                  </div>
                )}
              </div>
              )
            ))}
            {diffs.every(d => d.resolved) && (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle size={40} className="mx-auto text-green-400 mb-2"/>
                    <p>All suggestions resolved!</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerModule;