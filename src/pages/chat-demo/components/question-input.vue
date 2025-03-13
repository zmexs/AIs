<template>
    <div class="question-input" :style="{ width: `${questionInputWith}px`, bottom: `${questionInputBottom}px` }">
        <!-- 停止生成 -->
        <div class="stop-button" v-if="isGeneratingReply">
            <v-button icon="basic_stop_line" remote @click="onStopStream">停止生成</v-button>
        </div>
        <div v-if="disableInput[currentVisitorId]" class="question-mask"></div>
        <div :class="['question-input-inner', { 'inputFocus': inputFocus, 'disabled': isGeneratingReply || isThinking }]">
            <v-textarea @focus="updateFocus(true)" @blur="updateFocus(false)"
                        :readonly="disableInput[currentVisitorId] || isGeneratingReply || isThinking" v-model="question"
                        @keydown.native="onPressEnter($event)" :placeholder="disableInput[currentVisitorId] ? '已结束会话' : '请输入'"
                        :autofocus="true" :autoheight="true" class="question-input-inner__textarea"></v-textarea>
            <div class="question-input-inner__toolbar">
                <div class="toolbar-left"></div>
                <div class="toolbar-right">
                    <div :class="['send-icon', { 'disabled': isSendIconDisabled || disableInput[currentVisitorId] }]">
                        <v-icon name="basic_send_fill" size="20" @click="onSendQuestion" v-tip:sendMsg.hover remote></v-icon>
                        <v-tip ref="sendMsg" size="small" placement="top">发送</v-tip>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import elementResizeDetectorMaker from 'element-resize-detector';
import { scrollToBottom, escapeUserInput } from '@/utils/util';
import { MESSAGE_TYPE, ACCESS_TYPE } from '@/constants';

export default {
    name: 'QuestionInput',
    components: {
    },
    props: {
        currentVisitorId: {
            msgData: {
                type: Number,
                default: 0
            }
        }
    },
    data () {
        return {
            isSendIconDisabled: true,
            questionInputWith: 360,
            questionInputBottom: 0,
            question: '',
            inputFocus: false,
            disableInput: {},
            isGeneratingReply: false, // 是否生成回答中
            isThinking: false // 是否思考中
        };
    },
    created () {
    // 监听答案消息队列变更事件, 判断是否正在思考/正在生成答案
        this.$eventHub.$on('client_msgContentChange', (res) => {
            const { chatsContent, type } = res;
            if (type !== MESSAGE_TYPE.ANSWER) return;
            this.isGeneratingReply = !!chatsContent.find(r => r.is_final === false);
            this.isThinking = chatsContent.length > 0 && res.chatsContent[res.chatsContent.length - 1].loading_message;
        });
    },
    mounted () {
        const erd = elementResizeDetectorMaker();
        const questionInputParentDom = document.querySelector('.question-input').parentElement;

        // 输入框宽度
        erd.listenTo(questionInputParentDom, (element) => {
            this.questionInputWith = element.clientWidth;
        });

        // 输入框bootom间距（坐席端置底无需处理，用户端需计算）
        if (this.webIMSource === 'client') {
            const bodyDom = document.body;
            const chatWrapperDom = document.querySelector('.chat-wrap__main');

            erd.listenTo(bodyDom, () => {
                this.questionInputBottom = bodyDom.clientHeight > chatWrapperDom.clientHeight ? (bodyDom.clientHeight - chatWrapperDom.clientHeight) / 2 : 0;
            });
        }
    },
    methods: {
        updateFocus (isFocus) {
            console.log('updateFocus', isFocus);
            this.inputFocus = isFocus;
        },
        // 回车键
        onPressEnter (event) {
            if (event.keyCode === 13) {
                if (!event.metaKey) {
                    event.preventDefault();
                    this.onSendQuestion();
                } else {
                    this.question = this.question + '\n';
                }
            }
        },
        // 发送问题
        onSendQuestion () {
            if (this.disableInput[this.currentVisitorId]) return;
            if (!this.question.trim()) {
                return;
            }
            this.$emit('send', escapeUserInput(this.question));
            this.question = '';

            // 问题发出后，对话框立即滚动至底部
            this.$nextTick(() => {
                const sDom = document.querySelector('.client-chat');
                if (!sDom) return;
                scrollToBottom(sDom, sDom.scrollHeight);
            });
        },
        // 停止生成
        onStopStream () {
            if (ACCESS_TYPE === 'ws') {
                this.$clientData.stopGeneration();
            } else {
                this.$SseCls.stopGeneration();
            }

            this.isGeneratingReply = false;
        }
    },
    watch: {
        question (val) {
            if (val.trim()) {
                this.isSendIconDisabled = false;
            } else {
                this.isSendIconDisabled = true;
            }
        }
    }
};
</script>

<style lang="less">
.question-input {
  position: fixed;
  // margin-top: -110px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;

  .toolbar-info {
    display: inline-block;
    font-weight: 400;
    font-size: 12px;
    color: var(--color-text-caption);

    .red-txt {
      color: red;
    }
  }

  .stop-button {
    display: flex;
    justify-content: center;

    button {
      box-shadow: var(--shadow-small);
      border: none;
      padding: 6px 8px;
    }
  }

  .question-mask {
    width: 100%;
    height: 110px;
    position: absolute;
    z-index: 200;
    background: rgba(255, 255, 255, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bolder;
  }

  &-inner {
    display: flex;
    flex-direction: column;
    margin: 12px;
    background-color: rgba(255, 255, 255, 0.8);
    border: var(--border-normal) solid;
    border-color: var(--color-border-normal);
    border-radius: var(--radius-large);

    .v-textarea--default {
      border-radius: var(--radius-large);
    }

    &:has(.question-input-inner),
    &:has(.v-textarea--focus),
    &.inputFocus {
      border-color: var(--color-primary-normal);
    }

    &.disabled {
      background-color: var(--color-fill-disable);
      border-color: var(--color-border-disable) !important;

      .v-textarea__placeholder {
        color: var(--color-text-disable);
      }
    }

    &__textarea {
      width: 100%;
      max-height: 120px;
      border: none;
      background: none;

      .v-textarea__txt {
        overflow-y: overlay;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Helvetica, Arial, PingFang SC, Microsoft YaHei, Noto Sans, sans-serif !important;
      }
    }

    .v-textarea--focus {
      border: none;
    }

    &__toolbar {
      display: flex;
      justify-content: space-between;
      z-index: 10;
      margin: 8px;

      .v-icon {
        cursor: pointer;
      }

      .toolbar-left {
        display: flex;

        .v-icon {
          &.disabled {
            cursor: not-allowed;
            color: var(--color-text-disable);
          }

          padding: 6px;
        }
      }

      .toolbar-right {
        display: flex;
        gap: 4px;

        .stop-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          padding: 6px;
        }

        .send-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
        }

        .send-icon {
          color: var(--color-primary-normal);
        }

        .stop-icon:hover,
        .send-icon:hover {
          background: var(--color-fill-hover);
          border-radius: 3px;
        }

        .stop-icon:active,
        .send-icon:active {
          background: var(--color-fill-active);
          border-radius: 3px;
        }

        .stop-icon.disabled,
        .send-icon.disabled {
          background: none;
          cursor: not-allowed;

          .v-icon {
            cursor: not-allowed;
            color: var(--color-text-disable);
          }
        }

        .split-line {
          align-self: center;
          width: 1px;
          height: 16px;
          background: var(--color-divider-normal);
          margin: 0 5px;
        }
      }
    }
  }
}
</style>
