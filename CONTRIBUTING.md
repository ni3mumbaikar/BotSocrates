# Contributing to BotSocrates 🤖

First off, thank you for considering contributing to **BotSocrates**! 🎉 Whether you want to add a cool new WhatsApp command, improve the AI group chat summarizer, fix a bug, or write better documentation, your help is welcome.

This guide provides everything you need to get up and running quickly.

---

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Local Development Setup (Docker Compose)](#local-development-setup-docker-compose)
  - [1. Fork & Clone](#1-fork--clone)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Start the Bot](#3-start-the-bot)
  - [4. Authenticate WhatsApp](#4-authenticate-whatsapp)
- [Project Architecture & Directory Structure](#project-architecture--directory-structure)
- [Step-by-Step: Adding a New Command](#step-by-step-adding-a-new-command)
- [Step-by-Step: Working on the Daily Chat Summarizer](#step-by-step-working-on-the-daily-chat-summarizer)
- [Running Automated Tests](#running-automated-tests)
- [Commit Convention & Git Workflow](#commit-convention--git-workflow)
- [Pull Request Guidelines & Checklist](#pull-request-guidelines--checklist)

---

## Code of Conduct

We are committed to maintaining a welcoming, inclusive, and harassment-free community:
- **Be respectful and constructive**: Provide thoughtful feedback and discuss ideas politely.
- **Focus on quality and privacy**: BotSocrates interacts with private chat environments. Ensure all group data is handled securely and isolatedly.
- **Have fun**: BotSocrates is built for bakchodi, smart automation, and utility among friends—keep the energy positive!

---

## Prerequisites

To maintain environment parity across all platforms (Linux, macOS, Windows) and handle dependencies like Node.js, SQLite, Python, and FFmpeg automatically, development is standardized on Docker:

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Docker Compose on Linux)
- A secondary WhatsApp account or a testing number to scan the QR code.

---

## Local Development Setup (Docker Compose)

### 1. Fork & Clone
Fork the repository on GitHub, then clone your fork locally:

```bash
git clone https://github.com/<your-username>/BotSocrates.git
cd BotSocrates
```

### 2. Configure Environment Variables
Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` in your editor and configure the necessary values:
- `PREFIX=/`: Bot command prefix (default is `/`).
- `PORT=3000`: Local API port.
- `TZ=Asia/Kolkata`: Set to your local timezone (used for daily midnight summaries).
- *(Optional)* `SUMMARY_GROUP_IDS`: Comma-separated WhatsApp group JIDs if testing the daily summarizer.
- *(Optional)* `OPENCLAW_API_URL` & `OPENCLAW_API_KEY`: If testing AI summaries.

### 3. Start the Bot
Build and launch the container with Docker Compose:

```bash
docker compose up --build
```

> **Note on Live Reload**: The container mounts your repository directory and runs `node --watch index.js`. Any code edits you make in your local editor will automatically reload inside the container without needing a rebuild!

### 4. Authenticate WhatsApp
1. Watch the terminal logs:
   ```bash
   docker compose logs -f bot
   ```
2. A QR code will be printed in the terminal.
3. Open WhatsApp on your test phone -> **Linked Devices** -> **Link a Device** -> Scan the QR code.
4. Once connected, your credentials will be persisted in `./auth_info_baileys` (which is volume-mounted and gitignored), meaning you won't need to re-scan on restarts.

---

## Project Architecture & Directory Structure

```
BotSocrates/
├── auth_info_baileys/       # WhatsApp multi-file auth credentials (gitignored)
├── commands/                # Individual bot command modules (e.g. ping, sticker, tts)
├── docs/                    # Architecture diagrams and technical specs
│   └── chat_summary_architecture.md
├── tests/                   # Automated unit and integration test suites
│   └── test_summary_flow.js
├── utils/                   # Core bot engines and utility helpers
│   ├── chatLogger.js        # SQLite-backed message ingestion & rolling 48h pruner
│   ├── commandList.js       # Command registrar and alias mapping
│   ├── commandsHandler.js   # Command router and prefix matcher
│   ├── scheduler.js         # Midnight cron job scheduler
│   └── summarizer.js        # OpenClaw LLM gateway, continuation loop & WhatsApp sanitizer
├── chats.db                 # Local SQLite database storing group messages (gitignored)
├── docker-compose.yml       # Standardized local dev configuration with live-reload
├── Dockerfile               # Production container image with Node 22, FFmpeg, and Python
└── index.js                 # Application bootstrap & Baileys socket manager
```

---

## Step-by-Step: Adding a New Command

Adding a new command to BotSocrates takes four simple steps:

### 1. Create the Command Module
Create a new file under `commands/<your_command>.js`:

```javascript
/**
 * commands/flipcoin.js
 */
module.exports.reply = async function (sock, msg) {
  const chatId = msg.key.remoteJid;
  const outcome = Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙";

  await sock.sendMessage(
    chatId,
    { text: `*Toss Result:* ${outcome}` },
    { quoted: msg }
  );
};
```

If your command accepts arguments (e.g. `/flipcoin 5`):
```javascript
module.exports.replyForCommandWithOption = async function (sock, msg, option) {
  const chatId = msg.key.remoteJid;
  // option contains the string passed after the command name
  await sock.sendMessage(
    chatId,
    { text: `You passed option: ${option}` },
    { quoted: msg }
  );
};
```

### 2. Register the Command and Aliases
Open `utils/commandList.js`:

```javascript
const flipcoin = require("../commands/flipcoin");

module.exports.commandsGenerator = function () {
  // ... existing commands ...
  
  commandsList["flipcoin"] = flipcoin;
  commandsList["coin"] = flipcoin; // alias

  return commandsList;
};
```

### 3. Update the Help Menu
Open `commands/help.js` and add your command description so users can discover it via `/help`:

```javascript
"\n\n*/flipcoin* : Flip a coin for quick decisions 🪙\n" +
"Alias : _coin_"
```

### 4. Update the Commands Table in README
Add your command to the markdown table in [README.md](file:///d:/coding2/BotSocrates/README.md).

---

## Step-by-Step: Working on the Daily Chat Summarizer

BotSocrates includes an automated daily group chat summarizer that runs at midnight IST:
- **`utils/chatLogger.js`**: Ingests incoming group messages using Node.js built-in `node:sqlite`. Keeps a rolling 48-hour window.
- **`utils/summarizer.js`**: Sends the yesterday transcript to OpenClaw / DeepSeek LLM gateway, handles multi-turn token continuation if response is truncated, formats WhatsApp markdown (`sanitizeWhatsAppFormatting`), and delivers isolated summaries.
- **`utils/scheduler.js`**: Triggers daily execution at `00:00:05 AM IST`.
- For detailed architecture, see [docs/chat_summary_architecture.md](file:///d:/coding2/BotSocrates/docs/chat_summary_architecture.md).

---

## Running Automated Tests

Always ensure existing and new tests pass before opening a Pull Request.

Run the test suite inside the Docker container:

```bash
docker compose exec bot node tests/test_summary_flow.js
```

*(Or from your host machine if you have Node.js 22+ installed: `node tests/test_summary_flow.js`)*

When adding new features or fixing bugs, please add corresponding assertions in `tests/`.

---

## Commit Convention & Git Workflow

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard. This makes git history clean, readable, and easy to parse.

### Commit Format
```
<type>(<scope>): <short description>
```

### Common Types:
- `feat`: A new user-facing feature or bot command (e.g. `feat(commands): add /weather command`)
- `fix`: A bug fix (e.g. `fix(summarizer): prevent token limit truncation in long transcripts`)
- `docs`: Documentation updates (e.g. `docs: update deployment instructions in README`)
- `test`: Adding or updating test cases (e.g. `test(logger): add isolation test for multiple groups`)
- `refactor`: Code changes that neither fix a bug nor add a feature (e.g. `refactor(socket): improve reconnect delay backoff`)
- `chore`: Maintenance tasks, dependency updates, or dockerfile tweaks (e.g. `chore(deps): update baileys to v6.5.0`)

### Branching Strategy
1. Create a descriptive branch from `main`:
   ```bash
   git checkout -b feat/add-flipcoin-command
   # or
   git checkout -b fix/image-converter-crash
   ```
2. Commit your changes with conventional messages:
   ```bash
   git commit -m "feat(flipcoin): add coin toss command with coin alias"
   ```
3. Push to your fork:
   ```bash
   git push origin feat/add-flipcoin-command
   ```

---

## Pull Request Guidelines & Checklist

Before opening a PR, please verify:
- [ ] Code follows existing project style and patterns.
- [ ] No secrets, `.env` files, or session folders (`auth_info_baileys/`) are committed.
- [ ] All tests pass (`node tests/test_summary_flow.js`).
- [ ] If adding a command:
  - [ ] Module created in `commands/`.
  - [ ] Registered in `utils/commandList.js`.
  - [ ] Added to `commands/help.js`.
  - [ ] Documented in `README.md`.
- [ ] Commit messages follow Conventional Commits format.
- [ ] PR description clearly explains **what** changed and **why**.
