const axios = require("axios");

// Credits : https://github.com/Shubhamrawat5/whatsapp-bot
async function getNews() {
    // const more = String.fromCharCode(8206);
    // const readMore = more.repeat(4001);
    try {
        let url = "https://news-pvx.herokuapp.com/";
        const { data } = await axios.get(url);

        let msg = ' 💻🤖🦾 Tech News 🎧🖥️👩🏾‍💻';
        let inshorts = data.inshorts;
        let count = 0; //for first 14 news only
        for (let i = 0; i < inshorts.length; ++i) {
            ++count;
            if (count === 15) break;
            msg += `\n\n🌐 ${inshorts[i]}`;
        }
        // msg += `\n\njoin TG@pvxtechnews for daily tech news!`;
        return msg;
    } catch (err) {
        console.log(err);
        return "ERROR something went wrong please try again after some time !";
    }
};


module.exports.reply = async function (sock, msg) {
    let id = msg.key.remoteJid;
    let sentMsg = await sock.sendMessage(id, {
        text: await getNews()
    });
}