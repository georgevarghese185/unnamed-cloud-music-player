# Unnamed Cloud Music Player

A cross platform cloud backed music player

## Unnamed?

Yes, I haven't thought of a name yet. I don't have a very good track record when it comes to completing hobby projects so a dedicated name is a little too much commitment for me right now...

## What is this project?

The plan is to create a cross-platform music player app that can

1. Play songs stored locally on your device

2. Play songs stored on cloud storage (Google Drive, OneDrive, Dropbox etc..)

3. Sync your library, playlists and queue activity across devices so that you can pick up where you left off anywhere, anytime

4. And more.. maybe

## Current progress

- A mostly blank electron and web app
- The electron app can import music from folders on your system and add them to a library and display the songs as a list

## Run the project

1. Install Node.js and Yarn

   If you use `nvm` or `nvm-windows` you can install the recommended version of Node.js with

   ```
   nvm install
   nvm use
   ```

2. Install dependencies

   ```sh
   yarn install
   ```

### Run web app:

```sh
yarn dev
```

### Run electron app

```sh
yarn dev -m electron
```

### Lint and Format

Use ESLint and Prettier to fix whatever style and formatting issues you can before committing any code

```sh
yarn lint
yarn format --write
```
