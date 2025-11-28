import { DiffItem, HistoryRecord } from './types';
import { initialDiffs } from './constants';

// --- 配置区域 ---
// ⚠️ 部署提示: 
// 1. 在 Vercel 环境变量中设置 VITE_USE_MOCK = false
// 2. 在 Vercel 环境变量中设置 VITE_API_BASE_URL = 您的后端线上地址 (例如 https://scholar-ai-backend.onrender.com)

// 安全获取环境变量 (Safe Environment Variable Access)
// 处理 import.meta.env 可能为 undefined 的情况
const getEnvVar = (key: string, defaultValue: string = '') => {
  try {
    // Cast to any to avoid TS error: Property 'env' does not exist on type 'ImportMeta'
    return ((import.meta as any).env && (import.meta as any).env[key]) || defaultValue;
  } catch {
    return defaultValue;
  }
};

const USE_MOCK_API = getEnvVar('VITE_USE_MOCK') === 'false' ? false : true; 
const API_BASE_URL = getEnvVar('VITE_API_BASE_URL') || "http://localhost:8000"; 

export const api = {
  /**
   * 测试模型连接
   * @param modelId 模型ID
   * @param apiKey API Key
   */
  testConnection: async (modelId: string, apiKey: string): Promise<boolean> => {
    console.log(`[API] Testing connection for ${modelId}`);
    
    if (USE_MOCK_API) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 模拟简单的成功，如果 key 是 "error" 则失败
                resolve(apiKey !== 'error');
            }, 1000);
        });
    } else {
        try {
            // 尝试请求一个轻量级接口或者专门的 test 接口
            const response = await fetch(`${API_BASE_URL}/test_connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: modelId, api_key: apiKey })
            });
            return response.ok;
        } catch (error) {
            console.error("Connection Test Failed:", error);
            return false;
        }
    }
  },

  /**
   * 模拟审稿：上传论文并获取分析结果
   * @param file 论文文件
   * @param modelId 选中的模型ID (e.g., 'gpt-4o')
   * @param apiKey 用户提供的 API Key (可选)
   */
  uploadManuscript: async (file: File, modelId: string, apiKey?: string): Promise<{ success: boolean; data?: any }> => {
    console.log(`[API] Uploading file: ${file.name} | Model: ${modelId} | Key Present: ${!!apiKey}`);

    if (USE_MOCK_API) {
      // === MOCK 模式 ===
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ 
            success: true, 
            data: { 
              diffs: initialDiffs,
              score: 81.3 
            } 
          });
        }, 1500);
      });
    } else {
      // === 真实模式: 请求 Python 后端 ===
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', modelId); // 告诉后端用什么模型
        if (apiKey) formData.append('api_key', apiKey); // 传递密钥

        const response = await fetch(`${API_BASE_URL}/upload_paper`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        console.error("API Error:", error);
        return { success: false };
      }
    }
  },

  /**
   * 写作助手：发送文本进行润色
   * @param text 待润色文本
   * @param modelId 选中的模型ID
   * @param apiKey 用户提供的 API Key
   */
  polishText: async (text: string, modelId: string, apiKey?: string): Promise<string> => {
    console.log(`[API] Polishing | Model: ${modelId} | Key Present: ${!!apiKey}`);

    if (USE_MOCK_API) {
      // === MOCK 模式 ===
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve("The model was implemented using the PyTorch framework. During the data preprocessing stage, all missing values were excluded. Ultimately, the results indicated an accuracy of 95%. This demonstrates the robustness of our approach under varied conditions.");
        }, 1000); 
      });
    } else {
      // === 真实模式 ===
      try {
        const response = await fetch(`${API_BASE_URL}/optimize_text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: text, 
            model: modelId,
            api_key: apiKey 
          }),
        });

        if (!response.ok) throw new Error('Optimization failed');
        const data = await response.json();
        return data.optimized_text;
      } catch (error) {
        console.error("API Error:", error);
        return "Error: Could not connect to the optimization service.";
      }
    }
  }
};