const compressor = require('node-minify');

compressor.minify({
    compressor: 'gcc',
    input: 'src/scripts/*.js',
    output: 'public/js/$1.js',
});