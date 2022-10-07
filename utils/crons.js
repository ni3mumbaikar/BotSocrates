const moment = require('moment');
const MongoClient = require("mongodb").MongoClient;
const InternalServerError = require("./error").InternalServerError;
const cron = require("node-cron");
const getNews = require("../commands/technews").getNews;

// cron expression
// 0 19 * * * => for 7:00 PM
// 0 7 * * *  => for 7:00 AM


module.exports.setUpCrons = async function (sock) {

    let sendNews = async function () {
        let URI = process.env.MONGO_URI;
        const client = new MongoClient(URI);
        try {
            const database = client.db('socrates');
            const subscribers = database.collection('news_subs');
            const cursor = subscribers.find({ valid: true })
            const msg = await getNews();
            cursor.forEach(async subscriber => {
                let sentMsg = await sock.sendMessage(subscriber.uid, {
                    text: msg
                });
            });

        } catch (err) {
            console.log(err);
        } finally {
            // client.close();
        }
    }

    cron.schedule("0 7 * * *", sendNews());

    cron.schedule("0 19 * * *", sendNews());

}

