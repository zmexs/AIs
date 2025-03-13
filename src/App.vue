<template>
    <div id="app">
        <router-view/>
    </div>
</template>

<script>

export default {
    name: 'App',
    created () {
    }
};
</script>

<style lang="less">
@import './styles/common.less';

#app {
    text-align: left;
    height: 100%;
}
.robot-avatar {
  width: 32px;
  height: 32px;
  margin-top: 5px;
  border-radius: 32px;
  vertical-align: middle;
  margin-right: 10px;
}
html,
body {
    margin: 0;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial,"PingFang SC","Microsoft YaHei","Noto Sans",sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
a {
    color: var(--color-primary-normal);
}
</style>
