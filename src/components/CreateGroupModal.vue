<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h2>Create Group</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Group Name:</label>
            <input 
              v-model="form.title" 
              type="text" 
              placeholder="Enter group name (e.g. KFC)" 
              required
              class="input-field"
            />
          </div>

          <div class="form-group">
            <label>Time:</label>
            <div class="time-inputs">
                <input 
                    v-model="form.startTime" 
                    type="datetime-local" 
                    :min="minStartTime" 
                    required 
                    class="input-field date-input"
                    @click="showPicker"
                />
                <span>to</span>
                <input 
                    v-model="form.endTime" 
                    type="datetime-local" 
                    :min="form.startTime" 
                    required 
                    class="input-field date-input"
                    @click="showPicker"
                />
            </div>
          </div>
          
          <div class="form-group members-section">
            <label>Members:</label>
            <div class="members-container">
                <!-- Selected Friends (Chips) -->
                <div v-for="friendId in form.invitedUserIds" :key="friendId" class="member-chip">
                    <span class="member-name">{{ getFriendName(friendId) }}</span>
                    <button type="button" class="remove-member-btn" @click="toggleFriend(friendId)">×</button>
                </div>

                <!-- Invite Button -->
                <button type="button" class="invite-btn" @click="showFriendList = !showFriendList">
                    Invite +
                </button>
            </div>

            <!-- Backdrop to close dropdown on click outside -->
            <div v-if="showFriendList" class="dropdown-backdrop" @click="showFriendList = false"></div>

            <!-- Friend Selection Dropdown/List -->
            <div v-if="showFriendList" class="friend-selection-list">
                <div v-if="userStore.friends.length === 0" class="no-friends-msg">
                    You have no friends yet. <router-link to="/friends">Add friends</router-link> first.
                </div>
                <div 
                    v-for="friend in userStore.friends" 
                    :key="friend.id" 
                    class="friend-option" 
                    :class="{ 'selected': form.invitedUserIds.includes(friend.id) }"
                    @click="toggleFriend(friend.id)"
                >
                    <span class="friend-avatar-small">{{ friend.name.charAt(0).toUpperCase() }}</span>
                    <span>{{ friend.name }} (@{{ friend.username }})</span>
                    <span v-if="form.invitedUserIds.includes(friend.id)" class="check-mark">✓</span>
                </div>
            </div>
          </div>
          
          <div class="menu-section">
            <label>Menu (Items & Prices)</label>
            <div class="menu-table">
                <div class="table-header">
                    <span>Item Name</span>
                    <span>Price</span>
                    <span>Action</span>
                </div>
                <div v-for="(item, index) in form.products" :key="index" class="table-row">
                    <input v-model="item.name" type="text" placeholder="Item" required class="input-field small" />
                    <input v-model.number="item.price" type="number" placeholder="$" required class="input-field small" />
                    <button type="button" @click="removeProduct(index)" class="remove-btn">&times;</button>
                </div>
            </div>
            <button type="button" @click="addProduct" class="add-btn">+ Add Item</button>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn" :disabled="isLoading">
                {{ isLoading ? 'Creating...' : 'Create Group' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useUserStore } from '../stores/userStore';
import axios from 'axios';

const props = defineProps(['isOpen']);
const emit = defineEmits(['close', 'created']);
const authStore = useAuthStore();
const userStore = useUserStore();
const isLoading = ref(false);
const showFriendList = ref(false);


const form = reactive({
    title: '',
    startTime: '',
    endTime: '',
    products: [
        { name: '', price: '' }
    ],
    invitedUserIds: []
});

// Format Date to YYYY-MM-DDTHH:mm string for datetime-local input
const toLocalISOString = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
};

// Initialize with current time and +2 hours
const now = new Date();
form.startTime = toLocalISOString(now);

const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
form.endTime = toLocalISOString(twoHoursLater);

const minStartTime = toLocalISOString(new Date());

const addProduct = () => {
    form.products.push({ name: '', price: '' });
};

const removeProduct = (index) => {
    if (form.products.length > 1) {
        form.products.splice(index, 1);
    }
};

const showPicker = (event) => {
    try {
        if (event.target.showPicker) {
            event.target.showPicker();
        }
    } catch (error) {
        // Fallback or ignore if not supported/allowed
    }
};

const toggleFriend = (friendId) => {
    const index = form.invitedUserIds.indexOf(friendId);
    if (index === -1) {
        form.invitedUserIds.push(friendId);
    } else {
        form.invitedUserIds.splice(index, 1);
    }
};

const getFriendName = (id) => {
    const friend = userStore.friends.find(f => f.id === id);
    return friend ? friend.name : 'Unknown';
};

const handleSubmit = async () => {
    // Validation: End time must be later than start time
    if (new Date(form.endTime) <= new Date(form.startTime)) {
        alert("End time must be later than Start time.");
        return;
    }

    isLoading.value = true;
    try {
        const token = authStore.token;
        await axios.post('http://localhost:3001/api/groups', {
            title: form.title,
            startTime: new Date(form.startTime).toISOString(),
            endTime: new Date(form.endTime).toISOString(),
            products: form.products.map(p => ({
                name: p.name,
                price: Number(p.price)
            })),
            invitedUserIds: form.invitedUserIds
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        emit('created');
        emit('close');
    } catch (error) {
        console.error("Failed to create group", error);
        const errorMsg = error.response?.data?.details || "Failed to create group. Please check inputs.";
        alert(`Error: ${errorMsg}`);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    // Ensure we have the latest friends list
    userStore.getFriends();
});
</script>

<style scoped>
* {
    box-sizing: border-box;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  background: white;
  width: 90%;
  max-width: 600px; /* Increased from 500px */
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  border: 2px solid #999;
  color: #000; /* Ensure text is visible in dark mode contexts */
}

/* ... existing code ... */

/* Ensure inputs in the time row don't overflow or squeeze too much */
.time-inputs .input-field {
    flex: 1; 
    min-width: 0; /* Prevent flex item from overflowing */
    font-size: 0.9rem; /* Smaller font to fit date string */
    padding: 8px; /* Slightly compact padding */
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 2px solid #999;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  color: #000;
}

.modal-header h2 {
    margin: 0;
    font-weight: bold;
}

.close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    color: #000;
}

.modal-body {
    padding: 20px;
    max-height: 80vh;
    overflow-y: auto;
    color: #000;
}

.form-group {
    margin-bottom: 20px; /* Increased from 15px */
}

label {
    display: block;
    font-weight: bold;
    margin-bottom: 8px; /* Slightly increased */
    color: #000;
}

.input-field {
    width: 100%;
    padding: 10px;
    border: 2px solid #999;
    border-radius: 8px;
    font-size: 1rem;
    color: #000;
    background: #fff; /* Ensure white background input */
}

.time-inputs {
    display: flex;
    gap: 15px;
    align-items: center;
}


/* Members Section */
.members-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px;
    border: 2px solid #999; /* Changed from dashed #ccc to solid #333 */
    border-radius: 8px;
    min-height: 50px;
    align-items: center;
    background: #fff; /* Ensure white background */
}

.member-chip {
    display: flex;
    align-items: center;
    background: #f0f0f0;
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 0.9rem;
    gap: 8px;
    border: 2px solid #999;
    color: #333;
}

.member-name {
    font-weight: 500;
}

.remove-member-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    color: #888;
    padding: 0;
    display: flex;
    align-items: center;
}

.remove-member-btn:hover {
    color: #ff4d4d;
}

.dropdown-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 50; /* Below the list but above other content */
    cursor: default;
    background: transparent;
}

/* ... existing styles ... */

.invite-btn {
    background: white;
    border: 2px solid #999;
    border-radius: 20px;
    padding: 5px 12px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: bold;
    color: #000; /* Force black text */
}

.invite-btn:hover {
    background: #f0f0f0;
}

.friend-selection-list {
    margin-top: 10px;
    border: 2px solid #999;
    border-radius: 8px;
    max-height: 150px;
    overflow-y: auto;
    background: white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    position: relative;
    z-index: 51;
}

.friend-option {
    padding: 8px 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    border-bottom: 2px solid #eee;
}

.friend-option:hover {
    background-color: #f5f5f5;
}

.friend-option.selected {
    background-color: #fff0eb;
    color: #ee4d2d;
}

.friend-avatar-small {
    width: 24px;
    height: 24px;
    background: #ddd;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
    color: #555;
}

.check-mark {
    margin-left: auto;
    font-weight: bold;
}

.no-friends-msg {
    padding: 15px;
    text-align: center;
    color: #666;
    font-size: 0.9rem;
}


.menu-section {
    margin-top: 25px;
    border-top: 2px solid #999;
    padding-top: 20px;
}

.menu-table {
    border: 2px solid #999;
    border-radius: 8px;
    margin-bottom: 15px;
    overflow: hidden;
    background: #fff;
}

.table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 0.5fr;
    background: #eee;
    padding: 10px;
    border-bottom: 2px solid #999;
    font-weight: bold;
    color: #000;
}

.table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 0.5fr;
    padding: 10px;
    gap: 10px; /* Increased gap */
    border-bottom: 2px solid #999;
    align-items: center;
}

.table-row:last-child {
    border-bottom: none;
}

.small {
    padding: 8px; /* Slightly more padding */
    border: 2px solid #999;
}

.remove-btn {
    background: #ff4d4d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    height: 30px;
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
}

.add-btn {
    width: 100%;
    padding: 12px;
    background: #eee;
    border: 2px solid #999;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    color: #000;
}

.add-btn:hover {
    background: #ddd;
}

.form-actions {
    margin-top: 25px;
    text-align: right;
}

.submit-btn {
    background: #ee4d2d;
    color: white;
    padding: 12px 30px;
    border: none;
    border-radius: 50px;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.submit-btn:hover:not(:disabled) {
    background: #d73211;
}

.submit-btn:disabled {
    background: #fabfb5;
    cursor: not-allowed;
}

/* Make the entire input clickable and pointer cursor */
.date-input {
    cursor: pointer;
}

/* Invert icon color if needed for visibility, or ensure it's black */
.date-input::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(0); /* Force black icon */
}
</style>
