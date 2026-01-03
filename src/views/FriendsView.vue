<template>
  <div class="page-wrapper">
    <Navbar />

    <div class="dashboard-container">
      <!-- Search/Add Section -->
      <div class="action-card search-card">
        <h3>新增好友</h3>
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            @input="handleInput"
            placeholder="搜尋 ID 或姓名..."
            class="search-input"
          />
        </div>

        <!-- Search Results -->
        <div v-if="userStore.loading" class="searching-text">搜尋中...</div>

        <div v-if="userStore.searchResults.length > 0" class="search-results">
            <div v-for="user in userStore.searchResults" :key="user.id" class="result-item">
                <span class="result-name">{{ user.name }} (@{{ user.username }})</span>
                <button
                  class="add-btn"
                  @click="addFriend(user.id)"
                  :disabled="isFriend(user.id)"
                >
                  {{ isFriend(user.id) ? '已新增' : '新增' }}
                </button>
            </div>
        </div>
        <div v-else-if="searchQuery && !userStore.loading && userStore.searchResults.length === 0" class="no-results">
            找不到使用者。
        </div>
      </div>

      <!-- Friends List -->
      <div class="friends-list-section">
        <h3>我的好友（{{ userStore.friends.length }}）</h3>

        <div class="friends-grid">
            <div v-for="friend in userStore.friends" :key="friend.id" class="friend-card">
                <div class="friend-avatar">{{ friend.name.charAt(0).toUpperCase() }}</div>
                <div class="friend-info">
                    <div class="friend-name">{{ friend.name }}</div>
                    <div class="friend-username">@{{ friend.username }}</div>
                </div>
            </div>

            <div v-if="userStore.friends.length === 0" class="empty-state">
                您還沒有新增任何好友。
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Navbar from '../components/Navbar.vue';
import { useUserStore } from '../stores/userStore';
import { useToastStore } from '../stores/toastStore';

const userStore = useUserStore();
const toastStore = useToastStore();
const searchQuery = ref('');
let debounceTimer = null;

const handleInput = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    
    if (!searchQuery.value.trim()) {
        userStore.clearSearch();
        return;
    }

    debounceTimer = setTimeout(() => {
        userStore.searchUsers(searchQuery.value);
    }, 500); // 500ms debounce
};

const addFriend = async (id) => {
    try {
        await userStore.addFriend(id);
        toastStore.addToast('好友已新增！', 'success');
        searchQuery.value = '';
        userStore.clearSearch();
    } catch (err) {
        toastStore.addToast(err.response?.data?.error || '新增好友失敗', 'error');
    }
};

const isFriend = (id) => {
    return userStore.friends.some(f => f.id === id);
};

onMounted(() => {
    userStore.getFriends();
});
</script>

<style scoped>
/* Reuse styles from Dashboard slightly modified */
* {
  box-sizing: border-box;
}

.page-wrapper {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.dashboard-container {
  width: 100%;
  max-width: 800px;
  margin: 30px auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-card {
  background: white;
  color: #333;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.search-card h3, .friends-list-section h3 {
    margin-top: 0;
    color: #333;
    font-size: 1.2rem;
    margin-bottom: 15px;
}

.search-box {
    margin-bottom: 15px;
}

.search-input {
    width: 100%;
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 50px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
}

.search-input:focus {
    border-color: #ee4d2d;
}

.search-results {
    border-top: 1px solid #eee;
    margin-top: 10px;
    max-height: 200px;
    overflow-y: auto;
}

.result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #f9f9f9;
}

.result-name {
    font-weight: 500;
}

.add-btn {
    background-color: #ee4d2d;
    color: white;
    border: none;
    padding: 5px 15px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.9rem;
}

.add-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.add-btn:hover:not(:disabled) {
    background-color: #d73211;
}

/* Friends Grid */
.friends-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
}

.friend-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    gap: 15px;
    border: 1px solid transparent;
    transition: box-shadow 0.2s;
}

.friend-card:hover {
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.friend-avatar {
    width: 50px;
    height: 50px;
    background-color: #ffeae6;
    color: #ee4d2d;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.2rem;
}

.friend-info {
    flex: 1;
    overflow: hidden;
}

.friend-name {
    font-weight: bold;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.friend-username {
    font-size: 0.85rem;
    color: #888;
}

.empty-state, .no-results, .searching-text {
    color: #888;
    font-style: italic;
    padding: 10px;
    text-align: center;
}
</style>
