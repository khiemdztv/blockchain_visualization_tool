'use strict';

/**
 * llm_chain.js — LangChain prompt templates + chat model fallback chain for HubBlock
 *
 * - PromptTemplate: system prompts (RAG / base mode, Vietnamese / English)
 * - ChatOpenAI + .withFallbacks(): Groq, Gemini and OpenAI are all called through
 *   their OpenAI-compatible endpoints; on ANY error the next model is tried.
 */

const { PromptTemplate } = require('@langchain/core/prompts');
const { ChatOpenAI } = require('@langchain/openai');

// ─── System prompt templates ──────────────────────────────────────
// {extra} = systemInstruction + webKnowledge + adminDataContext (built in server.js)
const RAG_PROMPT_VI = PromptTemplate.fromTemplate(`Bạn là AI Assistant của HubBlock — ứng dụng giáo dục Blockchain.
Trang hiện tại: "{currentPage}"
Bạn đã được huấn luyện sẵn trên 14 bộ tài liệu sau:
- {allBooks}

Dựa trên truy vấn hiện tại, hệ thống đã trích xuất các đoạn văn bản (TÀI LIỆU) liên quan nhất như sau:

{ragContext}

QUY TẮC QUAN TRỌNG:
1. Trả lời Tiếng Việt, thân thiện, rõ ràng và có chiều sâu học thuật.
2. LUÔN trích dẫn nguồn ngay dước đoạn văn dựa theo đúng format ở phần TÀI LIỆU (KHÔNG DÙNG "Nguồn 1", "Nguồn 2", mà phải dùng trực tiếp Tên sách). Ví dụ: [Tên Sách, tr. X]
3. TUYỆT ĐỐI KHÔNG dùng định dạng toán học LaTeX (như \\(, \\), \\[, \\]). Dùng text bình thường và các ký hiệu thông dụng (ví dụ: c = m^e mod n).
4. Nếu thông tin không có trong tài liệu trên, hãy nói rõ: "Theo kiến thức chung..."
5. Ưu tiên thông tin từ tài liệu hơn kiến thức nền.{extra}`);

const RAG_PROMPT_EN = PromptTemplate.fromTemplate(`You are HubBlock's AI Assistant — a blockchain education web app.
Current page: "{currentPage}"
You have been trained on the following 14 documents:
- {allBooks}

Based on the current query, the system has extracted the following most relevant DOCUMENTS:

{ragContext}

IMPORTANT RULES:
1. Reply in English, friendly and academically precise.
2. ALWAYS cite sources in your answer using the exact format provided in DOCUMENTS (DO NOT use "Source 1", "Source 2", but use the Book Title directly). Example: [Book Title, p. X]
3. DO NOT use LaTeX math formatting like \\( \\) or \\[ \\]. Use plain text and standard symbols (e.g. c = m^e mod n).
4. If information is not in the documents above, clearly state: "Based on general knowledge..."
5. Prioritize document information over general knowledge.{extra}`);

const BASE_PROMPT_VI = PromptTemplate.fromTemplate(`Bạn là AI Assistant của HubBlock — ứng dụng web giáo dục Blockchain cho sinh viên.
Trang hiện tại: "{currentPage}"
Trả lời Tiếng Việt, thân thiện, ngắn gọn. Tập trung vào blockchain, mật mã học, hướng dẫn app.{extra}`);

const BASE_PROMPT_EN = PromptTemplate.fromTemplate(`You are HubBlock's AI Assistant — a blockchain education web app.
Current page: "{currentPage}"
Reply in English, friendly and concise. Focus on blockchain, cryptography, app guidance.{extra}`);

function buildSystemPrompt({ isVi, currentPage, ragContext, allBooks, extra }) {
  const template = ragContext
    ? (isVi ? RAG_PROMPT_VI : RAG_PROMPT_EN)
    : (isVi ? BASE_PROMPT_VI : BASE_PROMPT_EN);
  return template.format({ currentPage, ragContext, allBooks, extra });
}

// ─── Chat model chain ─────────────────────────────────────────────
const PROVIDER_BASE_URLS = {
  groq: 'https://api.groq.com/openai/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  openai: undefined, // SDK default
};

/**
 * providers: [{ name, apiKey, models: [modelName, ...] }] in priority order.
 * Returns ChatOpenAI(first).withFallbacks([...rest]) or null if no model.
 */
function buildChatModel(providers) {
  const models = [];
  for (const prov of providers) {
    for (const modelName of prov.models) {
      const llm = new ChatOpenAI({
        model: modelName,
        apiKey: prov.apiKey,
        configuration: { baseURL: PROVIDER_BASE_URLS[prov.name] },
        maxTokens: 800,
        temperature: 0.5,
        timeout: 25000,
        maxRetries: 0, // fail fast so the fallback chain moves to the next model
      });
      models.push(llm.withConfig({ runName: `${prov.name}/${modelName}` }));
    }
  }
  if (models.length === 0) return null;
  return models.length === 1 ? models[0] : models[0].withFallbacks(models.slice(1));
}

/**
 * messages: [{ role: 'system' | 'user' | 'assistant', content }]
 * Returns { content, model }.
 */
async function invokeChat(providers, messages) {
  const chain = buildChatModel(providers);
  if (!chain) throw new Error('No AI provider configured');

  const result = await chain.invoke(messages, {
    callbacks: [{
      handleLLMError(err) {
        console.warn(`[Chat] Model failed (${err.status || 'err'}: ${err.message}), trying next model...`);
      },
    }],
  });

  const content = typeof result.content === 'string'
    ? result.content
    : (result.content || []).map(p => p.text || '').join('');
  const model = result.response_metadata?.model_name || result.response_metadata?.model || 'unknown';
  return { content: content.trim(), model };
}

module.exports = { buildSystemPrompt, buildChatModel, invokeChat };
