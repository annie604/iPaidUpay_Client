<template>
  <div class="page-wrapper">
    <!-- 1. Add Navbar -->
    <Navbar />

    <!-- 2. Wrap content in standard container styles -->
    <div class="sql-terminal-container">
      <h2>SQL Command Terminal</h2>
      
      <div class="terminal-window">
        <div class="terminal-header">postgres@ipaidupay: ~</div>
        <textarea 
          v-model="sqlQuery" 
          placeholder="SELECT * FROM &quot;User&quot; LIMIT 10;"
          class="sql-input"
          @keydown.ctrl.enter="runQuery"
        ></textarea>
        <div class="actions">
          <button @click="runQuery" :disabled="loading" class="run-btn">
            {{ loading ? 'Running...' : 'Execute (Ctrl+Enter)' }}
          </button>
          <button @click="clear" class="clear-btn">Clear</button>
        </div>
      </div>

      <div v-if="errorMessage" class="error-box">
        ❌ {{ errorMessage }}
      </div>

      <div v-if="queryResult && queryResult.length > 0" class="result-container">
        <div class="result-info">Rows returned: {{ queryResult.length }}</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-for="key in Object.keys(queryResult[0])" :key="key">
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in queryResult" :key="index">
                <td v-for="key in Object.keys(row)" :key="key">
                  {{ formatValue(row[key]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="executed && (!queryResult || queryResult.length === 0)" class="no-data">
        Query executed successfully. No rows returned.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
// Import Navbar
import Navbar from '../components/Navbar.vue';

const router = useRouter();
const authStore = useAuthStore();

const sqlQuery = ref('');
const loading = ref(false);
const errorMessage = ref(null);
const queryResult = ref(null);
const executed = ref(false);

onMounted(() => {
  // Security check
  if (!authStore.user || authStore.user.username !== 'OmegaAdmin') {
    router.push('/');
    return;
  }
});

const runQuery = async () => {
  const query = sqlQuery.value.trim();
  if (!query) return;

  loading.value = true;
  errorMessage.value = null;
  queryResult.value = null;
  executed.value = false;

  try {
    const response = await axios.post('/api/admin/sql', 
      { query },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    
    // The backend returns { result: ... }
    const res = response.data.result;
    
    // Handle different result types
    if (Array.isArray(res)) {
       queryResult.value = res;
    } else {
       if (typeof res === 'object' && res !== null) {
           queryResult.value = [res];
       } else {
           // Primitive result (like a count number)
           queryResult.value = [{ Result: res }];
       }
    }
    
    executed.value = true;

  } catch (err) {
    console.error(err);
    errorMessage.value = err.response?.data?.error || err.message;
  } finally {
    loading.value = false;
  }
};

const clear = () => {
  sqlQuery.value = '';
  errorMessage.value = null;
  queryResult.value = null;
  executed.value = false;
};

const formatValue = (val) => {
    if (val === null) return 'NULL';
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
};
</script>

<style scoped>
/* Common Page Wrapper Style */
.page-wrapper {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f5f5f5; /* Match other pages */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.sql-terminal-container {
  padding: 20px;
  max-width: 1000px;
  margin: 30px auto; /* Add margin to separate from Navbar */
  width: 100%;
}

h2 {
    color: #333; /* Dark text for light background */
    margin-bottom: 20px;
}

/* Terminal Look */
.terminal-window {
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  margin-bottom: 20px;
}

.terminal-header {
  background: #333;
  color: #ddd;
  padding: 5px 15px;
  font-family: monospace;
  font-size: 0.8rem;
}

.sql-input {
  width: 100%;
  height: 150px;
  background: #1e1e1e;
  color: #00ff00; /* 駭客綠 */
  border: none;
  padding: 15px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 1.1rem;
  resize: vertical;
  outline: none;
}

.actions {
  background: #252526;
  padding: 10px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.run-btn {
  background: #007acc;
  color: white;
  border: none;
  padding: 8px 20px;
  cursor: pointer;
  border-radius: 4px;
}
.run-btn:disabled { background: #555; }

.clear-btn {
  background: #444;
  color: white;
  border: none;
  padding: 8px 15px;
  cursor: pointer;
  border-radius: 4px;
}

/* Error Box */
.error-box {
  background: #5a1e1e;
  color: #ffcccc;
  padding: 15px;
  border-left: 5px solid #ff4444;
  margin-bottom: 20px;
  font-family: monospace;
  white-space: pre-wrap;
}

/* Result Table */
.result-container {
    padding-bottom: 50px;
}

.result-info {
  margin-bottom: 5px;
  color: #666;
  font-size: 0.9rem;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white; /* Explicit white background for table area */
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-family: monospace;
}

th {
  background: #f0f0f0;
  text-align: left;
  font-weight: bold;
  border-bottom: 2px solid #ddd;
  color: #333; 
}

th, td {
  padding: 10px;
  border-right: 1px solid #eee;
  white-space: nowrap; 
  color: #333;
}

tr:nth-child(even) { background: #f9f9f9; }
tr:hover { background: #f0f8ff; }

.no-data {
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 20px;
}
</style>
