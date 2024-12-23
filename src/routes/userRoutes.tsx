import React from 'react';
import { Route, Routes } from 'react-router-dom';
import UserLogin from '../Pages/User/login';
import UserRegister from '../Pages/User/register';
import Userhome from '../Pages/User/userhome';
import UserLogged from '../middleware/user/userlogged';
import Usermid from '../middleware/user/userhome';
import UserResetPaaword from '../Pages/User/resetPassword';
import ForgetPassword from '../Pages/User/forgetPassword';

import Otp from '../Components/otp';
import UserProfile from '../Pages/User/userProfile';
import UserPosts from '../Pages/User/userPosts';
import UserJobs from '../Pages/User/jobs';
import UserNotification from '../Pages/User/userNotification';
import Loading from '../Components/Loading';
import Message from '../Pages/User/chat';
import SavedItems from '../Pages/User/savedPage';
import UserDashBoard from '../Pages/User/userDashBoard';

const UserRoutes: React.FC = () => {

  return (
    <Routes>
      <Route element={<UserLogged />}>
        <Route path="/" element={<UserLogin />} />
        <Route path="/register" element={<UserRegister />} />
        
      </Route>

      <Route element={<Usermid />}>
     
        <Route path="/home" element={<Userhome />} />
        <Route path="/profile/:userId?" element={<UserProfile />} />
        <Route path="/posts" element={< UserPosts />} />
        <Route path="/jobs/:jobId?" element={< UserJobs />} />
        <Route path="/notification" element={< UserNotification />} />
        <Route path="/message" element={<Message />} />
        <Route path="/saved" element={<SavedItems />} />
        <Route path="/activity" element={<UserDashBoard />} />
      </Route>

      <Route path="/resetPassword" element={<UserResetPaaword />} />
      <Route path="/forgetpassword" element={<ForgetPassword />} />
      <Route path="/otp" element={<Otp />} />
   
      <Route path="/loading" element={< Loading />} />
    </Routes>
  );
}

export default UserRoutes;
