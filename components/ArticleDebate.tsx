'use client';

import { useState, useEffect, useRef } from 'react'; // Add useRef
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks'; // Add import

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ArticleDebateProps {
  articleId: string;
  articleContent: string;
  articleTitle: string;
}

export function ArticleDebate({ articleId, articleContent, articleTitle }: ArticleDebateProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null); // Add ref

  const sendMessage = async () => {
    if (!input.trim() || loading) return; // Prevent sending if loading

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          articleContent,
          articleTitle,
          userMessage: messageToSend,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your message.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus(); // Focus the input after response
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Article Content */}
      <div className="mb-8 max-h-96 overflow-y-auto">  {/* Add scroll pane */}
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {articleTitle}
        </h1>
        <div className="prose prose-gray dark:prose-invert max-w-none prose-p:my-6 prose-headings:my-4">
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>{articleContent}</ReactMarkdown>
        </div>
      </div>

      {/* Debate Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Debate with AI
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ask questions, challenge claims, or discuss this article with our AI assistant.
        </p>

        {/* Messages */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">  {/* Add scroll to messages if needed */}
          {messages.length === 0 ? (
            <div className="text-center py-1 text-gray-800 dark:text-gray-800">
              
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-yellow-700 dark:bg-yellow-700 ml-auto max-w-md text-black'  // Add text-white for darker text
                    : 'bg-gray-300 dark:bg-gray-800 mr-auto max-w-md'
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{message.content}</ReactMarkdown>
                <div className="text-xs text-gray-900 dark:text-gray-700 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mr-auto max-w-md">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about this conspiracy..."
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-yellow-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 resize-none"  // Changed to yellow-700
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-yellow-700 text-white rounded-r-md hover:bg-yellow-800 disabled:bg-gray-400 disabled:cursor-not-allowed"  // Changed to yellow-700
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}