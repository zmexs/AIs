// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
// eslint-disable-next-line
import Vue from 'vue';
import moment from 'moment';
import App from './App';
import router from './router';
import axios from 'axios';
import { ACCESS_TYPE } from '@/constants';

const vhtml = window.vhtml;
Vue.use(vhtml);
vhtml.install(Vue);

try {
    let iconpath = 'https://cdn3.codesign.qq.com/icons/XzKaDZdEa7j2GPL/latest/iconfont.js';
    vhtml.Icon.setDefaultRemoteSrc && vhtml.Icon.setDefaultRemoteSrc(iconpath);
} catch (e) {
    console.log('load remote icon error');
}

Vue.config.productionTip = false;
Vue.prototype.moment = moment;

router.beforeEach((to, from, next) => {
    document.title = to.meta.title || '企点智能客服';
    if (to.name && window.$initType !== to.name) {
        window.location.reload();
    }
    next();
});

let webIMType; // 后端ws识别的端类型
let webIMSource; // 前端区分UI交互的端类型

webIMType = [5];
window.$initTypeKey = 5;
webIMSource = 'client';

Vue.prototype.webIMSource = webIMSource;

Object.defineProperty(window, 'userType', {
    writable: false,
    enumerable: false,
    configurable: false,
    value: 2
});

window.$initType = 'ChatDemo';

console.log('【init msg-------ACCESS_TYPE---->】', ACCESS_TYPE);
let tokenGet = webIMType.map(type => {
    return new Promise(async (resolve, reject) => {
        let demoToken = '';
        if (ACCESS_TYPE === 'ws') {
            const res = await axios.get('http://localhost:3000/getDemoToken');
            if (res && res.data && res.data.apiResponse && res.data.apiResponse.Token) {
                demoToken = res.data.apiResponse.Token;
            }
        }
        let result = {
            type: type,
            token: demoToken,
            access: ACCESS_TYPE
        };
        console.log('【init msg----------demoToken---->】', result);
        resolve(result);
    });
});

Promise.all(tokenGet).then(res => {
    Object.defineProperty(window, 'webimToken', {
        writable: false,
        enumerable: false,
        configurable: false,
        value: res
    });
    if (ACCESS_TYPE === 'ws') {
        (async () => {
            let mixin = await import('@/manage/index');
            Vue.mixin(mixin);
            /* eslint-disable no-new */
            new Vue({
                el: '#app',
                router,
                render (h) {
                    return h(App);
                }
            }).$mount('#app');
        })();
    } else {
        (async () => {
            let sseMixin = await import('@/manage/sse');
            Vue.mixin(sseMixin);
            /* eslint-disable no-new */
            new Vue({
                el: '#app',
                router,
                render (h) {
                    return h(App);
                }
            }).$mount('#app');
        })();
    }
}).catch(e => {
});
