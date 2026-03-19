---
title: "Leveraging FLAME for Efficient Screenshot Generation"
date: 2024-11-22
author: "Nyakio Muriuki"
role: "Software Developer"
reading_time: 15
image: "/images/blog/leveraging_flame_for_efficient_screenshot_generation.png"
draft: false
---

A successful knowledge-sharing platform, like [Elixir Drops](https://elixirdrops.net), depends on making its content both discoverable and easily shareable. Metatags are essential for achieving this by providing search engines, social media platforms, and browsers with critical metadata to understand, display, and rank content appropriately.

Among these, metatag images—visuals that appear when a link is shared on platforms like Facebook, Twitter, or Slack—play a key role in engaging users. These images, specified via Open Graph (og:image) and Twitter Card (twitter:image) tags, significantly enhance the appearance and click-through potential of shared links.

For platforms centered on code sharing, developers typically use tools to style and format code snippets into visually appealing screenshots for social media. However, manually creating such images for a growing platform like Elixir Drops is not scalable. To address this, we automated the creation of custom metatag images using Elixir tools and the FLAME library for dynamic scaling.

# Automating Metatag Image Creation

### 1.Triggering a Background Job

Every time a post is created or updated, a background job is queued to generate a screenshot of the post content. This image is uploaded to an S3 bucket and referenced in the post's metatags.

```elixir
def handle_event("save", %{"drop" => drop_params}, socket) do
  case create_or_update_drop(socket, socket.assigns.live_action, drop_params) do
    {:ok, drop} ->
      enqueue_seo_screenshot_creation(drop.id)

      {
        :noreply,
        push_navigate(
          socket,
          to: ~p"/profile"
        )
      }

    {:error, changeset} ->
      {:noreply, assign_form(socket, changeset)}
  end
end

defp enqueue_seo_screenshot_creation(drop_id) do
  %{"drop_id" => drop_id}
  |> ScreenshotGeneratorWorker.new()
  |> Oban.insert()
end
```

### 2. Background Job for Screenshot Generation

The background job ensures that only posts with code blocks trigger the screenshot generation process. The job scans the Markdown content of the post using a regex. If no code block is found, the job is canceled to avoid unnecessary retries.

```elixir
def perform(%Oban.Job{args: args}) do
  args
  |> maybe_create_screenshot()
  |> maybe_retry_job()
end

defp maybe_retry_job({:ok, _image_url}), do: :ok
defp maybe_retry_job({:cancel, reason}), do: {:cancel, reason}
defp maybe_retry_job(error), do: error

defp maybe_create_screenshot(args) do
  with {:ok, drop} <- get_drop(args["drop_id"]),
        :ok <- check_for_code_block(drop.body) do
    drop_screenshot(drop)
  else
    _error ->
      {:cancel, "No code block found"}
  end
end

defp check_for_code_block(body) do
  case Regex.run(@markdown_regex, body, capture: :first) do
    nil -> {:error, "No code block found"}
    _code_block -> :ok
  end
end
```

### 3. Screenshot Generation

Screenshots are created using Wallaby, which relies on Chromedriver. The setup dynamically generates browser-based screenshots of the code blocks.

```elixir
defp generate_screenshot(drop) do
  {:ok, session} =
    Wallaby.start_session(
      capabilities: %{
        chromeOptions: %{
          args: [
            "--headless",
            "--no-sandbox",
            "window-size=1280,800",
            "--fullscreen",
            "--disable-gpu",
            "--disable-dev-shm-usage"
          ]
        }
      }
    )

  url = build_url_with_auth(drop)

  %Wallaby.Session{screenshots: [screenshot]} =
    session
    |> Browser.visit(url)
    |> Browser.take_screenshot()

  Wallaby.end_session(session)

  {:ok, screenshot}
end
```

### 4. Uploading to S3

The generated screenshot is uploaded to S3 for persistent storage and later reference in the post's metatags.

```elixir
defp upload_screenshot(screenshot, drop) do
  timestamp = Timex.to_unix(drop.updated_at)

  image_name = "drop-meta-image-#{timestamp}-#{drop.id}.png"

  case Client.upload_image(screenshot, image_name, "image/png") do
    {:ok, image_url} ->
      {:ok, image_url}

    error ->
      error
  end
end
```

Handling tasks like screenshot generation and S3 uploads can lead to spikes in resource usage, especially with increasing demand. To manage this efficiently, we leveraged FLAME, a library designed for elastic workloads. FLAME allows resource-intensive operations to run on short-lived infrastructure, scaling dynamically to meet demand and scaling down during idle times.

> FLAME is a distributed, serverless-inspired library and paradigm in Elixir, designed to efficiently manage elastic workloads—tasks with highly variable resource demands. It enables developers to treat their entire application as a lambda, allowing modular components to execute on short-lived infrastructure without requiring rewrites or complex orchestration.- [Docs](https://hexdocs.pm/flame/FLAME.html)

# Using FLAME to Handle Screenshot Generation

FLAME provides a powerful way to manage elastic workloads. Here are the steps to integrate FLAME for dynamically generating screenshots for your posts.

### 1. Add FLAME dependency

```elixir
# mix.exs:
{:flame, "~> 0.5.1"},
```

### 2. Setting up FLAME

Inspired by a [great example](https://github.com/fly-apps/wps/). We configure FLAME to enable or disable services depending on whether a node is running as a FLAME child. You can learn more about this setup from the [Deployment Considerations](https://hexdocs.pm/flame/FLAME.html#deployment-considerations) and [Pools](https://hexdocs.pm/flame/FLAME.html#module-pools) documentation.
Here's how we configured application.exs:

```elixir
# application.exs
 @impl Application
def start(_type, _args) do
  children =
    children(
      always: ElixirDropsWeb.Telemetry,
      always: ElixirDropsWeb.Endpoint,
      parent: ElixirDrops.Repo,
      parent:
        {DNSCluster, query: Application.get_env(:elixir_drops, :dns_cluster_query) || :ignore},
      parent: {Phoenix.PubSub, name: ElixirDrops.PubSub},
      # Start the Finch HTTP client for sending emails
      parent: {Finch, name: ElixirDrops.Finch},
      # Start a worker by calling: ElixirDrops.Worker.start_link(arg)
      # {ElixirDrops.Worker, arg},
      # Start to serve requests, typically the last entry
      parent:
        {FLAME.Pool,
          name: ElixirDrops.ScreenshotGenerator,
          idle_shutdown_after: 30_000,
          log: :info,
          max_concurrency: 2,
          max: 4,
          min: 0},
      parent: {Oban, Application.get_env(:elixir_drops, Oban)}
    )

  # See https://hexdocs.pm/elixir/Supervisor.html
  # for other strategies and supported options
  opts = [strategy: :one_for_one, name: ElixirDrops.Supervisor]
  Supervisor.start_link(children, opts)
end

# Tell Phoenix to update the endpoint configuration
# whenever the application is updated.
@impl Application
def config_change(changed, _new, removed) do
  ElixirDropsWeb.Endpoint.config_change(changed, removed)
  :ok
end

# Exclude children marked with `parent` in the FLAME environment
defp children(child_specs) do
  is_parent? = is_nil(FLAME.Parent.get())
  is_flame? = !is_parent? || FLAME.Backend.impl() == FLAME.LocalBackend

  Enum.flat_map(child_specs, fn
    {:always, spec} -> [spec]
    {:parent, spec} when is_parent? == true -> [spec]
    {:parent, _spec} when is_parent? == false -> []
    {:flame, spec} when is_flame? == true -> [spec]
    {:flame, _spec} when is_flame? == false -> []
  end)
end
```

### 3. Configuring the Fly Backend

Since we're using Fly.io machines, we need to configure the [FlyBackend](https://hexdocs.pm/flame/FLAME.FlyBackend.html) and set the environment variables for FLAME. Note that Fly.io machines running FLAME tasks do not inherit the parent's environment variables.

Add the following configuration in config/runtime.exs:

```elixir
# config/runtime.exs
config :flame,
  backend: FLAME.FlyBackend,
  env: %{
    "AWS_ACCESS_KEY_ID" => aws_access_key_id,
    "AWS_ENDPOINT_URL_S3" => aws_endpoint_url,
    "AWS_REGION" => aws_region,
    "AWS_SECRET_ACCESS_KEY" => aws_secret_access_key,
    "BUCKET_NAME" => aws_bucket
  },
  token: fly_api_token
```

### 4. Wrapping Screenshot Generation in FLAME

Once FLAME is set up, we can wrap the screenshot generation logic in a [FLAME call](https://hexdocs.pm/flame/FLAME.html#call/3) to execute the task on short-lived infrastructure.

Here's how you can wrap the screenshot generation and S3 upload logic:

```elixir
 defp drop_screenshot(drop) do
  FLAME.call(ScreenshotGenerator, fn ->
    with {:ok, screenshot} <- generate_screenshot(drop),
          {:ok, image} <- File.read(screenshot) do
      upload_screenshot(image, drop)
    end
  end)
end
```

By integrating FLAME into our workflow, we have streamlined the process of generating and uploading screenshots for our posts, allowing us to handle elastic workloads efficiently without introducing unnecessary complexity. FLAME's ability to dynamically scale resources on-demand ensures that we can handle spikes in demand—such as when processing multiple screenshot requests—while maintaining cost-effectiveness and simplicity. This approach not only simplifies our infrastructure but also enables us to focus on providing a better experience for users without worrying about the complexities of serverless architectures. Whether you're handling resource-intensive tasks like screenshot generation or other elastic workloads, FLAME offers a robust and scalable solution for modern web applications.

You can learn more about FLAME:

- [Official Docs](https://hexdocs.pm/flame/FLAME.html)
- [Rethinking Serverless with FLAME](https://fly.io/blog/rethinking-serverless-with-flame/)
- [Scaling Your Phoenix App in Elixir with FLAME](https://blog.appsignal.com/2024/09/03/scaling-your-phoenix-app-in-elixir-with-flame.html)
- [Serverless With Servers? FLAME is...weird](https://www.youtube.com/watch?v=ewf-18jacmo)
