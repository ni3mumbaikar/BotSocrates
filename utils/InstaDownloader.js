require("dotenv").config();

/* --------------------------------- IMPORTS --------------------------------- */

const axios = require("axios");
const fs = require("fs");
const Path = require("path");

/* --------------------------------- InstaDownloader Util class --------------------------------- */

let ICOOKIE = process.env.ICOOKIE;

class InstaDownloader {
    static async iProfile(sock, chatId, msg, link) {
        try {
            let instaId = link.replace("https://instagram.com/", "");
            instaId = instaId.replace("?utm_medium=copy_link", "");
            console.log("Insta id to search: ", instaId);

            const res = await axios({
                url: `https://www.instagram.com/${instaId}/?__a=1&__d=dis`,
                headers: {
                    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
                    "cache-control": "max-age=0",
                    "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
                    "sec-ch-ua-mobile": "?1",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "none",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1",
                    // cookie: 'ig_did=305179C0-CE28-4DCD-847A-2F28A98B7DBF; ig_nrcb=1; mid=YQBN3wAEAAGfSSDsZYS9nf2a5MHO; csrftoken=KItbBYAsObQgmJU2CsfqfiRFtk8JXwgm; sessionid=29386738134%3A8NwzjrA3jruVB4%3A23; ds_user_id=29386738134; fbm_124024574287414=base_domain=.instagram.com; shbid="18377,29386738134,1674226938:01f7d2db0f9c512fc79336716e1cf02623129a7897f5ccb8d878999be86c0e010bb77920"; shbts="1642690938,29386738134,1674226938:01f73e613a6030436ef5f2cea6c7402b82a96c1a61f905b746d3951f49a7f2d2eab6d399"; fbsr_124024574287414=Ps5NinG2AjNMV4W927e_vwMrZVLCltfcbWGS3B5S3to.eyJ1c2VyX2lkIjoiMTAwMDA5NDY1ODIwODQyIiwiY29kZSI6IkFRQlZrOVljMF9DS24tVEpqZ21VWjdPT2dOelFVdkJyLXUzaENSOGR0RzZrbVQxdWszYUMtVDZJeV9QWjBCc1lCcTBmZkxNZmsyUVlMM0hMVGVhQ1pxb1RRQzdsOE9BYlZKdmlvTU5GZ0dncVdxZVQzNV9JM3ZOV0pCR3BsWXVQX0dGMDJMMEt2aTk4WXpxNFhrVWhaVUNRanpPcUthN01aOVdZaVc5SVFzZjRxU3FQTXUzVXlwRWVsMXQ4TjJkV2ZHSnNFYXRsNXBIRXBGMlJSSWljY0F1c3BTZHNPdWFZSThCeV9uRFpjQklUUFk0RzNJY0NiYnFtdXNFZXY5ZUlsMVlZQ0E0bE5ROWxyeGtZdU1IM05scWRFTmtlQjNwWVRjRGlsZDZtekNpNFgzcnZIZUtUMFVFNkJFYVlURFpCTmhaOTd5TmJWT1R1ZENWdk84UlFoYjV2Iiwib2F1dGhfdG9rZW4iOiJFQUFCd3pMaXhuallCQU0zaHBjU2lKUm50WWcyTm0xamhlUlFkd3VCeExaQ1V0UjV5endGSkdVQVpDbERGRThwdXdaQXRPMkxtQnMxNjNiVGQzZERhRVl3UGRiWHY1bE5PNEZaQVVoYUpBZDBIcTQyWkN5OVdicXh4blVnZml5MHBETm9rMXlQVzlUNHpaQVVsbHVGcmZ4OFFhRlRnZG9wRTBFMDBMaGg3OVhuWkN1QldteWZ0MlpBY1NYVUpMRjNWNzUwWkQiLCJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTY0MjY5NDAyM30; rur="VLL,29386738134,1674231548:01f7816fe2a5156acdb86c5eff76c0ae83ac053646c44ccc592f854fb9d24a18bfcfc3ac"',
                    cookie: ICOOKIE,
                },
                referrerPolicy: "strict-origin-when-cross-origin",
                body: null,
                mode: "cors",
                method: "GET",
            });

            const jsonData = res.data;

            console.log(jsonData.graphql.user.profile_pic_url_hd);
            let followers = new Intl.NumberFormat("Hi").format(
                jsonData.graphql.user.edge_followed_by.count
            );
            let following = new Intl.NumberFormat("Hi").format(
                jsonData.graphql.user.edge_follow.count
            );
            await sock.sendMessage(
                chatId, {
                image: { url: jsonData.graphql.user.profile_pic_url_hd },
                caption: `*Full Name* :- ${jsonData.graphql.user.full_name}\n ​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​\n*​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​Bio* :-${jsonData.graphql.user.biography}\n*Followers* :- ${followers}\n*Following* :- ${following}`,
            }, { quoted: msg }
            );
            // Do stuffs
        } catch (err) {
            console.log(err);
            await sock.sendMessage(
                chatId, { text: "Check the profile link/id or Try Again" }, { quoted: msg }
            );
        }
    }
    static async download(url, fileName, savePath) {
        const path = Path.resolve(savePath, fileName);

        const writer = fs.createWriteStream(path);
        const response = await axios({
            url,
            method: "GET",
            responseType: "stream",
        });
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    }

    static async igDownload(sock, chatId, msg, link) {
        if (link === "") {
            await sock.sendMessage(
                chatId, { text: "Empty Parameter!" }, { quoted: msg }
            );
            return;
        }
        try {
            let finalLink = link.split("?")[0];
            if (finalLink.slice(-1) != "/") {
                finalLink += "/";
            }
            finalLink = finalLink + "?__a=1&__d=dis";
            let metaData;

            metaData = await axios({
                url: finalLink,
                headers: {
                    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
                    "cache-control": "max-age=0",
                    "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
                    "sec-ch-ua-mobile": "?1",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "none",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1",
                    //cookie: 'ig_did=305179C0-CE28-4DCD-847A-2F28A98B7DBF; ig_nrcb=1; mid=YQBN3wAEAAGfSSDsZYS9nf2a5MHO; csrftoken=KItbBYAsObQgmJU2CsfqfiRFtk8JXwgm; sessionid=29386738134%3A8NwzjrA3jruVB4%3A23; ds_user_id=29386738134; fbm_124024574287414=base_domain=.instagram.com; shbid="18377,29386738134,1674226938:01f7d2db0f9c512fc79336716e1cf02623129a7897f5ccb8d878999be86c0e010bb77920"; shbts="1642690938,29386738134,1674226938:01f73e613a6030436ef5f2cea6c7402b82a96c1a61f905b746d3951f49a7f2d2eab6d399"; fbsr_124024574287414=Ps5NinG2AjNMV4W927e_vwMrZVLCltfcbWGS3B5S3to.eyJ1c2VyX2lkIjoiMTAwMDA5NDY1ODIwODQyIiwiY29kZSI6IkFRQlZrOVljMF9DS24tVEpqZ21VWjdPT2dOelFVdkJyLXUzaENSOGR0RzZrbVQxdWszYUMtVDZJeV9QWjBCc1lCcTBmZkxNZmsyUVlMM0hMVGVhQ1pxb1RRQzdsOE9BYlZKdmlvTU5GZ0dncVdxZVQzNV9JM3ZOV0pCR3BsWXVQX0dGMDJMMEt2aTk4WXpxNFhrVWhaVUNRanpPcUthN01aOVdZaVc5SVFzZjRxU3FQTXUzVXlwRWVsMXQ4TjJkV2ZHSnNFYXRsNXBIRXBGMlJSSWljY0F1c3BTZHNPdWFZSThCeV9uRFpjQklUUFk0RzNJY0NiYnFtdXNFZXY5ZUlsMVlZQ0E0bE5ROWxyeGtZdU1IM05scWRFTmtlQjNwWVRjRGlsZDZtekNpNFgzcnZIZUtUMFVFNkJFYVlURFpCTmhaOTd5TmJWT1R1ZENWdk84UlFoYjV2Iiwib2F1dGhfdG9rZW4iOiJFQUFCd3pMaXhuallCQU0zaHBjU2lKUm50WWcyTm0xamhlUlFkd3VCeExaQ1V0UjV5endGSkdVQVpDbERGRThwdXdaQXRPMkxtQnMxNjNiVGQzZERhRVl3UGRiWHY1bE5PNEZaQVVoYUpBZDBIcTQyWkN5OVdicXh4blVnZml5MHBETm9rMXlQVzlUNHpaQVVsbHVGcmZ4OFFhRlRnZG9wRTBFMDBMaGg3OVhuWkN1QldteWZ0MlpBY1NYVUpMRjNWNzUwWkQiLCJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTY0MjY5NDAyM30; rur="VLL,29386738134,1674231548:01f7816fe2a5156acdb86c5eff76c0ae83ac053646c44ccc592f854fb9d24a18bfcfc3ac"',
                    cookie: ICOOKIE,
                },
                referrerPolicy: "strict-origin-when-cross-origin",
                body: null,
                mode: "cors",
                method: "GET",
            });
            metaData = metaData.data["items"][0];
            //console.log(metaData);

            let getType;
            if (metaData.video_versions) {
                getType = "video";
            } else {
                getType = "image";
            }

            let fileName = (Math.random() + 1).toString(36).substring(7);
            let savePath;
            let file;

            if (getType == "image") {
                fileName = `${fileName}.jpg`;
                savePath = "Media/Image";
                let imageLink;
                if (metaData.carousel_media) {
                    imageLink =
                        metaData.carousel_media[0].image_versions2.candidates[0].url;
                } else {
                    imageLink = metaData.image_versions2.candidates[0].url;
                }

                await InstaDownloader.download(imageLink, fileName, savePath);
                file = Path.resolve(savePath, fileName);
            } else {
                fileName = `${fileName}.mp4`;
                savePath = "Media/Video";

                let videoLink;
                if (metaData.carousel_media) {
                    videoLink = metaData.carousel_media[0].video_versions[0].url;
                } else {
                    videoLink = metaData.video_versions[0].url;
                }
                await InstaDownloader.download(videoLink, fileName, savePath);
                file = Path.resolve(savePath, fileName);
            }

            if (getType === "video") {
                await sock.sendMessage(
                    chatId, {
                    video: fs.readFileSync(file),
                    caption: "",
                    gifPlayback: false,
                }, { quoted: msg }
                );
            } else {
                await sock.sendMessage(
                    chatId, {
                    image: { url: file },
                    caption: "",
                }, { quoted: msg }
                );
            }

            fs.unlinkSync(`${savePath}/${fileName}`);
        } catch (error) {
            console.log("Insta download error: ", error);
            await sock.sendMessage(
                chatId, { text: "Can not download! Try After Sometime" }, { quoted: msg }
            );
        }
    }
}

module.exports = InstaDownloader;