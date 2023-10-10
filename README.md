<h1 align="center">BitPurseBot</h1>
<p align="center"><a href="https://t.me/BitPurse_bot">BitPurseBot</a> - a self-custody opensource Bitcoin wallet within Telegram.</p>

---

<p align="center">
<a href="https://t.me/BitPurse_bot"><img alt="BitPurseBot" src="https://img.shields.io/badge/Testnet_bot-gray?logo=telegram"></a>
<a href="https://kit.svelte.dev"><img alt="SvelteKit" src="https://img.shields.io/badge/SvelteKit-gray?logo=svelte"></a>
<a href="https://sveltequery.vercel.app/"><img alt="Static Badge" src="https://img.shields.io/badge/Svelte_Query-gray"></a>
<a href="https://tailwindcss.com/"><img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-gray?logo=tailwindcss"></a>
<a href="https://m3.material.io/"><img alt="Material You" src="https://img.shields.io/badge/Material_You-gray"></a>
<a href="https://ziglang.org/"><img alt="Zig lang" src="https://img.shields.io/badge/Zig-gray?logo=zig"></a>
<a href="https://webassembly.org/"><img alt="Web Assembly" src="https://img.shields.io/badge/WASM-gray?logo=webassembly"></a>
<a href="https://blockstream.info/"><img alt="BlockStream" src="https://img.shields.io/badge/BlockStream-gray"></a>
<a href="https://grammy.dev"><img alt="Grammy" src="https://img.shields.io/badge/Grammy-gray"></a>
<a href="https://pocketbase.io/"><img alt="PocketBase" src="https://img.shields.io/badge/PocketBase-gray?logo=pocketbase"></a>
</p>

---

## Run locally

### Requirements

- You have [yarn](https://yarnpkg.com/getting-started/install) installed

- You have bot registered via [@BotFather](https://t.me/botfather)

### Instruction

- Clone this repository:

  ```bash
  git clone https://github.com/DavisDmitry/BitPurseBot
  ```

- Install dependencies

  ```bash
  yarn
  ```

- Copy `.env.example` as `.env`

  ```bash
  cp .env.example .env
  ```

- Make the app public available

  ```bash
  yarn expose
  ```

- Edit your `.env` (see [Configuration](#Configuration)).

- Build

  ```bash
  yarn build
  ```

- Set webhook url (replace `<VALUE>` with values from [Configuration](#Variables))

  ```bash
  curl -d "url=<PUBLIC_APP_URL>/api/bot&secret_token=<WEBHOOK_SECRET>" -X POST https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
  ```

- Run

  ```bash
  yarn preview
  ```

## Configuration

Everything is configured using environment variables. All settings can be divided into two types:

- Static (build time)
- Dynamic (runtime)

> [About SvelteKit environment variables](https://joyofcode.xyz/sveltekit-environment-variables)

### Variables

- **`PUBLIC_NET`**: Bitcoin network (`main` or `test`) - _static_
- **`PUBLIC_BOT_USERNAME`**: Username of your bot (without `@`) - _static_
- **`PUBLIC_APP_URL`**: Base path of your mini app - _static_
  > must start with `https://`
- **`BOT_TOKEN`**: Token of your bot - _dynamic_
  > You can get it from [@BotFather](https://t.me/botfather)
- **`WEBHOOK_SECRET`**: Secret token for webhooks from Telegram Bot API - _dynamic_
  > [Bot API #sendWebhook](https://core.telegram.org/bots/api#setwebhook)
- **`PB_URL`**: PocketBase backend URL - _dynamic_, optional (set empty string if you don't need it)
  > [Optional PocketBase backend](#Optional%20backend)
- **`PB_EMAIL`**: PocketBase admin email - _dynamic_, required if **`PB_URL`** provided (set empty string if you don't need it)
- **`PB_PASSWORD`**: PocketBase admin password - _dynamic_, required if **`PB_URL`** provided (set empty string if you don't need it)

## Optional backend

If you want to save bot users to a database, you can run the [PocketBase](https://pocketbase.io/) backend. But this is not necessary, the bot will work without it.

### Instruction

- [Download PocketBase binary](https://github.com/pocketbase/pocketbase/releases)

- Apply migrations (stored in `pb_migrations`)

  ```bash
  ./pocketbase migrate
  ```

- Start the web server

  ```bash
  ./pocketbase server
  ```

- Go to PocketBase admin UI and setup admin account

- Configure **`PB_*`** variables in your `.env`

## Production deploy

BitPurseBot can be deployed like any other SvelteKit application. See [SvelteKit documentation](https://kit.svelte.dev/docs/adapters)

## For developers

WASM code for signing transactions has already been compiled (stored in `static`). You can also compile it yourself if you have [Zig](https://ziglang.org/) installed

```bash
yarn build-zig
```

### Supported Telegram Mini App features

- Scanning a QR-code: [`src/routes/wallet/send/+page.svelte`](https://github.com/DavisDmitry/BitPurseBot/blob/master/src/routes/wallet/send/+page.svelte)

- Popups, closing confirmation

- Dynamic theme changing: [`src/routes/+layout.ts`](https://github.com/DavisDmitry/BitPurseBot/blob/master/src/routes/+layout.svelte)

- Main button

- Back button

- Haptic feedback

## Current state and limitations

Since I had a little time to develop, the functionality of BitPurseBot is quite limited at the moment.

- BIP-44 and BIP-84 have been partially implemented. BitPurseBot creates a hierarchy of keys, but uses only one account and one key for incoming transactions and change (`m/84'/0'/0'/0/0` for mainnet, `m/84'/1'/0'/0/0` for testnet)

- Only one address type can be created: Native SegWit (bech32)

- Only one type of outgoing transactions is supported: P2WPKH (native SegWit)

- The seed phrase cannot be imported and is generated randomly when the Mini App is first launched

- The seed phrase is stored in localStorage (wallet's TON Space does the same, but has the ability to make a cloud backup)

Because of all this, the mainnet version has not yet been launched.
