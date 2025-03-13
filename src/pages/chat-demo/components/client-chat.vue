<template>
    <div class="client-chat" style="height: 100%">

        <div class="qa-item" v-for="(item, index) in msgList" :key="index">
            <!-- 时间戳 -->
            <div class="timestamp" v-if="index === 0 || (index !== 0 && item.timestamp && (Number(item.timestamp) - Number(msgList[index - 1].timestamp)) > timestampGap)">
                {{ moment(new Date(String(item.timestamp).length === 10 ? item.timestamp * 1000 : Number(item.timestamp))).format('MM-DD HH:mm') }}
            </div>

            <!-- 问题 -->
            <div class="question-item" v-if="item.is_from_self">
                <v-spinner status="default" class="qs-loading" v-if="item.is_loading"></v-spinner>
                <VueMarkdown
                    class="question-text"
                    style="max-width: 352px"
                    :source="item.content"
                    :anchorAttributes="{target: '_blank'}"
                    :linkify="false"
                />
            </div>
            <!-- 答案 -->
            <div class="answer-item" v-if="!item.is_from_self">
                <!-- 头像 -->
                <div class="answer-avatar">
                    <img class="robot-avatar" :src="item.from_avatar" />
                </div>

                <!-- 答案信息 -->
                <div class="answer-info" :ref="item.record_id">
                    <div class="loading" v-if="item.loading_message">正在思考中</div>
                    <!-- Markdown渲染 -->
                    <VueMarkdown
                        class="answer-md"
                        style="max-width: 310px"
                        :source="item.content"
                        :anchorAttributes="{target: '_blank'}"
                        :linkify="false"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import clone from 'clone';
import VueMarkdown from 'vue-markdown';
import elementResizeDetectorMaker from 'element-resize-detector';
import { scrollToBottom } from '@/utils/util';
import { MESSAGE_TYPE, ACCESS_TYPE } from '@/constants';

export default {
    name: 'ClientChat',
    components: {
        VueMarkdown
    },
    data () {
        return {
            loading: false,
            historyLoading: false,
            timestampGap: 5 * 60, // 两次问题间隔大于5min，则展示时间戳（接口侧返回的时间戳是秒级）
            msgList: [], // 对话消息列表
            robotName: '', // 机器人名称
            chatBoxHeight: document.body.clientHeight,
            jsScrolling: false,
            userScrolling: false
        };
    },
    created () {
        // 监听用户端/管理端体验侧的ws事件
        this.listenClientAndManageEvent();
        // 监听公共的ws事件
        this.listenCommonEvent();
    },
    mounted () {
        const erd = elementResizeDetectorMaker();
        const bodyDom = document.body;

        erd.listenTo(bodyDom, (element) => {
            this.chatBoxHeight = element.clientHeight - 113; // 57+56 头部的高度
        });

        const sDom = document.querySelector('.client-chat');
        sDom.addEventListener('scroll', () => {
            console.log('sdom scroll this.jsScrolling, this.userScrolling ', this.jsScrolling, this.userScrolling);
            if (this.msgList[this.msgList.length - 1].is_final === false && !this.jsScrolling) {
                console.log('sdom scroll1');
                this.userScrolling = true;
            } else {
                this.jsScrolling = false;
            }
        });
    },
    methods: {
        // 监听用户端/管理端体验侧的ws事件
        listenClientAndManageEvent () {
            // 从缓存获取机器人信息
            let cachedConfig = null;
            if (ACCESS_TYPE === 'ws') {
                cachedConfig = this.$clientData.getConfigInfo();
            } else {
                cachedConfig = this.$SseCls.sseQueryConfigInfo();
            }
            if (cachedConfig) {
                this.robotName = cachedConfig.name;
            }

            // 监听答案消息队列变更事件
            this.$eventHub.$on('client_msgContentChange', (res) => {
                const { chatsContent, type } = res;

                // PS：若新消息不属于当前机器人，则在 $clientData 中监听到ws消息后判断并屏蔽。不在此处判断和屏蔽
                this.renderMsgList(chatsContent, type);
            });
        },
        // 监听公共的ws事件
        listenCommonEvent () {
            this.$eventHub.$on('data_history', () => {
                this.historyLoading = false;
            });

            this.$eventHub.$on('data_historyError', () => {
                this.historyLoading = false;
            });
        },
        // 渲染消息会话页面
        renderMsgList (data, type) {
            // 无需滚动至底部的ws事件：用户端拉取历史记录、用户端停止生成、坐席端取历史记录、点赞点踩
            const noScrollEvt = [MESSAGE_TYPE.HISTORY, MESSAGE_TYPE.STOP, MESSAGE_TYPE.WORKBENCH_HISTORY, MESSAGE_TYPE.FEEDBACK];
            const list = data.map(el => {
                return { ...el, showPop: true };
            });
            this.msgList = clone(list);

            // 对话框滚动至底部（部分ws事件类型无需执行滚动）
            this.$nextTick(() => {
                const sDom = document.querySelector('.client-chat');

                if (!sDom) return;

                if (!this.userScrolling && (!noScrollEvt.includes(type))) {
                    this.jsScrolling = true;
                    scrollToBottom(sDom, sDom.scrollHeight);
                }
                if (this.msgList.length > 0 && this.msgList[this.msgList.length - 1].is_final === true) {
                    this.userScrolling = false;
                }
            });
        }
    }
};
</script>

<style lang="less">
.client-chat::-webkit-scrollbar {
  display: none;
}

.client-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: overlay;
  padding: 0 12px;

  .loading {
    margin: 1em 0;
    width: 90px;
    &:after {
      content: ".";
      animation: ellipsis 1.5s steps(1, end) infinite;
    }
  }

  @keyframes ellipsis {
    0% { content: "."; }
    33% { content: ".."; }
    66% { content: "..."; }
    100% { content: "."; }
  }

  .qa-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
    font-weight: 400;
    font-size: 14px;
    color: var(--color-text-primary);

    .timestamp {
      font-weight: 400;
      font-size: 12px;
      line-height: 16px;
      text-align: center;
      color: var(--color-text-caption);
      margin: 16px 0;
    }

    .question-item {
      display: flex;
      align-items: center;
      width: fit-content;
      text-align: center;
      align-self: flex-end;
      padding-left: 44px;

      .qs-error {
        min-width: 16px;
        margin-right: 10px;
        color: var(--color-error-normal);
      }
      .qs-loading {
        margin-right: 10px;
      }
      .question-text {
        background: #DBE8FF; // var(--bubble-bg-myself-normal);
        border-radius: 6px;
        padding: 0 12px;
        text-align: left;
        word-break: break-all;
        word-wrap: break-word;

        code {
          white-space: break-spaces;
        }
        img {
          max-width: 80%;
        }
      }
    }

    .summary-item {
      align-self: center;
      margin: 12px 0;
    }

    .answer-item {
      display: flex;

      .contacter-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        margin-right: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .answer-info {
        position: relative;
        display: flex;
        flex-direction: column;
        padding: 0 12px;
        background: #F4F5F7; // var(--bubble-bg-each-other-normal);
        border-radius: 6px;
        width: fit-content;

        .answer-md {
          font-size: var(--body-regular);
          word-break: break-all;
          word-wrap: break-word;
          .table {
            /* 滚动条Track */
            ::-webkit-scrollbar-track {
              background: transparent;
            }

            /* Handle */
            ::-webkit-scrollbar-thumb {
              border-radius: 10px;
              background: rgba(17, 32, 70, 0.13);;
            }
          }
          img {
            max-width: 100%;
            cursor: pointer;
          }
          p {
            word-break: break-all;
            word-wrap: break-word;
          }
          code {
            white-space: break-spaces;
          }
          table {
            // display: inline-block;
            // white-space: nowrap;
            // max-width: 100%;
            // overflow: scroll;
            // background: white;
            // border-bottom: 1px solid rgba(18, 42, 79, 0.08);
            // border-right: 1px solid rgba(18, 42, 79, 0.08);
            // border-spacing: 0;
            // border-collapse: collapse;
            display: inline-block;
            overflow-x: scroll;
            background: white;
            border-spacing: 0;
            border-collapse: collapse;
            border-bottom: 1px solid rgba(18, 42, 79, 0.08);
            border-right: 1px solid rgba(18, 42, 79, 0.08);
            max-width: 100%;
            th {
              background: #eaecef;
              color: rgba(1, 11, 50, 0.41);
              // padding: 12px;
              // font-weight: 400;
              // background: #eaecef;
            }
            td, th {
              border-left: 1px solid rgba(18, 42, 79, 0.08);
              border-top: 1px solid rgba(18, 42, 79, 0.08);
            }
            td {
              padding: 8px 12px;
              min-width: 20px;
            }
          }
          .table-style {
            display: inline-block;
            white-space: nowrap;
            max-width: 100%;
            overflow: scroll;
            background: white;
            border-bottom: 1px solid rgba(18, 42, 79, 0.08);
            border-right: 1px solid rgba(18, 42, 79, 0.08);
            border-spacing: 0;
            border-collapse: collapse;
            th {
              color: rgba(1, 11, 50, 0.41);
              padding: 12px;
              font-weight: 400;
              background: #eaecef;
            }
            td, th {
              border-left: 1px solid rgba(18, 42, 79, 0.08);
              border-top: 1px solid rgba(18, 42, 79, 0.08);
            }
            td {
              padding: 8px 4px;
              min-width: 45px;
              overflow-wrap: break-word;
              white-space: break-spaces;
            }
          }
        }
        .answer-expand {
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          width: 44px;
          height: 24px;
          margin-bottom: 12px;
          background: var(--color-bg-2);
          box-shadow: var(--shadow-small-light);
          border-radius: 16px;
          align-self: center;
        }
        .stop-ws {
          color: var(--color-text-caption);
          margin-left: 5px;
        }
        .answer-source {
          margin: 12px 0;
          font-size: 14px;
          color: var(--color-text-caption);
          text-align: left;

          .v-button {
            text-decoration: none;
            text-align: left;
          }
        }
      }
    }
  }
  .qa-item:last-child {
    padding-bottom: 120px;
  }
}
</style>
