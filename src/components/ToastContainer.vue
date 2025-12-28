<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id" 
        class="toast-item"
        :class="toast.type"
      >
        <div class="toast-content">{{ toast.message }}</div>
        <button class="toast-close" @click="toastStore.removeToast(toast.id)">&times;</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toastStore';
const toastStore = useToastStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none; /* Allow clicks through container */
}

.toast-item {
  pointer-events: auto;
  min-width: 300px;
  padding: 12px 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 500;
  border-left: 5px solid #333;
}

/* Types */
.toast-item.info { border-left-color: #2196F3; color: #333; }
.toast-item.success { border-left-color: #4CAF50; color: #155724; background: #d4edda; }
.toast-item.error { border-left-color: #f44336; color: #721c24; background: #f8d7da; }

.toast-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  margin-left: 10px;
  opacity: 0.6;
  line-height: 1;
}
.toast-close:hover { opacity: 1; }

/* Animation */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
