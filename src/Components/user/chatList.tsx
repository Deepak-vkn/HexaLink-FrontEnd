import React, { useState, useEffect, ChangeEvent } from 'react';
import { FaUser, FaSearch, FaImage } from 'react-icons/fa';
import { fetchFollowDocument, createConversation } from '../../api/user/get';
import { sendToBackend } from '../../api/user/post';
import { socket } from '../../Socket/socket';
interface Chat {
  _id: string;
  lastMessage: string;
  unreadCount?: number;
  updatedAt?: string;
  otherUser: User;
}

interface User {
  _id: string;
  name: string;
  image: string;
}

interface ChatListProps {
  chats: any[]; // Replace `any[]` with a more specific type if available
  user: User; // Specify the correct type for user if available
  onConversationSelect: (conversationId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats = [], user, onConversationSelect }) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showUsersList, setShowUsersList] = useState<boolean>(false);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);

  useEffect(() => {
    // Update the filtered chats whenever chats or searchTerm change
    const newFilteredChats = chats.map((chat) => {
      const otherUser = chat.user1._id === user._id ? chat.user2 : chat.user1;
      return { ...chat, otherUser };
    }).filter(chat => {
      const otherUserName = chat.otherUser?.name?.toLowerCase() || '';
      return otherUserName.includes(searchTerm.toLowerCase());
    });

    setFilteredChats(newFilteredChats);
  }, [chats, searchTerm, user._id]);



  useEffect(() => {
    const handleReceiveMessage = (newMsg: any) => {
      const { conversationId, sendBy, content, file, sendTime } = newMsg;

      // Check if the user who sent the message is in the chat list
      setFilteredChats((prevChats) =>
        prevChats.map((chat) => {
          // Check if the chat's other user matches the sender
          if ( chat.otherUser._id === sendBy) {
            return {
              ...chat,
              lastMessage: content, // Update last message
              updatedAt: sendTime, // Update the timestamp
              unreadCount: chat.unreadCount ? chat.unreadCount + 1 : 1 // Increment unread count
            };
          }
          return chat;
        })
      );

      console.log('Received message from:', sendBy, 'Content:', content);
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [chats]); // Add chats as a dependency to re-subscribe when it changes




  const handleShowUsers = async () => {
    try {
      const usersResponse = await fetchFollowDocument(user._id);
      const approvedUsers = usersResponse.follow.following
        .filter((follow) => follow.status === 'approved')
        .map((follow) => ({
          _id: follow.id._id,
          name: follow.id.name,
          image: follow.id.image,
        }));
      setAvailableUsers(approvedUsers);
      setShowUsersList(true);
    } catch (error) {
      console.error('Failed to fetch users for starting a new chat:', error);
    }
  };

  const handleSearchChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (value) {
      try {
        const results = await sendToBackend(value);
        setAvailableUsers(results);
        setShowUsersList(true);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    } else {
      setAvailableUsers([]);
      setShowUsersList(false);
    }
  };

  const handleStartChat = async (userId: string) => {
    try {
      const response = await createConversation(user._id, userId);
      if (response) {
        setShowUsersList(false);
        onConversationSelect(response);
      } else {
        console.error('Failed to create conversation:', response.message);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleChatClick = (chat: Chat) => {
    if (chat) {
      // Reset unread count to zero when the chat is selected
      setFilteredChats((prevChats) =>
        prevChats.map((c) =>
          c._id === chat._id ? { ...c, unreadCount: 0 } : c
        )
      );
      setSelectedChat(chat);
      onConversationSelect(chat);
    }
  };

  return (
    <div className="w-full md:w-1/3 border-r border-gray-200 bg-white flex flex-col h-full">
      <div className="p-4 bg-gray-100 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Chats</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {filteredChats.length > 0 ? (
        <ul className="overflow-y-auto flex-grow">
          {filteredChats.map((chat) => (
            <li
              key={chat._id}
              className={`p-4 hover:bg-gray-100 cursor-pointer transition duration-150 ease-in-out border-b border-gray-100 ${
                selectedChat?._id === chat._id ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleChatClick(chat)}
            >
              <div className="flex items-center">
                <div className="relative">
                  {chat.otherUser.image ? (
                    <img
                      src={chat.otherUser.image}
                      alt={chat.otherUser.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <FaUser className="w-12 h-12 rounded-full bg-gray-300 p-2 text-gray-600" />
                  )}
                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="font-semibold text-gray-800">{chat.otherUser.name}</h3>
                  <p className="text-sm text-gray-600 truncate">
                    {chat.lastMessage.startsWith('https://res.cloudinary.com')
                      ? <FaImage className="inline text-gray-600" />
                      : chat.lastMessage}
                  </p>
                </div>
                {chat.updatedAt && (
                  <span className="text-xs text-gray-400">
                    {(() => {
                      const messageDate = new Date(chat.updatedAt);
                      const today = new Date();

                      const isSameDay =
                        messageDate.getDate() === today.getDate() &&
                        messageDate.getMonth() === today.getMonth() &&
                        messageDate.getFullYear() === today.getFullYear();

                      return isSameDay
                        ? messageDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true,
                          })
                        : messageDate.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true,
                          });
                    })()}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center flex-grow">
          <p className="text-gray-600 mb-4">No chats found.</p>
          <button
            onClick={handleShowUsers}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Start a New Chat
          </button>
        </div>
      )}

      {showUsersList && (
        <ul className="overflow-y-auto flex-grow">
          {availableUsers.map((user) => (
            <li
              key={user._id}
              className="p-4 hover:bg-gray-100 cursor-pointer transition duration-150 ease-in-out border-b border-gray-100"
              onClick={() => handleStartChat(user._id)} // Pass the user ID to start a chat
            >
              <div className="flex items-center">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <FaUser className="w-12 h-12 rounded-full bg-gray-300 p-2 text-gray-600" />
                )}
                <div className="ml-4 flex-grow">
                  <h3 className="font-semibold text-gray-800">{user.name}</h3>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatList;
