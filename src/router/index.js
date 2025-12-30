import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: DashboardView,
        },
        {
            path: '/groups',
            name: 'groups',
            component: DashboardView,
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('../views/RegisterView.vue'),
        },
        {
            path: '/friends',
            name: 'friends',
            component: () => import('../views/FriendsView.vue'),
        },
        {
            path: '/terminal',
            name: 'terminal',
            component: () => import('../views/TerminalView.vue'),
            beforeEnter: (to, from, next) => {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && (user.username === 'OmegaAdmin') || (user.username === 'SupremeAdmin')) {
                    next();
                } else {
                    next('/');
                }
            }
        }
    ],
});

export default router;
