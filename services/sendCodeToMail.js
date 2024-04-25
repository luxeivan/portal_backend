
const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT
const smtpLogin = process.env.SMTP_LOGIN
const smtpPass = process.env.SMTP_PASS

function generateRandomCode() {
  return Math.floor(Math.random() * 9001) + 1001;
}
//let testEmailAccount = await nodemailer.createTestAccount();
const sendCodeToMail = async (to) => {
const code = generateRandomCode()
  let transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: true,
    auth: {
      user: smtpLogin,
      pass: smtpPass,
    },
  });

  let result = await transporter.sendMail({
    from: 'luxeivan@yandex.ru',
    to,
    subject: 'Код для подтверждения почты',
    text: '',
    html:
      `
            <table align="center"
            background="https://ci4.googleusercontent.com/proxy/CAKZfC9bB1Jbux2RyYJ89CeIs9UEKRolMwG8WjrDDIFNy2960SQlZEnbrn6DcMz8xX2E2XM6y6Cd3JzbCMm7E-BejiUhKQ=s0-d-e1-ft#https://id-mail.s3.yandex.net/security/security.png"
            border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="background:#c5ecb8 url('https://ci4.googleusercontent.com/proxy/CAKZfC9bB1Jbux2RyYJ89CeIs9UEKRolMwG8WjrDDIFNy2960SQlZEnbrn6DcMz8xX2E2XM6y6Cd3JzbCMm7E-BejiUhKQ=s0-d-e1-ft#https://id-mail.s3.yandex.net/security/security.png') right top/auto no-repeat;background-position:right top;background-repeat:no-repeat;background-size:auto;width:50%;border-radius:32px">
            <tbody>
              <tr>
                <td style="direction:ltr;font-size:0px;padding:32px;text-align:center">    
                  <div class="m_3464614884232654678mj-column-per-100"
                    style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top" width="100%">
                      <tbody>
                        <tr>
                          <td style="font-size:0px;word-break:break-word">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="border-collapse:collapse;border-spacing:0px">
                              <tbody>
                                <tr>
                                  <td style="width:157px">
                                    <a href="https://mosoblenergo.ru" style="text-decoration:none;font-weight:500" target="_blank"
                                      data-saferedirecturl="https://www.google.com/url?q=https://passport.yandex.ru/profile&amp;source=gmail&amp;ust=1701930121757000&amp;usg=AOvVaw26d6w_DDl0ulNeGXExwpvO">
                                      <img alt="Мособлэнерго" height="auto"
                                        src="https://trustphone.ru/wa-data/public/shop/img/logo4-4.png"
                                        style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px"
                                        width="157" class="CToWUd" data-bit="iit">
                                    </a>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-size:0px;word-break:break-word">
                            <div style="height:50px;line-height:50px"> </div>
                          </td>
                        </tr>          
                        <tr>
                          <td style="font-size:0px;word-break:break-word">
                            <div
                              style="font-family:YS Text,Arial,sans-serif;font-size:13px;line-height:1;text-align:left;color:#262633">
                              <h1 style="font-size:24px;line-height:32px;margin:0 0 16px 0;font-weight:500">
                               Код: <span style="font-size:32px;font-weight:700">${code}</span>
                              </h1>
                            </div>
                          </td>
                        </tr>          
                      </tbody>
                    </table>
          
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
                `,
  });

  //console.log(result);
  return code

}
module.exports = sendCodeToMail;