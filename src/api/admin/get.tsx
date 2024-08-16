import axiosInstance from '../../api/axiosInstance';

export const fetchUsers = async () => {
    console.log('Reached admin log');
    try {
        const response = await axiosInstance.get('/admin/fetchusers', {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};


export const fetchCompany = async () => {
    console.log('Reached admin log');
    try {
        const response = await axiosInstance.get('/admin/fetchcompany', {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};
