const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const axios = require("axios");
const moment = require("moment");
const Botly = require("botly");
const smser = require("./smser");
const search = require("./search");
const quote = require("./quotes");
const PageID = "108853885138709";
const botly = new Botly({
    accessToken: process.env.PAGE_ACCESS_TOKEN,
    verifyToken: process.env.VERIFY_TOKEN,
    webHookPath: process.env.WB_PATH,
    notificationType: Botly.CONST.REGULAR,
    FB_URL: "https://graph.facebook.com/v13.0/",
  });

async function searcher(senderId, query, country, token) {
    axios.get(`https://search5-noneu.truecaller.com/v2/bulk?q=${query}&countryCode=${country}&type=14&encoding=json`, { headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      }})
      .then(response => {
          if (response.data.data[0] != null) {
            if (response.data.data[0].value.name) {
              if (response.data.data[0].value.image) {
                botly.sendGeneric({
                  id: senderId,
                  elements: {
                    title: response.data.data[0].value.name,
                    image_url: response.data[0].value.image,
                    subtitle: `${response.data.data[0].value.phones[0].carrier} | ${response.data.data[0].value.phones[0].nationalFormat}`,
                    buttons: [
                      botly.createWebURLButton(
                        "WhatsApp 📞",
                        `wa.me/${response.data.data[0].value.phones[0].e164Format}`
                      ),
                      botly.createPostbackButton("الإعدادات ⚙️", "profile"),
                    ],
                  },
                  aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.SQUARE,
                });
              } else {
                botly.sendGeneric({
                  id: senderId,
                  elements: {
                    title: response.data.data[0].value.name,
                    image_url: "https://i.ibb.co/StcT5v2/unphoto.jpg",
                    subtitle: `${response.data.data[0].value.phones[0].carrier} | ${response.data.data[0].value.phones[0].nationalFormat}`,
                    buttons: [
                      botly.createWebURLButton(
                        "WhatsApp 📞",
                        `wa.me/${response.data.data[0].value.phones[0].e164Format}`
                      ),
                      botly.createPostbackButton("الإعدادات ⚙️", "profile"),
                    ],
                  },
                  aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.SQUARE,
                });
              }
             /* axios({
                method: "POST",
                url: `https://${country}.dzjs.repl.co/save`,
                headers: { "content-type": "application/json" },
                data: response.data.data[0],
              });
              */
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
      }, error => {
        if (error.response.data == "too many requests") {
            console.log(error.response.data); 
        }
      });
}

/* ----- DB ----- */
const { Deta } = require('deta');
const deta = Deta();
const db = deta.Base('users');
/* ----- DB ----- */
app.get("/", function (_req, res) {
    res.sendStatus(200);
  });
  app.use(
    bodyParser.json({
      verify: botly.getVerifySignature(process.env.APP_SECRET),
    })
  );
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/webhook", botly.router());

botly.on("message", async (senderId, message, data) => {
    const user = await db.get(senderId);
    const timer = new Date().getTime() + 24 * 60 * 60 * 1000;
    const time = new Date().getTime();
    if (message.message.text) {
      const nume = message.message.text.replace(/\D/g, "");
      const isnum = /^\d+$/.test(nume);
      if (message.message.text == "البروفيل") {
        if (user.mode == "free") {
          botly.sendButtons({
            id: senderId,
            text: `البلد الحالي 🌐 : ${user.country}\nنوع الحساب 💬 : ${user.mode}\nعمليات البحث 🔍 : (${user.searchnums}/10)`,
            buttons: [botly.createPostbackButton("تغيير البلد 🌐", "recountry")],
          });
        } else if (user.mode == "paid") {
          botly.sendButtons({
            id: senderId,
            text: `البلد الحالي 🌐 : ${user.country}\nنوع الحساب 💬 : ${user.mode}`,
            buttons: [
              botly.createPostbackButton("تغيير البلد 🌐", "recountry"),
              botly.createPostbackButton("حذف حسابي ❎", "delaccount"),
            ],
          });
        } else {
          botly.sendText({ id: senderId, text: "حسابك غير موجود اصلا" });
        }
      } else if (message.message.text == "com1") {
        //
      } else if (message.message.text == "com2") {
        //eval(search.searchPhone(senderId, user.country, "0663712471", user.searchnums));
      } else {
        if (user != null) {
          if (user.country == null) {
            botly.sendText({
              id: senderId,
              text: "لم يتم إختيار البلد! الرجاء اختيار البلد الخاص بك 🌍",
              quick_replies: [
                botly.createQuickReply("الجزائر 🇩🇿", "dz"),
                botly.createQuickReply("المغرب 🇲🇦", "ma"),
                botly.createQuickReply("تونس 🇹🇳", "tn"),
                botly.createQuickReply("ليبيا 🇱🇾", "ly"),
                botly.createQuickReply("مصر 🇪🇬", "eg"),
                botly.createQuickReply("الاردن 🇯🇴", "jo"),
                botly.createQuickReply("السودان 🇸🇩", "sd"),
                botly.createQuickReply("سوريا 🇸🇾", "sy"),
                botly.createQuickReply("العراق 🇮🇶", "iq"),
                botly.createQuickReply("بولندا", "pl"),
                botly.createQuickReply("موريتانيا 🇲🇷", "mr"),
                botly.createQuickReply("قطر 🇶🇦", "qa"),
                botly.createQuickReply("اليمن 🇾🇪", "ye"),
              ],
            });
          } else if (user.mode == "free") {
            if (time < user.lastsearch) {
              if (user.searchnums >= 10) {
                botly.sendButtons({
                  id: senderId,
                  text: "انتهت عمليات البحث الخاصة بك ✋ يرجى الانتظار حتى غدا (24 ساعة ⏱️) او التسجيل برقم هاتفك للحصول على عدد غير محدود من عمليات البحث",
                  buttons: [
                    botly.createPostbackButton("تسجيل برقم الهاتف 📱", "paid"),
                  ],
                });
              } else {
                const add = user.searchnums + 1;
                if (isnum == true) {
                    await db.update({lastsearch: timer, searchnums: add}, senderId)
                    .then((data) => {
                        eval(
                            search.searchPhone(
                              senderId,
                              user.country,
                              message.message.text
                            )
                          );
                    });
                } else {
                  botly.sendText({
                    id: senderId,
                    text: "يرجى إدخال أرقام هواتف فقط 😺 للبحث عنها.",
                  });
                }
              }
            } else if (time > user.lastsearch) {
              if (isnum == true) {
                await db.update({lastsearch: timer, searchnums: 1}, senderId)
                    .then((data) => {
                        eval(
                            search.searchPhone(
                              senderId,
                              user.country,
                              message.message.text,
                              user.searchnums
                            )
                          );
                    });
              } else {
                botly.sendText({
                  id: senderId,
                  text: "يرجى إدخال أرقام هواتف فقط 😺 للبحث عنها.",
                });
              }
            }
          } else if (user.mode == "paid") {
            if (user.token == null) {
              if (user.phone == null) {
                if (isnum == true) {
                  botly.sendButtons({
                    id: senderId,
                    text: `هل تؤكد أن هذا ${message.message.text} هو رقمك الصحيح ؟ 🤔`,
                    buttons: [
                      botly.createPostbackButton(
                        "نعم ✅",
                        `cn-${message.message.text}`
                      ),
                      botly.createPostbackButton("لا ❎", "rephone"),
                    ],
                  });
                } else {
                  botly.sendButtons({
                    id: senderId,
                    text: "لم يتم العثور على رقمك! المرجو كتابة رقم هاتفك الصحيح ✅😺",
                    buttons: [
                      botly.createPostbackButton("العودة للمجاني ⬇️", "free"),
                    ],
                  });
                }
              } else if (user.phone != null && user.smsid != null && user.smsed == true) {
                const time = new Date().getTime();
                if (time < user.lastsms) {
                  if (isnum == true && message.message.text.length == 6) {
                    eval(
                      smser.verifySMS(
                        senderId,
                        user.phone,
                        user.country,
                        user.phonecode,
                        user.smsid,
                        message.message.text
                      )
                    );
                  } else {
                    botly.sendButtons({
                      id: senderId,
                      text: "الرقم خاطئ ❎ قم بإدخال الرقم الصحيح المتكون من 6 أرقام ✅👌",
                      buttons: [
                        botly.createPostbackButton("العودة للمجاني ⬇️", "free"),
                      ],
                    });
                  }
                } else if (time > user.lastsms) {
                    await db.update({phone: null, smsid: null, lastsms: time, smsed: false}, senderId)
                    .then((data) => {
                        botly.sendText({
                            id: senderId,
                            text: "انتهى وقت إدخال رقم التحقق 😓 الرجاء إدخال رقم هاتف اخر و اعادة المحاولة 🔄",
                          });
                    });
                }
              }
            } else {
              if (isnum == true) {
                searcher(
                  senderId,
                  message.message.text,
                  user.country,
                  user.token
                );
              } else {
                botly.sendText({
                  id: senderId,
                  text: "الرجاء إدخال ارقام هواتف فقط 🙄📲",
                });
              }
            }
          }
        } else {
            await db.put({mode: "free", lastsearch: timer, searchnums: 0}, senderId)
                    .then((data) => {
                        botly.sendText({
                            id: senderId,
                            text: "أهلا بك في كالربوت ✨🌙 يمكنك إدخال اي رقم هاتف 📞 و سأجلب لك إسمه. لكن عليك اولا إختيار بلدك 😊👇",
                            quick_replies: [
                              botly.createQuickReply("الجزائر 🇩🇿", "dz"),
                              botly.createQuickReply("المغرب 🇲🇦", "ma"),
                              botly.createQuickReply("تونس 🇹🇳", "tn"),
                              botly.createQuickReply("ليبيا 🇱🇾", "ly"),
                              botly.createQuickReply("مصر 🇪🇬", "eg"),
                              botly.createQuickReply("الاردن 🇯🇴", "jo"),
                              botly.createQuickReply("السودان 🇸🇩", "sd"),
                              botly.createQuickReply("سوريا 🇸🇾", "sy"),
                              botly.createQuickReply("العراق 🇮🇶", "iq"),
                              botly.createQuickReply("بولندا", "pl"),
                              botly.createQuickReply("موريتانيا 🇲🇷", "mr"),
                              botly.createQuickReply("قطر 🇶🇦", "qa"),
                              botly.createQuickReply("اليمن 🇾🇪", "ye"),
                            ],
                          });
                    });
        }
      }
    } else if (message.message.attachments[0].payload.sticker_id) {
      console.log(message.message.attachments[0].payload.sticker_id);
     // botly.sendText({ id: senderId, text: "(Y)" });
    } else if (message.message.attachments[0].type == "image") {
      botly.sendText({
        id: senderId,
        text: "للأسف. لا يمكنني البحث بالصور 📷🤔 يرجى استعمال الارقام فقط",
      });
    } else if (message.message.attachments[0].type == "audio") {
      botly.sendText({
        id: senderId,
        text: "أنا غير قادر على البحث بالصوت 🎙 المرجو استعمال ارقام الهواتف فقط",
      });
    } else if (message.message.attachments[0].type == "video") {
      botly.sendText({
        id: senderId,
        text: "لا. هذا فيديو! 😴🎥 لا يمكنني البحث بالفيديوهات. يرجى استعمال ارقام الهواتف فقط",
      });
    }
    //  e n d  //
});

botly.on("postback", async (senderId, message, postback, data, ref) => {
    // s t a r t  //
    const user = await db.get(senderId);
    const time = new Date().getTime();
    if (message.postback) {
      // Normal (buttons)
      if (postback == "START") {
        if (user != null) {
          botly.sendText({
            id: senderId,
            text: "مرحبا بك مرة اخرى في كالربوت 😀💜",
          });
        } else {
            await db.put({mode: "free", lastsearch: time, searchnums: 0}, senderId)
                    .then((data) => {
                        botly.sendText({
                            id: senderId,
                            text: "أهلا بك في كالربوت ✨🌙 يمكنك إدخال اي رقم هاتف 📞 و سأجلب لك إسمه. لكن عليك اولا إختيار بلدك 😊👇",
                            quick_replies: [
                              botly.createQuickReply("الجزائر 🇩🇿", "dz"),
                              botly.createQuickReply("المغرب 🇲🇦", "ma"),
                              botly.createQuickReply("تونس 🇹🇳", "tn"),
                              botly.createQuickReply("ليبيا 🇱🇾", "ly"),
                              botly.createQuickReply("مصر 🇪🇬", "eg"),
                              botly.createQuickReply("الاردن 🇯🇴", "jo"),
                              botly.createQuickReply("السودان 🇸🇩", "sd"),
                              botly.createQuickReply("سوريا 🇸🇾", "sy"),
                              botly.createQuickReply("العراق 🇮🇶", "iq"),
                              botly.createQuickReply("بولندا", "pl"),
                              botly.createQuickReply("موريتانيا 🇲🇷", "mr"),
                              botly.createQuickReply("قطر 🇶🇦", "qa"),
                              botly.createQuickReply("اليمن 🇾🇪", "ye"),
                            ],
                          });
                    });
        }
      } else if (postback == "profile") {
        if (user.mode == "free") {
          botly.sendButtons({
            id: senderId,
            text: `البلد الحالي 🌐 : ${user.country}\nنوع الحساب 💬 : ${user.mode}\nعمليات البحث 🔍 : (${user.searchnums}/10)`,
            buttons: [botly.createPostbackButton("تغيير البلد 🌐", "recountry")],
          });
        } else if (user.mode == "paid") {
          botly.sendButtons({
            id: senderId,
            text: `البلد الحالي 🌐 : ${user.country}\nنوع الحساب 💬 : ${user.mode}`,
            buttons: [
              botly.createPostbackButton("تغيير البلد 🌐", "recountry"),
              botly.createPostbackButton("حذف حسابي ❎", "delaccount"),
            ],
          });
        }
      } else if (postback == "recountry") {
        botly.sendText({
          id: senderId,
          text: "يرجى إختيار البلد 🌐 الذي تريد التغيير له ☑️",
          quick_replies: [
            botly.createQuickReply("الجزائر 🇩🇿", "dz"),
            botly.createQuickReply("المغرب 🇲🇦", "ma"),
            botly.createQuickReply("تونس 🇹🇳", "tn"),
            botly.createQuickReply("ليبيا 🇱🇾", "ly"),
            botly.createQuickReply("مصر 🇪🇬", "eg"),
            botly.createQuickReply("الاردن 🇯🇴", "jo"),
            botly.createQuickReply("السودان 🇸🇩", "sd"),
            botly.createQuickReply("سوريا 🇸🇾", "sy"),
            botly.createQuickReply("العراق 🇮🇶", "iq"),
            botly.createQuickReply("السعودية 🇸🇦", "sa"),
            botly.createQuickReply("موريتانيا 🇲🇷", "mr"),
            botly.createQuickReply("قطر 🇶🇦", "qa"),
            botly.createQuickReply("اليمن 🇾🇪", "ye"),
          ],
        });
      } else if (postback.startsWith("cn-")) {
        const phone = postback.replace("cn-", "");
        eval(
          smser.sendSMS(
            senderId,
            phone,
            user.country,
            user.phonecode
          )
        );
      } else if (postback == "rephone") {
        botly.sendText({
          id: senderId,
          text: "حسنا 🆗 يرجى إدخال رقم هاتف اخر الان 🤔",
        });
      } else if (postback == "free") {
        await db.update({ token: null, mode: postback }, senderId)
        .then((data) => {
            botly.sendText({ id: senderId, text: "تم حفظ حسابك بنجاح ☑️" });
        });
      } else if (postback == "delaccount") {
        await db.update({token: null, phone: null, lastsms: null, smsid: null, smsed: false, mode: "free"}, senderId)
        .then((data) => {
            botly.sendText({ id: senderId, text: "تم حذف حسابك بنجاح ☑️" });
        });
      } else if (postback == "paid") {
        await db.update({token: null, phone: null, lastsms: null, smsid: null, smsed: false, mode: postback}, senderId)
        .then((data) => {
            botly.sendText({id: senderId, text: "تم حفظ حسابك بنجاح ☑️ الرجاء كتابة رقم هاتفك لكي تبدأ عملية التوثيق 💁‍♂️"});
        });
      } else if (postback == "tbs") {
        //
      } else if (postback == "OurBots") {
        botly.sendText({
          id: senderId,
          text: `مرحبا 👋\nيمكنك تجربة كل الصفحات التي أقدمها لكم 👇 إضغط على إسم أي صفحة للتعرف عليها و مراسلتها 💬 كل الصفحات تعود لصانع واحد و كل ماتراه أمامك يُصنع بكل حـ💜ـب و إهتمام في ليالي الارض الجزائرية.\n• ${quote.quotes()} •`,
          quick_replies: [
            botly.createQuickReply("كالربوت 📞", "callerbot"),
            botly.createQuickReply("شيربوت 🌙", "sharebot"),
            botly.createQuickReply("بوتباد 📖", "bottpad"),
            botly.createQuickReply("ترجمان 🌍", "torjman"),
            botly.createQuickReply("بوتيوب ↗️", "botube"),
            botly.createQuickReply("كيوبوت 🐱", "qbot"),
            botly.createQuickReply("سمسمي 🌞", "simsimi"),
          ],
        });
      }
    } else {
      // Quick Reply
      if (message.message.text == "tbs") {
        //
      } else if (message.message.text == "tbs") {
        //
      } else if (postback == "dz") {
        await db.put({country: postback, phonecode: 213}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "ma") {
        await db.put({country: postback, phonecode: 212}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "tn") {
        await db.put({country: postback, phonecode: 216}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "ly") {
        await db.put({country: postback, phonecode: 218}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "eg") {
        await db.put({country: postback, phonecode: 20}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "jo") {
        await db.put({country: postback, phonecode: 962}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "sd") {
        await db.put({country: postback, phonecode: 249}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "sy") {
        await db.put({country: postback, phonecode: 963}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "iq") {
        await db.put({country: postback, phonecode: 964}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "sa") {
        await db.put({country: postback, phonecode: 966}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "mr") {
        await db.put({country: postback, phonecode: 222}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "qa") {
        await db.put({country: postback, phonecode: 974}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "ye") {
        await db.put({country: postback, phonecode: 967}, senderId)
        .then((data) => {
            botly.sendText({
                id: senderId,
                text: "تم حفظ البلد بنجاح 🌐 يمكنك البحث الان. لا يوجد داعي لإضافة رمز الدولة امام الارقام 🙅🏻‍♂️ (+213/+212/+9).",
              });
        });
      } else if (postback == "callerbot") {
        botly.sendGeneric({
          id: senderId,
          elements: {
            title: "CallerBot - كالربوت",
            image_url: "https://i.ibb.co/gM5pKr4/gencallerbot.png",
            subtitle: "صفحة ترسل لها اي رقم هاتف و ستبحث لك عن صاحب هذا الرقم",
            buttons: [
              botly.createWebURLButton("على الماسنجر 💬", "m.me/CallerBot/"),
              botly.createWebURLButton(
                "على الفيسبوك 🌐",
                "facebook.com/CallerBot/"
              ),
              botly.createWebURLButton(
                "حساب الصانع 🇩🇿",
                "facebook.com/0xNoti/"
              ),
            ],
          },
          aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL,
        });
      } else if (postback == "sharebot") {
        botly.sendGeneric({
          id: senderId,
          elements: {
            title: "ShareBot - شيربوت",
            image_url: "https://i.ibb.co/2nSB6xx/gensharebot.png",
            subtitle:
              "صفحة لتحميل الفيديوهات من التيك توك بدون علامة او الريلز و فيديوهات الفيسبوك",
            buttons: [
              botly.createWebURLButton("على الماسنجر 💬", "m.me/ShareBotApp/"),
              botly.createWebURLButton(
                "على الفيسبوك 🌐",
                "facebook.com/ShareBotApp/"
              ),
              botly.createWebURLButton(
                "حساب الصانع 🇩🇿",
                "facebook.com/0xNoti/"
              ),
            ],
          },
          aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL,
        });
      } else if (postback == "bottpad") {
        botly.sendGeneric({
          id: senderId,
          elements: {
            title: "Bottpad - بوتباد",
            image_url: "https://i.ibb.co/RBQZbXG/genbottpad.png",
            subtitle:
              "صفحة تجلب لك روايات من واتباد و ترسلها لك لكي تقرأها على الفيسبوك",
            buttons: [
              botly.createWebURLButton("على الماسنجر 💬", "m.me/Bottpad/"),
              botly.createWebURLButton(
                "على الفيسبوك 🌐",
                "facebook.com/Bottpad/"
              ),
              botly.createWebURLButton(
                "حساب الصانع 🇩🇿",
                "facebook.com/0xNoti/"
              ),
            ],
          },
          aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL,
        });
      } else if (postback == "torjman") {
        botly.sendGeneric({
          id: senderId,
          elements: {
            title: "Torjman - Translation Bot",
            image_url: "https://i.ibb.co/hCtJM06/gentorjman.png",
            subtitle:
              "صفحة ترجمة تدعم 13 لغة مختلفة تساعدك على ترجمة النصوص بشكل فوري",
            buttons: [
              botly.createWebURLButton("على الماسنجر 💬", "m.me/TorjmanBot/"),
              botly.createWebURLButton(
                "على الفيسبوك 🌐",
                "facebook.com/TorjmanBot/"
              ),
              botly.createWebURLButton(
                "حساب الصانع 🇩🇿",
                "facebook.com/0xNoti/"
              ),
            ],
          },
          aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL,
        });
      } else if (postback == "botube") {
        botly.sendGeneric({
          id: senderId,
          elements: {
            title: "Botube - بوتيوب",
            image_url: "https://i.ibb.co/jvt0t0B/genbotube.png",
            subtitle:
              "صفحة تبحث بها على اليوتيوب و ترسل لك فيديوهات يمكنك مشاهدتها و الاستماع لها",
            buttons: [
              botly.createWebURLButton("على الماسنجر 💬", "m.me/BotubeApp/"),
              botly.createWebURLButton(
                "على الفيسبوك 🌐",
                "facebook.com/BotubeApp/"
              ),
              botly.createWebURLButton(
                "حساب الصانع 🇩🇿",
                "facebook.com/0xNoti/"
              ),
            ],
          },
          aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL,
        });
      } else if (postback == "qbot") {
        botly.sendGeneric({
          id: senderId,
          elements: {
            title: "كيوبوت - QBot",
            image_url: "https://i.ibb.co/Fx7kGFj/genqbot.png",
            subtitle:
              "صفحة يمكنك التحدث لها مثل الانسان بكل حرية و مناقشة معاها المواضيع التي تريدها",
            buttons: [
              botly.createWebURLButton("على الماسنجر 💬", "m.me/QBotAI/"),
              botly.createWebURLButton("على الفيسبوك 🌐", "facebook.com/QBotAI/"),
              botly.createWebURLButton(
                "حساب الصانع 🇩🇿",
                "facebook.com/0xNoti/"
              ),
            ],
          },
          aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL,
        });
      } else if (postback == "simsimi") {
        botly.sendGeneric({
          id: senderId,
          elements: {
            title: "سمسمي الجزائري - Simsimi Algerian",
            image_url: "https://i.ibb.co/DkdLSSG/gensimsimi.png",
            subtitle:
              "صفحة للمرح فقط تقوم بالرد على رسائلك بشكل طريف تتحدث باللهجة الجزائرية فقط",
            buttons: [
              botly.createWebURLButton(
                "على الماسنجر 💬",
                "m.me/SimsimiAlgerian/"
              ),
              botly.createWebURLButton(
                "على الفيسبوك 🌐",
                "facebook.com/SimsimiAlgerian/"
              ),
              botly.createWebURLButton(
                "حساب الصانع 🇩🇿",
                "facebook.com/0xNoti/"
              ),
            ],
          },
          aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL,
        });
      }
    }
    //   e n d   //
  });
  /*------------- RESP -------------*/
  /*
  botly.setGetStarted({pageId: PageID, payload: "START"});
  botly.setGreetingText({
      pageId: PageID,
      greeting: [
        {
          locale: "default",
          text: "tbs"
        },
        {
          locale: "ar_AR",
          text: "tbs"
        }
      ]
    });
  botly.setPersistentMenu({
      pageId: PageID,
      menu: [
          { 
            locale: "default",
            composer_input_disabled: false,
            call_to_actions: [
              {
                title:   "تعرف على بوتات أخرى 🤖",
                type:    "postback",
                payload: "OurBots"
              },{
                title:   "البروفايل 📁",
                type:    "postback",
                payload: "profile"
              },{
                type:  "web_url",
                title: "صنع بكل حـ❤️ـب في الجزائر",
                url:   "m.me/100011041393904/",
                webview_height_ratio: "full"
              }
            ]
          }
        ]
    });
    */
  /*------------- RESP -------------*/
  app.listen(3000, () =>
    console.log(`App is on Port : 3000`)
  );