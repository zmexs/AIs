/**
 * 获取 location hash 参数
 * @param {string} variable 参数名
 * @returns {string} 参数值
 */
export const getQueryVariable = (variable) => {
    const query = window.location.hash.split('?');

    if (query.length < 2) {
        return '';
    }

    const vars = query[1].split('&');

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        if (pair[0] === variable) {
            return decodeURI(pair[1]);
        }
    }
    return '';
};

/**
 * 滚动至指定dom底部
 */
export const scrollToBottom = (sDom, sTop) => {
    if (!sDom) return;

    sDom.scrollTo({
        top: sTop
        // behavior: 'smooth'
    });
};

/**
 * 数组去重
 */
export const arrayUnique = (arr, replaceKey, holdKey) => {
    let temp = {};

    return arr.reduce((prev, cur) => {
        if (!temp[cur[replaceKey]]) {
            temp[cur[replaceKey]] = {index: prev.length};
            prev.push(cur);
        } else {
            const oldItem = temp[cur[replaceKey]];
            cur[holdKey] = oldItem[holdKey];
            prev.splice(oldItem['index'], 1, cur);
        }

        return prev;
    }, []);
};

export const generateRequestId = (length = 10) => {
    const data =
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F',
            'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y',
            'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
            's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    let nums = '';
    for (let i = 0; i < length; i++) {
        const r = parseInt(Math.random() * 61, 10);
        nums += data[r];
    }
    return nums + '-' + parseInt(Math.random() * 10000000000, 10);
};

function escapeHtml (str) {
    return str.replace(/[&<>"'/]/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        }[match];
    });
}

export const escapeUserInput = (input) => {
    const parts = input.split(/(<script[^>]*>.*?<\/script>|<[^>]*>)/gi);
    return parts.map(part => {
        if (part.startsWith('<script')) {
            return escapeHtml(part);
        } else if (part.startsWith('<')) {
            return escapeHtml(part);
        } else {
            return part;
        }
    }).join('');
};
