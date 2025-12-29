<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <!-- Tab Navigation -->
       <div class="modal-tabs" v-if="mode === 'detail' || mode === 'summary' || mode === 'order'">
          <button 
            :class="['tab-btn', { active: activeTab === 'settings' }]" 
            @click="activeTab = 'settings'"
            v-if="isCreator || mode === 'edit'"
          >
            Menu Settings
          </button>
           
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

          <button 
            :class="['tab-btn', { active: activeTab === 'payments' }]" 
            @click="activeTab = 'payments'"
          >
             Payments
          </button>
       </div>
      
      <div class="modal-body">
        
        <!-- Tab 1: Settings / Menu -->
        <div v-show="activeTab === 'settings'">
            <GroupSettingsTab 
                :group="fullGroupData" 
                :mode="mode" 
                :allOrders="allOrders"
                @updated="handleChildUpdate"
            />
        </div>

        <!-- Tab 2: My Order -->
        <div v-show="activeTab === 'order'">
            <GroupOrderTab 
                :groupId="group.id" 
                :products="fullGroupData.products" 
                :initialOrder="fullGroupData.myOrder"
                :isLocked="fullGroupData.status === 'CLOSED'"
                @updated="handleChildUpdate"
            />
        </div>

        <!-- Tab 3: Group Summary -->
        <div v-show="activeTab === 'summary'">
            <GroupSummaryTab 
                :detailedGroupStats="detailedGroupStats" 
                :grandTotal="grandTotal" 
            />
        </div>

        <!-- Tab 4: Payments -->
        <div v-show="activeTab === 'payments'">
            <GroupPaymentsTab 
                :orders="allOrders" 
                :isCreator="isCreator" 
                :creatorId="fullGroupData.creatorId || 0"
                :grandTotal="grandTotal"
                :totalCollected="totalCollected"
                @updated="handleChildUpdate"
            />
        </div>

      </div>
    </div>
    
    <div v-if="isLoadingSummary" class="loading-overlay">Loading details...</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

// Subcomponents
import GroupSettingsTab from './groups/GroupSettingsTab.vue';
import GroupOrderTab from './groups/GroupOrderTab.vue';
import GroupSummaryTab from './groups/GroupSummaryTab.vue';
import GroupPaymentsTab from './groups/GroupPaymentsTab.vue';

const props = defineProps({
    group: { type: Object, required: true },
    mode: { type: String, default: 'detail' }
});

const emit = defineEmits(['close', 'updated']);
const authStore = useAuthStore();

const activeTab = ref(
    props.mode === 'summary' ? 'summary' : 
    props.mode === 'order' ? 'order' : 
    'settings'
);

const isLoadingSummary = ref(false);
const fullGroupData = ref({ ...props.group }); // Start with props, update with full fetch
const allOrders = ref([]);

// Derived Stats
const grandTotal = computed(() => fullGroupData.value.totalGroupAmount || 0);

const detailedGroupStats = computed(() => {
    if (!allOrders.value) return [];
    
    const statsMap = {};
    allOrders.value.forEach(order => {
        if (!order.items) return;
        const userName = order.user ? order.user.name : `User ${order.userId}`;
        
        order.items.forEach(item => {
            if (!statsMap[item.name]) {
                statsMap[item.name] = {
                    name: item.name,
                    quantity: 0,
                    totalPrice: 0,
                    users: []
                };
            }
            statsMap[item.name].quantity += item.quantity;
            statsMap[item.name].totalPrice += item.price * item.quantity;
            
            const existing = statsMap[item.name].users.find(u => u.name === userName);
            if (existing) existing.qty += item.quantity;
            else statsMap[item.name].users.push({ name: userName, qty: item.quantity });
        });
    });
    return Object.values(statsMap).sort((a, b) => a.name.localeCompare(b.name));
});

const totalCollected = computed(() => {
    if (!allOrders.value) return 0;
    return allOrders.value
        .filter(o => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + (o.total || 0), 0);
});

const isCreator = computed(() => fullGroupData.value.isCreator);
const modalTitle = computed(() => {
    if (props.mode === 'edit') return 'Edit Group';
    if (props.mode === 'invite') return 'Invite Members';
    return fullGroupData.value.title || 'Group Details';
});

// Fetch full details
const refreshGroupSummary = async () => {
    if (props.mode === 'create') return; 
    
    try {
        isLoadingSummary.value = true;
        const response = await axios.get(`/api/orders/group/${props.group.id}/summary`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        
        fullGroupData.value = { ...props.group, ...response.data };
        allOrders.value = response.data.allOrders || [];
        
    } catch (error) {
        console.error("Failed to fetch group summary", error);
    } finally {
        isLoadingSummary.value = false;
    }
};

const handleChildUpdate = () => {
    refreshGroupSummary();
    emit('updated');
};

// Initial fetch
watch(() => props.group.id, refreshGroupSummary, { immediate: true });

</script>

<style scoped>
/* Modal Structure Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 650px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  overflow: hidden;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.modal-header h2 { margin: 0; font-size: 1.25rem; color: #333; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }

.modal-tabs {
    display: flex;
    background: #f1f3f5;
    padding: 0 10px;
    border-bottom: 1px solid #ddd;
    overflow-x: auto;
}

.tab-btn {
    padding: 12px 16px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-weight: 600;
    color: #666;
    white-space: nowrap;
}

.tab-btn:hover { color: #339af0; }
.tab-btn.active { border-bottom-color: #228be6; color: #228be6; }

.modal-body {
  overflow-y: auto;
  flex: 1;
}

.loading-overlay {
    position: absolute;
    top: 60px; left: 0; right: 0; bottom: 0;
    background: rgba(255,255,255,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    color: #666;
    z-index: 100;
}
</style>
