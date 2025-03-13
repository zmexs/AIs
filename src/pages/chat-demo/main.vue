<template>
    <!-- demo 用户端 -->
    <div class="client-side-wrap">
        <div class="header-v2"></div>
        <div class="client-side-wrap__main main-v2">
            <div class="client-side-wrap__main-right">
                <div class="chat-wrap">
                    <div class="chat-wrap__main">
                        <div class="chat-wrap__main-header">
                            <div class="chat-header">
                                <CommonHeader/>
                            </div>
                        </div>
                        <div class="chat-wrap__main-content" :style="{ 'margin-bottom': `${chatMainMrgBottom}px` }">
                            <ClientChat @send="onSendQuestion" />
                        </div>
                        <div class="chat-wrap__main-footer">
                            <QuestionInput @send="onSendQuestion" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import './utils/sse';
import './utils/ClientData';
import CommonHeader from './components/common-header';
import ClientChat from './components/client-chat';
import QuestionInput from './components/question-input';
import { MESSAGE_TYPE, ACCESS_TYPE } from '@/constants';

export default {
    name: 'ChatDemo',
    components: {
        CommonHeader,
        ClientChat,
        QuestionInput
    },
    data () {
        return {
            chatMainMrgBottom: 140
        };
    },
    mounted () {
        console.error('【init message connect type------>】', ACCESS_TYPE);
        // 初始化数据
        if (ACCESS_TYPE === 'ws') {
            this.$clientData.init();
        } else {
            this.$SseCls.init();
        }
    },
    created () {
        // 监听用户端ws事件
        this.listenClientEvent();
    },
    methods: {
        // 监听用户端ws事件
        listenClientEvent () {
            // 监听配置信息，获取机器人和问答库可用状态
            this.$eventHub.$on('client_configChange', (res) => {
                this.isAvailable = res.is_available; // 机器人与问答库是否可用，不可用则页面展示”维护中“状态
            });
            // 监听历史记录拉取成功事件
            this.$eventHub.$on('client_msgContentChange', (res) => {
                const { chatsContent, type } = res;
                if (type === MESSAGE_TYPE.ANSWER && chatsContent.length > 0) {
                    // 主动推送记录数目录数 > 0，则隐藏欢迎页，进入绘会话页，并展示拉取的历史记录
                    this.isWeclome = false;
                }
                if (type === MESSAGE_TYPE.HISTORY && chatsContent.length > 0) {
                    // 历史记录数 > 0，则隐藏欢迎页，进入绘会话页，并展示拉取的历史记录
                    this.isWeclome = false;
                }
            });
        },
        // 发送问题上行消息
        onSendQuestion (question) {
            console.log('onSendQuestion', question);
            if (ACCESS_TYPE === 'ws') {
                this.$clientData.triggerSendMsg(question);
            } else {
                this.$SseCls.sseSendMsg(question);
            }
        }
    }
};
</script>

<style lang="less">
.client-side-wrap {
  display: flex;
  height: 100%;
  overflow-x: hidden;
  background: linear-gradient(180deg, #EAEEF6 0%, #FFFFFF 100%), #FFFFFF;
  .main-v2 {
    background: url('../../assets/img/bg-c2.png');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    .header-v2 {
      position: absolute;
      left: 0;
      .logo-img-v2 {
        padding: 50px;
        height: 24px;
        margin-bottom: 30px;
      }
      @media screen and (max-width: 1000px)  {
        .logo-img-v2 {
          display: none;
        }
      }
    }
  }
  &__main {
    position: relative;
    display: flex;
    padding: 0 100px;
    width: 100%;

    &-left {
      padding-top: 100px;

      .logo-img {
        height: 24px;
        margin-bottom: 30px;
      }
    }

    &-right {
      width: 100%;
    }
  }
}

.chat-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  &__main {
    display: flex;
    flex-direction: column;
    width: 400px;
    height: 85%;
    min-height: 700px;
    overflow: hidden;
    background: var(--color-bg-0);
    border-radius: 12px;
    // margin-right: 35%;
    // box-shadow: -4px -4px 8px rgba(255, 255, 255, 0.9), -24px -24px 48px rgba(255, 255, 255, 0.9), 24px 24px 48px rgba(18, 54, 153, 0.1);
    box-shadow: 0px 24px 48px rgba(18, 54, 153, 0.1);

    &-chat-content {
      height: calc(100% - 80px);
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
    }

    &-content {
      height: calc(100% - 80px);
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
    }
    &-footer {
      position: relative;
      z-index: 3;
    }
  }
}
</style>
