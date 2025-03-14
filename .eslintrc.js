// https://eslint.org/docs/user-guide/configuring

module.exports = {
    root: true,
    parserOptions: {
      parser: 'babel-eslint'
    },
    env: {
      browser: true,
    },
    extends: [
      // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
      // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
      'plugin:vue/essential', 
      // https://github.com/standard/standard/blob/master/docs/RULES-en.md
      'standard'
    ],
    // required to lint *.vue files
    plugins: [
      'vue'
    ],
    // add your custom rules here
    rules: {
      indent: ['warn', 4],
      camelcase: 'off', 
      'vue/html-indent': ['warn', 4],
      'semi': ['error', 'always'],
      "template-curly-spacing" : "off",
      "indent": ["warn", 4, {
        "ignoredNodes": ["TemplateLiteral"]
      }]
    },
  }
  