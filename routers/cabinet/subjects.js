const express = require('express');
const router = express.Router();
const { addSubject, getSubjects } = require('../services/strapi');

// Маршрут для добавления нового субъекта
router.post('/subjects', async (req, res) => {
  try {
    const { body, files } = req; // Допустим, вы получаете файлы и данные формы
    const subject = await addSubject(body, files); // Вызывает функцию для добавления субъекта
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Маршрут для получения списка субъектов пользователя
router.get('/subjects', async (req, res) => {
  try {
    const userId = req.session.userId; // Допустим, userID сохраняется в сессии
    const subjects = await getSubjects(userId);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;
