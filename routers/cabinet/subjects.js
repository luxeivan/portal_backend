const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router();
const { addSubject, getSubjects, getSubjectItem } = require('../../services/strapi/strapiSubjects');

// Маршрут для добавления нового субъекта
router.post('/', async (req, res) => {
  try {
    const userId = req.userId
    const { body } = req;
    const subject = await addSubject(body, userId); // Вызывает функцию для добавления субъекта
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Маршрут для получения списка субъектов пользователя
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader.split(' ')[1];
    const userData = jwt.verify(accessToken, process.env.JWT_SECRET);
    //console.log(userData)
    const subjects = await getSubjects(userData.id);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Маршрут для получения одного субъекта
router.get('/:id', async (req, res) => {
  try {
    const userId = req.userId
    const idSubject = req.params.id
    const subject = await getSubjectItem(idSubject);
    if(subject.attributes.profil.data.id===userId){
      subject.attributes.profil = undefined
      res.json(subject);
    }else{
      res.status(404).json({status:"error", message: 'субъект с данным id не найден' });
    }
  } catch (error) {
    //console.log(error.message)
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
