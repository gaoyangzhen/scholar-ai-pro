import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User } from 'lucide-react';
import { UserMode } from '../types';

interface AuthScreenProps {
  onLogin: (mode: UserMode) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-indigo-600/20 z-0"></div>
          <Sparkles className="text-blue-400 mx-auto mb-4 relative z-10" size={48} />
          <h1 className="text-2xl font-bold text-white relative z-10">ScholarAI Pro</h1>
          <p className="text-blue-200 mt-2 text-sm relative z-10">你的 SCI/EI 论文智能发表助手</p>
        </div>
        <div className="p-8">
          <div className="flex gap-4 mb-6 border-b border-slate-100 pb-2">
            <button 
                onClick={() => setIsLogin(true)} 
                className={`flex-1 pb-2 text-sm font-semibold transition-colors ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
            >
                登录 (Login)
            </button>
            <button 
                onClick={() => setIsLogin(false)} 
                className={`flex-1 pb-2 text-sm font-semibold transition-colors ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
            >
                注册 (Register)
            </button>
          </div>
          <div className="space-y-4">
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input type="email" placeholder="Institutional Email (e.g., .edu)" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input type="password" placeholder="Password" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
            </div>
            {!isLogin && (
                <div className="relative animate-fade-in">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input type="text" placeholder="Full Name" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                </div>
            )}
            <button onClick={() => onLogin('account')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                {isLogin ? '进入系统 (Sign In)' : '创建账户 (Create Account)'}
            </button>
            <div className="text-center mt-4">
                <button onClick={() => onLogin('guest')} className="text-sm text-slate-400 hover:text-slate-600 underline">
                    游客试用 (Try Demo Mode)
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;