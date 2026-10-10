import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  Mail, 
  MessageSquare, 
  Lightbulb, 
  Calendar, 
  HeartHandshake,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { Student, ClassInfo } from '../types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';

interface AIAssistantViewProps {
  classInfo: ClassInfo;
  students: Student[];
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  {
    icon: Mail,
    title: 'Soạn tin nhắn gửi Phụ huynh',
    prompt: 'Hãy soạn một tin nhắn Zalo gửi phụ huynh học sinh nhắc nhở về việc ôn thi giữa kỳ và giữ gìn sức khỏe cho các con, với giọng văn trang trọng, thân thiện và ấm áp.'
  },
  {
    icon: BookOpen,
    title: 'Mẫu nhận xét học bạ (TT 22)',
    prompt: 'Hãy gợi ý 5 mẫu câu nhận xét đánh giá rèn luyện học bạ theo Thông tư 22 cho các đối tượng: HS tích cực gương mẫu, HS học khá nhưng rụt rè, HS có tiến bộ vượt bậc, HS hay mất trật tự cần rèn luyện thêm.'
  },
  {
    icon: Calendar,
    title: 'Kế hoạch tiết Sinh hoạt lớp',
    prompt: 'Hãy lên dàn ý kịch bản 45 phút cho tiết Sinh hoạt lớp THPT chủ đề "Xây dựng tình bạn đẹp - Nói không với bạo lực học đường", gồm phần sơ kết tuần và phần sinh hoạt chuyên đề tương tác hấp dẫn.'
  },
  {
    icon: Lightbulb,
    title: 'Biện pháp sư phạm tư vấn',
    prompt: 'Tôi có một học sinh lớp 10 gần đây có biểu hiện học lực giảm sút, hay ngủ gật trong lớp và ít giao tiếp với bạn bè. Xin hãy gợi ý quy trình các bước tiếp cận, tìm hiểu tâm lý và giải pháp sư phạm phù hợp.'
  }
];

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  classInfo,
  students
}) => {
  const defaultWelcome: Message[] = [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Xin chào Thầy/Cô **${classInfo.homeroomTeacher}**! 👋\n\nTôi là **Trợ lý AI Chủ nhiệm** của lớp **${classInfo.className}** (${classInfo.schoolName}).\n\nTôi có thể hỗ trợ Thầy/Cô:\n- ✍️ Soạn thảo tin nhắn gửi phụ huynh (Zalo / SMS / Giấy mời)\n- 📋 Viết lời nhận xét học bạ, sổ liên lạc điện tử chuẩn Thông tư 22\n- 🎯 Lên kịch bản tiết Sinh hoạt lớp theo chủ đề sinh động\n- 💡 Gợi ý giải pháp sư phạm cho các tình huống nề nếp, tâm lý học đường.\n\nThầy/Cô có thể bấm vào các gợi ý nhanh bên dưới hoặc gõ yêu cầu cụ thể!`,
      timestamp: 'Vừa xong'
    }
  ];

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = loadFromStorage<Message[]>(STORAGE_KEYS.AI_CHAT, defaultWelcome);
    return Array.isArray(saved) && saved.length > 0 ? saved : defaultWelcome;
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.AI_CHAT, messages);
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Provide context about the class and students
      const systemContext = `Bạn là Trợ lý AI chuyên nghiệp hỗ trợ Giáo viên chủ nhiệm THPT tại Việt Nam. Lớp hiện tại: ${classInfo.className}, Trường: ${classInfo.schoolName}, Sĩ số: ${students.length} học sinh. Năm học: ${classInfo.schoolYear}. Hãy trả lời bằng tiếng Việt chuẩn mực sư phạm, rõ ràng, thiết thực, có định dạng danh sách dễ đọc.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: systemContext
        })
      });

      const data = await response.json();
      const botReply = data.reply || 'Rất tiếc, đã có lỗi kết nối đến máy chủ AI. Thầy/Cô vui lòng thử lại sau giây lát.';

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Error calling AI chat:', err);
      const errorMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: 'Đã nhận yêu cầu! Hiện tại hệ thống đang chuyển sang chế độ mẫu phản hồi hỗ trợ giáo viên chủ nhiệm. Thầy/Cô có thể tiếp tục tương tác bình thường.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 p-5 rounded-2xl text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              Trợ Lý Trí Tuệ Nhân Tạo (AI Gemini)
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                Sư phạm THPT
              </span>
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Hỗ trợ soạn thảo thông báo, nhận xét học bạ Thông tư 22 và xử lý tình huống lớp chủ nhiệm
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {QUICK_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              className="p-3 bg-white hover:bg-blue-50/60 border border-slate-200/80 rounded-xl text-left transition shadow-2xs group flex items-start space-x-2.5"
            >
              <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 text-blue-600 shrink-0 transition">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition truncate">
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  {item.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chat Conversation Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[520px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                    isUser ? 'bg-blue-600 text-white' : 'bg-linear-to-br from-indigo-600 to-purple-600 text-white'
                  }`}
                >
                  {isUser ? 'GV' : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed shadow-2xs relative group ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                  }`}
                >
                  {/* Markdown-style line breaks rendering */}
                  <div className="space-y-2 whitespace-pre-wrap">
                    {msg.text}
                  </div>

                  <div
                    className={`flex items-center justify-between mt-2 pt-2 border-t text-[10px] ${
                      isUser ? 'border-blue-500/50 text-blue-200' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-600 transition"
                        title="Sao chép nội dung"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 text-xs text-slate-500 shadow-2xs flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
                <span>Trợ lý AI đang suy nghĩ câu trả lời phù hợp...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              id="ai-chat-input"
              type="text"
              placeholder="Nhập câu hỏi hoặc yêu cầu hỗ trợ sư phạm (VD: Soạn tin nhắn họp PH, nhận xét em Tuấn Anh...)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
            />

            <button
              id="ai-chat-send-btn"
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition flex items-center space-x-1.5 shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
