const path = require('path');

module.exports = {
    mode: "production",
    entry: path.resolve(__dirname + "/src/flxy.js"),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.bundle.js',
        library: 'Flxy',   
        libraryTarget: 'umd',                 // Universal module definition
        globalObject: "typeof self !== 'undefined' ? self : this", // Safe global object
        libraryExport: 'default',
    },
};
