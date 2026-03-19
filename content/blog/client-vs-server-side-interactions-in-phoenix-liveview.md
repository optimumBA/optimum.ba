---
title: "Client vs Server side interactions in Phoenix LiveView"
date: 2024-07-08
author: "Nyakio Muriuki"
role: "Software Developer"
reading_time: 10
image: "/images/blog/client_vs_server.png"
draft: false
---

The effectiveness of server-side frameworks like Phoenix LiveView for creating fully interactive web applications has sparked considerable debate, as seen in discussions such as these:

<figure>
<img src="/images/blog/client_vs_server-2.png" />
<figcaption class="attachment__caption attachment__caption--edited"><a href="https://x.com/t3dotgg/status/1796850200528732192">https://x.com/t3dotgg/status/1796850200528732192</a></figcaption>
</figure>

<figure>
<img src="/images/blog/client_vs_server-3.png" />
<figcaption class="attachment__caption attachment__caption--edited"><a href="https://x.com/josevalim/status/1798008439895195960">https://x.com/josevalim/status/1798008439895195960</a></figcaption>
</figure>

While Phoenix LiveView can achieve significant functionality independently, the strategic decision of when to initiate server round trips becomes crucial for crafting truly interactive web experiences. This post explores the dynamics of client-side versus server-side interactions within Phoenix LiveView.

# Client vs Server

To ensure a smooth user experience, it's crucial to determine which interactions require minimal latency. For instance, actions like dragging and dropping elements across a screen or dynamically creating UI components should be executed without delay; otherwise, your application may feel sluggish and unresponsive. Thus, the decision between client-side and server-side processing hinges on understanding when each approach is most appropriate.

1. **Showing and Hiding Content:** For interactions such as displaying modals or toggling visibility based on user actions (e.g. clicking a button), handling these tasks on the client side is generally preferable. This approach is suitable unless:

- The content must be dynamically loaded to optimize network or application load.
- The interaction requires state changes that must be synchronized with the backend.
  Example: On a settings page, showing a modal when a user clicks "Change Email Address" can be managed client-side.

<figure>
<img src="/images/blog/client_vs_server-4.gif" />
<figcaption class="attachment__caption attachment__caption--edited">Showing form in a modal from client-side</figcaption>
</figure>

However, triggering a confirmation message after sending an email with a verification link typically involves a backend state change, making it appropriate for server-side handling.

<figure>
<img src="/images/blog/client_vs_server-5.gif" />
<figcaption class="attachment__caption attachment__caption--edited">Showing a success message from server-side</figcaption>
</figure>

2. **Zero Latency Demands:** Interactions that demand instant responsiveness, such as drag-and-drop interfaces, should primarily be managed client-side to ensure a seamless user experience.
3. **Server-Side Necessity:** Any interaction that inherently involves the server should be handled server-side.
   Examples include:
   - Uploading files.
   - Saving data to a database.
   - Broadcasting messages to other clients with Phoenix PubSub.

By discerning when to delegate tasks to the client versus the server, applications can optimize performance and responsiveness, delivering an intuitive user experience across various functionalities.

# How to build a rich client experience in Liveview?

LiveView provides developers with convenient ways to incorporate JavaScript code when building interactive applications. Here are some of the available options:

### LiveView.JS

The Phoenix.LiveView.JS module enables developers to seamlessly integrate JavaScript functionality into Elixir code, offering commands for executing essential client-side operations.

These commands support common tasks such as toggling CSS classes, dispatching DOM events, etc.

> _While these operations can be accomplished via client-side hooks, JS commands are DOM-patch aware, so operations applied by the JS APIs will stick to elements across patches from the server._
>
> [https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.JS.html](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.JS.html)

In addition to purely client-side utilities, the JS commands include a rich push API, for extending the default phx-binding pushes with options to customize targets, loading states, and additional payload values.

Below is an example demonstrating how to utilize these commands to dynamically apply styles while showing and hiding a modal.

```heex
<a
  phx-click={show_settings_modal("change-email-modal")}
  >
  Change email address
</a>
```

```elixir
def show_settings_modal(modal) do
  %JS{}
  |> JS.add_class("blur-md pointer-events-none", to: ".settings-container")
  |> JS.show(to: "##{modal}")
end
```

### JS Hooks

A Javascript object provided by phx-hook implementing methods like: `mounted()`, `updated()`, `beforeUpdate()`, `destroyed()`, `disconnected()`, `reconnected()`.

For example, one can implement a reorderable drag-and-drop list using Hooks.

```js
import Sortable

let Hooks = {}

Hooks.Sortable = {
  mounted(){
    let group = this.el.dataset.group
    let isDragging = false
    this.el.addEventListener("focusout", e => isDragging && e.stopImmediatePropagation())
    let sorter = new Sortable(this.el, {
      group: group ? {name: group, pull: true, put: true} : undefined,
      animation: 150,
      dragClass: "drag-item",
      ghostClass: "drag-ghost",
      onStart: e => isDragging = true, // prevent phx-blur from firing while dragging
      onEnd: e => {
        isDragging = false
        let params = {old: e.oldIndex, new: e.newIndex, to: e.to.dataset, ...e.item.dataset}
        this.pushEventTo(this.el, this.el.dataset["drop"] || "reposition", params)
      }
    })
  }
}

let liveSocket = new LiveSocket("/live", Socket, {params: {_csrf_token: csrfToken}, hooks: Hooks})
```

```elixir
def render(assigns) do
  ~H"""
  <div id="drag-and-drop" phx-hook="Sortable">
    ...
  </div>
  """
end
```

Learn more about hooks:

- [Client hooks via phx-hook](https://hexdocs.pm/phoenix_live_view/js-interop.html#client-hooks-via-phx-hook)
- [Why is LiveView not a zero-JS framework but a zero-boring-JS framework?](https://tylerbarker.com/posts/liveview-is-not-a-zero-js-framework-it-s-a-zero-boring-js-framework?utm_source=elixir-merge)
- [Building a simple countdown timer app with LiveView](https://youtu.be/YFBg5NNEW4g)

### Alpine.js

Alpine.js is well-suited for developing LiveView-like applications. While many features of Alpine.js can now be achieved using LiveView.JS or Hooks, it remains prevalent in numerous codebases, especially those originally built on the popular [PETAL](https://thinkingelixir.com/petal-stack-in-elixir/) stack during the earlier days of Phoenix LiveView. Alpine.js is still useful for handling events not covered with LiveView.JS.

Here's an example demonstrating Alpine.js usage to toggle and transition components:

```heex
<div x-data="{ isOpen: false }">
  <button @click="isOpen = !isOpen" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    Toggle Component
  </button>

  <div x-show.transition="isOpen" class="bg-gray-200 p-4 mt-2">
    <!-- Your content here -->
    This content will toggle with a nice transition effect.
  </div>
</div>
```

One can combine JavaScript commands with Alpine.js effectively. For instance, you can dispatch DOM events when a button is clicked and handle them in Alpine.js:

```heex
<button phx-click={JS.dispatch("set-slide", detail: %{slide: "chat"})}> Open Chat </button>

# Elsewhere in the codebase
<div
  x-data="{
    slide: null
  }"
  @set-slide-over.window="slide = (slide == $event.detail.slide) ? null : $event.detail.slide"
  >
  ...
</div>
```

In this example, clicking the button dispatches a custom event (set-slide) with specific data. Alpine.js then listens for and handles this event, demonstrating seamless integration with JavaScript commands in a mixed codebase environment. Check out Alpine.js [here](https://alpinejs.dev/).

# Built-in defaults to enrich client-side interactions

LiveView includes client-side features that allow developers to provide users with instant feedback while waiting for actions that may have latency.

Some of these features include:

- **phx-disable-with:** This feature allows buttons to switch text while a form is being submitted.

```heex
<button type="submit" phx-disable-with="Updating...">Update</button>
```

The button's `innerText` will change from "Update" to "Updating..." and restore it to "Update" on acknowledgment.

- **LiveView's CSS classes** LiveView includes built-in CSS classes that facilitate providing feedback. For instance, you can dynamically swap form content while a form is being submitted using LiveView's CSS loading state classes.

```css
.while-submitting {
  display: none;
}
.inputs {
  display: block;
}

.phx-submit-loading .while-submitting {
  display: block;
}
.phx-submit-loading .inputs {
  display: none;
}
```

```heex
<form phx-change="update">
  <div class="while-submitting">Please wait while we save our content...</div>
  <div class="inputs">
    <input type="text" name="text" value={@text}>
  </div>
</form>
```

You can learn more about this [here](https://fly.io/phoenix-files/phoenix-liveview-tailwind-variants/).

- **Global events dispatched for page navigation:** LiveView emits several events to the browsers and allows developers to submit their events too. For example, `phx:page-loading-start` and `phx:page-loading-stop` are dispatched, providing developers with the ability to give users feedback during main page transitions. These events can be utilized to display or conceal an animation bar that spans the page as shown below.

```js
// Show progress bar on live navigation and form submits
topbar.config({...})
window.addEventListener("phx:page-loading-start", info => topbar.show())
window.addEventListener("phx:page-loading-stop", info => topbar.hide())
```

# Other resources

- [Optimizing user experience in LiveView](https://dockyard.com/blog/2020/12/21/optimizing-user-experience-with-liveview)
- [phx- HTML attributes cheatsheet](https://hexdocs.pm/phoenix_live_view/html-attrs.html)
- [JavaScript interoperability](https://hexdocs.pm/phoenix_live_view/js-interop.html)
