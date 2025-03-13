import '@/manage/utils/EventHub';
import '@/manage/utils/Socket';

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
