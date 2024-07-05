const express = require("express");
const router = express.Router();
const { check, validationResult, checkSchema } = require("express-validator");
const sendCodeToPhone = require("../services/sendCodeToPhone");
const jwt = require("jsonwebtoken");
const { getUserByEmail, getUserById } = require("../services/onec/users");
const logger = require("../logger");
const bcrypt = require("bcrypt");

const privateKey = process.env.JWT_SECRET;

router.get("/test-error", (req, res) => {
  try {
    throw new Error("Это тестовая ошибка для логирования");
  } catch (err) {
    logger.error("Ошибка: %s. Стек вызова: %s", err.message, err.stack);
    res.status(500).send("Произошла ошибка, она была залогирована.");
  }
});

//Первичная отправка логина и пароля-----------------------------------------
router.post(
  "/login",
  //Проверка правильности заполнения полей-----------------------------------------
  async (req, res, next) => {
    await checkSchema({
      email: { isEmail: true, errorMessage: "Поле не является Email" },
      password: {
        isLength: { options: { min: 10 } },
        errorMessage: "Пароль не может быть меньше 10 символов",
      },
    }).run(req);
    const result = validationResult(req);
    //console.log(result)
    if (!result.isEmpty()) {
      logger.error("Ошибка проверки полей: %s", JSON.stringify(result.errors));
      return res.status(400).json({ status: "error", errors: result.errors });
    }
    next();
  },

  //Проверка есть ли пользователь и верен ли пароль и отправка звонка на телефон-----------------------------------------
  async function (req, res) {
    if (!req.body.email || !req.body.password) {
      return res
        .status(400)
        .json({ status: "error", message: "нет нужной информации" });
    }
    const founduser = await getUserByEmail(req.body.email.toLowerCase());
    console.log("founduser", founduser);
    if (
      founduser &&
      (await bcrypt.compare(req.body.password, founduser.Password))
    ) {
      req.session.founduser = founduser;
      //console.log(req.session.founduser)
      try {
        req.session.pincode = await sendCodeToPhone(founduser.Phone);
        return res.json({ status: "ok", message: "Ожидается пин код" });
      } catch (error) {
        console.log(error);
        return res
          .status(500)
          .json({ status: "error", message: "Не удалось совершить звонок" });
      }
    } else {
      return res
        .status(418)
        .json({ status: "error", message: "Логин или пароль неверные" });
    }
  }
);

//Прием пинкода-----------------------------------------
router.post(
  "/logincode",
  // Проверка введенного пинкода на кол-во символов
  async (req, res, next) => {
    await checkSchema({
      pincode: {
        isLength: { options: { min: 4, max: 11 } },
        errorMessage: "Код не может быть меньше 4 символов",
      },
    }).run(req);
    const result = validationResult(req);
    //console.log(result)
    if (!result.isEmpty()) {
      logger.error("Ошибка валидации: %s", JSON.stringify(result.errors)); // Логируем ошибки валидации
      return res.status(400).json({ status: "error", errors: result.errors });
    }
    next();
  },
  // Проверка отправленного пользователем пинкода сравниваем его из сессии если все верно выдаем JWT токен
  async (req, res) => {
    //console.log(req.session)
    if (!req.body.pincode) {
      logger.error("Ошибка: нет нужной информации"); // Логируем ошибку отсутствия пинкода
      return res
        .status(400)
        .json({ status: "error", message: "нет нужной информации" });
    }
    if (!req.session.founduser) {
      logger.error("Ошибка: Не найден пользователь"); // Логируем ошибку отсутствия пользователя в сессии
      return res
        .status(400)
        .json({ status: "error", message: "Не найден пользователь" });
    }
    if (req.session.pincode == req.body.pincode) {
      const userjwt = jwt.sign(
        {
          id: req.session.founduser.Ref_Key,
          email: req.session.founduser.Email,
          phone: req.session.founduser.Phone,
        },
        privateKey,
        { expiresIn: `${process.env.JWT_LIVE_HOURS}h` }
      );
      return res.json({
        status: "ok",
        jwt: userjwt,
        userid: req.session.founduser.Ref_key,
        email: req.session.founduser.Email,
        phone: req.session.founduser.Phone,
      });
    } else {
      logger.error("Ошибка: Не верный пин код"); // Логируем ошибку неверного пинкода
      return res
        .status(418)
        .json({ status: "error", message: "Не верный пин код" });
    }
  }
);

//Проверка отправленного пользователем пинкода сравниваем его из сессии если все верно выдаем JWT токен-----------------------------------------
// router.post("/getuser", async function (req, res) {
//   if (req.body.id) {
//     try {
//       const foundUser = await getUserById(req.body.id);
//       return res.json({ status: "ok", data: foundUser });
//     } catch (error) {
//       console.log(error);
//       return res.json({ status: "error", error });
//     }
//   }
//   return res.status(400).json({ status: "error", message: "нет нужной информации" });
// });

router.post("/test", async function (req, res) {
  if (!req.body.email) {
    logger.error("Ошибка: не указан email в теле");
    return res.json("не указан email в теле");
  }
  const user = await getUserByEmail(req.body.email);
  if (user) {
    //console.log(user)
    res.json(user);
  } else {
    const errorMessage = `пользователь с email: ${req.body.email} не найден`;
    logger.error(errorMessage);
    res.json(user);
  }
});

router.post("/checkjwt", async function (req, res) {
  if (!req.body.jwt) {
    logger.error("Ошибка: не указан jwt в теле"); // Логируем ошибку отсутствия jwt
    return res.json("не указан jwt в теле");
  }
  try {
    const valid = await jwt.verify(req.body.jwt, privateKey);
    logger.info("JWT успешно проверен", { valid }); // Логируем успешную проверку JWT
    const user = await getUserById(valid.id);
    if (!user) throw new Error("Пользователь не найден");
    //console.log(valid)
    res.json({ id: user.Ref_key, email: user.Email, phone: user.Phone });
  } catch (error) {
    logger.error("Ошибка проверки JWT", { error: error.message }); // Логируем ошибку проверки JWT
    res.status(401).json({ status: "unauthorized" });
  }
});

////kjfdfghjkliuytfdfghl

module.exports = router;
