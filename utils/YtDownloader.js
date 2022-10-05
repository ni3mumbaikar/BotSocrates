const ytdl = require('ytdl-core');
const fs = require('fs');
const Path = require('path');

module.exports = async function download(sock, msg, url, chatId) {
    url = urlParse(url);
    if (url != 418) {
        const savePath = 'Media/Video'
        ytdl.getBasicInfo(url).then(info => {
            if (info.videoDetails.lengthSeconds > 300) {
                sock.sendMessage(
                    chatId, { text: " ⚠️ Make sure video length is less than 10 minutes." }, { quoted: msg }
                );
            } else {
                let fileName = (Math.random() + 1).toString(36).substring(7) + '.mp4';
                const path = Path.resolve(savePath, fileName);
                const writer = fs.createWriteStream(path);

                ytdl(url)
                    .pipe(writer);
                return new Promise((resolve, reject) => {
                    writer.on("finish", async () => {
                        await sock.sendMessage(
                            chatId, {
                            video: await fs.readFileSync(path),
                            caption: "",
                            gifPlayback: false,
                        }, { quoted: msg }
                        );
                        fs.unlinkSync(path);

                    });
                    writer.on("error", reject);
                });
            }
        });
    } else {
        await sock.sendMessage(
            chatId, { text: " ⚠️ Please check your youtube video url." }, { quoted: msg }
        );
    }
}

function urlParse(ytv_url) {
    ytv_url = ytv_url.toString();
    if (ytv_url.includes("youtube.com/shorts")) {
        return ytv_url;
    } else if (ytv_url.startsWith("https://youtu.be/")) {
        return "https://youtube.com/shorts/" + ytv_url.split('/')[3];
    } else {
        return 418;
    }
}
