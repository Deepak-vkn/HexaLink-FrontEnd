// src/axiosConfig.ts
import axios from 'axios';
import store from '../Store/store'; // Import the default export
import { logout,setCredentials } from '../Store/userSlice';
import { companyLogout } from '../Store/companySlice';
import {  adminLogout } from '../Store/adminSlice';
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001',
  withCredentials:true
});


axiosInstance.interceptors.response.use(
  (response) => {
  
    if (response.data && response.data.token === false) {
      console.log('user tokn faield at axios')
      switch (response.data.role) {
        case 'user':
          store.dispatch(logout());
          break;
        case 'company':
          store.dispatch(companyLogout());
          break;
        case 'admin':
          store.dispatch(adminLogout());
          break;
        default:
          store.dispatch(logout()); 
          break;
      }
      window.location.href = '/';
    }

    if (response.data && response.data.user) {
      
      store.dispatch(setCredentials(response.data.user));
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
