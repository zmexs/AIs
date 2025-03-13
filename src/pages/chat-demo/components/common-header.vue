<template>
    <div class="header-banner theme-QDS-dark header-banner-bg">
        <div class="banner-wrap">
            <div class="banner-wrap__left">
                <div class="left-logo">
                    <img class="robot-avatar" :src="robotAvatar" />
                </div>
                <div class="left-title">
                    <div class="main-title">
                        {{ robotName }}
                        <v-icon name="head_beta_fill" size="30" valign="-10" remote />
                    </div>
                    <div class="sub-title">智能客服demo</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CommonHeader',
    components: {
    },
    props: {
    },
    data () {
        return {
            robotName: '',
            robotAvatar: ''
        };
    },
    created () {
        // 监听配置信息，获取机器人名称
        this.$eventHub.$on('client_configChange', (res) => {
            this.robotName = res.name;
            this.robotAvatar = res.avatar;
        });
    },
    methods: {
    }
};
</script>

<style lang="less">
.header-banner {
  width: 100%;
  &.header-banner-bg {
    background: linear-gradient(271.81deg, #305AF5 0%, #309CFF 52.76%, #00D0E9 100%);
  }
  &.header-fixed {
    position: fixed;
    width: 100%;
    z-index: 10;
  }

  .banner-wrap {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    z-index: 1;
    position: relative;

    &__left {
      display: flex;
      flex-direction: row;
      align-items: center;

      .left-title {
        display: flex;
        flex-direction: column;

        .main-title {
          font-weight: 500;
          font-size: 16px;
          color: var(--color-text-primary);
        }
        .sub-title {
          font-weight: 400;
          font-size: 12px;
          color: var(--inverse-opacity-3);
          margin-top: -5px;
        }
      }
    }
  }

}

</style>
