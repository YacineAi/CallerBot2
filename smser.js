const axios = require("axios");
const helpers = require("./phoner");
const Botly = require("botly");
const botly = new Botly({
  accessToken: process.env.PAGE_ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  webHookPath: process.env.WB_PATH,
  notificationType: Botly.CONST.REGULAR,
  FB_URL: "https://graph.facebook.com/v13.0/",
});
/* ----- DB ----- */
const { Deta } = require("deta");
const deta = Deta();
const db = deta.Base("cbot2");
/* ----- DB ----- */
const { generateRandomString, getModelAndManufacturer, getOSVersion } = helpers;
const axiosInstance = axios.create({
  headers: {
    clientSecret: 'lvc22mp3l1sfv6ujg83rd17btt',
    'User-Agent': 'Truecaller/11.7.5 (Android;6.0)',
    'Content-Type': 'application/json'
  },
});

const sendSMS = (senderId, phone, country, phonecode) => {
  var deviceDetails = getModelAndManufacturer();
  const deviceData = {
    countryCode: country,
    dialingCode: phonecode,
    installationDetails: {
      app: {
        buildVersion: 6,
        majorVersion: 10,
        minorVersion: 57,
        store: "GOOGLE_PLAY",
      },
      device: {
        deviceId: generateRandomString(16),
        language: "en",
        manufacturer: deviceDetails.manufacturer,
        model: deviceDetails.model,
        osName: "Android",
        osVersion: getOSVersion(),
      },
      language: "en",
    },
    region: "region-2",
    sequenceNo: 3
  };
  axiosInstance.post(`https://account-asia-south1.truecaller.com/v2/sendOnboardingOtp`, deviceData)
    .then(async (response) => {
      if (response.data.status == 1) {
       console.log(response.data)
        const smsTimer = new Date().getTime() + 5 * 60 * 1000;
        await db.update({phone: phone, smsed: true, lastsms: smsTimer, smsid: response.data.requestId}, senderId)
          .then((data) => {
            botly.sendText({
              id: senderId,
              text: `تم إرسال الرمز الى ${phone} الرجاء نسخ الرمز المتكون من 6 ارقام و إرساله للصفحة ستنتهي صلاحية الرمز بعد 5 دقائق ⏱️`,
            });
          });
      } else {
        botly.sendText({
          id: senderId,
          text: "يبدو أن الرقم الذي ادخلته غير صالح للاستعمال ✋❎ الرجاء استخدام رقم اخر",
        });
      }
    })
    .catch(function (rej) {
      botly.sendText({
        id: senderId,
        text: "يبدو أن الرقم الذي ادخلته غير موجود اصلا ✋❎ الرجاء استخدام رقم يستقبل رسائل",
      });
    });
};

const verifySMS = (senderId, phone, country, phonecode, smsid, vercode) => {
  const verifyData = {
    countryCode: country,
    dialingCode: phonecode,
    phoneNumber: phone,
    requestId: smsid,
    token: vercode,
  };
  axiosInstance.post(`https://account-asia-south1.truecaller.com/v1/verifyOnboardingOtp`, verifyData)
    .then(async (response) => {
      if (response.data.status == 2) {
        await db.update({ token: response.data.installationId }, senderId)
          .then((data) => {
            botly.sendButtons({
              id: senderId,
              text: "نجاح ✅☺️. تم التحقق من الرمز و توثيق حسابك ☑️. يمكنك البحث بكل حرية أو مشاهدة صور الاخرين ان كانت موجودة.",
              buttons: [botly.createPostbackButton("البروفايل 📁", "profile")],
            });
          });
      } else {
        botly.sendText({
          id: senderId,
          text: "كود التحقق الذي ادخلته غير صحيح ✋❎ الرجاء ادخال الرقم الصحيح الذي وصلك كرسالة.",
        });
      }
    });
};

exports.sendSMS = sendSMS;
exports.verifySMS = verifySMS;
