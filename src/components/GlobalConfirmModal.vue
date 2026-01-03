<template>
  <div v-if="toastStore.confirmState.visible" class="modal-overlay">
    <div class="confirm-card">
      <h3>{{ toastStore.confirmState.title || '確認' }}</h3>
      <p>{{ toastStore.confirmState.message }}</p>

      <div class="actions">
        <button class="btn cancel" @click="toastStore.handleConfirm(false)">取消</button>
        <button class="btn confirm" @click="toastStore.handleConfirm(true)">確認</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toastStore';
const toastStore = useToastStore();
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 10000; /* Higher than normal modals */
}

.confirm-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  text-align: center;
}

h3 { margin-top: 0; color: #333; }
p { color: #666; margin-bottom: 25px; line-height: 1.5; }

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
}

.btn.cancel {
  background: #eee;
  color: #555;
}
.btn.cancel:hover { background: #e0e0e0; }

.btn.confirm {
  background: #ee4d2d;
  color: white;
}
.btn.confirm:hover { background: #d73211; }
</style>
