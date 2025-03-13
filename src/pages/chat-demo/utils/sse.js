// HTTP SSE 接口请求
// 请求地址：https://wss.lke.cloud.tencent.com/v1/qbot/chat/sse
// 请求方式：POST

import Vue from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { MESSAGE_TYPE, APP_KEY } from '@/constants';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { arrayUnique } from '@/utils/util';

const $e = Vue.prototype.$eventHub;

const origin = process.env.SSE_BASE_URL;
let path = '/v1/qbot/chat/sse';
let sseUrl = origin + path;

// let systemEventEmit = (eventName, data) => {
//     Vue.prototype.$eventHub.$emit(eventName, data);
// };

let cache = null; // 缓存
let timeoutTasks = {}; // 超时任务管理
const msgSendTimeout = 2 * 60 * 1000; // 发送消息超时ms，此处超时默认为2min
let sseObj = null; // 暂存当前sse请求对象

class SseCls {
    constructor () {
        cache = {
            session_id: 'session_id', // 会话ID
            configInfo: null, // 配置信息
            chatsContent: [], // 会话聊天内容
            systemEvents: [], // 系统事件栈
            transferInfo: {
                transferStatus: false,
                transferAvatar: ''
            } // 当前转人工状态
        };
    }
    init () {
        // 获取基础配置
        this.sseQueryConfigInfo();
    }
    // 获取基础配置
    async sseQueryConfigInfo () {
        try {
            const seatBizId = 'seat_biz_id';
            const sessionId = 'session_id';
            cache.seat_biz_id = seatBizId;
            cache.session_id = sessionId;
            // 接着获取机器人基础信息
            const botInfo = {
                'code': 0,
                'data': {
                    'name': '测试机器人',
                    'avatar': 'https://qbot-1251316161.cos.ap-nanjing.myqcloud.com/avatar.png',
                    'is_available': true,
                    'bot_biz_id': '1664519736704069632'
                }
            };
            cache.configInfo = botInfo.data;
            cache.configInfo.session_id = sessionId;
            console.log('【sse】init config info:', cache.configInfo);
            $e.$emit('client_configChange', cache.configInfo);
        } catch (e) {
            Vue.prototype.$message.error('获取会话信息失败，请刷新页面重试！');
        }
    }

    // 获取全局配置信息
    getConfigInfo () {
        return cache.configInfo;
    }
    // 获取消息队列数据
    getChatsContent () {
        return cache.chatsContent || [];
    }
    // 根据msgId获取消息
    getMsgById (msgId) {
        const findedMsg = cache.chatsContent.find((r) => r.record_id === msgId);
        return findedMsg;
    }
    // 根据msgId获取其关联问题消息
    getQmsgById (msgId) {
        let findedQmsg = null;
        const findedMsg = this.getMsgById(msgId);

        if (findedMsg) {
            findedQmsg = cache.chatsContent.find((r) => (r.record_id === findedMsg.related_record_id));
        }

        return findedQmsg;
    }
    // 修改指定msgId的消息内容
    modifyMsgContent (msgId) {
        const findedMsg = this.getMsgById(msgId);

        if (findedMsg) {
            findedMsg.is_final = true;
            findedMsg.content = findedMsg.content.concat(`<span class="stop-ws">| 已停止生成</span>`);
            // todo
            $e.$emit('client_msgContentChange', {
                chatsContent: cache.chatsContent,
                type: MESSAGE_TYPE.STOP // ”停止生成“事件
            });
        }
    }

    // sse 消息处理
    async getQASse (data, requestId) {
        let that = this;
        console.log('【sse】getQASse', data, requestId);
        const params = {
            'request_id': requestId,
            'content': data,
            'bot_app_key': APP_KEY,
            'visitor_biz_id': '1',
            'session_id': 'session_id',
            'visitor_labels': []
        };
        try {
            sseObj = await fetchEventSource(sseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params),
                openWhenHidden: true,
                onopen (response) {
                    console.log('【sse】Connection opened:', response);
                },
                onmessage (rsp) {
                    console.log('【sse】Message from server:', rsp);
                    const event = JSON.parse(rsp.data);
                    // 处理reply
                    if (event.type === 'reply') {
                        let data = event.payload;
                        if (data.session_id !== cache.session_id) return; // 若新消息不属于当前机器人时，则不做处理

                        const findedMsg = that.getMsgById(data.record_id);
                        if (findedMsg && findedMsg.is_final) return; // 若消息已经”停止生成“，则新消息抛弃

                        that.assembleMsgContent(data, MESSAGE_TYPE.ANSWER);
                    }

                    if (event.type === 'error') {
                        let rep = event.payload || event;
                        if (rep && rep.error) {
                            // Vue.prototype.$message.error(rep.error.message || '服务出错了！');
                            Vue.prototype.$message(rep.error.message || '服务出错了！', 'error', null, 5000);
                        } else {
                            Vue.prototype.$message('服务出错了！', 'error', null, 5000);
                        }
                    }
                },
                onerror (error) {
                    console.error('【sse】Error:', error);
                }
            });
        } catch (error) {
            console.error('Failed to connect:', error);
        }
    };

    // 消息上行事件（用户端）
    async sseSendMsg (msg) {
        if (!cache.configInfo || !cache.configInfo.session_id) {
            await this.queryConfigInfo();
        }
        const requestId = uuidv4();
        console.log('【sse】sseSendMsg', msg, requestId);

        // 插入消息队列的数据
        const msgContent = {
            request_id: requestId,
            content: msg,
            is_from_self: true,
            timestamp: +new Date(),
            is_final: true, // 问题无流失，默认置为 true（即流式输出已结束）
            is_loading: true // 默认消息发送中
        };

        this.assembleMsgContent(msgContent, MESSAGE_TYPE.QUESTION);

        timeoutTasks[msgContent.request_id] = setTimeout(() => {
            this.assembleMsgContent({
                ...msgContent,
                failed: true
            }, MESSAGE_TYPE.ANSWER);
        }, msgSendTimeout);
        this.getQASse(msg, requestId);
    }
    // 组装消息队列数据
    // 问题确认消息：根据request_id关联覆盖（服务端收到问题后的确认消息）
    // 答案消息：倒序遍历插入（服务端答案消息）
    assembleMsgContent (msgList, type) {
        let newMsg = msgList;

        if (type === MESSAGE_TYPE.QUESTION) {
            // 发送的问题消息由前端临时插入消息队列
            cache.chatsContent.push(newMsg);
        } else if (type === MESSAGE_TYPE.ANSWER) {
            if (cache.chatsContent.length < 1) {
                cache.chatsContent.push(newMsg);
            } else {
                let currentList = cache.chatsContent;

                timeoutTasks[newMsg.request_id] && clearTimeout(timeoutTasks[newMsg.request_id]);

                if (currentList.length === 2 && newMsg.can_rating) {
                    currentList[0].transferRobot = true;
                }
                if (newMsg.transfer && newMsg.loading_message) {
                    currentList.pop();
                    currentList[currentList.length - 1].loading_message = false;
                    currentList[currentList.length - 1] = {
                        ...newMsg,
                        ...currentList[currentList.length - 1],
                        transfer: true,
                        transferRobot: false
                    };
                } else {
                    for (let i = currentList.length - 1; i >= 0; i--) {
                        const { transfer, quit, transferRobot } = currentList[i];
                        const tmp = {
                            ...newMsg,
                            transfer,
                            quit,
                            transferRobot
                        };
                        // 答案消息流式输出覆盖（record_id）
                        if (newMsg.record_id === currentList[i].record_id) {
                            currentList[i] = tmp;
                            break;
                        }
                        // 服务端问题消息确认数据，覆盖前端插入的临时问题消息数据（request_id匹配 & 自己发出的问题消息）
                        if (newMsg.request_id && newMsg.request_id === currentList[i].request_id && newMsg.is_from_self) {
                            newMsg.is_loading = false; // 服务端确认收到问题消息，则去除”发送中“状态
                            currentList[i] = tmp;
                            // 非人工状态时, 并且用户发送的不是敏感消息。插入临时[正在思考中...]消息
                            if (!newMsg.is_evil && !cache.transferInfo.transferStatus) {
                                currentList.push({
                                    loading_message: true,
                                    is_from_self: false,
                                    content: '',
                                    from_avatar: cache.configInfo.avatar,
                                    timestamp: Number(currentList[i].timestamp) // 精确到秒
                                });
                            }
                            break;
                        }
                        // 插入最新答案消息
                        if (Number(newMsg.timestamp) >= Number(currentList[i].timestamp)) {
                            if (currentList[i].loading_message) {
                                // 删除原来的[正在思考中...]消息
                                currentList[currentList.length - 1] = newMsg;
                            } else {
                                currentList.splice(i + 1, 0, newMsg);
                            }
                            break;
                        }
                        if (i === 0 && Number(newMsg.timestamp) < Number(currentList[i].timestamp)) {
                            currentList.splice(0, 0, newMsg);
                        }
                    }
                }
            }
        } else if (type === MESSAGE_TYPE.HISTORY) {
            let currentList = cache.chatsContent;
            // 历史数据打上标签，无需展示”重新生成“和”停止生成“操作
            msgList = msgList.map((r) => {
                return {
                    ...r,
                    is_history: true,
                    is_final: true
                };
            });

            if (currentList.length === 0) {
                // 若消息队列为空（用户端，初始拉取历史记录，用做判断欢迎页展示场景）
                cache.chatsContent = [].concat(msgList);
            } else {
                // 若消息队列不为空
                let oldMsgCurrent = currentList[0];
                let newMsgHistory = msgList[msgList.length - 1];

                // 将历史数据拼装到消息队列中（按照时间戳重排数据）
                if (Number(newMsgHistory.timestamp) < Number(oldMsgCurrent.timestamp)) {
                    cache.chatsContent = [].concat(msgList).concat(cache.chatsContent);
                } else {
                    msgList.reverse().forEach(msg => {
                        for (let i = 0; i < cache.chatsContent.length; i++) {
                            if (msg.record_id === cache.chatsContent[i].record_id) {
                                // 重复覆盖
                                cache.chatsContent[i] = msg;
                                break;
                            } else if (Number(msg.timestamp) <= Number(cache.chatsContent[i].timestamp)) {
                                cache.chatsContent.splice(i, 0, msg);
                                break;
                            } else if (i === cache.chatsContent.length - 1 && Number(msg.timestamp) > Number(cache.chatsContent[i].timestamp)) {
                                cache.chatsContent.splice(i + 1, 0, msg);
                            }
                        }
                    });
                }
            }
        }

        // 消息去重。同一record_id取最新，同时保留消息最早的时间戳
        cache.chatsContent = arrayUnique(cache.chatsContent, 'record_id', 'timestamp');

        // 消息队列变更通知事件
        $e.$emit('client_msgContentChange', {
            chatsContent: cache.chatsContent,
            type
        });
    }

    // // todo 停止生成回复
    stopGeneration () {
        const ongoingMsg = cache.chatsContent.find((r) => r.is_final === false);
        if (!ongoingMsg) return;

        if (sseObj) {
            // 关闭sse，停止生成回复
            sseObj.close();
        }
        this.modifyMsgContent(ongoingMsg.record_id);
    }
}

const $sse = new SseCls();
Vue.prototype.$SseCls = $sse;
export default $sse;
