const express = require("express")

const path = require("path")

const app = express()

const port = process.env.PORT || 8080

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'))
})

app.use(express.static(__dirname));

app.listen(port)
console.log("Aplicação rodando em 'http://localhost:"+port+"'")