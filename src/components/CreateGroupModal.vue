<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h2>Create Group</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Group Name:</label>
            <input 
              v-model="form.title" 
              type="text" 
              placeholder="Enter group name (e.g. KFC)" 
              required
              class="input-field"
            />
          </div>

          <div class="form-group">
            <label>Time:</label>
            <div class="time-inputs">
                <input 
                    v-model="form.startTime" 
                    type="datetime-local" 
                    :min="minStartTime" 
                    required 
                    class="input-field date-input"
                    @click="showPicker"
                />
                <span>to</span>
                <input 
                    v-model="form.endTime" 
                    type="datetime-local" 
                    :min="form.startTime" 
                    required 
                    class="input-field date-input"
                    @click="showPicker"
                />
            </div>
          </div>
          
          <div class="menu-section">
            <label>Menu (Items & Prices)</label>
            <div class="menu-table">
                <div class="table-header">
                    <span>Item Name</span>
                    <span>Price</span>
                    <span>Action</span>
                </div>
                <div v-for="(item, index) in form.products" :key="index" class="table-row">
                    <input v-model="item.name" type="text" placeholder="Item" required class="input-field small" />
                    <input v-model.number="item.price" type="number" placeholder="$" required class="input-field small" />
                    <button type="button" @click="removeProduct(index)" class="remove-btn">&times;</button>
                </div>
            </div>
            <button type="button" @click="addProduct" class="add-btn">+ Add Item</button>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn" :disabled="isLoading">
                {{ isLoading ? 'Creating...' : 'Create Group' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

const props = defineProps(['isOpen']);
const emit = defineEmits(['close', 'created']);
const authStore = useAuthStore();
const isLoading = ref(false);


const form = reactive({
    title: '',
    startTime: '',
    endTime: '',
    products: [
        { name: '', price: '' }
    ]
});

// Format Date to YYYY-MM-DDTHH:mm string for datetime-local input
const toLocalISOString = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
};

// Initialize with current time and +2 hours
const now = new Date();
form.startTime = toLocalISOString(now);

const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
form.endTime = toLocalISOString(twoHoursLater);

const minStartTime = toLocalISOString(new Date());

const addProduct = () => {
    form.products.push({ name: '', price: '' });
};

const removeProduct = (index) => {
    if (form.products.length > 1) {
        form.products.splice(index, 1);
    }
};

const showPicker = (event) => {
    try {
        if (event.target.showPicker) {
            event.target.showPicker();
        }
    } catch (error) {
        // Fallback or ignore if not supported/allowed
    }
};

const handleSubmit = async () => {
    // Validation: End time must be later than start time
    if (new Date(form.endTime) <= new Date(form.startTime)) {
        alert("End time must be later than Start time.");
        return;
    }

    // Validation: Start time cannot be in the past (allow small buffer for form filling time of ~1 min if needed, but strict is safer)
    if (new Date(form.startTime) < new Date(minStartTime)) {
         // Optional: strict check, but HTML min attribute handles UI. 
         // JS check might be annoying if user opened form 2 mins ago. 
         // Let's rely mainly on relative check.
    }

    isLoading.value = true;
    try {
        const token = authStore.token;
        await axios.post('http://localhost:3001/api/groups', {
            title: form.title,
            startTime: new Date(form.startTime).toISOString(),
            endTime: new Date(form.endTime).toISOString(),
            products: form.products.map(p => ({
                name: p.name,
                price: Number(p.price)
            }))
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        emit('created');
        emit('close');
    } catch (error) {
        console.error("Failed to create group", error);
        alert("Failed to create group. Please check inputs.");
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
* {
    box-sizing: border-box;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  background: white;
  width: 90%;
  max-width: 600px; /* Increased from 500px */
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  border: 2px solid #333;
  color: #000; /* Ensure text is visible in dark mode contexts */
}

/* ... existing code ... */

/* Ensure inputs in the time row don't overflow or squeeze too much */
.time-inputs .input-field {
    flex: 1; 
    min-width: 0; /* Prevent flex item from overflowing */
    font-size: 0.9rem; /* Smaller font to fit date string */
    padding: 8px; /* Slightly compact padding */
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 2px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  color: #000;
}

.modal-header h2 {
    margin: 0;
    font-weight: bold;
}

.close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    color: #000;
}

.modal-body {
    padding: 20px;
    max-height: 80vh;
    overflow-y: auto;
    color: #000;
}

.form-group {
    margin-bottom: 20px; /* Increased from 15px */
}

label {
    display: block;
    font-weight: bold;
    margin-bottom: 8px; /* Slightly increased */
    color: #000;
}

.input-field {
    width: 100%;
    padding: 10px;
    border: 2px solid #333;
    border-radius: 8px;
    font-size: 1rem;
    color: #000;
    background: #fff; /* Ensure white background input */
}

.time-inputs {
    display: flex;
    gap: 15px;
    align-items: center;
}



.menu-section {
    margin-top: 25px;
    border-top: 2px solid #eee;
    padding-top: 20px;
}

.menu-table {
    border: 2px solid #333;
    border-radius: 8px;
    margin-bottom: 15px;
    overflow: hidden;
    background: #fff;
}

.table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 0.5fr;
    background: #eee;
    padding: 10px;
    border-bottom: 2px solid #333;
    font-weight: bold;
    color: #000;
}

.table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 0.5fr;
    padding: 10px;
    gap: 10px; /* Increased gap */
    border-bottom: 1px solid #ddd;
    align-items: center;
}

.table-row:last-child {
    border-bottom: none;
}

.small {
    padding: 8px; /* Slightly more padding */
    border: 1px solid #999;
}

.remove-btn {
    background: #ff4d4d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    height: 30px;
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
}

.add-btn {
    width: 100%;
    padding: 12px;
    background: #eee;
    border: 2px solid #333;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    color: #000;
}

.add-btn:hover {
    background: #ddd;
}

.form-actions {
    margin-top: 25px;
    text-align: right;
}

.submit-btn {
    background: #ee4d2d;
    color: white;
    padding: 12px 30px;
    border: none;
    border-radius: 50px;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.submit-btn:hover:not(:disabled) {
    background: #d73211;
}

.submit-btn:disabled {
    background: #fabfb5;
    cursor: not-allowed;
}

/* Make the entire input clickable and pointer cursor */
.date-input {
    cursor: pointer;
}

/* Invert icon color if needed for visibility, or ensure it's black */
.date-input::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(0); /* Force black icon */
}
</style>
