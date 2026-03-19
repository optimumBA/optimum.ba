---
title: "Exciting updates to phx.tools"
date: 2024-09-20
author: "Amos Kibet"
role: "Software Developer"
reading_time: 5
image: "/images/blog/exciting_updates_to_phx_tools.png"
draft: false
---

In the ever-evolving landscape of software development, it's essential to keep our tools lean, efficient, and up-to-date. We're excited to share the latest updates to [phx.tools](https://phx.tools/), the complete development environment for Elixir and Phoenix. If you've been following our journey since the initial release (as documented in [our previous blog post](/blog/phx-tools-complete-development-environment-for-elixir-and-phoenix)), you'll appreciate the enhancements we've made to streamline and modernize the toolset.

# Removal of Unnecessary Software

One of the primary goals of this update was to eliminate any bloatware that didn't contribute directly to the development workflow. We took a closer look at the included software packages and some of the removed packages are:

- **Chrome and Chromedriver:** While these tools are useful in some contexts, they aren't always needed for the Elixir and Phoenix development tasks. By removing them, we've reduced the overall footprint of phx.tools, making it more efficient and less resource-intensive.

- **Docker:** Docker is a powerful tool, but it's not a necessity for all developers. Recognizing that not every project requires containerization, we've removed Docker to simplify the environment. Developers who need it can still easily install it separately.

- **Node.js:** Node.js is a powerful tool, but it's not a necessity for all Phoenix projects. Recognizing that not every project requires Node.js, we've removed it to simplify the environment. Developers who need it can still easily install it separately.

These removals not only slim down the installation but also reduce potential security vulnerabilities and maintenance overhead.

# Updated Software Versions

In addition, all the remaining software has been updated to their latest versions. This ensures you have access to the most recent features and improvements, providing a more robust and up-to-date development setup.

# mise: A Superior Replacement for asdf

In this update, we've also replaced asdf with mise as our tool for managing language and package versions. Mise, available at [mise.jdx.dev](https://mise.jdx.dev/getting-started.html), offers a more streamlined and efficient experience compared to asdf.

- **Performance:** Mise is optimized for speed, significantly reducing the time it takes to switch between versions of Elixir, Erlang, or other tools. It also installs multiple tools in parallel. This performance boost helps you maintain your flow without the delays often encountered with asdf.

- **Simplicity:** Mise has a more intuitive setup and fewer dependencies, making it easier to configure and use. Unlike asdf, which often requires additional tools like direnv to manage environment variables, mise natively reads your .env file, eliminating the need for external software and simplifying your workflow.

- **Erlang Build Support:** When building Erlang, mise automatically takes into account your ~/.kerlrc configuration file, ensuring that your custom settings are applied seamlessly.

By adopting mise, we've made phx.tools faster and more user-friendly, ensuring that you have the best possible tools at your disposal.

# Shell Flexibility

Perhaps the most user-friendly update is the change in how we handle shell environments. Previously, we "forced" users to adopt the Zsh shell. While Zsh offers many powerful features, we recognized that forcing a specific shell setup could disrupt developers who were accustomed to their existing environments.

phx.tools now automatically detects your current shell configuration and uses it, whether you're working with Bash or Zsh. This change ensures a smoother, more personalized experience, allowing you to work in the environment you're most comfortable with.

# Conclusion

The latest update to phx.tools represents our commitment to creating a streamlined, up-to-date, and user-friendly development environment. By removing unnecessary software, updating the remaining tools, and introducing shell flexibility, we've made phx.tools more efficient and adaptable to your needs.

We're excited to see how these changes enhance your development experience. As always, we welcome your feedback and look forward to continuing to evolve phx.tools to meet the needs of the Elixir community.

Stay tuned for more updates, and happy coding!
