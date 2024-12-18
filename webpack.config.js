const path = require('path');

module.exports = {
    mode: "production",
    entry: path.resolve(__dirname + "/src/flxy.js"),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.bundle.js',
    },
};
