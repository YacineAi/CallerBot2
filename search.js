const Botly = require("botly");
const axios = require("axios");
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

const searchPhone = async (senderId, country, query) => {
  var tokens = await db.fetch({ "token?pfx": "a" });
  var random = Math.floor(Math.random() * tokens.items.length);
  const token = tokens.items[random].token;
  var research = function (token) {
    axios
      .get(
        `https://search5-noneu.truecaller.com/v2/bulk?q=${query}&countryCode=${country}&type=14&encoding=json`,
        {
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
        }
      )
      .then(
        (response) => {
          if (response.data.data[0]) {
            if (response.data.data[0].value.name) {
              botly.sendGeneric({
                id: senderId,
                elements: {
                  title: response.data.data[0].value.name,
                  image_url: "https://i.ibb.co/VTXKnYJ/gardencallerbot.png",
                  subtitle: `${response.data.data[0].value.phones[0].carrier} | ${response.data.data[0].value.phones[0].nationalFormat}`,
                  buttons: [
                    botly.createPostbackButton("الإعدادات ⚙️", "profile"),
                    botly.createPostbackButton("تسجيل برقم الهاتف 📱", "paid"),
                  ],
                },
                aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL,
              });
              /*
              axios({
                method: "POST",
                url: `https://${country}.dzjs.repl.co/save`,
                headers: { "content-type": "application/json" },
                data: response.data.data[0],
              });*/
            } else {
              botly.sendText({
                id: senderId,
                text: "لم يتم العثور على صاحب 👤 هذا الرقم 🙄",
              });
            }
          } else {
            botly.sendText({
              id: senderId,
              text: "لم يتم العثور على صاحب 👤 هذا الرقم 🙄",
            });
          }
        },
        (error) => {
          //console.log(error.response.data);
          const retry = async () => {
            var retokens = await db.fetch({ "token?pfx": "a" });
            var rerandom = Math.floor(Math.random() * retokens.items.length);
            var retoken = retokens.items[rerandom].token;
            research(retoken);
          };
          retry();
        }
      );
  };
  research(token);
};
exports.searchPhone = searchPhone;
