---
title: "Optimum infrastructure generator"
date: 2024-09-06
author: "Almir Sarajčić"
role: "Software Developer"
reading_time: 5
image: "/images/blog/optimum_infrastructure_generator.png"
draft: false
---

In the [Elixir DevOps blog post series](/blog/elixir-devops-series) we wrote about our development workflows and the infrastructure facilitating them. Those are the tools we reach for on most of the projects. Fly.io is our platform of choice, but even when we're not the ones making that decision, we at least set up the continuous integration the way we described in the [Optimum Elixir CI with GitHub Actions](/blog/optimum-elixir-ci-with-github-actions).

There are many moving pieces involved in the infrastructure setup, which can incur a great cost in terms of developer hours, even if following along our blog post series. As a small business owner, development team lead, or anyone involved in decision-making, you'll have a tough time justifying money spent on developers reinventing the wheel which is a CI/CD pipeline and other aspects of infrastructure setup versus taking an off-the-shelf solution.

We didn't want to do this manually on all our projects, so we created a generator that simplifies the process greatly. And now we offer that to everyone else, too. We target startups and small businesses that don't yet require a huge infrastructure (AWS, Google Cloud, Terraform, Kubernetes, custom setup on bare metal, you name it). Even if you're already on Kubernetes, maybe you should reconsider whether it's appropriate for your needs and your scale.

&nbsp;

Anyway, the generator serves as a glue between different tools we covered in the blog post series:

- Optimum CI with a revolutionary yet simple caching strategy
- automatic deployment to the staging server on Fly.io on merge
- automatic creation of preview apps on Fly.io on PR creation and updates
- config for the production server on Fly.io

&nbsp;

Plus:

- AppSignal configuration
- health check
- mise setup

&nbsp;

Whether you're working on an existing app, or a completely new one, we got you. Both plain Elixir and Phoenix apps are supported with different feature sets.

&nbsp;

If you're working on an Elixir app without Phoenix you get:

- mise config (.tool-versions file, reading env variables from .env file)
- local code checks (compilation warnings, Credo, Dialyzer, dependencies audit, Sobelow, Prettier formatting, Elixir formatting, tests, and coverage)
- CI on GitHub Actions
- docs
- release setup

&nbsp;

If you're working on a Phoenix app, on top of that, you get:

- health checks
- AppSignal configuration
- Dockerfile for environments on Fly.io
- preview, staging, and production environments config for Fly.io
- CI and CD on GitHub Actions setup for preview apps and staging deployment

&nbsp;

We offer all of this at a predictable, streamlined pricing. Buy it once for $499 and run it as many times as you want on any project.

We support both plain Elixir and Phoenix apps. Running the generator in Elixir apps sets up mise and CI (locally and on GitHub), while for Phoenix apps it additionally set up CD.

Visit [hex.codecodeship.com/package/optimum_gen_infra](https://hex.codecodeship.com/package/optimum_gen_infra) to get started.
