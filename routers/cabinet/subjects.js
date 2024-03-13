const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router();
const { addSubject, getSubjects } = require('../../services/strapi/strapiSubjects');

// Маршрут для добавления нового субъекта
router.post('/', async (req, res) => {
  try {
    const { body, files } = req; // Допустим, вы получаете файлы и данные формы
    const subject = await addSubject(body, files); // Вызывает функцию для добавления субъекта
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Маршрут для получения списка субъектов пользователя
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader.split(' ')[1];
    const userData = jwt.verify(accessToken, process.env.JWT_SECRET);
    console.log(userData)
    const subjects = await getSubjects(userData.id);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;
