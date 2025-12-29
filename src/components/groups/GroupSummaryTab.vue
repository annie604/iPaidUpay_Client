<template>
    <div class="tab-content">
        <div class="summary-table-container">
            <div class="order-table summary-table">
                <div class="table-header">
                    <span>Item</span>
                    <span>Total Qty</span>
                    <span>Total Amount</span>
                    <span>Ordered By</span>
                </div>
                <div v-for="(stat, idx) in detailedGroupStats" :key="idx" class="table-row summary-row">
                    <span>{{ stat.name }}</span>
                    <span>{{ stat.quantity }}</span>
                    <span>${{ stat.totalPrice }}</span>
                    <span class="ordered-by">
                        {{ stat.users.map(u => `${u.name} x${u.qty}`).join(', ') }}
                    </span>
                </div>
            </div>
            <div class="grand-total">
                Grand Total: <span class="price">${{ grandTotal }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    detailedGroupStats: { type: Array, required: true },
    grandTotal: { type: Number, required: true }
});
</script>

<style scoped>
.tab-content { padding: 20px; }
.summary-table-container { margin-top: 10px; }
.order-table { display: flex; flex-direction: column; }
.table-header, .table-row { display: grid; grid-template-columns: 1.5fr 0.8fr 1fr 2fr; gap: 10px; padding: 10px; border-bottom: 1px solid #eee; align-items: center; }
.table-header { font-weight: bold; border-bottom: 2px solid #eee; background: #f8f9fa; }
.grand-total { margin-top: 20px; text-align: right; font-weight: bold; font-size: 1.2rem; }
.price { color: #228be6; }
.ordered-by { font-size: 0.9rem; color: #555; }
</style>
