# BotSocrates

I know this is what you might be thinking

![](https://raw.githubusercontent.com/kentcdodds/starwars-names/master/other/starwars-names.gif)

Let me explain,  
BotSocrates is Just another whatsapp bot but it can do things the way I want !

<img src ="https://user-images.githubusercontent.com/24763651/194157590-0dbece7a-956a-4a82-94d0-9d24b60ba8d0.png" width="40%" height="40%">  


### Env variables
| Name         | Value     | Note |
|--------------|-----------|-----------|
|MONGO_URI| " "|  db functionality is not integrated Yet |
|PREFIX| "/"  | commands table below is created assuming prefix is "/" |

## Screenshots
![Screenshots](https://user-images.githubusercontent.com/24763651/194153036-9678b26c-9367-4beb-8569-1939ca5db30f.png)





### Commands

- Only important commands are mentioned in commands table. Explore new commands by /h.  

- Note that * marked params are compulsory.

| Command      | Alias     | Parameters |  Use | Example |
|--------------|-----------|------------|----------------------------------------------|----------------------|
| /help        |      /h   |    *admin*                               | To display help menu containing all commands |    /h  OR /h\<space\>admin    |
| /alive       |       -   |  -                                       | To check bot is online or not                |    /alive             |
| /sticker     |       -   |  *default, crop, full*                   | It returns sticker of the given image/video/gif              |    /sticker or <br/> /sticker\<space\>(any of the parameter)             |
| /ytv         |       -   |  *yotube shorts or video link\**         | Get youtube video from the given link <br/> To save my credit card running out of money the maximum video length is limited to 5 minutes |    /alive             |

### Deployment Guide

:warning: 404 ERROR GUIDE NOT FOUND

## Environment Variables

To run this bot, you need to ensure the following are correctly set up:

*   **Python**: Installed on your system.
*   **`gtts` Python Library**: Installed via `pip` (`pip install gtts`).
*   **`ffmpeg`**: Installed and its executable path set in your `.env` file.

Create a `.env` file in the root directory of the project and add the following line for `ffmpeg`:

```
FFMPEG_PATH="/path/to/your/ffmpeg"
```

Replace `/path/to/your/ffmpeg` with the actual absolute path to your `ffmpeg` executable. For example, on Windows, it might be `C:\ffmpeg\bin\ffmpeg.exe` or on Linux/macOS, it could be `/usr/local/bin/ffmpeg`.

