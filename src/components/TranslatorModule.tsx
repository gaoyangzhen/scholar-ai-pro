import React, { useState } from 'react';
import { ArrowRight, Copy, Check, RefreshCw, Languages } from 'lucide-react';
import { Model } from '../types';
import { api } from '../api';

interface TranslatorModuleProps {
  selectedModel: Model;
  apiKey?: string;
  checkGuestLimit: () => boolean;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'es', name: 'Español (Spanish)' },
];

const TranslatorModule: React.FC<TranslatorModuleProps> = ({ selectedModel, apiKey, checkGuestLimit }) => {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [targetLang, setTargetLang] = useState('zh');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    if (!checkGuestLimit()) return;

    setIsTranslating(true);
    setTargetText(''); // Clear previous result

    try {
      const result = await api.translate(sourceText, targetLang, selectedModel.id, apiKey);
      setTargetText(result);
    } catch (error) {
      setTargetText('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(targetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Languages size={18} className="text-blue-600" />
            <span>翻译助手 (Translator)</span>
          </div>
          
          <div className="h-4 w-px bg-slate-300"></div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Target Language:</span>
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="text-sm border-slate-200 rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim()}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all
            ${isTranslating || !sourceText.trim() 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'}`}
        >
          {isTranslating ? (
            <><RefreshCw size={16} className="animate-spin"/> Translating...</>
          ) : (
            <><ArrowRight size={16}/> Translate</>
          )}
        </button>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Source Panel */}
        <div className="flex-1 flex flex-col border-r border-slate-200 bg-white">
          <div className="p-3 border-b border-slate-100 text-xs font-medium text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Source Text</span>
            <span className="text-slate-300">{sourceText.length} chars</span>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter text to translate..."
            className="flex-1 p-6 resize-none outline-none text-slate-700 leading-relaxed text-lg placeholder:text-slate-300"
            spellCheck={false}
          />
        </div>

        {/* Target Panel */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          <div className="p-3 border-b border-slate-100 text-xs font-medium text-slate-400 uppercase tracking-wider flex justify-between items-center">
            <span>Translation Result</span>
            {targetText && (
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {targetText ? (
              <div className="text-slate-800 leading-relaxed text-lg whitespace-pre-wrap animate-fade-in">
                {targetText}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 italic">
                Translation will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatorModule;
