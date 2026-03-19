---
title: "Testing Elixir releases in CI"
date: 2024-04-30
author: "Almir Sarajčić"
role: "Software Developer"
reading_time: 10
image: "/images/blog/testing_elixir_releases_in_ci.png"
draft: false
---

Have you ever deployed your app and called it a day only to find out later that in production some NIF was missing or a 3rd party application wasn't started? No, that never happens to you because you always run your app locally with `MIX_ENV=prod` before deploying, right? Right?

Last year I worked on a project with a really conscientious team. We were working on an umbrella project consisting of 6 apps, and a colleague of mine always made sure to build a release for each of them in the prod environment and run it manually on his machine, then deploy it worry-free. It took some time to do that and it was a boring process, so to help him out, I automated the process by building a release and running it for each app in CI. Then, if everything passed, we'd proceed with the deployment.

At Optimum, we usually strive to deploy [preview apps](/blog/how-to-automate-creating-and-destroying-pull-request-review-phoenix-applications-on-fly-io) assuring us that the app is successfully built and running on a Fly.io server. Sometimes we have a different setup, for which we may build a release as part of our CI.

I'm going to show you how it works in a sample Phoenix app that will execute some code from ExUnit which will be missing in production. The code is available in the repo: [https://github.com/almirsarajcic/testing_release](https://github.com/almirsarajcic/testing_release).

# Failing example

Let's generate a new Phoenix app that consists of only an API endpoint.

```bash
mix phx.new testing_release --adapter bandit --no-assets --no-ecto --no-esbuild --no-gettext --no-html --no-live --no-mailer --no-tailwind
```

Create a controller in a new file `lib/testing_release_web/controllers/home_controller.ex`:

```elixir
defmodule TestingReleaseWeb.HomeController do
  use TestingReleaseWeb, :controller

  def index(conn, _params) do
    ExUnit.__info__(:functions) |> IO.inspect(label: "ExUnit functions")

    json(conn, %{status: "ok"})
  end
end
```

Add the route:

```elixir
scope "/api", TestingReleaseWeb do
  pipe_through :api

  get "/", HomeController, :index
end
```

You can see the full commit here: [https://github.com/almirsarajcic/testing_release/commit/378f30c124ca7814e43b8685e57cf350caceb20d](https://github.com/almirsarajcic/testing_release/commit/378f30c124ca7814e43b8685e57cf350caceb20d).

After setting that up, I can launch a Fly.io server:

```bash
fly launch --generate-name --vm-memory 256
```

After it's been deployed I can visit URL [https://old-wave-7774.fly.dev/api](https://old-wave-7774.fly.dev/api) and get the following response:

```json
{ "errors": { "detail": "Internal Server Error" } }
```

Executing `fly logs` shows:

```
[error] ** (UndefinedFunctionError) function ExUnit.__info__/1 is undefined (module ExUnit is not available)
ExUnit.__info__(:functions)
    (testing_release 0.1.0) lib/testing_release_web/controllers/home_controller.ex:5: TestingReleaseWeb.HomeController.index/2
    (testing_release 0.1.0) lib/testing_release_web/controllers/home_controller.ex:1: TestingReleaseWeb.HomeController.action/2
    (testing_release 0.1.0) lib/testing_release_web/controllers/home_controller.ex:1: TestingReleaseWeb.HomeController.phoenix_controller_pipeline/2
    (phoenix 1.7.12) lib/phoenix/router.ex:484: Phoenix.Router.__call__/5
    (testing_release 0.1.0) lib/testing_release_web/endpoint.ex:1: TestingReleaseWeb.Endpoint.plug_builder_call/2
    (testing_release 0.1.0) lib/testing_release_web/endpoint.ex:1: TestingReleaseWeb.Endpoint.call/2
    (bandit 1.5.0) lib/bandit/pipeline.ex:124: Bandit.Pipeline.call_plug!/2
```

But we won't fix the error yet. Let's reproduce it in CI.

# Automating release process

We can use the same Dockerfile generated for us while running `fly launch` to start a container in GitHub Actions and then send an HTTP request to verify it works as expected. We'll be using a script [github_workflows_generator](https://hex.pm/packages/github_workflows_generator) we introduced in the blog post [Maintaining GitHub Actions workflows](/blog/maintaining-github-actions-workflows) to write the workflow in Elixir.

Here we'll focus only on the steps of the workflow, but you can see the full commit on the following link: [https://github.com/almirsarajcic/testing_release/commit/65def71031669cf7fcde77918f9b073e95bca4d3](https://github.com/almirsarajcic/testing_release/commit/65def71031669cf7fcde77918f9b073e95bca4d3).

```elixir
steps: [
  [
    name: "Checkout",
    uses: "actions/checkout@v3"
  ],
  [
    name: "Set up Docker Buildx",
    uses: "docker/setup-buildx-action@v1"
  ],
  [
    name: "Cache Docker layers",
    uses: "actions/cache@v3",
    with: [
      path: "/tmp/.buildx-cache",
      key: "${{ runner.os }}-buildx-${{ github.sha }}",
      "restore-keys": "${{ runner.os }}-buildx"
    ]
  ],
  [
    name: "Build image",
    uses: "docker/build-push-action@v2",
    with: [
      context: ".",
      builder: "${{ steps.buildx.outputs.name }}",
      tags: "testing_release:latest",
      load: true,
      "build-args": "target=testing_release",
      "cache-from": "type=local,src=/tmp/.buildx-cache",
      "cache-to": "type=local,dest=/tmp/.buildx-cache-new,mode=max"
    ]
  ],
  [
    # Temp fix
    # https://github.com/docker/build-push-action/issues/252
    # https://github.com/moby/buildkit/issues/1896
    name: "Move cache",
    run: "rm -rf /tmp/.buildx-cache\nmv /tmp/.buildx-cache-new /tmp/.buildx-cache"
  ],
  [
    name: "Create the container",
    id: "create_container",
    run:
      "echo ::set-output name=container_id::$(docker create -p 4000:4000 -e FLY_APP_NAME=${{ env.FLY_APP_NAME }} -e FLY_PRIVATE_IP=${{ env.FLY_PRIVATE_IP }} -e PHX_HOST=${{ env.PHX_HOST }} -e SECRET_KEY_BASE=${{ env.SECRET_KEY_BASE }} testing_release | tail -1)"
  ],
  [
    name: "Start the container",
    run: "docker start ${{ steps.create_container.outputs.container_id }}"
  ],
  [
    name: "Check HTTP status code",
    uses: "nick-fields/retry@v2",
    with: [
      command:
        "INPUT_SITES='[\"http://localhost:4000/api\"]' INPUT_EXPECTED='[200]' ./scripts/check_status_code.sh",
      max_attempts: 3,
      retry_wait_seconds: 5,
      timeout_seconds: 1
    ]
  ],
  [
    name: "Write Docker logs to a file",
    if: "failure() && steps.create_container.outcome == 'success'",
    run:
      "docker logs ${{ steps.create_container.outputs.container_id }} >> docker.log"
  ],
  [
    name: "Upload Docker log file",
    if: "failure()",
    uses: "actions/upload-artifact@v3",
    with: [
      name: "docker.log",
      path: "docker.log"
    ]
  ]
]
```

Most of the steps are related to setting up Docker for caching intermediary images so that subsequent runs are quicker, but these steps are the most important:

```elixir
[
  name: "Start the container",
  run: "docker start ${{ steps.create_container.outputs.container_id }}"
],
[
  name: "Check HTTP status code",
  uses: "nick-fields/retry@v2",
  with: [
    command:
      "INPUT_SITES='[\"http://localhost:4000/api\"]' INPUT_EXPECTED='[200]' ./scripts/check_status_code.sh",
    max_attempts: 3,
    retry_wait_seconds: 5,
    timeout_seconds: 1
  ]
]
```

After building the image and creating the container, we start it, and then send an HTTP request to it. We're not sure when the server is ready, so we use [nick-fields/retry](https://github.com/nick-fields/retry) action to retry sending the request with a configurable number of maximum attempts. To send a request we use a convenient script [scripts/check_status_code.sh](https://github.com/almirsarajcic/testing_release/blob/main/scripts/check_status_code.sh) I copied from https://github.com/lakuapik/gh-actions-http-status.

In the end, we upload a log as an artifact so we can inspect it in case the request fails.

There's an additional change we have to make to enable running the release outside of Fly.io environment. In the file `rel/env.sh.eex` replace the line

```bash
export ERL_AFLAGS="-proto_dist inet6_tcp"
```

with

```bash
if [[ -z "${FLY_PRIVATE_IP}" ]]; then
    export ERL_AFLAGS="-proto_dist inet6_tcp"
fi
```

After pushing the code to GitHub, you can see requests failing.

<figure>
<img src="/images/blog/testing_elixir_releases_in_ci-2.png" />
<figcaption>Run nick-fields/retry@v2 step</figcaption>
</figure>

Checking the log file saved as an artifact

<figure>
<img src="/images/blog/testing_elixir_releases_in_ci-3.png" />
<figcaption>docker.log artifact</figcaption>
</figure>

shows the following error messages:

```
15:31:02.527 [info] Running TestingReleaseWeb.Endpoint with Bandit 1.5.0 at :::4000 (http)
15:31:02.528 [info] Access TestingReleaseWeb.Endpoint at https://localhost
15:31:07.848 request_id=F8rJ9kxkVangNu4AAAAE [info] GET /api
15:31:07.848 request_id=F8rJ9kxkVangNu4AAAAE [info] Sent 500 in 251µs
15:31:07.849 request_id=F8rJ9kxkVangNu4AAAAE [error] ** (UndefinedFunctionError) function ExUnit.__info__/1 is undefined (module ExUnit is not available)
    ExUnit.__info__(:functions)
    (testing_release 0.1.0) lib/testing_release_web/controllers/home_controller.ex:5: TestingReleaseWeb.HomeController.index/2
    (testing_release 0.1.0) lib/testing_release_web/controllers/home_controller.ex:1: TestingReleaseWeb.HomeController.action/2
    (testing_release 0.1.0) lib/testing_release_web/controllers/home_controller.ex:1: TestingReleaseWeb.HomeController.phoenix_controller_pipeline/2
    (phoenix 1.7.12) lib/phoenix/router.ex:484: Phoenix.Router.__call__/5
    (testing_release 0.1.0) lib/testing_release_web/endpoint.ex:1: TestingReleaseWeb.Endpoint.plug_builder_call/2
    (testing_release 0.1.0) lib/testing_release_web/endpoint.ex:1: TestingReleaseWeb.Endpoint.call/2
    (bandit 1.5.0) lib/bandit/pipeline.ex:124: Bandit.Pipeline.call_plug!/2
```

The fix for this is simple: change the `:extra_applications` in the `mix.exs` file from

```elixir
[:logger, :runtime_tools]
```

to

```elixir
[:ex_unit, :logger, :runtime_tools]
```

([https://github.com/almirsarajcic/testing_release/commit/534615eb5dcf0cc19c166971cdeeb23f4ad49708](https://github.com/almirsarajcic/testing_release/commit/534615eb5dcf0cc19c166971cdeeb23f4ad49708))

After pushing the code, we verify it works.

<figure>
<img src="/images/blog/testing_elixir_releases_in_ci-4.png" />
<figcaption>main.yml workflow result</figcaption>
</figure>

You can also use a database by setting up the Docker container to use the network from the DB service, Redis, and whatnot. Possibilities are vast.

_This was a post from our [Elixir DevOps series](/blog/elixir-devops-series)._
