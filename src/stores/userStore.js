import { defineStore } from 'pinia';
import axios from 'axios';
import { useAuthStore } from './auth';

export const useUserStore = defineStore('user', {
    state: () => ({
        friends: [],
        searchResults: [],
        loading: false,
        error: null,
    }),
    actions: {
        async searchUsers(query) {
            this.loading = true;
            this.error = null;
            const authStore = useAuthStore();
            try {
                const response = await axios.get(`http://localhost:3001/api/users/search?q=${query}`, {
                    headers: { Authorization: `Bearer ${authStore.token}` }
                });
                this.searchResults = response.data;
            } catch (err) {
                console.error(err);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    authStore.logout();
                    window.location.href = '/login';
                    return;
                }
                this.error = 'Search failed';
            } finally {
                this.loading = false;
            }
        },

        async getFriends() {
            this.loading = true;
            this.error = null;
            const authStore = useAuthStore();
            try {
                const response = await axios.get('http://localhost:3001/api/users/friends', {
                    headers: { Authorization: `Bearer ${authStore.token}` }
                });
                this.friends = response.data;
            } catch (err) {
                console.error(err);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    authStore.logout();
                    window.location.href = '/login';
                    return;
                }
                this.error = 'Failed to load friends';
            } finally {
                this.loading = false;
            }
        },

        async addFriend(friendId) {
            const authStore = useAuthStore();
            try {
                await axios.post('http://localhost:3001/api/users/friends',
                    { friendId },
                    { headers: { Authorization: `Bearer ${authStore.token}` } }
                );
                // Refresh friends list
                await this.getFriends();
                // Clear search or update status? For now just refresh
            } catch (err) {
                console.error(err);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    authStore.logout();
                    window.location.href = '/login';
                    return;
                }
                throw err; // Let component handle error toast/alert
            }
        },

        clearSearch() {
            this.searchResults = [];
        }
    }
});
