<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <!-- Tab Navigation -->
       <div class="tabs-nav" v-if="mode === 'detail' || mode === 'summary' || mode === 'order'">
          <button 
            :class="['tab-btn', { active: activeTab === 'settings' }]" 
            @click="activeTab = 'settings'"
            v-if="isCreator || mode === 'edit'"
          >
            Menu Settings
          </button>
           <!-- If not creator, they can see 'Menu Settings' but maybe we call it 'Menu' or specific requirements: -->
           <!-- Requirement: "Tab 1: Menu Settings... Others can only view" -->
           <button 
            :class="['tab-btn', { active: activeTab === 'settings' }]" 
            @click="activeTab = 'settings'"
            v-if="!isCreator && mode !== 'invite'"
          >
             Menu List
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
             <form @submit.prevent="handleSubmit">
                <div class="form-group">
                    <label>Group Name:</label>
                    <input 
                    v-model="form.title" 
                    type="text" 
                    required
                    class="input-field"
                    :disabled="!canEditSettings"
                    />
                </div>

                <div class="form-group">
                    <label>Time:</label>
                    <div class="time-inputs">
                        <input 
                            v-model="form.startTime" 
                            type="datetime-local" 
                            required 
                            class="input-field date-input"
                            :disabled="!canEditSettings"
                            @click="showPicker"
                        />
                        <span>to</span>
                        <input 
                            v-model="form.endTime" 
                            type="datetime-local" 
                            required 
                            class="input-field date-input"
                            :disabled="!canEditSettings"
                            @click="showPicker"
                        />
                    </div>
                </div>
                
                <div class="form-group members-section" ref="membersSection">
                    <label>Members:</label>
                    <div class="members-container">
                        <div v-for="userId in form.invitedUserIds" :key="userId" class="member-chip">
                            <span class="member-name">{{ getFriendName(userId) }}</span>
                            <button v-if="canEditSettings" type="button" class="remove-member-btn" @click="toggleFriend(userId)">×</button>
                        </div>

                        <button v-if="canEditSettings" type="button" class="invite-btn" @click="showFriendList = !showFriendList">
                            Invite +
                        </button>
                    </div>

                    <!-- Backdrop to close dropdown on click outside -->
                    <div v-if="showFriendList" class="dropdown-backdrop" @click="showFriendList = false"></div>

                    <div v-if="showFriendList" class="friend-selection-list">
                        <div v-if="userStore.friends.length === 0" class="no-friends-msg">
                            No friends to invite.
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
                            <span v-if="isEditing">Action</span>
                        </div>
                        <div v-for="(item, index) in form.products" :key="index" class="table-row">
                            <input v-model="item.name" type="text" placeholder="Item" required class="input-field small" :disabled="!canEditSettings" />
                            <input v-model.number="item.price" type="number" placeholder="$" required class="input-field small" :disabled="!canEditSettings" />
                            <button 
                                v-if="canEditSettings" 
                                type="button" 
                                @click="removeProduct(index)" 
                                class="remove-btn"
                                :disabled="isProductInUse(item.name)"
                                :title="isProductInUse(item.name) ? 'Cannot delete: Item is currently ordered by a member' : 'Remove Item'"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                    <button v-if="canEditSettings" type="button" @click="addProduct" class="add-btn">+ Add Item</button>
                </div>

                <div class="form-actions" v-if="canEditSettings">
                    <button type="submit" class="submit-btn" :disabled="isLoading">
                        {{ 
                            isLoading ? 'Saving...' : 
                            isSettingsSaved ? 'Saved!' :
                            isSettingsDirty ? 'Save Changes' : 'Up to date'
                        }}
                    </button>
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
                        <option v-for="(prod, idx) in form.products" :key="idx" :value="idx">
                            {{ prod.name }} (${{ prod.price }})
                        </option>
                    </select>
                    <input v-model.number="orderQuantity" type="number" min="1" class="input-field qty-input" placeholder="Qty" />
                    <button type="button" class="add-order-btn" @click="addToMyOrder" :disabled="selectedProductIndex === -1">Add</button>
                </div>
            </div>

            <div class="my-order-list">
                <!-- Label removed -->
                <div class="order-table">
                     <div class="table-header">
                        <span>Item</span>
                        <span>Qty</span>
                        <span>Subtotal</span>
                        <span>Action</span>
                    </div>
                    <div v-if="myOrderItems.length === 0" class="empty-msg">No items selected yet.</div>
                    <div v-for="(item, idx) in myOrderItems" :key="idx" class="table-row">
                        <span>{{ item.name }}</span>
                        <!-- Qty with - + controls -->
                        <div class="qty-control">
                            <button type="button" class="qty-btn" @click="decreaseQty(idx)">-</button>
                            <input 
                                v-model.number="item.quantity" 
                                type="text" 
                                class="qty-input-small" 
                                @change="handleQtyChange(idx)"
                            />
                            <button type="button" class="qty-btn" @click="increaseQty(idx)">+</button>
                        </div>
                        <span>${{ item.price * item.quantity }}</span>
                        <button type="button" class="remove-btn" @click="removeFromMyOrder(idx)">&times;</button>
                    </div>
                </div>
                <div class="order-total">
                    Total: <span class="price">${{ myOrderTotal }}</span>
                </div>

            </div>

            <div class="form-actions">
                <div class="last-updated" v-if="formattedLastUpdated">
                    Last updated: {{ formattedLastUpdated }}
                </div>
                <button type="button" class="submit-btn" :disabled="isOrderLoading" @click="submitOrder">
                    {{ 
                        isOrderLoading ? 'Saving...' : 
                        isSaved ? 'Saved!' :
                        isDirty ? 'Save Order' : 'Up to date'
                    }}
                </button>

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
                    </div>
                    <div v-for="(stat, idx) in groupStats" :key="idx" class="table-row">
                        <span>{{ stat.name }}</span>
                         <span>{{ stat.quantity }}</span>
                        <span>${{ stat.totalPrice }}</span>
                    </div>
                </div>
                 <div class="grand-total">
                    Grand Total: <span class="price">${{ grandTotal }}</span>
                </div>
             </div>
        </div>

      </div>
    </div>
    <!-- Loading overlay if fetching full details -->
    <div v-if="isLoadingSummary" class="loading-overlay">Loading details...</div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useUserStore } from '../stores/userStore';
import axios from 'axios';

const props = defineProps({
    group: { type: Object, required: true },
    mode: { type: String, default: 'detail' } // 'detail', 'edit', 'invite'
});
const emit = defineEmits(['close', 'updated']);
const authStore = useAuthStore();
const userStore = useUserStore();
const isLoading = ref(false);
const isOrderLoading = ref(false);
const isLoadingSummary = ref(false);
const showFriendList = ref(false);

const activeTab = ref(
    props.mode === 'summary' ? 'summary' : 
    props.mode === 'order' ? 'order' : 
    'settings'
); // settings, order, summary

// Form Data (Settings Tab)
const form = reactive({
    title: '',
    startTime: '',
    endTime: '',
    products: [],
    invitedUserIds: []
});
const originalForm = ref(null); 
const isSettingsSaved = ref(false);

// My Order Data
const selectedProductIndex = ref(-1);
const orderQuantity = ref(1);
const myOrderItems = ref([]);
const originalOrderItems = ref([]); // For Dirty Checking
const lastUpdatedTime = ref(null);

// Group Summary Data
const groupStats = ref([]);
const grandTotal = ref(0);
const allOrders = ref([]);


// Initialize data from props
watch(() => props.group, (newGroup) => {
    if (newGroup) {
        // 1. Settings Data
        form.title = newGroup.title;
        form.startTime = newGroup.startTime ? newGroup.startTime.slice(0, 16) : '';
        form.endTime = newGroup.endTime ? newGroup.endTime.slice(0, 16) : '';
        form.products = newGroup.products ? JSON.parse(JSON.stringify(newGroup.products)) : []; 
        form.invitedUserIds = newGroup.invitedUserIds ? [...newGroup.invitedUserIds] : [];
        
        // Save initial state for dirty checking
        originalForm.value = JSON.parse(JSON.stringify(form));

        // 2. My Order Data
        if (newGroup.myOrder && newGroup.myOrder.items) {
             const items = newGroup.myOrder.items.map(i => ({
                 name: i.name,
                 price: i.price,
                 quantity: i.quantity
             }));
             myOrderItems.value = JSON.parse(JSON.stringify(items));
             originalOrderItems.value = JSON.parse(JSON.stringify(items)); // Deep copy
             lastUpdatedTime.value = newGroup.myOrder.updatedAt;
        } else {
             myOrderItems.value = [];
             originalOrderItems.value = [];
             lastUpdatedTime.value = null;
        }

        // 3. Group Summary Data
        groupStats.value = newGroup.orderStats || [];
        grandTotal.value = newGroup.totalGroupAmount || 0;
        allOrders.value = newGroup.allOrders || [];
    }
}, { immediate: true });

// Ensure 'Menu Settings' is visible by default or based on role
// But we want to start on 'Settings' usually.
// If mode is edit/invite, 'settings' is forced by logic below implicitly? (Tabs hidden if not detail)
// Actually tabs are hidden if mode != 'detail'? 
// Wait: `v-if="mode === 'detail'"` on tabs-nav.
// If mode is 'edit' or 'invite', we are editing settings, so we should just show settings form. 
// AND hide tabs.
// Correct.

const isEditing = computed(() => props.mode === 'edit');
const isInviteMode = computed(() => props.mode === 'invite');
const isCreator = computed(() => props.group.isCreator);
const canEditSettings = computed(() => isCreator.value || isEditing.value || isInviteMode.value);

const isSettingsDirty = computed(() => {
    if (!originalForm.value) return false;
    return JSON.stringify(form) !== JSON.stringify(originalForm.value);
});

const modalTitle = computed(() => {
    if (props.mode === 'edit') return 'Edit Group';
    if (props.mode === 'invite') return 'Invite Members';
    return props.group.title || 'Group Details';
});

// --- Tab 2 Logic: My Order ---
// --- Tab 2 Logic: My Order ---
const addToMyOrder = () => {
    if (selectedProductIndex.value === -1) return;
    const product = form.products[selectedProductIndex.value];
    
    // Check if already exists, update qty if so
    const existing = myOrderItems.value.find(i => i.name === product.name && i.price === product.price);
    if (existing) {
        existing.quantity += orderQuantity.value;
    } else {
        myOrderItems.value.push({
            name: product.name,
            price: product.price,
            quantity: orderQuantity.value
        });
    }
    // Reset inputs
    selectedProductIndex.value = -1;
    orderQuantity.value = 1;

};

const removeFromMyOrder = (index) => {
    if (confirm("Are you sure you want to remove this item?")) {
        myOrderItems.value.splice(index, 1);
    }
};

const increaseQty = (index) => {
    myOrderItems.value[index].quantity++;
};

const decreaseQty = (index) => {
    if (myOrderItems.value[index].quantity > 1) {
        myOrderItems.value[index].quantity--;
    } else {
        // Notify user about deletion
        if (confirm("Quantity is 0. Do you want to remove this item?")) {
            myOrderItems.value.splice(index, 1);
        }
    }
};

const handleQtyChange = (index) => {
    const qty = myOrderItems.value[index].quantity;
    if (qty <= 0) {
        if (confirm("Quantity is 0. Do you want to remove this item?")) {
             myOrderItems.value.splice(index, 1);
        } else {
            myOrderItems.value[index].quantity = 1; // Reset to 1 if user cancels
        }
    }
};

// --- Dirty Checking Logic ---
const isDirty = computed(() => {
    if (myOrderItems.value.length !== originalOrderItems.value.length) return true;
    
    // Helper stringify comparison
    // Use sort to ensure order doesn't affect comparison (robustness)
    const sortFn = (a, b) => a.name.localeCompare(b.name);
    const sortedCurrent = [...myOrderItems.value].sort(sortFn);
    const sortedOriginal = [...originalOrderItems.value].sort(sortFn);
    
    return JSON.stringify(sortedCurrent) !== JSON.stringify(sortedOriginal);
});

const formattedLastUpdated = computed(() => {
    if (!lastUpdatedTime.value) return '';
    const date = new Date(lastUpdatedTime.value);
    return date.toLocaleString();
});

const handleOrderAction = () => {
    submitOrder();
};

const myOrderTotal = computed(() => {
    return myOrderItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Saved state for UI feedback
const isSaved = ref(false);

const submitOrder = async (showNotification = true) => {
    if (!isDirty.value) return; 
    isOrderLoading.value = true;
    isSaved.value = false;
    try {
        const token = authStore.token;
        const response = await axios.post('http://localhost:3001/api/orders', {
            groupId: props.group.id,
            items: myOrderItems.value
        }, {
             headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update local state with server response (metadata like updatedAt)
        if (response.data.order) {
            const serverOrder = response.data.order;
            lastUpdatedTime.value = serverOrder.updatedAt;
            
            // Sync local items with server response
            const newItems = serverOrder.items.map(i => ({
                name: i.name,
                price: i.price,
                quantity: i.quantity
            }));
            
            myOrderItems.value = JSON.parse(JSON.stringify(newItems));
            originalOrderItems.value = JSON.parse(JSON.stringify(newItems));
        }

        // Chain Reaction: Refresh group summary immediately
        await refreshGroupSummary(false); // false = do not overwrite myOrderItems again (we just saved it)
        
        // Show "Saved" state and Trigger Animation
        isSaved.value = true;
        
        setTimeout(() => isSaved.value = false, 3000);

        // Notify parent to update list (total price etc)
        // Note: Parent update might trigger prop change -> watch -> re-update local state.
        // This is acceptable for consistency.
        emit('updated'); 

    } catch (error) {
        console.error("Order submit failed", error);
        alert("Failed to update order. Please try again.");
    } finally {
        isOrderLoading.value = false;
    }
};



// --- Tab 3 Logic: Group Summary ---
// Need to aggregate stats from ALL orders.
// `props.group` does NOT contain all orders in the current dashboard response!
// `getDashboardGroups` returns `orders` but maps them to `participants` string.
// Wait, `getDashboardGroups` response structure: 
// { ..., myOrder: {...}, participants: [...], totalGroupAmount: ... }
// It DOES NOT pass the full list of orders to the frontend.
// I need the Full Orders list for the Summary Tab.
// Option A: Update Backend `getDashboardGroups` to include `orders` summary list.
// Option B: Fetch single group details on open?
// Given `GroupDetailModal` logic, `group` prop comes from dashboard list.
// The dashboard list (from `groupController.js`) returns:
// `invites`, `products`, `myOrder`, `totalGroupAmount`.
// But `orders` are processed into `participants` and `totalGroupAmount`.
// Missing: Breakdown of items bought by everyone.
//
// I should update `groupController.js` to return `stats` or `allOrders`.
// Let's implement client-side assuming data exists, but I know it's missing.
// I MUST fetch updated data or update the backend controller.
// Since I already verified `groupController.js`, I know it doesn't send item breakdown.
//
// Let's calculate stats from `props.group` if data were there, 
// BUT realized I need to fix the backend controller first? 
// Or I can add a quick `stats` field in the controller response now?
//
// Actually, I am already in the middle of frontend edit.
// I will add the logic here expecting `props.group.stats` or similar, 
// AND THEN I will update the backend controller in the next step to provide it.
//
// Let's assume `props.group.orderStats` is an array of { name, quantity, totalPrice }.
//



// ... (Existing Functions: showPicker, addProduct, removeProduct, etc.) ...
const showPicker = (event) => {
    try {
        if (event.target.showPicker) {
            event.target.showPicker();
        }
    } catch (error) {}
};

const isProductInUse = (productName) => {
    if (!productName || !allOrders.value || allOrders.value.length === 0) return false;
    // Check if any order contains an item with this name
    return allOrders.value.some(order => 
        order.items && order.items.some(item => item.name === productName)
    );
};

const addProduct = () => {
    form.products.push({ name: '', price: null });
};

const removeProduct = (index) => {
    const product = form.products[index];
    if (isProductInUse(product.name)) {
        alert(`Cannot delete "${product.name}" because it is currently included in an order.`);
        return;
    }
    if (form.products.length > 1) {
        form.products.splice(index, 1);
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
    return friend ? friend.name : id; 
};

const handleSubmit = async () => {
    if (!isSettingsDirty.value) return;
    
    isLoading.value = true;
    isSettingsSaved.value = false;
    try {
        const token = authStore.token;
        const response = await axios.put(`http://localhost:3001/api/groups/${props.group.id}`, {
            title: form.title,
            startTime: new Date(form.startTime).toISOString(),
            endTime: new Date(form.endTime).toISOString(),
            products: form.products.map(p => ({
                id: p.id, 
                name: p.name,
                price: Number(p.price)
            })),
            invitedUserIds: form.invitedUserIds
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Sync products from server response (to get new IDs)
        if (response.data.products) {
            form.products = JSON.parse(JSON.stringify(response.data.products));
        }

        emit('updated');
        
        // Update originalForm with the synced data
        originalForm.value = JSON.parse(JSON.stringify(form));
        
        isSettingsSaved.value = true;
        setTimeout(() => isSettingsSaved.value = false, 3000);
        
        // emit('close'); // Don't close, allow continued editing
    } catch (error) {
        console.error("Failed to update group", error);
        alert("Failed to update group.");
    } finally {
        isLoading.value = false;
    }
};

// Refresh group summary data from server
const refreshGroupSummary = async (updateLocalOrder = true) => {
    try {
        const token = authStore.token;
        const response = await axios.get(`http://localhost:3001/api/orders/group/${props.group.id}/summary`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const summaryData = response.data;
        
        // Update group summary data
        groupStats.value = summaryData.orderStats || [];
        grandTotal.value = summaryData.totalGroupAmount || 0;
        allOrders.value = summaryData.allOrders || [];
        
        // Update my order data
        if (updateLocalOrder) {
            if (summaryData.myOrder) {
                const serverItems = summaryData.myOrder.items.map(i => ({
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity
                }));
                
                // Only update if server data is different from current local data
                const currentItemsStr = JSON.stringify(myOrderItems.value.sort((a, b) => a.name.localeCompare(b.name)));
                const serverItemsStr = JSON.stringify(serverItems.sort((a, b) => a.name.localeCompare(b.name)));
                
                if (currentItemsStr !== serverItemsStr) {
                    myOrderItems.value = JSON.parse(JSON.stringify(serverItems));
                    originalOrderItems.value = JSON.parse(JSON.stringify(serverItems));
                }
                
                lastUpdatedTime.value = summaryData.myOrder.updatedAt;
            } else {
                // If no order exists on server (or it was deleted), clear local data
                // But only if we are not currently editing (dirty check?)
                // Actually, if we are fetching summary, we usually want to trust server state 
                // OR we should be careful if user has unsaved changes.
                // Since this function is called on load or after save, it's safer to respect server.
                // But if auto-save is pending?
                
                // For "load on open", we definitely want to reset to empty if server says empty.
                if (myOrderItems.value.length > 0 && !isDirty.value) {
                     myOrderItems.value = [];
                     originalOrderItems.value = [];
                     lastUpdatedTime.value = null;
                } else if (myOrderItems.value.length === 0) {
                     // Already empty, just sync metadata
                     originalOrderItems.value = [];
                     lastUpdatedTime.value = null;
                }
            }
        }
        
    } catch (error) {
        console.error('Failed to refresh group summary:', error);
    } finally {
        isLoadingSummary.value = false;
    }
};

onMounted(() => {
    // We need full order details (allOrders) to perform validation like "isProductInUse".
    // The prop 'group' from dashboard only has limited info.
    refreshGroupSummary(false);
});

// Auto-refresh summary when switching to summary tab
watch(activeTab, (newTab) => {
    if (newTab === 'summary' || newTab === 'order') {
        refreshGroupSummary();
    }
});

onMounted(() => {
    userStore.getFriends();
    // Load initial group summary data
    if (props.mode === 'detail') {
        refreshGroupSummary();
    }
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
.tabs-nav {
    display: flex;
    border-bottom: 2px solid #999; /* The "Folder" line */
    padding: 0 20px; /* Side padding */
    gap: 5px; /* Space between tabs */
    background: #f0f0f0; /* Tab bar background */
    padding-top: 10px;
}

.tab-btn {
    padding: 10px 20px;
    background: #e0e0e0;
    border: 2px solid transparent; /* Invisible border by default to keep size */
    border-bottom: none;
    border-radius: 10px 10px 0 0;
    cursor: pointer;
    font-weight: bold;
    color: #666;
    position: relative;
    top: 2px; /* Push down to overlap the container border */
    transition: all 0.2s;
}

.tab-btn.active {
    background: white;
    color: #ee4d2d;
    border: 2px solid #999; /* Active border */
    border-bottom: 2px solid white; /* White bottom to merge with content */
    z-index: 5; /* Ensure it covers the line */
}

.tab-btn:hover:not(.active) {
    background: #dcdcdc;
    color: #333;
}

/* Content Areas */
.tab-content { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

/* Form Styles */
.form-group { margin-bottom: 20px; }
label { display: block; font-weight: bold; margin-bottom: 8px; color: #000; }
.input-field { width: 100%; padding: 10px; border: 2px solid #999; border-radius: 8px; font-size: 1rem; color: #000; background: #fff; }
.input-field:disabled { background: #f0f0f0; border-color: #999; }
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
.add-btn { width: 100%; padding: 12px; background: #eee; border: 2px solid #999; border-radius: 8px; cursor: pointer; font-weight: bold; color: #000; }
.add-btn:hover { background: #ddd; }
.form-actions { 
    margin-top: 25px; 
    display: flex; 
    justify-content: flex-end; 
    align-items: center; 
    gap: 15px; 
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
.order-table .table-header, .order-table .table-row { grid-template-columns: 2fr 1.5fr 1fr 0.5fr; } /* Adjusted for control width */
.order-total { text-align: right; font-size: 1.2rem; font-weight: bold; margin-top: 10px; }

/* Qty Control Styles */
.qty-control {
    display: flex;
    align-items: center;
    gap: 5px;
}
.last-updated {
    font-size: 0.85rem;
    color: #888;
    font-style: italic;
    /* Removed text-align right and margin top since it's now flex item */
}

.auto-save-indicator {
    font-size: 0.8rem;
    color: #007bff;
    margin-top: 5px;
    font-style: italic;
    text-align: center;
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

/* Summary Styles */
.summary-table .table-header, .summary-table .table-row { grid-template-columns: 2fr 1fr 1fr; }
.grand-total { font-size: 1.4rem; font-weight: bold; margin-top: 20px; text-align: right; border-top: 2px solid #999; padding-top: 15px; }

/* Animations */

</style>
