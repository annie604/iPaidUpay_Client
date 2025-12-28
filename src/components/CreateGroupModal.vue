<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h2>Create Group</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <!-- Tab Navigation -->
      <div class="modal-tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'settings' }]" 
          @click="activeTab = 'settings'"
        >
          Menu Settings
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'order' }]" 
          @click="activeTab = 'order'"
        >
          My Order
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'summary' }]" 
          @click="activeTab = 'summary'"
        >
          Group Summary
        </button>
      </div>
      
      <div class="modal-body">
        
        <!-- Tab 1: Menu Settings (Original Form) -->
        <div v-show="activeTab === 'settings'" class="tab-content">
            <form id="create-group-form" @submit.prevent="handleSubmit">
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
                        <!-- Creator (Me) Chip -->
                        <div class="member-chip">
                             <span class="member-name creator-name">{{ userStore.user?.name }} (Host)</span>
                        </div>

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

                    <div v-if="showFriendList" class="dropdown-backdrop" @click="showFriendList = false"></div>

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
            </form>
        </div>

        <!-- Tab 2: My Order -->
        <div v-show="activeTab === 'order'" class="tab-content">
             <div class="order-selection-area">
                <label>Add Item:</label>
                <div class="selection-row">
                    <select v-model="selectedProductIndex" class="input-field">
                        <option :value="-1" disabled>Select Item...</option>
                        <option 
                            v-for="(prod, idx) in form.products" 
                            :key="idx" 
                            :value="idx"
                        >
                            {{ prod.name ? prod.name : '(Unnamed Item)' }} (${{ prod.price }})
                        </option>
                    </select>
                    <input v-model.number="selectedQty" type="number" min="1" class="input-field qty-input" placeholder="Qty" />
                    <button type="button" class="add-order-btn" @click="addToMyOrder" :disabled="selectedProductIndex === -1">Add</button>
                </div>
            </div>

            <div class="my-order-list">
                <h4>My Order List</h4>
                 <div v-if="myOrderItems.length === 0" class="empty-msg">
                    You haven't added any items yet.
                </div>
                <div v-else class="order-table">
                     <div class="table-header">
                        <span>Item</span>
                        <span>Qty</span>
                        <span>Subtotal</span>
                        <span>Action</span>
                    </div>
                    <div v-for="(item, idx) in myOrderItems" :key="idx" class="table-row">
                        <span>{{ item.name }}</span>
                        <!-- Editable Qty -->
                        <div class="qty-control">
                            <button type="button" class="qty-btn" @click="updateOrderItemQty(idx, -1)">-</button>
                            <input 
                                v-model.number="item.quantity" 
                                type="text" 
                                class="qty-input-small" 
                            />
                            <button type="button" class="qty-btn" @click="updateOrderItemQty(idx, 1)">+</button>
                        </div>
                        <span>${{ item.price * item.quantity }}</span>
                        <button type="button" @click="removeOrderItem(idx)" class="remove-btn small-btn">&times;</button>
                    </div>
                </div>
                <div class="order-total" v-if="myOrderItems.length > 0">
                    Total: <span class="price">${{ myOrderTotal }}</span>
                </div>
            </div>
        </div>

        <!-- Tab 3: Group Summary -->
        <div v-show="activeTab === 'summary'" class="tab-content">
             <div class="summary-table-container">
                <div class="order-table summary-table">
                    <div class="table-header">
                        <span>Item</span>
                        <span>Total Qty</span>
                        <span>Total Amount</span>
                        <span>Ordered By</span>
                    </div>
                    <div v-if="localGroupStats.length === 0" class="empty-msg">
                        No orders placed yet.
                    </div>
                    <div v-else v-for="(stat, idx) in localGroupStats" :key="idx" class="table-row">
                        <span>{{ stat.name }}</span>
                        <span>{{ stat.quantity }}</span>
                        <span>${{ stat.totalPrice }}</span>
                        <span class="ordered-by">
                             {{ userStore.user?.name }} (Host) x{{ stat.quantity }}
                        </span>
                    </div>
                </div>
                 <div class="grand-total">
                    Grand Total: <span class="price">${{ myOrderTotal }}</span>
                </div>
             </div>
             <p class="summary-note">Note: This is a preview based on your initial order.</p>
        </div>

      </div>

      <!-- Footer Actions (Always visible) -->
      <div class="modal-footer">
          <button type="button" class="submit-btn" :disabled="isLoading" @click="handleSubmit">
             {{ isLoading ? 'Creating Group...' : 'Create Group' }}
          </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useUserStore } from '../stores/userStore';
import { useToastStore } from '../stores/toastStore';
import axios from 'axios';

const props = defineProps(['isOpen']);
const emit = defineEmits(['close', 'created']);
const authStore = useAuthStore();
const userStore = useUserStore();
const toastStore = useToastStore();

const isLoading = ref(false);
const showFriendList = ref(false);
const activeTab = ref('settings');

// --- Form State ---
const form = reactive({
    title: '',
    startTime: '',
    endTime: '',
    products: [
        { name: '', price: '' }
    ],
    invitedUserIds: [] // Friends IDs
});

// --- Initial Setup ---
const toLocalISOString = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
};

const now = new Date();
form.startTime = toLocalISOString(now);
const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
form.endTime = toLocalISOString(twoHoursLater);
const minStartTime = toLocalISOString(new Date());


// --- Menu Logic ---
const addProduct = () => {
    form.products.push({ name: '', price: '' });
};

const removeProduct = (index) => {
    // Check if this product is in my order
    const prodName = form.products[index].name;
    if (prodName) {
        // Remove from my order if present
        const orderIdx = myOrderItems.value.findIndex(i => i.name === prodName);
        if (orderIdx !== -1) {
            myOrderItems.value.splice(orderIdx, 1);
        }
    }

    if (form.products.length > 1) {
        form.products.splice(index, 1);
    } else {
        // Just clear it if it's the last one
        form.products[0] = { name: '', price: '' };
    }
};

// --- Members Logic ---
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


// --- My Order Logic (Local) ---
const myOrderItems = ref([]);
const selectedProductIndex = ref(-1);
const selectedQty = ref(1);

const addToMyOrder = () => {
    if (selectedProductIndex.value === -1) return;
    const prod = form.products[selectedProductIndex.value];
    if (!prod.name || !prod.price) return;

    // Check if already in order
    const existing = myOrderItems.value.find(i => i.name === prod.name);
    if (existing) {
        existing.quantity += selectedQty.value;
    } else {
        myOrderItems.value.push({
            name: prod.name,
            price: Number(prod.price),
            quantity: selectedQty.value
        });
    }
    // Reset selection
    selectedQty.value = 1;
};

const removeOrderItem = (index) => {
    myOrderItems.value.splice(index, 1);
};

const updateOrderItemQty = (index, change) => {
    const item = myOrderItems.value[index];
    const newQty = item.quantity + change;
    if (newQty > 0) {
        item.quantity = newQty;
    }
};

const myOrderTotal = computed(() => {
    return myOrderItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});


// --- Group Summary Logic (Local Preview) ---
const localGroupStats = computed(() => {
    // Since only Creator can order initially, stats are just my order items
    return myOrderItems.value.map(item => ({
        name: item.name,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity
    }));
});


// --- Submission ---
const handleSubmit = async () => {
    // Validation
    if (!form.title) {
        toastStore.addToast("Please enter a group name.", "error");
        activeTab.value = 'settings';
        return;
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
        toastStore.addToast("End time must be later than Start time.", "error");
        activeTab.value = 'settings';
        return;
    }
    // Check valid products
    const validProducts = form.products.filter(p => p.name && p.price);
    if (validProducts.length === 0) {
        toastStore.addToast("Please add at least one valid product to the menu.", "error");
        activeTab.value = 'settings';
        return;
    }


    isLoading.value = true;
    try {
        const token = authStore.token;
        await axios.post('http://localhost:3001/api/groups', {
            title: form.title,
            startTime: new Date(form.startTime).toISOString(),
            endTime: new Date(form.endTime).toISOString(),
            products: validProducts.map(p => ({
                name: p.name,
                price: Number(p.price)
            })),
            invitedUserIds: form.invitedUserIds,
            // Send Initial Order if any
            initialOrder: myOrderItems.value.length > 0 ? myOrderItems.value : undefined
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        emit('created');
        emit('close');
        toastStore.addToast("Group created successfully!", "success");
    } catch (error) {
        console.error("Failed to create group", error);
        const errorMsg = error.response?.data?.details || "Failed to create group. Please check inputs.";
        toastStore.addToast(errorMsg, "error");
    } finally {
        isLoading.value = false;
    }
};

const showPicker = (event) => {
    try {
        if (event.target.showPicker) {
            event.target.showPicker();
        }
    } catch (error) {}
};

onMounted(() => {
    userStore.getFriends();
});
</script>

<style scoped>
* { box-sizing: border-box; }
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal-card {
  background: white; width: 90%; max-width: 600px;
  height: 80vh; /* Fixed height to prevent resizing */
  border-radius: 15px; overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  border: 2px solid #999; color: #000;
  display: flex; flex-direction: column;
}
.modal-header {
  padding: 15px 20px; border-bottom: 2px solid #999;
  display: flex; justify-content: space-between; align-items: center;
  background: #fff; color: #000;
}
.modal-header h2 { margin: 0; font-weight: bold; }
.close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: #000; }
.modal-body { 
    padding: 20px; 
    flex: 1; /* Fill remaining height */
    overflow-y: auto; /* Scroll if content exceeds height */
    color: #000; 
}

/* Tabs */
.modal-tabs {
    display: flex; border-bottom: 2px solid #999; background: #f9f9f9;
}
.tab-btn {
    flex: 1; padding: 15px; background: none; border: none; font-weight: bold; color: #666;
    cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s;
}
.tab-btn.active { color: #ee4d2d; border-bottom-color: #ee4d2d; background: white; }
.tab-btn:hover:not(.active) { background: #eee; }

/* Content Areas */
.tab-content { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

/* Form Styles */
.form-group { margin-bottom: 20px; }
label { display: block; font-weight: bold; margin-bottom: 8px; color: #000; }
.input-field { width: 100%; padding: 10px; border: 2px solid #999; border-radius: 8px; font-size: 1rem; color: #000; background: #fff; }
.time-inputs { display: flex; gap: 15px; align-items: center; }
.time-inputs .input-field { flex: 1; min-width: 0; font-size: 0.9rem; padding: 8px; }

/* Members Section */
.members-container {
    display: flex; flex-wrap: wrap; gap: 10px; padding: 10px;
    border: 2px solid #999; border-radius: 8px; min-height: 50px;
    align-items: center; background: #fff;
}
.member-chip {
    display: flex; align-items: center; background: #f0f0f0;
    border-radius: 20px; padding: 5px 12px; font-size: 0.9rem; gap: 8px;
    border: 2px solid #999;
    color: #333;
}
.member-name { font-weight: 500; }
.creator-name { color: #ee4d2d; font-weight: bold; }
.remove-member-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; line-height: 1; color: #888; padding: 0; display: flex; align-items: center; }
.remove-member-btn:hover { color: #ff4d4d; }
.invite-btn {
    background: white; border: 2px solid #999; border-radius: 20px;
    padding: 5px 12px; cursor: pointer; font-size: 0.85rem; font-weight: bold; color: #000;
}
.invite-btn:hover { background: #f0f0f0; }
.dropdown-backdrop {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 50; cursor: default; background: transparent;
}
.friend-selection-list {
    margin-top: 10px; border: 2px solid #999; border-radius: 8px;
    max-height: 150px; overflow-y: auto; background: white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: relative; z-index: 51;
}
.friend-option { padding: 8px 15px; display: flex; align-items: center; gap: 10px; cursor: pointer; border-bottom: 2px solid #eee; }
.friend-option:hover { background-color: #f5f5f5; }
.friend-option.selected { background-color: #fff0eb; color: #ee4d2d; }
.friend-avatar-small { width: 24px; height: 24px; background: #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; color: #555; }
.check-mark { margin-left: auto; font-weight: bold; }
.no-friends-msg { padding: 15px; text-align: center; color: #666; font-size: 0.9rem; }

/* Menu Section */
.menu-section { margin-top: 25px; border-top: 2px solid #999; padding-top: 20px; }
.menu-table { border: 2px solid #999; border-radius: 8px; margin-bottom: 15px; overflow: hidden; background: #fff; }
.table-header, .table-row { display: grid; grid-template-columns: 2fr 1fr 0.5fr; padding: 10px; gap: 10px; align-items: center; }
.table-header { background: #eee; border-bottom: 2px solid #999; font-weight: bold; color: #000; }
.table-row { border-bottom: 2px solid #999; }
.table-row:last-child { border-bottom: none; }
.small { padding: 8px; border: 2px solid #999; }
.remove-btn { background: #ff4d4d; color: white; border: none; border-radius: 4px; cursor: pointer; height: 30px; width: 30px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.remove-btn:disabled { background: #ccc; cursor: not-allowed; opacity: 0.6; }
.add-btn { width: 100%; padding: 12px; background: #eee; border: 2px solid #999; border-radius: 8px; cursor: pointer; font-weight: bold; color: #000; }
.add-btn:hover { background: #ddd; }

/* Modal Footer */
.modal-footer {
    padding: 15px 20px; border-top: 2px solid #999; background: #fff; text-align: right;
}
.submit-btn { background: #ee4d2d; color: white; padding: 12px 30px; border: none; border-radius: 50px; font-weight: bold; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.submit-btn:hover:not(:disabled) { background: #d73211; }
.submit-btn:disabled { background: #ccc; cursor: not-allowed; }

/* My Order Styles */
.order-selection-area { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #999; }
.selection-row { display: flex; gap: 10px; margin-top: 10px; }
.qty-input { width: 80px; }
.add-order-btn { background: #333; color: white; border: none; border-radius: 8px; padding: 0 20px; cursor: pointer; font-weight: bold; }
.add-order-btn:disabled { background: #999; cursor: not-allowed; }

.my-order-list .order-table { margin-top: 10px; }
.order-table .table-header, .order-table .table-row { 
    grid-template-columns: 1fr 1fr 1fr 0.5fr !important; /* Equal width for first 3, smaller action */
    justify-items: center; /* Center content horizontally */
    align-items: center;   /* Center content vertically */
} 
.order-total { text-align: right; font-size: 1.2rem; font-weight: bold; margin-top: 10px; }

/* Qty Control Styles */
.qty-control {
    display: flex;
    align-items: center;
    gap: 5px;
}
.qty-btn {
    width: 25px;
    height: 25px;
    background: #e0e0e0;
    border: 1px solid #999;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
}
.qty-btn:hover { background: #d0d0d0; }
.qty-input-small {
    width: 40px;
    text-align: center;
    padding: 2px;
    border: 1px solid #999;
    border-radius: 4px;
}
.price { color: #ee4d2d; }
.empty-msg { padding: 20px; text-align: center; color: #999; grid-column: 1 / -1; }

/* Summary Table Enhancements */
.summary-table .table-header, .summary-table .table-row {
     display: grid;
     grid-template-columns: repeat(4, 1fr) !important; /* Force 4 columns equal width */
     align-items: center; /* Vertically center */
     gap: 10px;
}
.grand-total { font-size: 1.4rem; font-weight: bold; margin-top: 20px; text-align: right; border-top: 2px solid #999; padding-top: 15px; }
.summary-note { margin-top: 10px; font-style: italic; color: #666; text-align: right; font-size: 0.9rem; 
}
.ordered-by { font-size: 0.9rem; color: #555; }

/* --- Responsive Adjustments --- */
@media (max-width: 768px) {
    .modal-card {
        width: 95%;
        height: 90vh;
        max-width: none;
    }
    
    .modal-header {
        padding: 10px 15px;
    }
    
    .modal-header h2 {
        font-size: 1.2rem;
    }

    .modal-tabs {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    .tab-btn {
        padding: 12px 10px;
        font-size: 0.9rem;
        white-space: nowrap;
    }
    
    .time-inputs {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }
    
    .time-inputs .input-field {
        width: 100%;
    }
    
    .table-header, .table-row {
        gap: 5px;
        font-size: 0.9rem;
        padding: 8px 5px;
    }
    
    .member-chip {
        font-size: 0.8rem;
        padding: 4px 8px;
    }
    
    .order-selection-area .selection-row {
        flex-direction: column;
    }
    
    .order-selection-area .input-field,
    .order-selection-area .add-order-btn {
        width: 100%;
    }
}
</style>
