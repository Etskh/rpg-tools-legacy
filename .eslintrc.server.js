module.exports = {
    'env': {
        'browser': true,
        'commonjs': true,
        'es2020': true
    },
    'globals': {
        'process': true,
    },
    'extends': 'eslint:recommended',
    'parserOptions': {
        'ecmaVersion': 11
    },
    'rules': {
        'indent': [
            'error',
            4
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],
        'comma-dangle': [
            'error',
            'always-multiline',
        ],
    }
};
