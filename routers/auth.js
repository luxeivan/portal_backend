const express = require("express");
const router = express.Router();
const { check, validationResult, checkSchema } = require("express-validator");
const sendCodeToPhone = require("../services/sendCodeToPhone");
const jwt = require("jsonwebtoken");
const { getUserByEmail, getUserById } = require("../services/onec/users");
const logger = require("../logger");
const bcrypt = require("bcrypt");

const privateKey = process.env.JWT_SECRET;

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Маршруты для аутентификации пользователей
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Логин пользователя
 *     description: Проверка логина и пароля, отправка пин-кода на телефон
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 10
 *     responses:
 *       200:
 *         description: Ожидается пин код
 *       400:
 *         description: Ошибка валидации
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post(
  "/login",
  async (req, res, next) => {
    try {
      await checkSchema({
        email: { isEmail: true, errorMessage: "Поле не является Email" },
        password: {
          isLength: { options: { min: 10 } },
          errorMessage: "Пароль не может быть меньше 10 символов",
        },
      }).run(req);
      const result = validationResult(req);
      if (!result.isEmpty()) {
        logger.error(
          "Ошибка проверки полей: %s",
          JSON.stringify(result.errors)
        );
        return res.status(400).json({ status: "error", errors: result.errors });
      }
      next();
    } catch (error) {
      logger.error(
        "Внутренняя ошибка сервера при проверке полей: %s",
        error.message
      );
      res
        .status(500)
        .json({ status: "error", message: "Внутренняя ошибка сервера" });
    }
  },
  async function (req, res) {
    try {
      if (!req.body.email || !req.body.password) {
        return res
          .status(400)
          .json({ status: "error", message: "нет нужной информации" });
      }

      const founduser = await getUserByEmail(req.body.email.toLowerCase());
      console.log("founduser", founduser);

      if (
        founduser &&
        (await bcrypt.compare(req.body.password, founduser.password))
      ) {
        req.session.founduser = founduser;
        try {
          req.session.pincode = await sendCodeToPhone(founduser.phone);
          return res.json({ status: "ok", message: "Ожидается пин код" });
        } catch (error) {
          logger.error(
            "Ошибка при отправке кода на телефон: %s",
            error.message
          );
          return res
            .status(500)
            .json({ status: "error", message: "Не удалось совершить звонок" });
        }
      } else {
        return res
          .status(418)
          .json({ status: "error", message: "Логин или пароль неверные" });
      }
    } catch (error) {
      logger.error("Ошибка при проверке пользователя: %s", error.message);
      res
        .status(500)
        .json({ status: "error", message: "Внутренняя ошибка сервера" });
    }
  }
);

/**
 * @swagger
 * /api/auth/logincode:
 *   post:
 *     summary: Проверка пин-кода
 *     description: Проверка введенного пин-кода и выдача JWT токена при успешной проверке
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pincode
 *             properties:
 *               pincode:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 11
 *     responses:
 *       200:
 *         description: Успешная проверка пин-кода, выдача JWT токена
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неверный пин-код
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post(
  "/logincode",
  async (req, res, next) => {
    try {
      await checkSchema({
        pincode: {
          isLength: { options: { min: 4, max: 11 } },
          errorMessage: "Код не может быть меньше 4 символов",
        },
      }).run(req);
      const result = validationResult(req);
      if (!result.isEmpty()) {
        logger.error("Ошибка валидации: %s", JSON.stringify(result.errors));
        return res.status(400).json({ status: "error", errors: result.errors });
      }
      next();
    } catch (error) {
      logger.error(
        "Внутренняя ошибка сервера при валидации пинкода: %s",
        error.message
      );
      res
        .status(500)
        .json({ status: "error", message: "Внутренняя ошибка сервера" });
    }
  },
  async (req, res) => {
    try {
      if (!req.body.pincode) {
        logger.error("Ошибка: нет нужной информации");
        return res
          .status(400)
          .json({ status: "error", message: "нет нужной информации" });
      }
      if (!req.session.founduser) {
        logger.error("Ошибка: Не найден пользователь");
        return res
          .status(400)
          .json({ status: "error", message: "Не найден пользователь" });
      }
      if (req.session.pincode == req.body.pincode) {
        const userjwt = jwt.sign(
          {
            id: req.session.founduser.Ref_Key,
            email: req.session.founduser.email,
            phone: req.session.founduser.phone,
          },
          privateKey,
          { expiresIn: `${process.env.JWT_LIVE_HOURS}h` }
        );
        return res.json({
          status: "ok",
          jwt: userjwt,
          userid: req.session.founduser.Ref_key,
          email: req.session.founduser.email,
          phone: req.session.founduser.phone,
        });
      } else {
        logger.error("Ошибка: Не верный пин код");
        return res
          .status(418)
          .json({ status: "error", message: "Не верный пин код" });
      }
    } catch (error) {
      logger.error(
        "Внутренняя ошибка сервера при проверке пинкода: %s",
        error.message
      );
      res
        .status(500)
        .json({ status: "error", message: "Внутренняя ошибка сервера" });
    }
  }
);

/**
 * @swagger
 * /api/auth/test:
 *   post:
 *     summary: Тестовый маршрут
 *     description: Тестовый маршрут для проверки пользователя по email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Успешный ответ
 *       400:
 *         description: Ошибка запроса
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/test", async function (req, res) {
  try {
    if (!req.body.email) {
      logger.error("Ошибка: не указан email в теле");
      return res.status(400).json("не указан email в теле");
    }

    const user = await getUserByEmail(req.body.email);
    if (user) {
      res.json(user);
    } else {
      const errorMessage = `пользователь с email: ${req.body.email} не найден`;
      logger.error(errorMessage);
      res.status(404).json(user);
    }
  } catch (error) {
    logger.error(
      `Внутренняя ошибка сервера при проверке пользователя: ${error.message}`
    );
    res
      .status(500)
      .json({ status: "error", message: "Внутренняя ошибка сервера" });
  }
});

/**
 * @swagger
 * /api/auth/checkjwt:
 *   post:
 *     summary: Проверка JWT токена
 *     description: Проверка JWT токена и возврат информации о пользователе
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jwt
 *             properties:
 *               jwt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешная проверка JWT
 *       400:
 *         description: Ошибка запроса
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/checkjwt", async function (req, res) {
  try {
    if (!req.body.jwt) {
      logger.error("Ошибка: не указан jwt в теле");
      return res.status(400).json("не указан jwt в теле");
    }

    const valid = await jwt.verify(req.body.jwt, privateKey);
    logger.info("JWT успешно проверен", { valid });
    const user = await getUserById(valid.id);
    if (!user) throw new Error("Пользователь не найден");
    res.json({ id: user.Ref_key, email: user.email, phone: user.phone });
  } catch (error) {
    logger.error("Ошибка проверки JWT", { error: error.message });
    res.status(401).json({ status: "unauthorized" });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { check, validationResult, checkSchema } = require("express-validator");
// const sendCodeToPhone = require("../services/sendCodeToPhone");
// const jwt = require("jsonwebtoken");
// const { getUserByEmail, getUserById } = require("../services/onec/users");
// const logger = require("../logger");
// const bcrypt = require("bcrypt");

// const privateKey = process.env.JWT_SECRET;

// /**
//  * @swagger
//  * /api/auth/login:
//  *   post:
//  *     summary: Логин пользователя
//  *     description: Проверка логина и пароля, отправка пин-кода на телефон
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *               - password
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 format: email
//  *               password:
//  *                 type: string
//  *                 minLength: 10
//  *     responses:
//  *       200:
//  *         description: Ожидается пин код
//  *       400:
//  *         description: Ошибка валидации
//  *       500:
//  *         description: Внутренняя ошибка сервера
//  */
// router.post(
//   "/login",
//   async (req, res, next) => {
//     try {
//       await checkSchema({
//         email: { isEmail: true, errorMessage: "Поле не является Email" },
//         password: {
//           isLength: { options: { min: 10 } },
//           errorMessage: "Пароль не может быть меньше 10 символов",
//         },
//       }).run(req);
//       const result = validationResult(req);
//       if (!result.isEmpty()) {
//         logger.error(
//           "Ошибка проверки полей: %s",
//           JSON.stringify(result.errors)
//         );
//         return res.status(400).json({ status: "error", errors: result.errors });
//       }
//       next();
//     } catch (error) {
//       logger.error(
//         "Внутренняя ошибка сервера при проверке полей: %s",
//         error.message
//       );
//       res
//         .status(500)
//         .json({ status: "error", message: "Внутренняя ошибка сервера" });
//     }
//   },
//   async function (req, res) {
//     try {
//       if (!req.body.email || !req.body.password) {
//         return res
//           .status(400)
//           .json({ status: "error", message: "нет нужной информации" });
//       }

//       const founduser = await getUserByEmail(req.body.email.toLowerCase());
//       console.log("founduser", founduser);

//       if (
//         founduser &&
//         (await bcrypt.compare(req.body.password, founduser.password))
//       ) {
//         req.session.founduser = founduser;
//         try {
//           req.session.pincode = await sendCodeToPhone(founduser.phone);
//           return res.json({ status: "ok", message: "Ожидается пин код" });
//         } catch (error) {
//           logger.error(
//             "Ошибка при отправке кода на телефон: %s",
//             error.message
//           );
//           return res
//             .status(500)
//             .json({ status: "error", message: "Не удалось совершить звонок" });
//         }
//       } else {
//         return res
//           .status(418)
//           .json({ status: "error", message: "Логин или пароль неверные" });
//       }
//     } catch (error) {
//       logger.error("Ошибка при проверке пользователя: %s", error.message);
//       res
//         .status(500)
//         .json({ status: "error", message: "Внутренняя ошибка сервера" });
//     }
//   }
// );

// /**
//  * @swagger
//  * /api/auth/logincode:
//  *   post:
//  *     summary: Проверка пин-кода
//  *     description: Проверка введенного пин-кода и выдача JWT токена при успешной проверке
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - pincode
//  *             properties:
//  *               pincode:
//  *                 type: string
//  *                 minLength: 4
//  *                 maxLength: 11
//  *     responses:
//  *       200:
//  *         description: Успешная проверка пин-кода, выдача JWT токена
//  *       400:
//  *         description: Ошибка валидации
//  *       401:
//  *         description: Неверный пин-код
//  *       500:
//  *         description: Внутренняя ошибка сервера
//  */
// router.post(
//   "/logincode",
//   async (req, res, next) => {
//     try {
//       await checkSchema({
//         pincode: {
//           isLength: { options: { min: 4, max: 11 } },
//           errorMessage: "Код не может быть меньше 4 символов",
//         },
//       }).run(req);
//       const result = validationResult(req);
//       if (!result.isEmpty()) {
//         logger.error("Ошибка валидации: %s", JSON.stringify(result.errors));
//         return res.status(400).json({ status: "error", errors: result.errors });
//       }
//       next();
//     } catch (error) {
//       logger.error(
//         "Внутренняя ошибка сервера при валидации пинкода: %s",
//         error.message
//       );
//       res
//         .status(500)
//         .json({ status: "error", message: "Внутренняя ошибка сервера" });
//     }
//   },
//   async (req, res) => {
//     try {
//       if (!req.body.pincode) {
//         logger.error("Ошибка: нет нужной информации");
//         return res
//           .status(400)
//           .json({ status: "error", message: "нет нужной информации" });
//       }
//       if (!req.session.founduser) {
//         logger.error("Ошибка: Не найден пользователь");
//         return res
//           .status(400)
//           .json({ status: "error", message: "Не найден пользователь" });
//       }
//       if (req.session.pincode == req.body.pincode) {
//         const userjwt = jwt.sign(
//           {
//             id: req.session.founduser.Ref_Key,
//             email: req.session.founduser.email,
//             phone: req.session.founduser.phone,
//           },
//           privateKey,
//           { expiresIn: `${process.env.JWT_LIVE_HOURS}h` }
//         );
//         return res.json({
//           status: "ok",
//           jwt: userjwt,
//           userid: req.session.founduser.Ref_key,
//           email: req.session.founduser.email,
//           phone: req.session.founduser.phone,
//         });
//       } else {
//         logger.error("Ошибка: Не верный пин код");
//         return res
//           .status(418)
//           .json({ status: "error", message: "Не верный пин код" });
//       }
//     } catch (error) {
//       logger.error(
//         "Внутренняя ошибка сервера при проверке пинкода: %s",
//         error.message
//       );
//       res
//         .status(500)
//         .json({ status: "error", message: "Внутренняя ошибка сервера" });
//     }
//   }
// );

// /**
//  * @swagger
//  * /api/auth/test:
//  *   post:
//  *     summary: Тестовый маршрут
//  *     description: Тестовый маршрут для проверки пользователя по email
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 format: email
//  *     responses:
//  *       200:
//  *         description: Успешный ответ
//  *       400:
//  *         description: Ошибка запроса
//  *       404:
//  *         description: Пользователь не найден
//  *       500:
//  *         description: Внутренняя ошибка сервера
//  */
// router.post("/test", async function (req, res) {
//   try {
//     if (!req.body.email) {
//       logger.error("Ошибка: не указан email в теле");
//       return res.status(400).json("не указан email в теле");
//     }

//     const user = await getUserByEmail(req.body.email);
//     if (user) {
//       res.json(user);
//     } else {
//       const errorMessage = `пользователь с email: ${req.body.email} не найден`;
//       logger.error(errorMessage);
//       res.status(404).json(user);
//     }
//   } catch (error) {
//     logger.error(
//       `Внутренняя ошибка сервера при проверке пользователя: ${error.message}`
//     );
//     res
//       .status(500)
//       .json({ status: "error", message: "Внутренняя ошибка сервера" });
//   }
// });

// /**
//  * @swagger
//  * /api/auth/checkjwt:
//  *   post:
//  *     summary: Проверка JWT токена
//  *     description: Проверка JWT токена и возврат информации о пользователе
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - jwt
//  *             properties:
//  *               jwt:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Успешная проверка JWT
//  *       400:
//  *         description: Ошибка запроса
//  *       401:
//  *         description: Неавторизован
//  *       500:
//  *         description: Внутренняя ошибка сервера
//  */
// router.post("/checkjwt", async function (req, res) {
//   try {
//     if (!req.body.jwt) {
//       logger.error("Ошибка: не указан jwt в теле");
//       return res.status(400).json("не указан jwt в теле");
//     }

//     const valid = await jwt.verify(req.body.jwt, privateKey);
//     logger.info("JWT успешно проверен", { valid });
//     const user = await getUserById(valid.id);
//     if (!user) throw new Error("Пользователь не найден");
//     res.json({ id: user.Ref_key, email: user.email, phone: user.phone });
//   } catch (error) {
//     logger.error("Ошибка проверки JWT", { error: error.message });
//     res.status(401).json({ status: "unauthorized" });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { check, validationResult, checkSchema } = require("express-validator");
// const sendCodeToPhone = require("../services/sendCodeToPhone");
// const jwt = require("jsonwebtoken");
// const { getUserByEmail, getUserById } = require("../services/onec/users");
// const logger = require("../logger");
// const bcrypt = require("bcrypt");

// const privateKey = process.env.JWT_SECRET;

// //Первичная отправка логина и пароля-----------------------------------------
// router.post(
//   "/login",
//   //Проверка правильности заполнения полей-----------------------------------------
//   async (req, res, next) => {
//     try {
//       await checkSchema({
//         email: { isEmail: true, errorMessage: "Поле не является Email" },
//         password: {
//           isLength: { options: { min: 10 } },
//           errorMessage: "Пароль не может быть меньше 10 символов",
//         },
//       }).run(req);
//       const result = validationResult(req);
//       //console.log(result)
//       if (!result.isEmpty()) {
//         logger.error(
//           "Ошибка проверки полей: %s",
//           JSON.stringify(result.errors)
//         );
//         return res.status(400).json({ status: "error", errors: result.errors });
//       }
//       next();
//     } catch (error) {
//       logger.error(
//         "Внутренняя ошибка сервера при проверке полей: %s",
//         error.message
//       );
//       res
//         .status(500)
//         .json({ status: "error", message: "Внутренняя ошибка сервера" });
//     }
//   },

//   //Проверка есть ли пользователь и верен ли пароль и отправка звонка на телефон-----------------------------------------
//   async function (req, res) {
//     try {
//       if (!req.body.email || !req.body.password) {
//         return res
//           .status(400)
//           .json({ status: "error", message: "нет нужной информации" });
//       }

//       const founduser = await getUserByEmail(req.body.email.toLowerCase());
//       console.log("founduser", founduser);

//       if (
//         founduser &&
//         (await bcrypt.compare(req.body.password, founduser.password))
//       ) {
//         req.session.founduser = founduser;
//         //console.log(req.session.founduser)
//         try {
//           req.session.pincode = await sendCodeToPhone(founduser.phone);
//           return res.json({ status: "ok", message: "Ожидается пин код" });
//         } catch (error) {
//           logger.error(
//             "Ошибка при отправке кода на телефон: %s",
//             error.message
//           );
//           return res
//             .status(500)
//             .json({ status: "error", message: "Не удалось совершить звонок" });
//         }
//       } else {
//         return res
//           .status(418)
//           .json({ status: "error", message: "Логин или пароль неверные" });
//       }
//     } catch (error) {
//       logger.error("Ошибка при проверке пользователя: %s", error.message);
//       res
//         .status(500)
//         .json({ status: "error", message: "Внутренняя ошибка сервера" });
//     }
//   }
// );

// //Прием пинкода-----------------------------------------
// router.post(
//   "/logincode",
//   // Проверка введенного пинкода на кол-во символов
//   async (req, res, next) => {
//     try {
//       await checkSchema({
//         pincode: {
//           isLength: { options: { min: 4, max: 11 } },
//           errorMessage: "Код не может быть меньше 4 символов",
//         },
//       }).run(req);
//       const result = validationResult(req);
//       //console.log(result)
//       if (!result.isEmpty()) {
//         logger.error("Ошибка валидации: %s", JSON.stringify(result.errors)); // Логируем ошибки валидации
//         return res.status(400).json({ status: "error", errors: result.errors });
//       }
//       next();
//     } catch (error) {
//       logger.error(
//         "Внутренняя ошибка сервера при валидации пинкода: %s",
//         error.message
//       );
//       res
//         .status(500)
//         .json({ status: "error", message: "Внутренняя ошибка сервера" });
//     }
//   },
//   // Проверка отправленного пользователем пинкода сравниваем его из сессии если все верно выдаем JWT токен
//   async (req, res) => {
//     try {
//       //console.log(req.session)
//       if (!req.body.pincode) {
//         logger.error("Ошибка: нет нужной информации"); // Логируем ошибку отсутствия пинкода
//         return res
//           .status(400)
//           .json({ status: "error", message: "нет нужной информации" });
//       }
//       if (!req.session.founduser) {
//         logger.error("Ошибка: Не найден пользователь"); // Логируем ошибку отсутствия пользователя в сессии
//         return res
//           .status(400)
//           .json({ status: "error", message: "Не найден пользователь" });
//       }
//       if (req.session.pincode == req.body.pincode) {
//         const userjwt = jwt.sign(
//           {
//             id: req.session.founduser.Ref_Key,
//             email: req.session.founduser.email,
//             phone: req.session.founduser.phone,
//           },
//           privateKey,
//           { expiresIn: `${process.env.JWT_LIVE_HOURS}h` }
//         );
//         return res.json({
//           status: "ok",
//           jwt: userjwt,
//           userid: req.session.founduser.Ref_key,
//           email: req.session.founduser.email,
//           phone: req.session.founduser.phone,
//         });
//       } else {
//         logger.error("Ошибка: Не верный пин код"); // Логируем ошибку неверного пинкода
//         return res
//           .status(418)
//           .json({ status: "error", message: "Не верный пин код" });
//       }
//     } catch (error) {
//       logger.error(
//         "Внутренняя ошибка сервера при проверке пинкода: %s",
//         error.message
//       );
//       res
//         .status(500)
//         .json({ status: "error", message: "Внутренняя ошибка сервера" });
//     }
//   }
// );

// router.post("/test", async function (req, res) {
//   try {
//     if (!req.body.email) {
//       logger.error("Ошибка: не указан email в теле");
//       return res.status(400).json("не указан email в теле");
//     }

//     const user = await getUserByEmail(req.body.email);
//     if (user) {
//       //console.log(user)
//       res.json(user);
//     } else {
//       const errorMessage = `пользователь с email: ${req.body.email} не найден`;
//       logger.error(errorMessage);
//       res.status(404).json(user);
//     }
//   } catch (error) {
//     logger.error(
//       `Внутренняя ошибка сервера при проверке пользователя: ${error.message}`
//     );
//     res
//       .status(500)
//       .json({ status: "error", message: "Внутренняя ошибка сервера" });
//   }
// });

// router.post("/checkjwt", async function (req, res) {
//   try {
//     if (!req.body.jwt) {
//       logger.error("Ошибка: не указан jwt в теле"); // Логируем ошибку отсутствия jwt
//       return res.status(400).json("не указан jwt в теле");
//     }

//     const valid = await jwt.verify(req.body.jwt, privateKey);
//     logger.info("JWT успешно проверен", { valid }); // Логируем успешную проверку JWT
//     const user = await getUserById(valid.id);
//     if (!user) throw new Error("Пользователь не найден");
//     //console.log(valid)
//     res.json({ id: user.Ref_key, email: user.email, phone: user.phone });
//   } catch (error) {
//     logger.error("Ошибка проверки JWT", { error: error.message }); // Логируем ошибку проверки JWT
//     res.status(401).json({ status: "unauthorized" });
//   }
// });

// module.exports = router;
