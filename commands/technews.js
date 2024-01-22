const axios = require("axios");
const MongoClient = require("mongodb").MongoClient;
let URI = process.env.MONGO_URI;
const moment = require("moment");
const InternalServerError = require("../utils/error").InternalServerError;

// Credits : https://github.com/Shubhamrawat5/whatsapp-bot
module.exports.getNews = async function () {
  try {
    let url = process.env.NEWS_API;
    const { data } = await axios.get(url);

    let msg = "💻🤖🦾 Tech News 🎧🖥️👩🏾‍💻";
    let inshorts = data["gadgets-now"];
    let count = 0; //for first 14 news only
    for (let i = 0; i < inshorts.length; ++i) {
      ++count;
      if (count === 15) break;
      msg += `\n\n🌐 ${inshorts[i]}`;
    }
    // msg += `\n\njoin TG@pvxtechnews for daily tech news!`;
    return msg;
  } catch (err) {
    return "ERROR something went wrong please try again after some time !";
  }
};

module.exports.reply = async function (sock, msg) {
  let id = msg.key.remoteJid;
  let sentMsg = await sock.sendMessage(id, {
    text: await this.getNews(),
  });
};

commandOptionsList = ["subscribe", "unsubscribe"];

module.exports.replyForCommandWithOption = async function (sock, msg, option) {
  let id = msg.key.remoteJid;
  if (commandOptionsList.includes(option)) {
    if (option === "subscribe") {
      insertSubscriber(id, msg, sock);
    } else if (option === "unsubscribe") {
      unsubscribe(id, msg, sock);
    }
  } else {
    let sentMsg = await sock.sendMessage(
      id,
      {
        text: "Invalid option !" + "\nNo command option found like " + option,
      },
      { quoted: msg }
    );
  }
};

async function unsubscribe(id, msg, sock) {
  const client = new MongoClient(URI);
  try {
    const database = client.db("socrates");
    const subscribers = database.collection("news_subs");
    const query = { uid: id };
    let subscriber = await subscribers.findOne(query);
    if (subscriber == undefined) {
      let sentMsg = await sock.sendMessage(
        id,
        {
          text: "❌ Not subscription found !",
        },
        { quoted: msg }
      );
    } else {
      if (subscriber.valid == true) {
        const filter = { uid: id };
        const updateDoc = { $set: { valid: false } };
        const options = { upsert: true };

        const result = await subscribers.updateOne(filter, updateDoc, options);

        if (result.matchedCount == 1) {
          let sentMsg = await sock.sendMessage(
            id,
            {
              text: "✅ Ok, I won't disturb you again",
            },
            { quoted: msg }
          );
        } else {
          InternalServerError(id, msg, sock);
        }
      } else {
        let sentMsg = await sock.sendMessage(
          id,
          {
            text: "✅ Subscription is already expired, I won't disturb you again",
          },
          { quoted: msg }
        );
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

async function insertSubscriber(id, msg, sock) {
  const client = new MongoClient(URI);
  try {
    const database = client.db("socrates");
    const subscribers = database.collection("news_subs");
    // Query to find if the subscriber alreay existst
    const query = { uid: id };
    let subscriber = await subscribers.findOne(query);
    if (subscriber == undefined) {
      console.log("No subscriber found Creating new entry");
      subscriber = {};
      if (msg.pushName && id) {
        let currentmomment = moment().add(90, "days");
        subscriber.name = msg.pushName;
        subscriber.uid = id;
        subscriber.valid_till = currentmomment.toDate();
        subscriber.valid = true;
        if (id.endsWith("@g.us")) {
          const result = await subscribers.insertOne(subscriber);
          // console.log(`A document was inserted with the _id: ${result.insertedId}`);

          let sentMsg = await sock.sendMessage(
            id,
            {
              text:
                "✅ Technews subscription activated for 3 months !" +
                "\n" +
                "You'll receive daily technews twice @7:00AM and 7:00PM" +
                "\n\n" +
                "Note : Subscription is valid till _" +
                currentmomment.format("ddd Do MMM YYYY") +
                "_",
            },
            { quoted: msg }
          );
        } else {
          let sentMsg = await sock.sendMessage(
            id,
            {
              text: "❌ Group only command",
            },
            { quoted: msg }
          );
        }
      } else {
        InternalServerError(id, msg, sock);
      }
    } else {
      if (subscriber.valid == false) {
        const filter = { uid: id };

        const updateDoc = { $set: { valid: true } };
        const options = { upsert: true };

        const result = await subscribers.updateOne(filter, updateDoc, options);
        if (result.matchedCount == 1) {
          if (moment().isBefore(moment(subscriber.valid_till))) {
            let valid_till = moment(subscriber.valid_till);
            let sentMsg = await sock.sendMessage(
              id,
              {
                text:
                  "✅ Technews subscription is active !" +
                  "\n" +
                  "You'll receive daily technews twice @7:00AM and 7:00PM" +
                  "\n\n" +
                  "Note : Subscription is valid till _" +
                  valid_till.format("ddd Do MMM YYYY") +
                  "_",
              },
              { quoted: msg }
            );
          } else {
            let currentmomment = moment().add(90, "days");
            let sentMsg = await sock.sendMessage(
              id,
              {
                text:
                  "✅ Technews subscription renewed for 3 months !" +
                  "\n" +
                  "You'll receive daily technews twice @7:00AM and 7:00PM" +
                  "\n\n" +
                  "Note : Subscription is valid till _" +
                  currentmomment.format("ddd Do MMM YYYY") +
                  "_",
              },
              { quoted: msg }
            );
          }
        } else {
          InternalServerError(id, msg, sock);
        }
      } else {
        let sentMsg = await sock.sendMessage(
          id,
          {
            text: "Already subscribed !",
          },
          { quoted: msg }
        );
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
