import axios from 'axios';

const BASE_URL = '/api';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const checkConnection = async () => {
    try {
        const response = await client.get('/health');
        if (response.data.status === 'online') {
            console.log('Backend Connection: ONLINE');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Backend Connection: OFFLINE', error.message);
        return false;
    }
};

export default client;
