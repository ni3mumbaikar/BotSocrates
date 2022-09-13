const Innertube = require('youtubei.js');
const fs = require('fs');


const { UrlParser } = require('url-params-parser');

const Path = require("path");

module.exports = async function download(sock, msg, url, chatId) {

    let ID = undefined;
    let youtube = undefined;
    let options = undefined;
    let stream = undefined;
    let fileName = (Math.random() + 1).toString(36).substring(7) + '.mp4';
    const savePath = 'Media/Video'
    // const filepath = path.join(__dirname, 'Media', 'Video', fileName);
    const path = Path.resolve(savePath, fileName);


    url = urlParse(url);
    if (url.includes("youtube.com/shorts")) {
        // considering the video to be youtube short
        const urlParser = UrlParser(
            url,
            "/shorts/:id"
        )

        ID = urlParser.namedParams["id"];

        // To get yt video information
        // const video = await youtube.getDetails('-vK09JQs6os');
        // console.log(video);

    } else {
    }

    youtube = await new Innertube({ gl: 'IN' });

    // TODO : CHECK MAX QUALITY
    options = {
        format: 'mp4',
        quality: '720p',
        type: 'videoandaudio',
    };

    stream = await youtube.download(ID, options);

    const writer = fs.createWriteStream(path);
    await stream.pipe(writer);

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

};

function urlParse(ytv_url) {
    ytv_url = ytv_url.toString();
    console.log('here');
    if (ytv_url.includes("youtube.com/shorts")) {
        return ytv_url;
    } else if (ytv_url.startsWith("https://youtu.be/")) {
        console.log("https://youtube.com/shorts/" + ytv_url.split('/')[3]);
        return "https://youtube.com/shorts/" + ytv_url.split('/')[3];
    }
}

