import React from 'react';
import { Header } from '../layout/Header';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

// General AI chat page (CHAT-*). Engineering-document questions live on the Knowledge Copilot page.
export const ChatPage: React.FC = () => (
  <main
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      minWidth: 0,
    }}
  >
    <Header />
    <MessageList />
    <ChatInput />
  </main>
);
