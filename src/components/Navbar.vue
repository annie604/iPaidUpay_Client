<template>
    <nav class="navbar">
      <div class="brand">
        <span class="logo-icon">🛒</span> IpaidUpay
      </div>
      <div class="nav-links">
        <router-link to="/groups" class="nav-item" :class="{ 'active': $route.path === '/groups' || $route.path === '/' }">Groups</router-link>
        <router-link to="/friends" class="nav-item" :class="{ 'active': $route.path === '/friends' }">Friends</router-link>
        <div class="user-profile">
          <span class="user-name">Hi, {{ userName }}</span>
          <a href="#" @click.prevent="logout" class="logout-btn">Logout</a>
        </div>
      </div>
    </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const userName = computed(() => authStore.user?.name);

const logout = () => {
    authStore.logout();
    router.push('/login');
};
</script>

<style scoped>
.navbar {
  background: white;
  padding: 15px 10%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ee4d2d;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-item {
  text-decoration: none;
  color: #333;
  font-weight: 500;
}

.nav-item:hover, .nav-item.active {
  color: #ee4d2d;
}

.nav-item.active {
  border-bottom: 2px solid #ee4d2d;
  padding-bottom: 5px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 1px solid #ddd;
  padding-left: 20px;
}

.user-name {
  color: #ee4d2d;
  font-weight: bold;
}

.logout-btn {
  text-decoration: none;
  color: #999;
  font-size: 0.9rem;
  cursor: pointer;
}
</style>
