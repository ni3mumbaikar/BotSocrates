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
|ICOOKIE| sample -> 'csrftoken=; mid=; ig_did=; ig_nrcb=1; datr=; ds_user_id=; dpr=; rur=""; sessionid=; shbid=""; shbts=""'| your instagram cookie goes here.<br/> replace every "/" with "," in cookie value

## Screenshots
![Screenshots](https://user-images.githubusercontent.com/24763651/194153036-9678b26c-9367-4beb-8569-1939ca5db30f.png)





### Commands

- Only important commands are mentioned in commands table. Explore new commands by /h.  

- Note that * marked params are compulsory.

| Command      | Alias     | Parameters |  Use | Example |
|--------------|-----------|------------|----------------------------------------------|----------------------|
| /help        |      /h   |    *admin*                               | To display help menu containing all commands |    /h  OR /h\<space\>admin    |
| /alive       |       -   |  -                                       | To check bot is online or not                |    /alive             |
| /insta       |     /igd  |  *instagram reel or post link\**         | Get image/video from the provided link. It only works on public account also works on private accounts only which are accessible to the account whose cookie is active in env. variable | /insta\<space\>link or /igd\<space\>link|
| /sticker     |       -   |  *default, crop, full*                   | It returns sticker of the given image/video/gif              |    /sticker or <br/> /sticker\<space\>(any of the parameter)             |
| /instadp     |    /idp   |  *instagram username or profile link\**  | Get profile picture from instagram.<br/> This works on all private accounts too.             |    (/instadp or /idp)\<space\>(insta_username or insta_profile_link)             |
| /ytv         |       -   |  *yotube shorts or video link\**         | Get youtube video from the given link <br/> To save my credit card running out of money the maximum video length is limited to 5 minutes |    /alive             |

### Deployment Guide

:warning: 404 ERROR GUIDE NOT FOUND

