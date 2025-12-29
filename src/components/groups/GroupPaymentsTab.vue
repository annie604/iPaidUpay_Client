<template>
    <div class="tab-content">
        <div class="summary-table-container">
            <div class="order-table summary-table payment-grid">
                <div class="table-header payment-header">
                    <span>Member</span>
                    <span>Balance</span>
                    <span>Status</span>
                </div>
                <div v-if="orders.length === 0" class="empty-msg">
                    No orders found.
                </div>
                <div v-else v-for="(order, idx) in orders" :key="idx" class="table-row payment-row">
                    <span>
                        {{ getDisplayName(order) }}
                        <span v-if="order.userId === creatorId" class="creator-tag">(Host)</span>
                    </span>
                    <span>${{ order.total || 0 }}</span>
                    <span>
                         <button 
                            class="status-btn" 
                            :class="{ 'paid': order.paymentStatus === 'PAID', 'unpaid': order.paymentStatus === 'UNPAID' }"
                            @click="togglePaymentStatus(order)"
                            :disabled="!isCreator || isStatusUpdating"
                         >
                            {{ order.paymentStatus || 'UNPAID' }}
                         </button>
                    </span>
                </div>
            </div>
            <div class="grand-total">
                Total Collected: <span class="price">${{ totalCollected }}</span> / ${{ grandTotal }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toastStore';
import { useUserStore } from '../../stores/userStore';
import axios from 'axios';

const props = defineProps({
    orders: { type: Array, required: true },
    isCreator: { type: Boolean, required: true },
    creatorId: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    totalCollected: { type: Number, required: true }
});

const emit = defineEmits(['updated']);

const authStore = useAuthStore();
const toastStore = useToastStore();
const userStore = useUserStore();

const isStatusUpdating = ref(false);

const getDisplayName = (order) => {
    if (order.user) return order.user.name;
    if (order.userId === userStore.user?.id) return 'Me';
    return `User ${order.userId}`;
};

const togglePaymentStatus = async (order) => {
    if (!props.isCreator) return;
    
    // Toggle logic
    const newStatus = order.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    isStatusUpdating.value = true;

    try {
        await axios.put(`/api/orders/${order.id}/payment-status`, { status: newStatus }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        
        // Optimistic update or wait for parent refresh?
        // Let's emit updated so parent refreshes everything to be safe and consistent
        toastStore.addToast(`Payment status updated to ${newStatus}`, 'success');
        emit('updated');

    } catch (error) {
        console.error("Failed to update payment status", error);
        toastStore.addToast("Failed to update payment status", 'error');
    } finally {
        isStatusUpdating.value = false;
    }
};
</script>

<style scoped>
.tab-content { padding: 20px; }
.summary-table-container { margin-top: 10px; }
.payment-grid { display: flex; flex-direction: column; }
.payment-header, .payment-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; align-items: center; padding: 12px; border-bottom: 1px solid #eee; }
.payment-header { font-weight: bold; background: #f8f9fa; border-bottom: 2px solid #eee; }
.creator-tag { font-size: 0.8em; color: #228be6; margin-left: 5px; background: #e7f5ff; padding: 2px 6px; border-radius: 4px; }
.status-btn { padding: 6px 12px; border: none; border-radius: 20px; font-weight: bold; cursor: pointer; min-width: 80px; }
.status-btn.paid { background: #d3f9d8; color: #2b8a3e; }
.status-btn.unpaid { background: #ffe3e3; color: #c92a2a; }
.status-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.grand-total { margin-top: 20px; text-align: right; font-weight: bold; }
</style>
