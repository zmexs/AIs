import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
    mode: 'hash',
    base: '/',
    routes: [
        {
            path: '/chat-demo',
            name: 'ChatDemo',
            component: r => require.ensure([], () => r(require('@/pages/chat-demo/main.vue')), 'ChatDemo')
        }
    ]
});
