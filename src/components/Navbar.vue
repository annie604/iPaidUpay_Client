<template>
    <nav class="navbar" ref="navbarRef">
      <div class="brand">
        <img src="/icon.png" alt="Logo" class="logo-icon" style="height: 2.5rem; width: auto;" /> IpaidUpay
      </div>
      
      <button class="hamburger-btn" @click="isMenuOpen = !isMenuOpen">
        <span>☰</span>
      </button>

      <div class="nav-links" :class="{ 'show': isMenuOpen }">
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
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const userName = computed(() => authStore.user?.name);
const isMenuOpen = ref(false);
const navbarRef = ref(null);

const logout = () => {
    isMenuOpen.value = false;
    authStore.logout();
    router.push('/login');
};

const closeMenu = (e) => {
    if (isMenuOpen.value && navbarRef.value && !navbarRef.value.contains(e.target)) {
        isMenuOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', closeMenu);
});

onUnmounted(() => {
    document.removeEventListener('click', closeMenu);
});
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

.hamburger-btn {
    display: none;
    background: none;
    border: none;
    font-size: 1.8rem;
    cursor: pointer;
    color: #333;
    padding: 0;
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

/* --- Responsive Styles --- */
@media (max-width: 768px) {
    .navbar {
        padding: 15px 20px;
    }

    .hamburger-btn {
        display: block;
    }

    .nav-links {
        display: none;
        position: absolute;
        top: 100%; /* Below navbar */
        left: 0;
        width: 100%;
        background: white;
        flex-direction: column;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        gap: 15px;
        align-items: flex-start;
    }
    
    .nav-links.show {
        display: flex;
    }
    
    .nav-item {
        width: 100%;
        padding: 10px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .nav-item.active {
        border-bottom: 1px solid #ee4d2d;
        padding-bottom: 10px;
    }
    
    .user-profile {
        width: 100%;
        border-left: none;
        padding-left: 0;
        margin-top: 10px;
        flex-direction: column; /* Stack vertically */
        align-items: flex-start; /* Align left */
        gap: 10px;
        padding-top: 15px;
        border-top: 2px solid #f0f0f0;
    }
}
</style>
