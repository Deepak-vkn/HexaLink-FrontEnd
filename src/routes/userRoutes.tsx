import React from 'react';
import { Route, Routes } from 'react-router-dom';
import UserLogin from '../Pages/User/login';
import UserRegister from '../Pages/User/register';
import Userhome from '../Pages/User/userhome';
import UserLogged from '../middleware/user/userlogged';
import Usermid from '../middleware/user/userhome';
import UserResetPaaword from '../Pages/User/resetPassword';
import ForgetPassword from '../Pages/User/forgetPassword';
import Navbar from '../Components/user/navbar';
import Otp from '../Components/otp';
import UserProfile from '../Pages/User/userProfile';
import UserPosts from '../Pages/User/userPosts';

const UserRoutes: React.FC = () => {

  return (
    <Routes>
      <Route element={<UserLogged />}>
        <Route path="/" element={<UserLogin />} />
        <Route path="/register" element={<UserRegister />} />
      </Route>

      <Route element={<Usermid />}>
        <Route path="/home" element={<Userhome />} />
      </Route>

      <Route path="/nav" element={<Navbar />} />
      <Route path="/resetPassword" element={<UserResetPaaword />} />
      <Route path="/forgetpassword" element={<ForgetPassword />} />
      <Route path="/otp" element={<Otp />} />
      <Route path="/userProfile" element={<UserProfile />} />
      <Route path="/posts" element={< UserPosts />} />
    </Routes>
  );
}

export default UserRoutes;
