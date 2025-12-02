import React, { useState } from 'react';
import { Send, FileText, Bot, User, Loader2, Upload } from 'lucide-react';
import { api } from '../api';
import { Model } from '../types';

interface ChatDocModuleProps {
  selectedModel: Model;
  apiKey?: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const ChatDocModule: React.FC<ChatDocModuleProps> = ({ selectedModel, apiKey }) => {
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: 'Hello! Upload a PDF document to start chatting with it.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setIsUploading(true);
      
      // Simulate upload/analysis delay
      setTimeout(() => {
        setIsUploading(false);
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'ai', 
          content: `I've analyzed "${uploadedFile.name}". You can now ask me questions about specific sections, methodology, or results.`, 
          timestamp: new Date() 
        }]);
      }, 1500);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Call API (Mock or Real)
      // Note: backend_server.py doesn't have a specific /chat-doc endpoint yet, 
      // so we might need to add it or use a generic chat endpoint. 
      // For now, we'll simulate a response or use a placeholder API call.
      const responseText = await api.chatWithDoc(file, userMsg.content, selectedModel.id, apiKey);
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: responseText, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: "Sorry, I encountered an error processing your request.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left: PDF Viewer Placeholder */}
      <div className="w-1/2 border-r border-slate-200 bg-slate-200/50 flex flex-col items-center justify-center p-8">
        {file ? (
          <div className="w-full h-full bg-white shadow-lg rounded-lg flex flex-col">
            <div className="h-12 border-b border-slate-100 flex items-center px-4 font-medium text-slate-700">
              <FileText size={18} className="mr-2 text-red-500"/>
              {file.name}
            </div>
            <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
              <div className="text-center">
                <FileText size={64} className="mx-auto mb-4 opacity-20"/>
                <p>PDF Preview Mode</p>
                <p className="text-sm">(Real PDF rendering would go here)</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <label className="cursor-pointer flex flex-col items-center gap-4 p-12 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-100/50 transition-colors">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <Upload size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-700">Upload PDF Document</h3>
                <p className="text-slate-500 text-sm mt-1">Drag & drop or click to browse</p>
              </div>
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
            </label>
          </div>
        )}
      </div>

      {/* Right: Chat Interface */}
      <div className="w-1/2 flex flex-col bg-white">
        <div className="h-14 border-b border-slate-100 flex items-center px-6 justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-2">
                <Bot size={20} className="text-blue-600"/> 
                Chat with Document
            </span>
            <span className="text-xs text-slate-400">{selectedModel.name}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-blue-100 text-blue-600'}`}>
                {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Bot size={16}/></div>
               <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-500 text-sm">
                 <Loader2 size={14} className="animate-spin"/> Thinking...
               </div>
             </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about the document..."
              disabled={!file || isLoading}
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDocModule;
