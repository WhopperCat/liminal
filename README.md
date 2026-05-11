# Bardo

A sleek pseudo web browser built by **Liminal**.

Bardo is an Express-powered proxy browser that uses Scramjet and Wisp to route web traffic through a service worker-powered browsing layer. It includes tabs, bookmarks, theme options, tab cloaking, an about:blank launcher, and a panic key for quickly redirecting the session.

## Features

- Multi-tab browsing
- Built-in search bar with support for DuckDuckGo, Google, Bing, Brave, and Startpage
- Bookmark bar and bookmark saving in local storage
- Theme selection
- Tab cloaking options for disguising the tab title and favicon
- About:blank launcher mode
- Panic key / panic redirect
- Proxy cache reload / reset option
- Service worker-based proxy setup

## Tech Stack

- Node.js 18+
- Express
- Scramjet
- Wisp
- BareMux
- Epoxy transport
- libcurl transport

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm start
```

The app listens on `PORT` if it is set, otherwise it defaults to `8080`.

## Project Structure

```text
.
├── server.js
├── package.json
├── public/
│   ├── app.js
│   ├── index.html
│   ├── style.css
│   └── sw.js
├── infra/
└── .github/
```

## Notes

- The service worker is served from `/sw.js` and the proxy assets are mounted under `/scramjet/`, `/baremux/`, `/epoxy/`, and `/libcurl/`.
- The app prefers a local Wisp endpoint when available and falls back to the public Wisp endpoint if needed.
- User settings are stored in `localStorage`.

## License

Add your license here if the project has one.
