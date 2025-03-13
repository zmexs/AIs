import Vue from 'vue';
import io from 'socket.io-client';

const origin = process.env.WS_BASE_URL;
let path = '/v1/qbot/chat/conn/';
let initSocket = 1;

let tokenArr = window.webimToken || [];
let mainToken = tokenArr.filter(item => {
    return item.type !== 4;
})[0].token;

let socket = io(origin, {
    path: path,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: async (cb) => {
        /* eslint-disable */
        try {
            if (initSocket === 1) {
                const token = mainToken || '';
                if (token) {
                    cb({ token: token });
                } else {
                    cb({ token: '' });
                }
                initSocket++;
            } else {
                const token = mainToken || '';
                cb({ token: token });
                initSocket++;
            }
        } catch (e) {
            cb({ token: '' });
            Vue.prototype.$message.error('获取token失败');
        }
    }
}); // 建立连接

let systemEventEmit = (eventName, data) => {
    Vue.prototype.$eventHub.$emit(eventName, data);
};

// 监听
socket.on('connect', () => {
  console.log('connect');
    // 监听连接是否成功
    systemEventEmit('connect');
});
socket.on('connect_error', () => {
    systemEventEmit('connectError');
    socket.connect();
});
socket.on('error', (error) => {
    console.error('【error】----->', error)
    if (error && error.payload && error.payload.error) {
        Vue.prototype.$message( error.payload.error.message || '服务出错了！', 'error', null, 5000);
    }
    systemEventEmit('error');
});
socket.on('disconnect', (reason) => {
    // 监听连接异常中断
    systemEventEmit('disconnect', reason);
});
socket.io.on('error', (error) => {
    systemEventEmit('SocketError', error);
});
socket.io.on('reconnect', (attemptNumber) => {
    systemEventEmit('reconnect', `Reconnected to server after ${attemptNumber} attempts`);
});
socket.io.on('reconnect_attempt', (attemptNumber) => {
    systemEventEmit('reconnectAttempt', `Attempt number ${attemptNumber} to reconnect to server`);
});
socket.io.on('reconnect_error', (error) => {
    systemEventEmit('reconnectError', error);
});
socket.io.on('reconnect_failed', () => {
    systemEventEmit('reconnectFailed');
});

let Socket = {
    emit (eventName, params) {
        let data = {
            payload: params
        };
        socket.emit(eventName, data);
    },
    on (eventName, cb) {
        let dataCB = (data) => {
            cb(data ? data.payload : data);
        };
        socket.on(eventName, dataCB);
    }
};

Vue.prototype.$socket = Socket;
