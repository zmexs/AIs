import '@/manage/utils/EventHub';

const mixin = {
    data () {
        return {};
    },
    created () {
        this.$eventHub.$register(this);
    },
    beforeDestroy () {
        this.$eventHub.$offAll(this._uid);
    }
};

export default mixin;
