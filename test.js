const { default: axios } = require("axios");
require('dotenv').config()
const server1c = process.env.SERVER_1C
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION
const headers = {
    "Authorization": server1c_auth
}
const startTimeScript = performance.now()
for (let index = 0; index < 1000; index++) {
    (async () => {
        
        try {
            const startTime = performance.now()
            const response = await axios.get(`http://178.177.41.170:7880/web_obmen_prototype/hs/edj/PCU/users?email=luxeivan@gmail.com`, {
                headers
            })
            const endTime = performance.now()
            console.log(response.data, ' | ', endTime - startTime)
            
        } catch (error) {
            console.log(error.message)
            return false
        }
    })()
    
}
const endTimeScript = performance.now()
console.log('END=', endTimeScript - startTimeScript)
console.log('Стас деплоит')