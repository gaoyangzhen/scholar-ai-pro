import { NavigationState, GlossaryTerm, ReferenceDocument } from "./types";

// 环境变量配置
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE_URL = import.meta.env.PROD
  ? ""
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Mock Data
const initialDiffs = [
  {
    original: "The study shows",
    modified: "The study demonstrates",
    type: "enhancement" as const,
  },
  {
    original: "good results",
    modified: "significant results",
    type: "enhancement" as const,
  },
];

export const api = {
  /**
   * 用户登录
   */
  login: async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    user?: any;
    token?: string;
    error?: string;
  }> => {
    console.log(`[API] Login attempt: ${email}`);

    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            resolve({
              success: false,
              error: "邮箱格式不正确 (Invalid email format)",
            });
            return;
          }
          if (password.length < 6) {
            resolve({
              success: false,
              error: "密码长度至少需要6位 (Password too short)",
            });
            return;
          }
          resolve({
            success: true,
            user: { name: "Dr. Researcher", email: email, role: "account" },
            token: "mock-jwt-token",
          });
        }, 800);
      });
    } else {
      try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.detail || "Login failed" };
        }
        if (data.token) {
          localStorage.setItem("auth-token", data.token);
        }
        return { success: true, user: data.user, token: data.token };
      } catch (error) {
        return {
          success: false,
          error: "无法连接到服务器 (Connection failed)",
        };
      }
    }
  },

  /**
   * 用户注册
   */
  register: async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{
    success: boolean;
    user?: any;
    token?: string;
    error?: string;
  }> => {
    console.log(`[API] Register attempt: ${email}`);

    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            resolve({ success: false, error: "邮箱格式不正确" });
            return;
          }
          if (password.length < 6) {
            resolve({ success: false, error: "密码长度至少需要6位" });
            return;
          }
          resolve({
            success: true,
            user: { name: fullName || "User", email: email, role: "account" },
            token: "mock-jwt-token",
          });
        }, 1000);
      });
    } else {
      try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName }),
        });
        const data = await response.json();
        if (!response.ok) {
          return {
            success: false,
            error: data.detail || "Registration failed",
          };
        }
        if (data.token) {
          localStorage.setItem("auth-token", data.token);
        }
        return { success: true, user: data.user, token: data.token };
      } catch (error) {
        return { success: false, error: "无法连接到服务器" };
      }
    }
  },

  /**
   * 测试模型连接
   */
  testConnection: async (modelId: string, apiKey: string): Promise<boolean> => {
    console.log(`[API] Testing connection for ${modelId}`);

    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          let isValid = false;
          if (apiKey === "error") {
            isValid = false;
          } else if (modelId.includes("gemini")) {
            isValid = apiKey.startsWith("AIza") && apiKey.length > 20;
          } else if (modelId.includes("gpt")) {
            isValid = apiKey.startsWith("sk-") && apiKey.length > 30;
          } else if (modelId.includes("claude")) {
            isValid = apiKey.startsWith("sk-ant") && apiKey.length > 30;
          } else {
            isValid = apiKey.length > 10;
          }
          resolve(isValid);
        }, 1000);
      });
    } else {
      try {
        return true;
      } catch (error) {
        return false;
      }
    }
  },

  /**
   * 模拟审稿：上传论文并获取分析结果
   */
  uploadManuscript: async (
    file: File,
    modelId: string,
    apiKey?: string
  ): Promise<{ success: boolean; data?: any }> => {
    console.log(
      `[API] Uploading file: ${
        file.name
      } | Model: ${modelId} | Key Present: ${!!apiKey}`
    );

    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            data: {
              diffs: initialDiffs,
              score: 81.3,
            },
          });
        }, 1500);
      });
    } else {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", modelId);
        if (apiKey) formData.append("apiKey", apiKey);

        const response = await fetch(`${API_BASE_URL}/api/analyze-upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        console.error("API Error:", error);
        return { success: false };
      }
    }
  },

  /**
   * 写作助手：发送文本进行润色 (支持流式输出)
   */
  polishText: async (
    text: string,
    modelId: string,
    apiKey?: string,
    onStream?: (chunk: string) => void
  ): Promise<string> => {
    console.log(
      `[API] Polishing | Model: ${modelId} | Key Present: ${!!apiKey}`
    );

    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        const mockResponse =
          "The model was implemented using the PyTorch framework. During the data preprocessing stage, all missing values were excluded. Ultimately, the results indicated an accuracy of 95%. This demonstrates the robustness of our approach under varied conditions.";
        let i = 0;
        const interval = setInterval(() => {
          if (i < mockResponse.length) {
            const chunk = mockResponse.slice(i, i + 5); // Simulate chunks
            if (onStream) onStream(chunk);
            i += 5;
          } else {
            clearInterval(interval);
            resolve(mockResponse);
          }
        }, 50);
      });
    } else {
      try {
        const token = localStorage.getItem("auth-token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/polish`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            text: text,
            model: modelId,
            apiKey: apiKey,
          }),
        });

        if (!response.ok) throw new Error("Optimization failed");

        const reader = response.body?.getReader();
        if (!reader) return "Error: No response body";

        let fullText = "";
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          if (onStream) onStream(chunk);
        }

        return fullText;
      } catch (error) {
        console.error("API Error:", error);
        return "Error: Could not connect to the optimization service.";
      }
    }
  },

  /**
   * 翻译助手：发送文本进行翻译 (支持流式输出)
   */
  translate: async (
    text: string,
    targetLang: string,
    modelId: string,
    apiKey?: string,
    onStream?: (chunk: string) => void
  ): Promise<string> => {
    console.log(`[API] Translating to ${targetLang} | Model: ${modelId}`);

    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        const mockResponse = `[${targetLang}] ${text} (Translated by ${modelId})`;
        let i = 0;
        const interval = setInterval(() => {
          if (i < mockResponse.length) {
            const chunk = mockResponse.slice(i, i + 5);
            if (onStream) onStream(chunk);
            i += 5;
          } else {
            clearInterval(interval);
            resolve(mockResponse);
          }
        }, 50);
      });
    } else {
      try {
        const token = localStorage.getItem("auth-token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/translate`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            text,
            targetLang,
            model: modelId,
            apiKey,
          }),
        });

        if (!response.ok) throw new Error("Translation failed");

        const reader = response.body?.getReader();
        if (!reader) return "Error: No response body";

        let fullText = "";
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          if (onStream) onStream(chunk);
        }
        return fullText;
      } catch (error) {
        console.error("API Error:", error);
        return "Error: Could not connect to translation service.";
      }
    }
  },

  /**
   * 获取术语库
   */
  getGlossary: async (): Promise<GlossaryTerm[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const saved = localStorage.getItem("scholar-ai-glossary");
          resolve(saved ? JSON.parse(saved) : []);
        }, 500);
      });
    } else {
      const token = localStorage.getItem("auth-token");
      try {
        const response = await fetch(`${API_BASE_URL}/api/glossary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return [];
        return await response.json();
      } catch (e) {
        console.error("Fetch glossary failed", e);
        return [];
      }
    }
  },

  /**
   * 添加术语
   */
  addGlossaryTerm: async (
    term: Omit<GlossaryTerm, "id" | "createdAt">
  ): Promise<GlossaryTerm> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newTerm: GlossaryTerm = {
            ...term,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          };
          const saved = localStorage.getItem("scholar-ai-glossary");
          const list = saved ? JSON.parse(saved) : [];
          const newList = [newTerm, ...list];
          localStorage.setItem("scholar-ai-glossary", JSON.stringify(newList));
          resolve(newTerm);
        }, 500);
      });
    } else {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`${API_BASE_URL}/api/glossary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(term),
      });
      if (!response.ok) throw new Error("Failed to add term");
      return await response.json();
    }
  },

  /**
   * 删除术语
   */
  deleteGlossaryTerm: async (id: string): Promise<boolean> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const saved = localStorage.getItem("scholar-ai-glossary");
          if (saved) {
            const list = JSON.parse(saved) as GlossaryTerm[];
            const newList = list.filter((t) => t.id !== id);
            localStorage.setItem(
              "scholar-ai-glossary",
              JSON.stringify(newList)
            );
          }
          resolve(true);
        }, 500);
      });
    } else {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`${API_BASE_URL}/api/glossary/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    }
  },

  /**
   * 文档对话
   */
  chatWithDoc: async (
    file: File | null,
    question: string,
    modelId: string,
    apiKey?: string
  ): Promise<string> => {
    console.log(`[API] ChatDoc | Question: ${question}`);
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(
            `[Mock AI] Based on the document "${
              file?.name || "file"
            }", here is the answer to "${question}": \n\nThe methodology described in Section 3 utilizes a transformer-based architecture...`
          );
        }, 1000);
      });
    } else {
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("question", question);
      formData.append("model", modelId);
      if (apiKey) formData.append("apiKey", apiKey);

      try {
        const response = await fetch(`${API_BASE_URL}/api/chat-doc`, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) return "Error: Chat failed";
        return await response.text();
      } catch (e) {
        return "Error: Could not connect to chat service";
      }
    }
  },

  /**
   * 获取参考文献列表
   */
  getReferences: async (): Promise<any[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: "1",
              filename: "Nature_Paper_2024.pdf",
              fileType: "pdf",
              uploadDate: "2024-03-15",
              size: "2.4 MB",
            },
            {
              id: "2",
              filename: "Research_Notes.md",
              fileType: "md",
              uploadDate: "2024-03-10",
              size: "15 KB",
            },
          ]);
        }, 500);
      });
    } else {
      const token = localStorage.getItem("auth-token");
      try {
        const response = await fetch(`${API_BASE_URL}/api/references`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return [];
        return await response.json();
      } catch (e) {
        console.error("Fetch references failed", e);
        return [];
      }
    }
  },

  /**
   * 上传参考文献
   */
  uploadReference: async (file: File): Promise<any> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: Date.now().toString(),
            filename: file.name,
            fileType: file.name.split(".").pop() || "unknown",
            uploadDate: new Date().toISOString().split("T")[0],
            size: "1.2 MB",
          });
        }, 800);
      });
    } else {
      const token = localStorage.getItem("auth-token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/references/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      return await response.json();
    }
  },

  /**
   * 删除参考文献
   */
  deleteReference: async (id: string): Promise<boolean> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 500);
      });
    } else {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`${API_BASE_URL}/api/references/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    }
  },
};
