"use client";

import { useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '@/context/ChatContext'; // Import useChat

const ChatInterface = () => {
  const {
    messages,
    input,
    setInput,
    loading,
    imageFile,
    setImageFile,
    imagePreview,
    setImagePreview,
    showChatHistory,
    setShowChatHistory,
    handleSendMessage,
    handleClearChat,
    handleRemoveImage,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Still needed for DOM manipulation

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const localHandleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file); // Use context setter
      setImagePreview(URL.createObjectURL(file)); // Use context setter
    }
  };

  const localHandleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      // Pass current input and imageFile to context's handleSendMessage
      handleSendMessage(input, imageFile);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-[600px] w-full px-4 z-50">
      {imagePreview && (
        <div className="relative mb-2 p-2 bg-neutral-800 rounded-lg flex items-center justify-between">
          <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
          <p className="text-white text-sm ml-3 truncate flex-grow">{imageFile?.name}</p>
          <button
            className="ml-2 p-1 rounded-full text-neutral-400 hover:bg-neutral-700 transition-colors"
            onClick={handleRemoveImage} // From context
            title="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="bg-neutral-900 border border-neutral-800 rounded-full shadow-lg flex items-center p-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={localHandleImageSelect}
          disabled={loading}
        />
        <button
          className="p-2 rounded-full text-neutral-400 hover:bg-neutral-800 transition-colors mr-2 disabled:opacity-50"
          title="Upload Image"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <ImageIcon size={20} />
        </button>

        <input
          type="text"
          className="flex-grow bg-transparent border-none outline-none text-white placeholder-neutral-500 text-sm"
          placeholder="Ask about the markets..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={localHandleKeyPress}
          disabled={loading}
        />
        <button
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-2 disabled:opacity-50"
          onClick={() => handleSendMessage(input, imageFile)} // From context
          disabled={loading || (input.trim() === '' && !imageFile)}
        >
          <Send size={20} />
        </button>
        {messages.length > 0 && (
          <button
            className="p-2 rounded-full text-neutral-400 hover:bg-neutral-800 transition-colors ml-2"
            onClick={handleClearChat} // From context
            title="Start a new chat"
            disabled={loading}
          >
            New Chat
          </button>
        )}
      </div>

      {/* Chat History Overlay (can be made scrollable and styled more extensively) */}
      {showChatHistory && messages.length > 0 && ( // Conditionally render based on showChatHistory
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg p-4 shadow-xl max-h-80 overflow-y-auto max-w-[1100px] w-full">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-neutral-700">
            <h3 className="text-white text-lg font-semibold">Conversation</h3>
            <div className="flex items-center">
              <button
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 transition-colors mr-2"
                onClick={handleClearChat} // From context
                title="Clear conversation"
                disabled={loading}
              >
                Clear Chat
              </button>
              <button
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 transition-colors"
                onClick={handleClearChat} // From context
                title="Close conversation and clear chat"
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>
          </div>
          {messages.map((msg, index) => (
            <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block px-3 py-1 rounded-lg text-base ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-200'}`}>
                {msg.parts.map((part, partIndex) => (
                  'text' in part ? (
                    <ReactMarkdown key={partIndex} remarkPlugins={[remarkGfm]}>
                      {part.text}
                    </ReactMarkdown>
                  ) : (
                    <img key={partIndex} src={part.imageUrl} alt="User upload" className="max-w-xs max-h-48 rounded-md mt-2" />
                  )
                ))}
              </span>
            </div>
          ))}
          {loading && (
            <div className="text-left mb-2">
              <span className="inline-block px-3 py-1 rounded-lg text-base bg-neutral-700 text-neutral-200">
                Typing...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatInterface;