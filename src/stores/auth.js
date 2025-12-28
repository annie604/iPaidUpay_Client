import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = '/api/auth';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
    },
    actions: {
        async register(username, password, name) {
            try {
                const response = await axios.post(`${API_URL}/register`, {
                    username,
                    password,
                    name,
                });
                return response.data;
            } catch (error) {
                throw error.response ? error.response.data : error;
            }
        },
        async login(username, password) {
            try {
                const response = await axios.post(`${API_URL}/login`, {
                    username,
                    password,
                });

                const { token, user } = response.data;

                this.token = token;
                this.user = user;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                return user;
            } catch (error) {
                throw error.response ? error.response.data : error;
            }
        },
        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },
});
