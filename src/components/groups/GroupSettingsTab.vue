<template>
    <div class="tab-content">
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
                <div class="time-label-row">
                    <label>Time:</label>
                    <div class="status-control" v-if="mode !== 'create'">
                        <button 
                            v-if="isCreator" 
                            type="button" 
                            class="status-toggle-pill-dashboard"
                            :class="{ 'open': localStatus === 'OPEN', 'closed': localStatus === 'CLOSED' }"
                            @click="toggleGroupStatus"
                            :disabled="isStatusUpdating"
                            title="Click to toggle status"
                        >
                            {{ localStatus === 'OPEN' ? 'OPEN' : 'CLOSED' }}
                        </button>
                        <span 
                            v-else
                            class="status-toggle-pill-dashboard" 
                            :class="{ 'open': localStatus === 'OPEN', 'closed': localStatus === 'CLOSED' }"
                            style="cursor: default;"
                        >
                            {{ localStatus === 'OPEN' ? 'OPEN' : 'CLOSED' }}
                        </span>
                    </div>
                </div>
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

            <!-- Members Management Section -->
            <div class="form-group members-section" ref="membersSection">
                <label>Members:</label>
                <div class="members-container">
                    <div v-for="userId in form.invitedUserIds" :key="userId" class="member-chip">
                        <span class="member-name" :class="{ 'creator-name': group.creatorId && userId === group.creatorId }">
                            {{ getFriendName(userId) }}
                        </span>
                        <button v-if="canEditSettings && !(group.creatorId && userId === group.creatorId)" type="button" class="remove-member-btn" @click="toggleFriend(userId)">×</button>
                    </div>

                    <button v-if="canEditSettings" type="button" class="invite-btn" @click="showFriendList = !showFriendList">
                        Invite +
                    </button>
                </div>

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

            <!-- Menu Items Section -->
            <div class="menu-section">
                <label>Menu (Items & Prices)</label>
                <div class="menu-table">
                    <div class="table-header">
                        <span>Item Name</span>
                        <span>Price</span>
                        <span v-if="canEditSettings">Action</span>
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
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useUserStore } from '../../stores/userStore';
import { useToastStore } from '../../stores/toastStore';
import axios from 'axios';

const props = defineProps({
    group: { type: Object, required: true },
    mode: { type: String, default: 'detail' },
    allOrders: { type: Array, default: () => [] }
});

const emit = defineEmits(['updated']);

const authStore = useAuthStore();
const userStore = useUserStore();
const toastStore = useToastStore();

const isLoading = ref(false);
const isSettingsSaved = ref(false);
const showFriendList = ref(false);
const isStatusUpdating = ref(false);

const localStatus = ref(props.group.status);
watch(() => props.group.status, (newVal) => { localStatus.value = newVal; });

const form = reactive({
    title: '',
    startTime: '',
    endTime: '',
    products: [],
    invitedUserIds: []
});
const originalForm = ref(null);

watch(() => props.group, (newGroup) => {
    if (newGroup) {
        form.title = newGroup.title || '';
        form.startTime = newGroup.startTime ? newGroup.startTime.slice(0, 16) : '';
        form.endTime = newGroup.endTime ? newGroup.endTime.slice(0, 16) : '';
        form.products = newGroup.products ? JSON.parse(JSON.stringify(newGroup.products)) : [];
        form.invitedUserIds = newGroup.invitedUserIds ? [...newGroup.invitedUserIds] : [];
        originalForm.value = JSON.parse(JSON.stringify(form));
    }
}, { immediate: true });

const isEditing = computed(() => props.mode === 'edit');
const isInviteMode = computed(() => props.mode === 'invite');
const isCreator = computed(() => props.group.isCreator);
const canEditSettings = computed(() => isCreator.value || isEditing.value || isInviteMode.value);

const isSettingsDirty = computed(() => {
    if (!originalForm.value) return false;
    return JSON.stringify(form) !== JSON.stringify(originalForm.value);
});

const showPicker = (event) => {
    try {
        if (event.target.showPicker) event.target.showPicker();
    } catch {}
};

const toggleGroupStatus = async () => {
    if (isStatusUpdating.value) return;
    const oldStatus = localStatus.value;
    const newStatus = oldStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    const action = newStatus === 'CLOSED' ? 'CLOSE' : 'OPEN';
    
    if (!await toastStore.showConfirm(`${action} Group`, `Are you sure you want to ${action} this group?`)) return;

    isStatusUpdating.value = true;
    localStatus.value = newStatus;

    try {
        await axios.put(`/api/groups/${props.group.id}/status`, { status: newStatus }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        toastStore.addToast(`Group is now ${newStatus}`, 'success');
        emit('updated');
    } catch (error) {
        localStatus.value = oldStatus;
        toastStore.addToast("Failed to update status", 'error');
    } finally {
        isStatusUpdating.value = false;
    }
};

const getFriendName = (id) => {
    if (id === userStore.user?.id) return `${userStore.user.name} (Me)`;
    if (props.group.creatorId && id === props.group.creatorId) return `${props.group.creator?.name || 'Host'} (Host)`;

    const friend = userStore.friends.find(f => f.id === id);
    if (friend) return friend.name;

    // Check invites from group if available
    if (props.group.invites) {
        const invite = props.group.invites.find(i => i.userId === id);
        if (invite && invite.name) return invite.name;
    }

    // Check allOrders for name resolution
    if (props.allOrders) {
        const order = props.allOrders.find(o => o.userId === id);
        if (order && order.user) return order.user.name;
    }
    
    return `User ${id}`;
};

const toggleFriend = (friendId) => {
    const index = form.invitedUserIds.indexOf(friendId);
    if (index === -1) form.invitedUserIds.push(friendId);
    else form.invitedUserIds.splice(index, 1);
};

const isProductInUse = (productName) => {
    if (!productName || !props.allOrders || props.allOrders.length === 0) return false;
    return props.allOrders.some(order => 
        order.items && order.items.some(item => item.name === productName)
    );
};

const addProduct = () => {
    form.products.push({ name: '', price: null });
};

const removeProduct = async (index) => {
    const product = form.products[index];
    if (isProductInUse(product.name)) {
        toastStore.addToast(`Cannot delete "${product.name}" because it is currently included in an order.`, 'error');
        return;
    }
    
    if (await toastStore.showConfirm("Delete Item", `Delete "${product.name || 'item'}"?`)) {
        form.products.splice(index, 1);
        await handleSubmit(); // Auto-save on delete
        toastStore.addToast("Item deleted", "success");
    }
};

const handleSubmit = async () => {
    if (!isSettingsDirty.value) return;
    isLoading.value = true;
    isSettingsSaved.value = false;

    try {
        const response = await axios.put(`/api/groups/${props.group.id}`, {
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
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.products) {
            form.products = JSON.parse(JSON.stringify(response.data.products));
        }
        originalForm.value = JSON.parse(JSON.stringify(form));
        emit('updated');
        isSettingsSaved.value = true;
        setTimeout(() => isSettingsSaved.value = false, 3000);
    } catch (error) {
        console.error(error);
        toastStore.addToast("Failed to update group.", "error");
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
/* Copy relevant styles from GroupDetailModal.css or common styles */
/* Assuming parent styles apply or scoped here if specific */
.tab-content { padding: 20px; }
.input-field { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 5px; }
.form-group { margin-bottom: 20px; }
.time-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.status-toggle-pill-dashboard { padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.8rem; border: none; cursor: pointer; }
.status-toggle-pill-dashboard.open { background: #e6fcf5; color: #0ca678; }
.status-toggle-pill-dashboard.closed { background: #f1f3f5; color: #868e96; }
.time-inputs { display: flex; align-items: center; gap: 10px; }
.date-input { width: 45%; }
.members-container { display: flex; flex-wrap: wrap; gap: 8px; border: 1px solid #eee; padding: 10px; border-radius: 6px; min-height: 50px; }
.member-chip { display: flex; align-items: center; background: #f8f9fa; padding: 5px 10px; border-radius: 20px; font-size: 0.9rem; }
.remove-member-btn { background: none; border: none; font-size: 1.2rem; margin-left: 5px; cursor: pointer; color: #999; }
.invite-btn { padding: 5px 12px; background: #e7f5ff; color: #1c7ed6; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9rem; }
.menu-table { display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; }
.table-header, .table-row { display: grid; grid-template-columns: 2fr 1fr 0.5fr; gap: 10px; align-items: center; }
.table-header { font-weight: bold; padding-bottom: 5px; border-bottom: 2px solid #eee; }
.table-row { border-bottom: 1px solid #f1f3f5; padding: 8px 0; }
.add-btn { width: 100%; padding: 10px; border: 2px dashed #ddd; background: none; border-radius: 6px; color: #666; cursor: pointer; margin-top: 5px; }
.submit-btn { width: 100%; padding: 12px; background: #228be6; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
.submit-btn:disabled { background: #a5d8ff; cursor: not-allowed; }
.friend-selection-list { position: absolute; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 250px; max-height: 200px; overflow-y: auto; z-index: 1001; }
.friend-option { padding: 8px 12px; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.friend-option:hover { background: #f8f9fa; }
.friend-option.selected { background: #e7f5ff; }
.dropdown-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; }
</style>
