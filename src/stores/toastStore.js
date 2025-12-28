import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
    // --- Toasts ---
    const toasts = ref([]);
    // toast structure: { id, message, type: 'info'|'success'|'error', duration }

    let nextId = 1;

    const addToast = (message, type = 'info', duration = 3000) => {
        const id = nextId++;
        toasts.value.push({ id, message, type, duration });

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        const index = toasts.value.findIndex(t => t.id === id);
        if (index !== -1) {
            toasts.value.splice(index, 1);
        }
    };

    // --- Confirmation Modal ---
    const confirmState = ref({
        visible: false,
        title: '',
        message: '',
        resolve: null,
        reject: null
    });

    const showConfirm = (title, message) => {
        return new Promise((resolve, reject) => {
            confirmState.value = {
                visible: true,
                title,
                message,
                resolve,
                reject
            };
        });
    };

    const handleConfirm = (result) => {
        if (confirmState.value.resolve) {
            confirmState.value.resolve(result);
        }
        confirmState.value = {
            visible: false,
            title: '',
            message: '',
            resolve: null,
            reject: null
        };
    };

    return {
        toasts,
        addToast,
        removeToast,
        confirmState,
        showConfirm,
        handleConfirm
    };
});
