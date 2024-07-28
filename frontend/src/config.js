// Using environment variables to allow flexibility in different environments
const API_URL = process.env.REACT_APP_BACKEND_URL;

const fetchSettings = async () => {
    try {
        const response = await fetch(`${API_URL}/settings`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};


export default {
    API_URL, fetchSettings
};
