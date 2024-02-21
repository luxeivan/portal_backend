const express = require('express')
const cors = require('cors');
const fs = require('fs');
const http = require('http')
const https = require('https')

const auth = require('./routers/auth')
const registration = require('./routers/registration')
const session = require('express-session');
const bodyParser = require('body-parser');
const sendMail = require('./routers/sendmail');
const FileStore = require('session-file-store')(session);


const options = {
    cert: fs.readFileSync('./ssl/luxeivan.ru_cert.pem'),
    key: fs.readFileSync('./ssl/luxeivan.ru_private_key.pem')
};


const app = express()
app.set('trust proxy', 1)
app.use(cors({credentials: true, origin: true}));
app.use(
    session({
        cookie: {
            httpOnly: false,
            maxAge: 100000
        },
        store: new FileStore({ retries: 1 }),
        secret: 'secret123435667gfgghfgfggfg',
        saveUninitialized: true,
    })
)
app.use(bodyParser.json())
//app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', auth)
app.use('/api/registration', registration)
app.use('/api/sendmail', sendMail)

const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);
httpServer.listen(5000);
httpsServer.listen(5443);

// app.listen(5000, () => {
//     console.log('Listen port 5000...')
// })