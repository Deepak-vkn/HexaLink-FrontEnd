import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { logoutcall, sendToBackend } from '../../api/user/post';
import { useDispatch } from 'react-redux';
import { useNavigate, Link,useLocation  } from 'react-router-dom';
import { logout } from '../../Store/userSlice';
import {IoPerson, IoNotifications  , IoSearch, IoMenu, IoClose } from "react-icons/io5";
import { MdHome } from "react-icons/md";
import { BsWechat } from "react-icons/bs";

import { initializeSocket } from '../../Socket/socket';
import { socket } from '../../Socket/socket';
import { useSelector } from 'react-redux';

import { fetchNotification,unreadMessageCount } from '../../api/user/get';
// import VideoCallModal from './vedioCall/createCall';
// interface User {
//   id: string;
//   name: string;
//   email: string;
// }

interface NavbarProps {
  user?: any | null;
}

const Navbar: React.FC<NavbarProps> = () => {
  initializeSocket()
 
    const user = useSelector((state:any) => state.user.userInfo);
    if (user?._id) {
      socket.emit('addUser', user._id);
    }
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0); 
  const location = useLocation(); // To monitor the current route
  //const [isCallModalOpen, setIsCallModalOpen] = useState(false);
 // const [callerInfo, setCallerInfo] = useState<any>(null); // S
  const [unreadMessage, setUnreadMessageCount] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen((prevState) => !prevState);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };


  const handleLogout = async () => {
    try {
      console.log('Logout triggered');
      const result = await logoutcall('user');
      if (result.success) {
        console.log('Logout successful');
        dispatch(logout());
        navigate('/');
        setIsDropdownOpen(false); 
        setIsMenuOpen(false); 
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Reset notification count when navigating to the notification page
  useEffect(() => {
    if (location.pathname === '/notification') {
      setNotificationCount(0); // Reset notification count
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      initializeSocket();
      if (user?._id) {
        // Add user to the socket
        socket.emit('addUser', user._id);
  
        // Fetch notifications
        try {
          const result = await fetchNotification(user._id); 
          if (result.success) {
            // Count unread notifications
            const unreadNotifications = result.data.filter((notification:any) => !notification.isRead);
            setNotificationCount(unreadNotifications.length); 
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }


         // Fetch unread message count
         try {
          const messageCountResult = await unreadMessageCount(user._id);
          if (messageCountResult.success) {
            setUnreadMessageCount(messageCountResult.count);
          }
        } catch (error) {
          console.error('Error fetching unread message count:', error);
        }
  
      
      }
    };
  
    fetchData();

    // return () => {
    //   socket.off('incomingCall'); // Remove the listener when the component unmounts
    // };
  
  }, [user?._id]);
  
   useEffect(() => {
    const handleNotificationUpdate = (notification: any) => {
      console.log('Notification received:', notification);
      setNotificationCount((prevCount) => prevCount + 1);
    };

    socket.on('notificationUpdate', handleNotificationUpdate);

    return () => {
      socket.off('notificationUpdate', handleNotificationUpdate);
    };
  }, []); 


  useEffect(() => {
    const handleMessageCountUpdate = (notification: any) => {
      console.log('Message count update received:', notification);
      // You can increase the unread message count by 1
      setUnreadMessageCount((prevCount) => prevCount + 1);
    };
  
    // Listening for the 'MessageCountUpdate' event
    socket.on('MessageCountUpdate', handleMessageCountUpdate);
  
    return () => {
      socket.off('MessageCountUpdate', handleMessageCountUpdate);
    };
  }, []); 

  useEffect(() => {
    const handleMessageCountUpdate = (notification: { count: number }) => {
      console.log('Message count update received:', notification);
      // Update the unread message count directly to the received count
      setUnreadMessageCount(notification.count);
    };

    // Listening for the 'updateMessageCount' event
    socket.on('updateMessageCount', handleMessageCountUpdate);

    return () => {
      // Clean up the event listener on component unmount
      socket.off('updateMessageCount', handleMessageCountUpdate);
    };
  }, []);
  // useEffect(() => {
  //   const handleIncomingCall = (callData: any) => {
  //     console.log('Incoming call arrived :', callData);
  //     setCallerInfo(callData); 
  //     setIsCallModalOpen(true); 
  //   };

  //   socket.on('incoming:call', handleIncomingCall); 

  //   return () => {
  //     socket.off('incoming:call', handleIncomingCall); 
  //   };
  // }, []);

  const handleSearchChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);

    if (value) {
      const results = await sendToBackend(value); 
      setSearchResults(results);
      setIsModalOpen(true); 
    } else {
      setSearchResults([]);
      setIsModalOpen(false);
    }
  };

  const handleItemClick = (result:any) => {
    console.log('Clicked profile navigate');
    const userId = result._id; 
    navigate(`/profile/${userId}`, {
      state: { isCurrentUser: false }
    });

  };

  // const handleCloseCallModal = () => {
  //   setIsCallModalOpen(false);
  // };


  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <span className="text-lg font-bold text-blue-500">Hexa Link</span>
          </Link>
        </div>

        <div className="hidden md:flex md:items-center md:space-x-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search users..."
              className="w-56 px-3 py-1.5 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <IoSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            
            {isModalOpen && searchResults?.length > 0 && (
              <div
                ref={modalRef}
                className="absolute top-12 w-full bg-white border border-gray-300 rounded-md shadow-lg z-20"
              >
                <ul>
                  {searchResults.map((result: any) => (
                    <li
                      key={result._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm"
                      onClick={() => handleItemClick(result)}
                    >
                      {result.image ? (
                        <img
                          src={result.image}
                          alt={result.name}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-2 text-white text-xs">
                          {result.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{result.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
          <Link to="/message" className="text-gray-600 hover:text-gray-900 relative">
            Chat
            {unreadMessage > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadMessage}
              </span>
            )}
          </Link>
          <Link to="/jobs" className="text-gray-600 hover:text-gray-900">Jobs</Link>
          <Link to="/notification" className="text-gray-600 hover:text-gray-900 relative">
            <IoNotifications size={18} />
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Link>
          <Link to="/profile" className="text-gray-600 hover:text-gray-900">
            <IoPerson size={18} />
          </Link>
        </div>

        <div className="flex items-center">
          <div className="hidden md:block">
            <button
              onClick={toggleDropdown}
              className="bg-blue-500 text-white rounded-full px-3 py-1.5 text-xs font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {user ? user.name : 'User'}
            </button>
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              <MdHome size={20} />
            </Link>
            <Link to="/message" className="text-gray-600 hover:text-gray-900 relative">
              <BsWechat   size={20} />
              {unreadMessage > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadMessage}
                </span>
              )}
            </Link>
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isMenuOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </div>

    {isMenuOpen && (
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link to="/jobs" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Jobs</Link>
          <Link to="/notification" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
           
            Notifications
            {notificationCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {notificationCount}
              </span>
            )}
          </Link>
          <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">  
            Profile
          </Link>
          <Link to="/activity" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
        Recent Activity
        </Link>
        <Link to="/posts" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
          Your Posts
        </Link>
        <Link to="/saved" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
        Saved Items
        </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    )}
  </nav>
  );
};

export default Navbar;
