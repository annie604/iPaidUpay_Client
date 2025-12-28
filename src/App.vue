<template>
  <RouterView />
  <ToastContainer />
  <GlobalConfirmModal />
</template>

<script setup>
import { RouterView } from 'vue-router'
import ToastContainer from './components/ToastContainer.vue';
import GlobalConfirmModal from './components/GlobalConfirmModal.vue';
</script>

<style>
/* Global reset or styles if needed */
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
