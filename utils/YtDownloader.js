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
    if (url != 418) {
        youtube = await new Innertube({ gl: 'IN' });

        options = {
            format: 'mp4',
            quality: '720p',
            type: 'videoandaudio',
        };


        // considering the video to be youtube short
        const urlParser = UrlParser(
            url,
            "/shorts/:id"
        )

        ID = urlParser.namedParams["id"];

        // To get yt video information
        console.log(ID);
        const video = await youtube.getDetails(ID);
        // Last element from the available qualities meta data of the video. Last element i.e. len-1 which is the maximum available quality for the specific video
        console.log(video.metadata.length_seconds);

        // IF the video is not greater than 5 Minutes
        if (video.metadata.length_seconds < 300) {

            options['quality'] = video.metadata.available_qualities[video.metadata.available_qualities.length - 1];

            // TODO : CHECK Vid length Do not download or send if it is above threshold

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
        } else {
            await sock.sendMessage(
                chatId, { text: " ⚠️ Make sure video length is less than 10 minutes." }, { quoted: msg }
            );
        }
    } else {
        await sock.sendMessage(
            chatId, { text: " ⚠️ Please check your youtube shorts url." }, { quoted: msg }
        );
    }

};

function urlParse(ytv_url) {
    ytv_url = ytv_url.toString();
    console.log('here');
    if (ytv_url.includes("youtube.com/shorts")) {
        return ytv_url;
    } else if (ytv_url.startsWith("https://youtu.be/")) {
        console.log("https://youtube.com/shorts/" + ytv_url.split('/')[3]);
        return "https://youtube.com/shorts/" + ytv_url.split('/')[3];
    } else {
        return 418;
    }
}

