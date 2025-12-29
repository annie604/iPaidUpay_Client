<template>
    <div class="tab-content">
        <!-- Add Item Section -->
        <div class="order-selection-area">
            <label>Add Item:</label>
            <div class="selection-row">
                <select v-model="selectedProductIndex" class="input-field" :disabled="isLocked">
                    <option :value="-1" disabled>Select Item...</option>
                    <option v-for="(prod, idx) in products" :key="idx" :value="idx">
                        {{ prod.name }} (${{ prod.price }})
                    </option>
                </select>
                <input v-model.number="orderQuantity" type="number" min="1" class="input-field qty-input" placeholder="Qty" :disabled="isLocked" />
                <button type="button" class="add-order-btn" @click="addToMyOrder" :disabled="selectedProductIndex === -1 || isLocked">Add</button>
            </div>
        </div>

        <!-- My Order List -->
        <div class="my-order-list">
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
                    <!-- Quantity Control -->
                    <div class="qty-control">
                        <button type="button" class="qty-btn" @click="decreaseQty(idx)" :disabled="isLocked">-</button>
                        <input 
                            v-model.number="item.quantity" 
                            type="text" 
                            class="qty-input-small" 
                            @change="handleQtyChange(idx)"
                            :disabled="isLocked"
                        />
                        <button type="button" class="qty-btn" @click="increaseQty(idx)" :disabled="isLocked">+</button>
                    </div>
                    <span>${{ item.price * item.quantity }}</span>
                    <button type="button" class="remove-btn" @click="removeFromMyOrder(idx)" :disabled="isLocked">&times;</button>
                </div>
            </div>
            <div class="order-total">
                Total: <span class="price">${{ myOrderTotal }}</span>
            </div>
        </div>

        <div class="form-actions">
            <div class="last-updated" v-if="formattedLastUpdated">
                Last updated: <br>
                {{ formattedLastUpdated }}
            </div>
            <button type="button" class="submit-btn" :disabled="isOrderLoading || isLocked" @click="submitOrder">
                {{ 
                    isOrderLoading ? 'Saving...' : 
                    isSaved ? 'Saved!' :
                    isDirty ? 'Save Order' : 'Up to date'
                }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toastStore';
import axios from 'axios';

const props = defineProps({
    groupId: { type: Number, required: true },
    products: { type: Array, default: () => [] },
    initialOrder: { type: Object, default: null }, // { items, updatedAt }
    isLocked: { type: Boolean, default: false }
});

const emit = defineEmits(['updated']);

const authStore = useAuthStore();
const toastStore = useToastStore();

const selectedProductIndex = ref(-1);
const orderQuantity = ref(1);
const myOrderItems = ref([]);
const originalOrderItems = ref([]);
const lastUpdatedTime = ref(null);
const isOrderLoading = ref(false);
const isSaved = ref(false);

const initOrder = () => {
    if (props.initialOrder && props.initialOrder.items) {
        const items = props.initialOrder.items.map(i => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity
        }));
        myOrderItems.value = JSON.parse(JSON.stringify(items));
        originalOrderItems.value = JSON.parse(JSON.stringify(items));
        lastUpdatedTime.value = props.initialOrder.updatedAt;
    } else {
        myOrderItems.value = [];
        originalOrderItems.value = [];
        lastUpdatedTime.value = null;
    }
};

watch(() => props.initialOrder, initOrder, { immediate: true });

const myOrderTotal = computed(() => {
    return myOrderItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const formattedLastUpdated = computed(() => {
    if (!lastUpdatedTime.value) return '';
    return new Date(lastUpdatedTime.value).toLocaleString();
});

const isDirty = computed(() => {
    if (myOrderItems.value.length !== originalOrderItems.value.length) return true;
    const sortFn = (a, b) => a.name.localeCompare(b.name);
    const sortedCurrent = [...myOrderItems.value].sort(sortFn);
    const sortedOriginal = [...originalOrderItems.value].sort(sortFn);
    return JSON.stringify(sortedCurrent) !== JSON.stringify(sortedOriginal);
});

const addToMyOrder = () => {
    if (selectedProductIndex.value === -1) return;
    const product = props.products[selectedProductIndex.value];
    
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
    selectedProductIndex.value = -1;
    orderQuantity.value = 1;
};

const removeFromMyOrder = async (index) => {
    if (await toastStore.showConfirm("Remove Item", `Remove "${myOrderItems.value[index].name}"?`)) {
        myOrderItems.value.splice(index, 1);
    }
};

const increaseQty = (index) => {
    myOrderItems.value[index].quantity++;
};

const decreaseQty = async (index) => {
    if (myOrderItems.value[index].quantity > 1) {
        myOrderItems.value[index].quantity--;
    } else {
        if (await toastStore.showConfirm("Remove Item", "Quantity is 0. Remove item?")) {
            myOrderItems.value.splice(index, 1);
        }
    }
};

const handleQtyChange = async (index) => {
    if (myOrderItems.value[index].quantity <= 0) {
        if (await toastStore.showConfirm("Remove Item", "Quantity is 0. Remove item?")) {
            myOrderItems.value.splice(index, 1);
        } else {
            myOrderItems.value[index].quantity = 1;
        }
    }
};

const submitOrder = async () => {
    if (!isDirty.value) return; 
    isOrderLoading.value = true;
    isSaved.value = false;
    try {
        const response = await axios.post('/api/orders', {
            groupId: props.groupId,
            items: myOrderItems.value
        }, {
             headers: { Authorization: `Bearer ${authStore.token}` }
        });
        
        if (response.data.order) {
            const serverOrder = response.data.order;
            lastUpdatedTime.value = serverOrder.updatedAt;
            const newItems = serverOrder.items.map(i => ({
                name: i.name,
                price: i.price,
                quantity: i.quantity
            }));
            
            myOrderItems.value = JSON.parse(JSON.stringify(newItems));
            originalOrderItems.value = JSON.parse(JSON.stringify(newItems));
        }

        isSaved.value = true;
        setTimeout(() => isSaved.value = false, 3000);
        emit('updated'); 
        toastStore.addToast("Order updated", "success");

    } catch (error) {
        console.error("Order submit failed", error);
        toastStore.addToast("Failed to update order.", "error");
    } finally {
        isOrderLoading.value = false;
    }
};
</script>

<style scoped>
/* Scoped styles reuse */
.tab-content { padding: 20px; }
.order-selection-area { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
.selection-row { display: flex; gap: 10px; margin-top: 10px; }
.input-field { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
.qty-input { width: 70px; }
.qty-input-small { width: 40px; text-align: center; border: 1px solid #ddd; border-radius: 4px; margin: 0 5px; }
.add-order-btn { padding: 8px 20px; background: #228be6; color: white; border: none; border-radius: 4px; cursor: pointer; }
.add-order-btn:disabled { background: #ccc; cursor: not-allowed; }
.table-header, .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 0.5fr; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
.table-header { font-weight: bold; border-bottom: 2px solid #eee; }
.qty-control { display: flex; align-items: center; }
.qty-btn { width: 24px; height: 24px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; }
.remove-btn { color: #fa5252; background: none; border: none; font-size: 1.2rem; cursor: pointer; }
.order-total { margin-top: 20px; text-align: right; font-weight: bold; font-size: 1.1rem; }
.submit-btn { width: 100%; margin-top: 20px; padding: 12px; background: #228be6; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
.submit-btn:disabled { background: #a5d8ff; cursor: not-allowed; }
.last-updated { text-align: center; font-size: 0.85rem; color: #868e96; margin-bottom: 10px; }
</style>
