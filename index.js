const express = require('express');
const app = express();
const PORT = 3000;


app.get('/', (req, res) => {
    res.send('Hello, i\'m so fucking scared');
})


app.listen(PORT,() => {
    console.log('server zapushen');
} );