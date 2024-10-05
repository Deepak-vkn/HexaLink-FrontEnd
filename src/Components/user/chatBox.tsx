import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaPaperPlane, FaEllipsisV, FaSmile, FaVideo, FaTimes ,FaImage} from 'react-icons/fa';
import { getMessages,deleteMessage } from '../../api/user/get';
import { socket } from '../../Socket/socket';
import VideoCallModal from '../user/vedioCall/createCall'; 
import { uploadFile } from '../../api/user/post';

interface User {
  _id: string;
  name: string;
  image: string;
}

interface Message {
  _id: string;
  content: string;
  file:string;
  sendBy: string;
  sendTime: Date;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  _id: string;
  user1: User;
  user2: User;
  createdAt: string;
  lastMessage?: string;
}

const ChatBox: React.FC<{ conversation: Conversation | null; user: User }> = ({ conversation, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null); 
  const [showVideoCallModal, setShowVideoCallModal] = useState(false); 
  const [selectedMedia, setSelectedMedia] = useState<string>( '');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false); // State to control media modal
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showDeleteOption, setShowDeleteOption] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [chatPartnerOnline, setChatPartnerOnline] = useState(false); 
    
  const chatPartnerId = conversation?.user1._id === user._id ? conversation.user2._id : conversation?.user1._id;


  useEffect(() => {
    const loadMessages = async () => {
      try {
        if (conversation?._id) {
          const fetchedMessages = await getMessages(conversation._id);
          setMessages(fetchedMessages);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    loadMessages();
  }, [conversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleReceiveMessage = (newMsg: Message) => {
      setMessages((prevMessages) => [...prevMessages, newMsg]);
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, []);

  useEffect(() => {
    if (user && conversation) {
      console.log('Emitting userOnline with:', { userId: user._id, chatId: chatPartnerId });
      socket.emit('userOnline', { userId: user._id, chatId: chatPartnerId });
    }
  
  
   
  }, [conversation, user, chatPartnerId]);  // Dependencies: user and conversation
  


  useEffect(() => {
    const chatPartnerOnlineReceive = (data: any) => {
      console.log('Received chatPartnerOnline event:', data);
      if (data.success) {
        console.log('Chat partner is online. Updating state to true.');
        setChatPartnerOnline(true);
      } else {
        console.log('Chat partner is offline. Updating state to false.');
        setChatPartnerOnline(false);
      }
    };
  
    socket.on('chatPartnerOnline', chatPartnerOnlineReceive);
  
    return () => {
      socket.off('chatPartnerOnline', chatPartnerOnlineReceive);
    };
  }, [conversation, chatPartnerId]); // Ensure dependencies are correctly included
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleSendMessage = () => {

    if (newMessage.trim() !== '' || file !== '') {
      const messagePayload: any = {
        conversationId: conversation?._id,
        sendTo: chatPartnerId,
        sendBy: user._id,
      };
  
      if (newMessage.trim() !== '') {
        messagePayload.content = newMessage.trim(); // Include content if available
      }
  
      if (file !== '') {
        messagePayload.file = file; // Include file if available
      }
  
      const newMsg: Message = {
        _id: Date.now().toString(),
        content: newMessage.trim(),
        file: file, // It can be empty if no file is sent
        sendBy: user._id,
        sendTime: new Date(),
        status: 'sent',
      };
  
      setMessages([...messages, newMsg]);
      setNewMessage(''); // Clear the message input
      setFile(''); // Clear the file after sending
  
      
      socket.emit('sendMessage', messagePayload, (error: any) => {
        if (error) {
          console.error('Error sending message:', error);
        }
        else {
          console.log('Message emitted successfully');
        }
      });
    }
  };
  



  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
        setSelectedMedia(reader.result as string);
        setShowMediaModal(true)
      };
      reader.readAsDataURL(file);

      
    }

  };

  const handleDelete = async () => {
    if (selectedMessageId) {
      try {
       const result= await deleteMessage(selectedMessageId); 
       if(result.success){
        setMessages(messages.filter((message) => message._id !== selectedMessageId));
        setShowDeleteOption(false);
        setSelectedMessageId(null);
       }
        
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };
  const handleSendMedia = async () => {
    if (selectedMedia && conversation) {
      const formData = new FormData();
      
      // Check if the selected media is a file or a Base64 string
      if (typeof selectedMedia === 'string') { // If selectedMedia is a Base64 string
        formData.append('image', selectedMedia); // Append Base64 image string
      } else {
        formData.append('file', selectedMedia); // Append the actual file
      }
      
      try {
        // Call the uploadFile API
        const response = await uploadFile(formData);
        
        if (response.success) {
          const fileUrl = response.fileUrl; // Use the uploaded file URL
          
          // Prepare the message payload
          const messagePayload = {
            conversationId: conversation._id,
            sendTo: chatPartnerId,
            sendBy: user._id,
            file: fileUrl, // Use the uploaded file URL
          };
  
          // Create the new message object
          const newMsg: Message = {
            _id: Date.now().toString(),
            content: '', // No text content for media messages
            file: fileUrl, // Use the uploaded file URL
            sendBy: user._id,
            sendTime: new Date(),
            status: 'sent',
          };
  
          // Update messages state to include the new message
          setMessages((prevMessages) => [...prevMessages, newMsg]);
  
          // Emit the message with the file
          socket.emit('sendMessage', messagePayload, (error) => {
            if (error) {
              console.error('Error sending message:', error);
            } else {
              console.log('Message emitted successfully');
            }
          });
  
          // Clear the selected media after sending
          setSelectedMedia('');
          setMediaPreview(null);
          setShowMediaModal(false);
        }
      } catch (error) {
        console.error('Upload failed:', error); // Handle the error
      }
    } else {
      console.log('No media selected or conversation not found.');
    }
  };


  const isMessageFromCurrentUser = (message: Message) => {
    if( message.sendBy === user._id){
      setSelectedMessageId(message._id);
      setShowDeleteOption(true);
    }
    else{
      setShowDeleteOption(false);

    }
  };



  const handleOpenCallModal = () => {
    console.log('open call modal');
    setShowVideoCallModal(true); // Show the modal when the video call button is clicked
  };

  const handleCloseCallModal = () => {
    console.log('close call modal');
    setShowVideoCallModal(false); // Close the modal if call is canceled
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {conversation ? (
        <>
          <div className="p-4 bg-white shadow-sm flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                {conversation.user1.image ? (
                  <img
                    className="w-10 h-10 rounded-full"
                    src={conversation.user1.image}
                    alt="User profile"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg">
                    {conversation.user1.name.charAt(0).toUpperCase()}
                    {chatPartnerOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  {conversation.user1._id === user._id ? conversation.user2.name : conversation.user1.name}
                </h2>
              
           
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700" onClick={handleOpenCallModal}>
                <FaVideo className="w-6 h-6" />
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <FaEllipsisV />
              </button>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message._id} className={`flex ${message.sendBy === user._id ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg flex justify-between items-start ${
                  message.sendBy === user._id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
             <div className="flex-1" onClick={() => isMessageFromCurrentUser(message)}>
                  {message.content ? (
                    <p className="text-sm">{message.content}</p>
                  ) : message.file ? (
                    <img src={message.file} alt="Sent file" className="max-w-full max-h-64 rounded-lg" />
                  ) : null}
                  
                  <p className="text-xs mt-1 text-gray-400">
                    {new Date(message.sendTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

          {/* Message input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <button className="text-gray-500 hover:text-gray-700 mr-2">
                <FaSmile className="w-6 h-6" />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-transparent outline-none"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <input
                type="file"
                accept="image/*, video/*"
                onChange={handleMediaChange}
                className="ml-2 text-blue-500 hover:text-blue-600 focus:outline-none"
              />
              {/* Always display the send button */}
              <button
                className="ml-2 text-blue-500 hover:text-blue-600 focus:outline-none"
                onClick={selectedMedia ? handleSendMedia : handleSendMessage}
              >
                <FaPaperPlane className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Video Call Modal */}
          {showVideoCallModal && (
            <VideoCallModal onClose={handleCloseCallModal}
            to={chatPartnerId}  />
          )}



      {/* Delete Modal */}
      {showDeleteOption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg max-w-sm w-full">
            <p className="text-lg text-gray-800">Are you sure you want to delete this message?</p>
            <div className="mt-4 flex justify-between">
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowDeleteOption(false)}
              >
                Cancel
              </button>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

          {/* Media Preview Modal (if applicable) */}
          {showMediaModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Media Preview</h2>
                  <button 
                    onClick={() => {
                      setShowMediaModal(false);
                      setSelectedMedia(null);
                      setMediaPreview(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
                {mediaPreview && (
                  <img src={mediaPreview} alt="Media Preview" className="w-full h-64 object-contain rounded-lg mb-4" />
                )}
                <div className="flex justify-end space-x-2">
                  <button 
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    onClick={() => {
                      setShowMediaModal(false);
                      setSelectedMedia(null);
                      setMediaPreview(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={handleSendMedia}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Select a conversation to start chatting</p>
        </div>
      )}

    </div>
  );
};

export default ChatBox;