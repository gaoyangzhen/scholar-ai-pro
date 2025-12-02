import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { UserMode } from '../types';
import { api } from '../api';

interface AuthScreenProps {
  onLogin: (mode: UserMode) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null); // Clear error on typing
  };

  const handleSubmit = async () => {
    setError(null);

    // Basic Validation
    if (!formData.email || !formData.password) {
      setError("请输入邮箱和密码 (Please enter email and password)");
      return;
    }

    // Strict Email Regex Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError("请输入有效的邮箱地址 (Invalid email format)");
      return;
    }
    
    if (!isLogin && !formData.fullName) {
      setError("请输入姓名 (Please enter your full name)");
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await api.login(formData.email, formData.password);
        if (result.success) {
            onLogin('account');
        } else {
            setError(result.error || "登录失败 (Login failed)");
        }
      } else {
        result = await api.register(formData.email, formData.password, formData.fullName);
        if (result.success) {
            // Registration Successful -> Switch to Login
            setIsLogin(true);
            setError(null); // Clear error
            alert("注册成功！请使用新账号登录。\nRegistration successful! Please login.");
            setFormData(prev => ({ ...prev, password: '' })); // Clear password for safety
        } else {
            setError(result.error || "注册失败 (Registration failed)");
        }
      }
    } catch (err) {
      setError("网络错误，请稍后重试 (Network error)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-scale-in">
        <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-inner">
            <Sparkles size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">ScholarAI <span className="text-blue-600">PRO</span></h1>
          <p className="text-slate-500 text-sm mt-1">SCI/EI 论文投稿辅助系统</p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-6 border-b border-slate-100 pb-2">
            <button 
                onClick={() => { setIsLogin(true); setError(null); }} 
                className={`flex-1 pb-2 text-sm font-semibold transition-colors ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
            >
                登录 (Login)
            </button>
            <button 
                onClick={() => { setIsLogin(false); setError(null); }} 
                className={`flex-1 pb-2 text-sm font-semibold transition-colors ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
            >
                注册 (Register)
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-600 animate-fade-in">
                <AlertCircle size={16} className="mt-0.5 shrink-0"/>
                <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  name="email"
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Institutional Email (e.g., user@uni.edu)" 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  disabled={loading}
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  name="password"
                  type="password" 
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password (min 6 chars)" 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  disabled={loading}
                />
            </div>
            {!isLogin && (
                <div className="relative animate-fade-in">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      name="fullName"
                      type="text" 
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Full Name" 
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      disabled={loading}
                    />
                </div>
            )}
            <button 
                onClick={handleSubmit} 
                disabled={loading}
                className={`w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 ${loading ? 'opacity-80 cursor-wait' : ''}`}
            >
                {loading && <Loader2 size={18} className="animate-spin"/>}
                {isLogin ? '进入系统 (Sign In)' : '创建账户 (Create Account)'}
            </button>
            <div className="text-center mt-4">
                <button 
                    onClick={() => !loading && onLogin('guest')} 
                    className="text-sm text-slate-400 hover:text-slate-600 underline"
                    disabled={loading}
                >
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