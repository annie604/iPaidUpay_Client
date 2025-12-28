<template>
  <div class="page-wrapper">
    <Navbar />

    <div class="dashboard-container">
      <div class="action-card">
        <button class="create-btn" @click="openCreateModal">
          <span class="plus-icon">+</span> 發起新團購 (Create Group)
        </button>
      </div>

      <CreateGroupModal 
        v-if="isCreateModalOpen" 
        @close="isCreateModalOpen = false" 
        @created="handleGroupCreated"
      />

      <div v-if="loading" class="loading-state">Loading groups...</div>
      <div v-else-if="error" class="error-state">{{ error }}</div>

      <div v-else class="group-list">
        <div v-for="group in groups" :key="group.id" class="group-card">
          
          <div class="card-header">
            <h3 class="group-title">{{ group.title }}</h3>
            
            <div class="menu-container">
              <button class="menu-dots" @click="toggleMenu(group.id)">⋮</button>
              
              <div v-if="activeMenuId === group.id" class="dropdown-menu">
                  <div class="menu-item" @click="openModal(group, 'detail')">View Detail</div>
                  <div 
                    class="menu-item delete" 
                    :class="{ 'disabled': !group.isCreator }"
                    @click="group.isCreator ? deleteGroup(group.id) : null"
                  >
                    Delete
                  </div>
              </div>
            </div>
          </div>

          <div class="card-body" @click="openModal(group, 'detail')">
            <div class="info-row time-row">
              <span class="label">Time:</span>
              <div class="time-content">
                  <span class="value">{{ group.timeRange }}</span>
                  
                  <!-- Dashboard Status Toggle -->
                   <button 
                      v-if="group.isCreator" 
                      type="button" 
                      class="status-toggle-pill-dashboard"
                      :class="{ 'open': group.status === 'OPEN', 'closed': group.status === 'CLOSED' }"
                      @click.stop="toggleGroupStatus(group)"
                      title="Click to toggle status"
                  >
                      {{ group.status === 'OPEN' ? 'OPEN' : 'CLOSED' }}
                  </button>
                  <span 
                      v-else
                      class="status-toggle-pill-dashboard" 
                      :class="{ 'open': group.status === 'OPEN', 'closed': group.status === 'CLOSED' }"
                      style="cursor: default;"
                  >
                      {{ group.status === 'OPEN' ? 'OPEN' : 'CLOSED' }}
                  </span>
              </div>
            </div>
            <div class="info-row">
              <span class="label">Creator:</span>
              <span class="value highlight">{{ group.creator }}</span>
            </div>
            <div class="info-row">
              <span class="label">With:</span>
              <span class="value">{{ group.participants.join(', ') }}</span>
            </div>
            <div class="order-summary" @click.stop="openModal(group, 'order')">
              <p>{{ group.itemsSummary }}</p>
              <span class="more-link">more...</span>
            </div>

            <div class="info-row price-row" @click.stop="openModal(group, 'summary')">
              <span class="label">Total Price:</span>
              <span class="price-tag">${{ group.price }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="groups.length === 0" class="empty-state">
           No groups found. Create one!
        </div>
      </div>
      
      <!-- Group Detail/Edit/Invite Modal -->
      <GroupDetailModal 
          v-if="selectedGroup"
          :group="selectedGroup"
          :mode="detailMode"
          @close="selectedGroup = null"
          @updated="handleGroupUpdated"
      />

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';
import CreateGroupModal from '../components/CreateGroupModal.vue';
import GroupDetailModal from '../components/GroupDetailModal.vue';
import Navbar from '../components/Navbar.vue';
import { useToastStore } from '../stores/toastStore';

const toastStore = useToastStore();

const authStore = useAuthStore();
const router = useRouter();
const groups = ref([]);
const loading = ref(true);
const error = ref(null);
const activeMenuId = ref(null);

// Modal state
const selectedGroup = ref(null);
const detailMode = ref('detail'); // 'detail', 'edit', 'invite'

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  // Format: YYYY/MM/DD HH:mm
  return `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const toggleMenu = (id) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null;
  } else {
    activeMenuId.value = id;
  }
};

// Close menu when clicking outside
const closeMenu = (e) => {
    if (!e.target.closest('.menu-container')) {
        activeMenuId.value = null;
    }
};

const isCreateModalOpen = ref(false);

const openCreateModal = () => {
  isCreateModalOpen.value = true;
};

const handleGroupCreated = () => {
    fetchGroups(); // Refresh list
};

const openModal = (group, mode) => {
    // We might need to fetch full group details here if 'group' from list is summary only.
    // However, existing list seems to have enough for now?
    // Let's rely on what we have, or fetch if needed. Use what we have for now.
    // Ideally we should clone it to avoid mutating the list directly before save.
    // The modal handles copying.
    selectedGroup.value = group;
    detailMode.value = mode;
    activeMenuId.value = null; // Close menu
};

const handleGroupUpdated = async () => {
    // Store ID before fetch
    const currentId = selectedGroup.value?.id;
    await fetchGroups();
    
    // Update selectedGroup with the fresh data from the new groups list
    if (currentId) {
        const updatedGroup = groups.value.find(g => g.id === currentId);
        if (updatedGroup) {
            selectedGroup.value = updatedGroup;
        }
    }
};

const deleteGroup = async (groupId) => {
    const confirmed = await toastStore.showConfirm(
        "Delete Group", 
        "Are you sure you want to delete this group? This will permanently remove all data from the database."
    );
    if (!confirmed) return;
    
    try {
        const token = authStore.token;
        await axios.delete(`/api/groups/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toastStore.addToast("Group deleted successfully", "success");
        fetchGroups();
    } catch (err) {
        console.error("Failed to delete group", err);
        const errorMsg = err.response?.data?.error || "Failed to delete group.";
        toastStore.addToast(errorMsg, "error");
    }
    activeMenuId.value = null;
};

const toggleGroupStatus = async (group) => {
    if (!group) return;
    
    const newStatus = group.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    
    // Quick confirm for Closing (optional, but good for consistency)
    // Confirm Change
    const action = newStatus === 'CLOSED' ? 'CLOSE' : 'OPEN';
    const message = newStatus === 'CLOSED' 
        ? `Are you sure you want to CLOSE "${group.title}"?`
        : `Are you sure you want to OPEN "${group.title}"?`;

    const confirmed = await toastStore.showConfirm(`${action} Group`, message);
    if (!confirmed) return;

    try {
        const token = authStore.token;
        // Optimistic Update
        const oldStatus = group.status;
        group.status = newStatus;

        await axios.put(`/api/groups/${group.id}/status`, {
             status: newStatus
        }, {
             headers: { Authorization: `Bearer ${token}` }
        });

        toastStore.addToast(`Group is now ${newStatus}`, 'success');
        
        // No need to fetchGroups if we trust the update, but to be safe/sync:
        // fetchGroups(); 
    } catch (error) {
        console.error("Failed to update status", error);
        // Revert on error
        group.status = group.status === 'OPEN' ? 'CLOSED' : 'OPEN'; 
        toastStore.addToast("Failed to update status", 'error');
    }
};

// Logout logic moved to Navbar

const fetchGroups = async () => {
    try {
        const token = authStore.token;
        if (!token) {
            router.push('/login');
            return;
        }

        const response = await axios.get('/api/groups', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        // Transform backend data to match UI expectations
        groups.value = response.data.map(g => ({
            id: g.id,
            title: g.title,
            status: g.status, // Ensure status is mapped
            startTime: g.startTime, // Keep original ISO for editing
            endTime: g.endTime,     // Keep original ISO for editing
            timeRange: `${formatTime(g.startTime)} - ${formatTime(g.endTime)}`,
            creator: g.creator.name,
            creatorId: g.creator.id, // Pass ID for modal logic
            ownerId: g.ownerId, // Need this for permission check if isCreator not enough
            isCreator: g.isCreator,
            invites: g.invites || [], // raw invites if available
            invitedUserIds: g.invites ? g.invites.map(i => i.userId) : [], // extracting IDs
            // Filter out creator from participants list for display
            participants: (g.participants || []).filter(p => p !== g.creator.name),
            price: g.totalGroupAmount,
            itemsSummary: (g.myOrder && g.myOrder.itemsSummary) ? g.myOrder.itemsSummary : 'You haven\'t ordered yet',
            myOrder: g.myOrder, // Pass full myOrder object to modal
            orderStats: g.orderStats || [],
            products: g.products || []
        }));

    } catch (err) {
        console.error(err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            authStore.logout();
            router.push('/login');
            return;
        }
        error.value = "Failed to load groups.";
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchGroups();
    document.addEventListener('click', closeMenu);
});

onUnmounted(() => {
    document.removeEventListener('click', closeMenu);
});
</script>

<style scoped>
/* --- 1. 全域與結構 (沿用 Login 風格) --- */
* {
  box-sizing: border-box;
}

.page-wrapper {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f5f5f5; /* 統一背景色 */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navbar styles moved to Navbar component */

/* --- 3. 儀表板容器 --- */
.dashboard-container {
  width: 100%;
  max-width: 800px; /* 限制最大寬度，讓卡片不要太寬 */
  margin: 30px auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px; /* Increased from 20px */
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* --- 4. 建立按鈕區塊 (Action Card) --- */
.action-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  text-align: center;
}

.create-btn {
  background-color: #ee4d2d;
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 50px; /* 圓形按鈕 */
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(238, 77, 45, 0.3); /* 按鈕發光感 */
  transition: transform 0.1s;
  width: 100%;
  max-width: 400px;
}

.create-btn:hover {
  background-color: #d73211;
  transform: translateY(-2px);
}

/* --- 5. 團購卡片 (Group Card) --- */
.group-card {
  background: white;
  border-radius: 8px; /* 圓角 */
  box-shadow: 0 4px 15px rgba(0,0,0,0.05); /* 柔和陰影 */
  padding: 20px 30px;
  position: relative;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.group-card:hover {
  border-color: #ee4d2d; /* 滑鼠移過去會有品牌色框框 */
}

.card-body {
    cursor: pointer;
}

.info-row.price-row {
    cursor: pointer;
    transition: background-color 0.2s;
    border-radius: 4px;
    padding: 2px 5px;
    margin-left: -5px; /* Alignment compensation for padding */
}
.info-row.price-row:hover {
    background-color: #f0f0f0;
}

/* 卡片標題區 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.group-title {
  margin: 0;
  font-size: 1.4rem;
  color: #333;
}

/* 卡片內容區 */
.info-row {
  display: flex;
  margin-bottom: 12px;
  color: #555;
  font-size: 0.95rem;
}

.label {
  font-weight: bold;
  width: 100px; /* Increased width */
  min-width: 100px; /* Ensure min width */
  color: #888;
  white-space: nowrap; /* Prevent wrapping */
}

.highlight {
  color: #ee4d2d;
  font-weight: bold;
}

.price-row {
  margin-top: 20px; /* Increase spacing */
  align-items: center;
}

.price-tag {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

/* 訂單摘要小方塊 */
.order-summary {
  background-color: #f9f9f9; /* 淺灰背景 */
  border-radius: 6px;
  padding: 10px 15px;
  margin-top: 15px;
  font-size: 0.9rem;
  color: #444;
  border-left: 4px solid #ee4d2d; /* 左側橘色線條裝飾 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.order-summary:hover {
  background-color: #f0f0f0;
}

.more-link {
  color: #999;
  font-size: 0.8rem;
  cursor: pointer;
}

/* --- 6. 選單樣式 (Menu) --- */
.menu-container {
  position: relative;
}

.menu-dots {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0 10px;
}

.menu-dots:hover {
  color: #333;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 30px;
  background: white;
  border: 1px solid #eee;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-radius: 4px;
  width: 120px;
  z-index: 10;
  overflow: hidden;
}

.menu-item {
  padding: 10px 15px;
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  transition: background 0.1s;
}

.menu-item:hover {
  background-color: #f5f5f5;
  color: #ee4d2d;
}

.menu-item.delete {
  border-top: 1px solid #eee;
  color: #d73211;
}

.menu-item.disabled {
    color: #ccc;
    cursor: not-allowed;
    background-color: #f9f9f9;
}
.menu-item.disabled:hover {
    color: #ccc;
    background-color: #f9f9f9;
}

.loading-state, .error-state, .empty-state {
    text-align: center;
    padding: 30px;
    color: #666;
}
.error-state {
    color: #ee4d2d;
}

/* --- Responsive Adjustments --- */
@media (max-width: 768px) {
  .dashboard-container {
      margin: 20px auto;
      padding: 0 15px;
      gap: 20px;
  }
  
  .group-card {
      padding: 15px 20px;
  }
  
  .card-header {
      flex-direction: row;
      align-items: center;
  }
  
  .group-title {
      font-size: 1.2rem;
  }
  
  .label {
      width: 80px; 
      min-width: 80px;
      font-size: 0.9rem;
  }
  
  .value, .price-tag {
      font-size: 0.95rem;
  }
  
  .create-btn {
      padding: 10px 20px;
      font-size: 1rem;
  }
}
/* Dashboard Status Styles */
.time-row {
    align-items: flex-start; /* For multi-line time */
}
.time-content {
    display: flex;
    flex-direction: column; /* Stack time and button on mobile if needed, or row? User said "behind time". */
    /* Let's Try Row layout with wrap */
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap; 
    gap: 10px;
}

.status-toggle-pill-dashboard {
    padding: 2px 10px;
    border: none;
    border-radius: 15px; /* Pill shape */
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: bold;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    white-space: nowrap;
}
.status-toggle-pill-dashboard.open {
    background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;
}
.status-toggle-pill-dashboard.open:hover {
    background-color: #c3e6cb;
}
.status-toggle-pill-dashboard.closed {
    background-color: #e2e3e5; color: #383d41; border: 1px solid #d6d8db;
}
.status-toggle-pill-dashboard.closed:hover {
    background-color: #d6d8db;
}

.status-badge-dashboard {
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.8rem;
}
.status-badge-dashboard.open { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.status-badge-dashboard.closed { background-color: #e2e3e5; color: #383d41; border: 1px solid #d6d8db; }

</style>
