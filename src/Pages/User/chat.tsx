import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Store/store';
import ChatList from '../../Components/user/chatList';
import ChatBox from '../../Components/user/chatBox';
import { fetchConversations } from '../../api/user/get'; 
import { socket } from '../../Socket/socket';

const ChatPage: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.userInfo);
  const [conversations, setConversations] = useState<any>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        if (user?._id) {
          const fetchedConversations = await fetchConversations(user?._id); 
          setConversations(fetchedConversations);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    loadConversations();
  }, [user?._id]);

  useEffect(() => {
    // Listen for incoming messages
    socket.on('receiveMessage', (data) => {
      const { conversationId, content, sendTime } = data;

      setConversations((prevConversations: any) =>
        prevConversations.map((conversation: any) => {
          if (conversation._id === conversationId) {
            return {
              ...conversation,
              lastMessage: content,
              updatedAt: sendTime,
            };
          }
          return conversation;
        })
      );
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  useEffect(() => {
    // Function to check if the screen is in mobile view
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Add the event listener for resizing
    window.addEventListener('resize', handleResize);

    // Initial check
    handleResize();

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleConversationSelect = (conversation: any) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {user && !isMobile && (
          <ChatList 
            chats={conversations}  
            user={user} 
            onConversationSelect={handleConversationSelect} 
          />
        )}

        {selectedConversation ? (
          <ChatBox conversation={selectedConversation} user={user} />
        ) : (
          isMobile && user && (
            <ChatList 
              chats={conversations}  
              user={user} 
              onConversationSelect={handleConversationSelect} 
            />
          )
        )}
      </div>
    </div>
  );
};

export default ChatPage;
