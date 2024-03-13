const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ status: 'error', message: 'нет авторизации' })
        }
        const accessToken = authHeader.split(' ')[1];
        const userData = jwt.verify(accessToken, process.env.JWT_SECRET);
        console.log(userData)
        if (!userData) {
            return res.status(401).json({ status: 'error', message: 'нет авторизации' })
        }
        next();

    } catch (e) {
        console.log(e)
        return res.status(401).json({ status: 'error', message: 'нет авторизации' });
    }
};