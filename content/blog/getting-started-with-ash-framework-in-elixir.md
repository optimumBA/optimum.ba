---
title: "Getting Started with Ash Framework in Elixir"
date: 2024-10-01
author: "Amos Kibet"
role: "Software Developer"
reading_time: 10
image: "/images/blog/getting_started_with_ash_framework_in_elixir.png"
draft: false
---

Are you looking for a powerful and flexible way to build Elixir applications? Look no further than the Ash framework! In this blog post, we'll introduce you to Ash, explain why it's great for building applications, and show you how to get started.

# What is Ash Framework?

Ash is a declarative, resource-based framework for building Elixir applications. It provides a set of powerful tools and abstractions that make it easier to build complex, data-driven applications while maintaining clean and maintainable code.

# Why Use Ash Framework?

1. **Declarative Design**: Ash allows you to define your application's structure and behavior declaratively, making your code more readable and maintainable.
2. **Resource-Based Architecture**: With Ash, you model your application around resources, which encapsulate data and behavior in a cohesive way.
3. **Built-in Features**: Ash provides many built-in features like pagination, filtering, and authorization, reducing the amount of boilerplate code you need to write.
4. **Extensibility**: The framework is highly extensible, allowing you to customize and extend its functionality to fit your specific needs.
5. **Integration with Phoenix**: Ash integrates seamlessly with Phoenix, making it easy to build web applications with a powerful backend.

# Installing Ash Framework

To get started with Ash in a new or existing Elixir project, you'll need to add the necessary dependencies to your `mix.exs` file:

```elixir
defp deps do
 [
 	{:ash_phoenix, "~> 2.0"},
	{:ash, "~> 3.0"},
    # ... other dependencies
 ]
end
```

Then, run `mix deps.get` to install the dependencies.

For more detailed installation instructions and configuration options, check out the [Ash Installation Guide](https://hexdocs.pm/ash/get-started.html).

# Key Features of Ash Framework

Let's explore a few key features of Ash that make it powerful for building applications:

### 1. Ash Resources

In Ash, you define your application's data model using resources. Here's an example of a simple Post resource:

```elixir
defmodule AshBlog.Posts.Post do
  use Ash.Resource,
    data_layer: AshPostgres.DataLayer,
    domain: AshBlog.Posts

  postgres do
    table "posts"
    repo AshBlog.Repo
  end

  actions do
    defaults [:read, :destroy, create: :*, update: :*]
  end

  attributes do
    uuid_primary_key :id
    attribute :title, :string, allow_nil?: false, public?: true
    attribute :body, :string, allow_nil?: false, public?: true
    create_timestamp :inserted_at
    update_timestamp :updated_at
  end
end
```

This resource definition includes attributes, actions, and database configuration. Ash takes care of generating the necessary database schema and provides a high-level API for interacting with your data.

### 2. Built-in Pagination

One of the powerful features of Ash is its built-in support for pagination. Ash comes with both **offset** and **keyset** pagination out of the box. With just a few lines of code, you can implement pagination in your application. To setup keyset pagination in your resource, just add this, under `actions`:

```elixir
# A `:read` action that returns a paginated list of posts,
# with a default of 10 posts per page
read :list do
  pagination keyset?: true, default_limit: 10
  prepare build(sort: :inserted_at)
end
```

And here's how you can use it in your LiveView:

```elixir
defp list_posts(%{assigns: %{load_more_token: nil}} = socket) do
  case Posts.read(Post, action: :list, page: [limit: 10]) do
    {:ok, %{results: posts}} ->
      load_more_token = List.last(posts) && List.last(posts).__metadata__.keyset

      socket
      |> assign(:load_more_token, load_more_token)
      |> stream(:posts, posts, reset: socket.assigns.load_more_token == nil)

    {:error, error} ->
      put_flash(socket, :error, "Error loading posts: #{inspect(error)}")
  end
end

defp list_posts(%{assigns: %{load_more_token: load_more_token}} = socket) do
  case Posts.read(Post, action: :list, page: [after: load_more_token, limit: 10]) do
    {:ok, %{results: posts}} ->
      load_more_token = List.last(posts) && List.last(posts).__metadata__.keyset

      socket
      |> assign(:load_more_token, load_more_token)
      |> stream(:posts, posts, at: -1, reset: socket.assigns.load_more_token == nil)

    {:error, error} ->
      put_flash(socket, :error, "Error loading posts: #{inspect(error)}")
  end
end
```

This implementation allows for efficient loading of posts as the user scrolls, creating an infinite scrolling behaviour.

### 3. Ash.Notifier

Another powerful feature of Ash is the ability to broadcast changes in resources using `Ash.Notifier`. This is particularly useful when you want to update the UI in real-time when data changes. Here's an example of how to set up a notifier:

```elixir
defmodule AshBlog.Notifiers do
  use Ash.Notifier

  def notify(%{action: %{type: :create}, data: post}) do
    Phoenix.PubSub.broadcast(AshBlog.PubSub, "post_creation", {:post_created, post})
  end
end
```

This notifier broadcasts a message whenever a new post is created.

Then, add the notifier to your resource:

```elixir
defmodule AshBlog.Posts.Post do
  use Ash.Resource,
    data_layer: AshPostgres.DataLayer,
    domain: AshBlog.Posts,
    notifiers: [AshBlog.Notifiers] # <-- add this

    # ...rest of your code
end
```

You can then subscribe to these notifications in your Phoenix LiveView to update the UI in real-time.

### 4. Integration with Phoenix LiveView

Ash integrates seamlessly with Phoenix LiveView, allowing you to build reactive user interfaces. Here's an example of how to use Ash with LiveView:

```elixir
defmodule AshBlogWeb.PostLive.Index do
  use AshBlogWeb, :live_view

  alias AshBlog.Posts
  alias AshBlog.Posts.Post

  @impl Phoenix.LiveView
  def mount(_params, _session, socket) do
    if connected?(socket), do: Phoenix.PubSub.subscribe(AshBlog.PubSub, "post_creation")

    form =
      Post
      |> AshPhoenix.Form.for_create(:create)
      |> to_form()

    {:ok,
     socket
     |> assign(:page_title, "AshBlog Posts")
     |> assign(:load_more_token, nil)
     |> assign(:form, form)
     |> stream(:posts, [])}
  end

  # ... other LiveView callbacks and event handlers
end
```

This LiveView lists posts, handles pagination, and updates in real-time when new posts are created.

To see a complete example of an Ash-powered blog application, you can check out [this](https://github.com/optimumBA/ash_poc/tree/main/ash_blog) sample AshBlog project on GitHub

# Conclusion

Ash framework provides a powerful and flexible way to build Elixir applications. Its declarative approach, resource-based architecture, built-in features like pagination, and integration with Phoenix make it an excellent choice for building complex, data-driven applications.To learn more about Ash and dive deeper into its features, check out the following resources:

- [Ash Documentation](https://hexdocs.pm/ash/get-started.html)
- [AshPhoenix Documentation](https://hexdocs.pm/ash_phoenix/readme.html)
- [Phoenix LiveView Documentation](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html)
- [Phoenix Framework Guides](https://hexdocs.pm/phoenix/overview.html)

Happy coding with Ash framework!
