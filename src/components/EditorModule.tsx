import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, FileUp, Loader2, Plus, Layout, Sparkles, FolderOpen, ChevronRight, 
  Download, Save, Languages, CheckCircle, Bold, Italic, Underline, Sigma, Quote, ChevronDown
} from 'lucide-react';
import { Chapter, Model, HistoryRecord } from '../types';
import { defaultEditorStructure, mockNestedChapters } from '../constants';
import { api } from '../api';

interface EditorModuleProps {
  selectedModel: Model;
  apiKey?: string;
  docMode: 'none' | 'blank' | 'uploaded';
  setDocMode: (mode: 'none' | 'blank' | 'uploaded') => void;
  checkGuestLimit: () => boolean;
  onSave: (data: Partial<HistoryRecord>) => void;
}

interface ChapterTreeItemProps {
  item: Chapter;
  activeId: string;
  onSelect: (id: string) => void;
  depth?: number;
}

const ChapterTreeItem: React.FC<ChapterTreeItemProps> = ({ item, activeId, onSelect, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  
  return (
    <div className="w-full">
      <div onClick={() => onSelect(item.id)} className={`w-full flex items-center px-3 py-2 rounded text-sm cursor-pointer transition-colors ${activeId === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`} style={{ paddingLeft: `${depth * 12 + 12}px` }}>
        {hasChildren && <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="mr-1 p-0.5 hover:bg-slate-200 rounded">{expanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</button>}
        {!hasChildren && <span className="w-4 mr-1"></span>}
        <span className="truncate">{item.title}</span>
      </div>
      {hasChildren && expanded && <div className="border-l border-slate-100 ml-4">{item.children?.map(child => <ChapterTreeItem key={child.id} item={child} activeId={activeId} onSelect={onSelect} depth={depth + 1}/>)}</div>}
    </div>
  );
};

const EditorModule: React.FC<EditorModuleProps> = ({ selectedModel, apiKey, docMode, setDocMode, checkGuestLimit, onSave }) => {
  const [activeChapter, setActiveChapter] = useState('c3');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const editorFileRef = useRef<HTMLInputElement>(null);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (docMode === 'blank') {
        setChapters(defaultEditorStructure);
        setActiveChapter(defaultEditorStructure[0].id);
    } else if (docMode === 'uploaded') {
        setChapters(mockNestedChapters);
        setActiveChapter(mockNestedChapters[1].id);
    } else {
        setChapters([]);
    }
  }, [docMode]);

  const handleEditorUploadTrigger = () => {
    editorFileRef.current?.click();
  };

  const handleEditorFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setDocMode('uploaded');
      }, 1500);
    }
  };

  const handleStartBlank = () => {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setDocMode('blank');
      }, 800);
  };

  useEffect(() => {
    if (docMode === 'none') return;
    if (activeChapter === 'c3') {
      setInputText("我们使用了 PyTorch 框架搭建模型。数据预处理阶段，我们删除了所有缺失值。最后，结果表明准确率达到了95%。这证明了我们的方法在不同条件下都很棒。");
      setOutputText(""); 
    } else {
      setInputText("");
      setOutputText("");
    }
  }, [activeChapter, docMode]);

  const handleOptimize = async () => {
    // 1. Guest Check
    if (!checkGuestLimit()) return;
    if (!inputText) return;

    // 2. Start Processing
    setIsProcessing(true);
    setOutputText(''); // Clear previous result

    try {
      // 3. Call API (Fetch full text)
      const resultText = await api.polishText(inputText, selectedModel.id, apiKey);
      
      // 4. Simulate Typing Effect (Optional, for UX)
      // Even with real API data, a typing effect looks nice.
      let i = 0;
      const interval = setInterval(() => {
          setOutputText(prev => prev + resultText.charAt(i));
          i++;
          if (i >= resultText.length) {
              clearInterval(interval);
              setIsProcessing(false);
          }
      }, 20); // Fast typing

    } catch (error) {
      console.error("Optimize error", error);
      setOutputText("Error generating response.");
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
      alert("模拟导出：您的文档已打包为 LaTeX 和 Word 格式并开始下载。");
  };

  if (docMode === 'none') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50 p-12 animate-fade-in">
         <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-10 text-center border border-slate-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
               <BookOpen size={32}/>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">智能写作工作台 (Smart Editor)</h2>
            <p className="text-slate-500 mb-8">导入您的论文初稿，系统将自动识别章节结构（Structure Recognition），并开启辅助写作模式。</p>
            <input type="file" ref={editorFileRef} onChange={handleEditorFileChange} className="hidden" accept=".docx,.pdf" />
            <div onClick={handleEditorUploadTrigger} className={`border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all mb-4 group ${isUploading ? 'bg-indigo-50 border-indigo-300' : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50'}`}>
               {isUploading ? <div className="flex flex-col items-center animate-pulse"><Loader2 className="animate-spin text-indigo-600 mb-2" size={32}/><p className="text-indigo-600 font-medium">正在解析章节结构...</p></div> : <><FileUp className="mx-auto mb-2 text-indigo-400 group-hover:text-indigo-600" size={32}/><p className="font-semibold text-indigo-700">点击上传初稿 (Word/PDF)</p><p className="text-xs text-indigo-400 mt-1">系统将自动解析多级目录</p></>}
            </div>
            <div className="flex items-center gap-4 my-4"><div className="h-px bg-slate-200 flex-1"></div><span className="text-xs text-slate-400">或者</span><div className="h-px bg-slate-200 flex-1"></div></div>
            <button onClick={handleStartBlank} disabled={isUploading} className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center justify-center gap-2 w-full py-2 hover:bg-slate-50 rounded"><Plus size={16}/> 新建空白文档 (Start from Scratch)</button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex h-full animate-fade-in">
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2"><Layout size={18} className="text-slate-500"/><span>{docMode === 'blank' ? 'Standard Structure' : 'Detected Sections'}</span></div>
          <div className="flex gap-1"><button title="重新解析" className="text-slate-400 hover:text-blue-600 p-1 rounded"><Sparkles size={14}/></button><button title="添加章节" className="text-slate-400 hover:text-blue-600 p-1 rounded"><Plus size={16}/></button></div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
           <div className="text-xs text-slate-400 font-semibold mb-2 px-3 uppercase tracking-wider mt-2">Sections</div>
           {chapters.map(item => <ChapterTreeItem key={item.id} item={item} activeId={activeChapter} onSelect={setActiveChapter} />)}
        </div>
        <div className="p-3 border-t border-slate-100 text-xs text-slate-400 text-center">文档准备就绪 • {docMode === 'blank' ? 'Blank Template' : 'Parsed'}</div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 justify-between">
           <div className="flex items-center gap-2 text-slate-700 font-medium">
              <FolderOpen size={18} className="text-slate-400"/>
              <span>Methodology</span>
              {docMode === 'uploaded' && <><ChevronRight size={14} className="text-slate-300"/><span>Neural Network Architecture</span></>}
           </div>
           <div className="flex gap-2">
             <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-300">
                <Download size={14}/> 导出 (Export)
             </button>
             <button 
               onClick={() => onSave({ title: 'Editor Draft', words: 350 })}
               className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
             >
               <Save size={14}/> 保存草稿
             </button>
             <button onClick={handleOptimize} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm">
               {isProcessing ? '生成中...' : <><Sparkles size={14}/> 润色 ({selectedModel.name})</>}
             </button>
           </div>
        </header>

        <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
          {/* Input Area with New Toolbar */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="px-4 py-2 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase flex justify-between">
              <span>输入 (Input - 中文/English)</span>
              <Languages size={14}/>
            </div>
            {/* Simulated Rich Text Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-50 bg-slate-50/50">
               <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Bold"><Bold size={16}/></button>
               <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Italic"><Italic size={16}/></button>
               <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Underline"><Underline size={16}/></button>
               <div className="w-px h-4 bg-slate-300 mx-1"></div>
               <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Formula"><Sigma size={16}/></button>
               <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Citation"><Quote size={16}/></button>
            </div>
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="flex-1 p-4 resize-none outline-none text-base text-slate-700 font-serif leading-relaxed" placeholder="在此输入您的草稿内容..." />
          </div>

          {/* Output Area with Streaming Effect */}
          <div className="flex-1 bg-indigo-50 rounded-xl shadow-inner border border-indigo-100 flex flex-col relative">
             <div className="px-4 py-2 border-b border-indigo-100 text-xs font-semibold text-indigo-500 uppercase flex justify-between">
              <span>优化结果 (Output - Academic English)</span>
              <CheckCircle size={14}/>
            </div>
            {isProcessing && !outputText ? (
               <div className="flex-1 flex items-center justify-center text-indigo-400 animate-pulse">
                 {selectedModel.name} 正在思考并优化您的文本...
               </div>
            ) : (
              <textarea 
                readOnly
                value={outputText}
                className="flex-1 p-4 resize-none outline-none text-base text-indigo-900 bg-transparent font-serif leading-relaxed font-medium"
                placeholder="点击上方 '润色' 按钮生成结果..."
              />
            )}
            
            {!isProcessing && outputText && (
               <div className="p-3 bg-white/60 mx-4 mb-4 rounded border border-indigo-100 text-xs text-slate-600 animate-fade-in-up">
                 <span className="font-bold text-indigo-600">修改说明 (Rationale):</span> 将主语从 "We" 调整为被动语态，以符合方法论部分的客观描述习惯；将 "very good" 具体化为准确率数值；"removed" 替换为更学术的 "excluded"。
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorModule;