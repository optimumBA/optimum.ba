---
title: "Sunsetting phx.tools"
date: 2026-11-05
author: "Almir Sarajčić"
role: "Founder, Optimum Tech"
reading_time: 2
eyebrow: "From Optimum Tech"
draft: false
---

I got the renewal reminder for phx.tools: another $33.39 to keep the domain for a year. No one's using the website, so I'm shutting it down and won't be renewing the domain when it expires on 5 December.

Back in 2023, inspired by [rails.new](https://rails.new/), I wanted the Elixir community to have a quick-start command too. It seemed like a good project for our internship program, so several interns worked on it together with me. We built a landing page and an installation script to set up an Elixir and Phoenix development environment on Linux and macOS. I wrote about it in the [original phx.tools introduction](https://optimum.ba/blog/phx-tools-complete-development-environment-for-elixir-and-phoenix/).

Pushing to GitHub triggered a workflow that tested the whole installation process on Linux and macOS, each under Bash, Zsh and Fish. The checks went through the installer, generated a Phoenix application and started its server to verify that it responded to an HTTP request.

If you're starting a Phoenix application today, [Phoenix Express](https://phoenix.hexdocs.pm/up_and_running.html#phoenix-express) covers that setup on macOS and Ubuntu:

```sh
curl https://new.phoenixframework.org/myapp | sh
```

It installs Erlang, Elixir and Phoenix and generates an application called `myapp`. Change that part of the URL to choose your application's name. It uses PostgreSQL or MySQL if available, otherwise SQLite. For other operating systems, follow the [Phoenix installation guide](https://phoenix.hexdocs.pm/installation.html).

The [phx.tools source](https://github.com/optimumBA/phx.tools) remains available as a public archive under its existing MIT license. The website and hosted installer have been shut down, and the project won't receive further updates.
