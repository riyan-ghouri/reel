## How It Works

This project is a **Node.js-based Instagram video downloader API**.  
It fetches public Instagram Reels or video posts, extracts the direct video stream, and returns it via a simple HTTP endpoint.

The server acts as a lightweight proxy between the client and Instagram’s media servers.

---

## Tech Stack

- **Node.js**
- **Express.js**
- **Fetch API**
- **Stream handling**
- **Environment variables** for sensitive data

---
## Tech Stack

- **Node.js**
- **Express.js**
- **Fetch API**
- **Stream handling**
- **Environment variables** for sensitive data

---

## How to Run Locally

### 1. Clone the repository

```bash

git clone https://github.com/riyan-ghouri/reel.git

cd reel

```

## Install dependencies



```bash

npm install

```
## Start the server

```bash

node server.js

```
## How to Use the API
```bash

GET /download?url=<INSTAGRAM_REEL_OR_VIDEO_URL>

