---
title: "Opening up our code"
date: 2026-09-22
author: "Almir Sarajčić"
role: "Founder, Optimum Tech"
reading_time: 4
eyebrow: "From Optimum Tech"
draft: false
---

We’ve made the code for ElixirDrops, Skeptic.bot, and OptimumGenInfra public, along with several older projects. If you’ve used these applications or followed our Elixir work, you can now look through the repositories.

## ElixirDrops, Skeptic.bot, and OptimumGenInfra

[ElixirDrops](https://elixirdrops.net) is a Phoenix LiveView application for publishing and discovering short Elixir tips. The [repository](https://github.com/optimumBA/elixir_drops) includes an image-generation workflow that uses Oban and FLAME to render a Drop’s code block in a browser, create sharing images, and send progress back to the editor. The application also includes PostgreSQL full-text search, plain-Markdown versions of Drops, and infinite scrolling that coordinates new cards with the masonry layout.

[Skeptic.bot](https://skeptic.bot) lets you ask questions about conspiracy and alternative podcasts and find relevant episodes. The Phoenix application uses retrieval-augmented generation (RAG): vector search finds relevant episodes, and their summaries provide context for a short AI response shown alongside episode links. The [repository](https://github.com/optimumBA/skeptic_bot) includes a background pipeline with stages for episode discovery, audio downloads, transcription, summary generation, and vector embeddings. The search code also finds matching transcript segments; webhooks and PubSub deliver answer updates to LiveView.

Both are available under Apache-2.0, so you can study, fork, and adapt the code. We’re keeping contributions closed, with Issues, Pull Requests, and Discussions disabled. If you deploy your own version, use your own name, branding, content, credentials, and data.

[OptimumGenInfra](https://github.com/optimumBA/optimum_gen_infra) is the Elixir Mix task we built to generate infrastructure and GitHub Actions configuration for Elixir and Phoenix applications. Its templates reuse compiled dependencies across CI jobs, check migration rollbacks for Ecto projects, and add a health endpoint for Phoenix applications. It’s also available under Apache-2.0, but we no longer maintain or sell it. The repository is archived and provided as-is.

We’ve also made some older projects available:

- [optimum.ba_old](https://github.com/optimumBA/optimum.ba_old), our earlier company website, built with Jekyll.
- [SaseMango](https://github.com/optimumBA/sase_mango), a Phoenix LiveView application for screening Sarajevo Stock Exchange data and calculating share purchases. It uses Ecto lateral joins and window functions to compare financial statements, Decimal arithmetic for calculations, and a GenServer-managed ETS cache whose broadcasts refresh the LiveView tables.
- [Prati.ba](https://github.com/optimumBA/prati_ba), a Bosnian news platform we built with infinite scrolling on LiveView streams. PubSub signalled when new articles arrived, and readers could click a notification to add them to the top of the list without reloading the page. Its GenStage scraping pipeline separated article discovery from fetching details, using supervised tasks and demand limits.
- [Currency Watch](https://github.com/optimumBA/currency_watch), a small Phoenix API that collects exchange rates. Ecto subqueries pair each currency’s latest stored rate from today with yesterday’s, while provider adapters defined through Elixir behaviours let ingestion tests substitute a test provider.
- [Dota.ba](https://github.com/optimumBA/dotaba), our old Bosnian/Balkan Dota community website, built with PHP and Kohana. It includes Steam login, clan and tournament tools, and a match-history importer that paginates Steam’s API, caches responses, and stores player statistics.

## Preparing the repositories

Before publication, I had agents inspect the files and Git history for secrets, personal data, and other material that shouldn’t become public. These repositories had been used internally, and we needed to account for that before opening them.

Skeptic.bot had authentication data for a shared company YouTube account in its private repository. That suited our workflow at the time. For publication, we also had to account for copies in Git history; the password had already been changed and the existing sessions signed out.

ElixirDrops had a development database dump with personal fields removed, but it still contained real GitHub user IDs. We’d kept them because some application flows we tested included signing in through GitHub. Those IDs could still identify users, so we removed the dump and had GitHub purge its historical large-file object. We then checked that a fresh clone could be set up and tested without it.

If you’re opening an existing repository, include old branches and pull requests in the review. A deleted file can still be available in Git history, and a database can still identify people after names and email addresses have been removed.

## What I’m working on

Optimum Tech, LLC continues operating after the staffed Optimum BH agency ended in January 2026. I’m working on our products and am available for Elixir and Phoenix consulting, particularly helping teams improve how they use AI to build and maintain their applications. You can reach me at [consulting@optimum.ba](mailto:consulting@optimum.ba).

I’ll be publishing future posts on [ElixirDrops](https://elixirdrops.net) and [Kogen.dev](https://kogen.dev). This blog will remain available as an archive.
