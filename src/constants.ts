import { Model, HistoryRecord, DiffItem, SavedPrompt, ReviewScore, Chapter, GlossaryTerm, FileItem } from './types';

// ... (keep other exports)

export const mockGlossary: GlossaryTerm[] = [
  { id: '1', source: '灵敏度', target: 'Sensitivity', category: 'Note: 不要翻译成 Responsiveness', createdAt: '2023-10-01' },
  { id: '2', source: '卷积神经网络', target: 'Convolutional Neural Networks (CNNs)', category: 'Note: 首次出现需全称', createdAt: '2023-10-01' },
  { id: '3', source: '鲁棒性', target: 'Robustness', category: 'General', createdAt: '2023-10-01' },
];

export const initialModels: Model[] = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: '免费、速度快，适合日常润色 (Free)', badge: 'Free & Fast', isDefault: true },
  { id: 'deepseek-chat', name: 'DeepSeek V3', desc: '国产之光，性价比极高，中文超强', badge: 'Best Value', isDefault: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', desc: 'OpenAI 高性价比模型，响应迅速', badge: 'OpenAI', isDefault: true },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: '长窗口支持，适合长论文分析', badge: 'Long Context', isDefault: true },
];

export const defaultEditorStructure: Chapter[] = [
  { id: 'sec-0', title: 'Abstract', level: 0 },
  { id: 'sec-1', title: '1. Introduction', level: 0 },
  { id: 'sec-2', title: '2. Methodology', level: 0 },
  { id: 'sec-3', title: '3. Results', level: 0 },
  { id: 'sec-4', title: '4. Discussion', level: 0 },
  { id: 'sec-5', title: '5. Conclusion', level: 0 },
  { id: 'sec-6', title: 'References', level: 0 },
];

export const defaultPrompt = `You are an expert reviewer for top-tier SCI/EI journals (e.g., Nature, IEEE TPAMI). 
Please evaluate the attached manuscript based on the following criteria:
1. Novelty & Significance
2. Methodology Rigor
3. Results & Discussion
4. Language & Structure

Provide a detailed report with specific improvement suggestions.`;

export const mockSavedPrompts: SavedPrompt[] = [
  { id: 1, name: 'Standard Review (Default)', content: defaultPrompt, isSystem: true },
  { id: 2, name: 'Focus on Grammar (润色模式)', content: 'Focus strictly on grammar, academic tone, and sentence structure. Do not critique the methodology.', isSystem: false },
  { id: 3, name: 'Strict Method Check (方法论)', content: 'Act as a statistician. Critically evaluate the sample size, statistical tests used, and p-value interpretations.', isSystem: false },
];

export const mockReviewScore: ReviewScore[] = [
  { subject: '创新性 (Novelty)', A: 85, fullMark: 100 },
  { subject: '方法论 (Methodology)', A: 92, fullMark: 100 },
  { subject: '结果讨论 (Discussion)', A: 78, fullMark: 100 },
  { subject: '语言格式 (Language)', A: 65, fullMark: 100 },
  { subject: '图表质量 (Figures)', A: 88, fullMark: 100 },
  { subject: '伦理合规 (Ethics)', A: 95, fullMark: 100 },
];

export const initialDiffs: DiffItem[] = [
  {
    id: 1,
    original: "The result shows that the method is very good and fast.",
    revised: "The results demonstrate that the proposed method exhibits superior efficacy and computational efficiency.",
    type: "Language & Style",
    severity: "Medium",
    reasonCN: "原句使用了 'very good' 和 'fast' 等口语化词汇，缺乏学术严谨性。建议替换为 'demonstrate', 'superior efficacy', 'computational efficiency'。",
    reasonEN: "The original sentence uses colloquial terms. Suggested replacements enhance academic tone and precision.",
    highlight: true,
    resolved: false
  },
  {
    id: 2,
    original: "We used a computer to calculate the data.",
    revised: "Data computation was performed using a high-performance workstation equipped with an Intel i9 processor.",
    type: "Methodology Detail",
    severity: "High",
    reasonCN: "方法描述过于模糊。在SCI论文中，需要明确具体的硬件或软件环境以确保实验的可重复性。",
    reasonEN: "Methodological description is too vague. Specify hardware/software to ensure reproducibility.",
    highlight: false,
    resolved: false
  }
];

export const mockPaperContent = `
A Novel Approach for Deep Learning Optimization

[Abstract omitted for brevity...]

2. Methodology

In this study, we propose a new framework. The result shows that the method is very good and fast. This improvement allows for better scaling.

To validate our approach, we used a computer to calculate the data. The simulation environment was set up in Python 3.8.

[...Rest of the paper content simulated...]
`;

export const mockNestedChapters: Chapter[] = [
  { id: 'c1', title: 'Abstract', level: 0 },
  { 
    id: 'c2', title: '1. Introduction', level: 0,
    children: [
      { id: 'c2-1', title: '1.1 Background', level: 1 },
      { id: 'c2-2', title: '1.2 Related Work', level: 1 },
      { id: 'c2-3', title: '1.3 Contribution', level: 1 }
    ]
  },
  { 
    id: 'c3', title: '2. Methodology', level: 0,
    children: [
      { id: 'c3-1', title: '2.1 Data Acquisition', level: 1 },
      { 
        id: 'c3-2', title: '2.2 Neural Network Architecture', level: 1,
        children: [
            { id: 'c3-2-1', title: '2.2.1 Backbone Network', level: 2 },
            { id: 'c3-2-2', title: '2.2.2 Loss Function', level: 2 }
        ]
      },
      { id: 'c3-3', title: '2.3 Training Strategy', level: 1 }
    ]
  },
  { id: 'c4', title: '3. Results', level: 0 },
  { id: 'c5', title: '4. Discussion', level: 0 },
  { id: 'c6', title: '5. Conclusion', level: 0 },
];

export const mockGlossary: GlossaryItem[] = [
  { id: 1, cn: '灵敏度', en: 'Sensitivity', note: '不要翻译成 Responsiveness' },
  { id: 2, cn: '卷积神经网络', en: 'Convolutional Neural Networks (CNNs)', note: '首次出现需全称' },
  { id: 3, cn: '鲁棒性', en: 'Robustness', note: '-' },
];

export const mockFiles: FileItem[] = [
  { id: 1, name: 'Reference_Wang_et_al_2023.pdf', type: 'PDF', size: '2.4 MB' },
  { id: 2, name: 'Lab_Data_Supplementary.xlsx', type: 'Excel', size: '1.1 MB' },
];

export const mockHistoryData: HistoryRecord[] = [
  { id: 101, type: 'review', title: 'Deep Learning Optimization - Review Report', date: '2023-10-24 14:30', score: 81.3 },
  { id: 102, type: 'editor', title: 'Methodology Draft v2', date: '2023-10-23 09:15', words: 450 },
];