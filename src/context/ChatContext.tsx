"use client";

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { upload } from '@vercel/blob/client';

interface Message {
  role: 'user' | 'model';
  parts: ({ text: string } | { imageUrl: string })[];
}

interface ChatContextType {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  loading: boolean;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  uploadedImageUrls: string[];
  setUploadedImageUrls: (urls: string[]) => void;
  showChatHistory: boolean;
  setShowChatHistory: (show: boolean) => void;
  handleSendMessage: (currentInput: string, currentImageFile: File | null) => Promise<void>;
  handleClearChat: () => Promise<void>;
  handleRemoveImage: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null); // Still need this ref for clearing the actual file input element

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
  };

  const handleSendMessage = async (currentInput: string, currentImageFile: File | null) => {
    if (currentInput.trim() === '' && !currentImageFile) return;

    const userMessageParts: ({ text: string } | { imageUrl: string })[] = [];
    if (currentInput.trim() !== '') {
      userMessageParts.push({ text: currentInput });
    }

    let uploadedImageUrl: string | null = null;
    if (currentImageFile) {
      setLoading(true);
      try {
        const newBlob = await upload(currentImageFile.name, currentImageFile, {
          access: 'public',
          handleUploadUrl: '/api/upload-image',
        });
        uploadedImageUrl = newBlob.url;
        setUploadedImageUrls((prevUrls) => [...prevUrls, uploadedImageUrl!]);
        userMessageParts.push({ imageUrl: uploadedImageUrl });
      } catch (uploadError: any) {
        console.error('Image upload failed:', uploadError);
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'model', parts: [{ text: `Error uploading image: ${uploadError.message}` }] },
        ]);
        setLoading(false);
        return;
      }
    }

    const userMessage: Message = { role: 'user', parts: userMessageParts };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    handleRemoveImage();
    setLoading(true);
    setShowChatHistory(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput, imageUrl: uploadedImageUrl, history: messages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI.');
      }

      const data = await response.json();
      const aiMessage: Message = { role: 'model', parts: [{ text: data.response }] };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error: any) {
      console.error('Chat API Error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'model', parts: [{ text: `Error: ${error.message}` }] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    setLoading(true);
    try {
      await Promise.all(uploadedImageUrls.map(async (url) => {
        await fetch('/api/delete-blob', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
      }));
    } catch (error) {
      console.error('Error deleting images:', error);
    } finally {
      setMessages([]);
      setInput('');
      setImageFile(null);
      setImagePreview(null);
      setUploadedImageUrls([]);
      setShowChatHistory(false);
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    // Cleanup function: deletes uploaded images when the component unmounts (e.g., page refresh, browser close)
    return () => {
      if (uploadedImageUrls.length > 0) {
        console.log('Cleaning up uploaded images on unmount:', uploadedImageUrls);
        // Using a more robust way to delete without blocking the unmount
        // Note: For actual production, consider a server-side cleanup or a more graceful client-side handling
        // where network requests on unmount might be unreliable.
        uploadedImageUrls.forEach(async (url) => {
          try {
            await fetch('/api/delete-blob', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url }),
            });
          } catch (error) {
            console.error('Error deleting image during cleanup:', url, error);
          }
        });
      }
    };
  }, [uploadedImageUrls]); // Dependency array: ensures the cleanup function captures the latest uploadedImageUrls

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        setInput,
        loading,
        imageFile,
        setImageFile,
        imagePreview,
        setImagePreview,
        uploadedImageUrls,
        setUploadedImageUrls,
        showChatHistory,
        setShowChatHistory,
        handleSendMessage,
        handleClearChat,
        handleRemoveImage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
