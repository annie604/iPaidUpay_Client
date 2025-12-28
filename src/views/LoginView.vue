<template>
  <div class="page-wrapper">
    <nav class="navbar">
      <div class="brand">
        <img src="/icon.png" alt="Logo" class="logo-icon" style="height: 2.5rem; width: auto;" /> IpaidUpay
      </div>
      <div class="nav-links">
        <router-link to="/register">註冊會員</router-link>
      </div>
    </nav>

    <div class="login-container">
      <div class="login-card">
        <div class="card-header">
          <h2>登入</h2>
          <p class="subtitle">歡迎回來，繼續省錢</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="input-group">
            <label>帳號 ID</label>
            <input 
              type="text" 
              v-model="form.id" 
              placeholder="請輸入帳號 (ID)" 
              required 
            />
          </div>

          <div class="input-group">
            <div class="label-row">
              <label>密碼</label>
              <span v-if="passwordError" class="error-text">輸入錯誤，請重新輸入</span>
            </div>
            <input 
              type="password" 
              v-model="form.passwd" 
              placeholder="請輸入密碼" 
              @input="passwordError = false"
              required 
            />
          </div>

          <button 
            type="submit" 
            class="login-btn" 
            :disabled="isLoading" 
            :class="{ 'is-loading': isLoading }"
          >
            {{ isLoading ? '登入中...' : '登入' }}
          </button>
        </form>

        <div class="footer-actions center-align">
          <span>還沒有帳號嗎？</span>
          <router-link to="/register" class="register-link">立即註冊</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';


import { useToastStore } from '../stores/toastStore';

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

// Loading state
const isLoading = ref(false);
const passwordError = ref(false);

const form = reactive({
  id: '',
  passwd: ''
});

const handleLogin = async () => {
  // Prevent duplicate submission
  if (isLoading.value) return;

  isLoading.value = true;

  try {
    await authStore.login(form.id, form.passwd);
    
    toastStore.addToast("登入成功！", "success"); // Notify user of success

    // Redirect to home page
    router.push('/');  
  } catch (error) {
    console.error(error);
    
    // Check for password error specifically if possible, or just set generic error for this demo
    // Assuming 401 means invalid credentials
    if (error.response?.status === 401) {
       passwordError.value = true;
       toastStore.addToast("帳號或密碼錯誤", "error");
    } else {
        // Robust error message handling
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || '登入失敗，請稍後再試';
        toastStore.addToast(errorMsg, "error");
    }

  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.page-wrapper {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: white;
  padding: 15px 10%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ee4d2d;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-links a {
    text-decoration: none;
    color: #666;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 60px;
  padding: 0 20px;
}

.login-card {
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 40px 30px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.card-header {
    text-align: center;
    margin-bottom: 30px;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: #333;
}

.subtitle {
    color: #666;
    font-size: 0.9rem;
    margin-top: 5px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
    display: block;
    margin-bottom: 5px;
    font-size: 0.9rem;
    color: #333;
    font-weight: bold;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #ee4d2d;
  box-shadow: 0 0 0 2px rgba(238, 77, 45, 0.1);
}

.login-btn {
  width: 100%;
  padding: 14px;
  background-color: #ee4d2d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-btn:hover {
  background-color: #d73211;
}

.footer-actions {
  margin-top: 20px;
  font-size: 0.9rem;
  border-top: 1px solid #eee;
  padding-top: 20px;
  color: #666;
}

.center-align {
    text-align: right;
    display: block;
}


.register-link {
  color: #ee4d2d;
  font-weight: bold;
  text-decoration: none;
  margin-left: 5px;
}

/* Disabled button style */
.login-btn:disabled {
  background-color: #fabfb5;
  cursor: not-allowed;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.error-text {
  color: #ee4d2d;
  font-size: 0.8rem;
  font-weight: bold;
}

/* Ensure padding doesn't affect width for symmetry */
* {
    box-sizing: border-box;
}

/* --- Responsive Adjustments --- */
@media (max-width: 768px) {
    .navbar {
        padding: 15px 5%;
    }
    
    .login-container {
        margin-top: 30px;
        padding: 0 15px;
    }
    
    .login-card {
        padding: 30px 20px;
    }
    
    .card-header h2 {
        font-size: 1.3rem;
    }
}
</style>
