import React, { useEffect, useState } from 'react';
import Posts from '../../Components/user/posts';
import { getUserPosts } from '../../api/user/get';
import { useSelector } from 'react-redux';
import { RootState } from '../../Store/store';

const UserPosts = () => {
  const [posts, setPosts] = useState([]);
  const user = useSelector((state: RootState) => state.user.userInfo);

  useEffect(() => {
    console.log('UserPosts component rendered');
    console.log('User:', user);
    
    const fetchPosts = async () => {
      if (user && user._id) {
        try {
          console.log('Fetching posts for userId:', user._id);
          const postsData = await getUserPosts(user._id);

          console.log('PostsData:', postsData);

          if (postsData.success) {
            setPosts(postsData.posts || []);
          } else {
            alert(postsData.message || 'No posts found.');
          }
        } catch (error) {
          console.error('Error fetching posts:', error);
        }
      }
    };

    fetchPosts();
  }, [user?._id]); // Use `user._id` specifically to avoid unnecessary renders

  console.log('Posts state:', posts);

  return (
    <div>
      <Posts posts={posts} />
    </div>
  );
}

export default UserPosts;