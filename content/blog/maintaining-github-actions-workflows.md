---
title: "Maintaining GitHub Actions workflows"
date: 2024-02-02
author: "Almir Sarajčić"
role: "Software Developer"
reading_time: 10
image: "/images/blog/maintaining_github_actions_workflows.png"
draft: false
---

<div>Whenever we have a choice to make for a CI system to use on a project, we pick GitHub Actions, mainly for convenience. Our code is already hosted on GitHub, and it doesn't make sense to introduce other tools unnecessarily, so some time ago we started using GitHub Actions as our CI provider.</div>
<div>&nbsp;</div>
<div>Over the years we've been constantly improving our development workflows thereby adding more complexity to our CI. There were many steps in our pipeline for various code checks, Elixir tests, etc., each increasing the time we needed to wait to make sure our code was good to go. So we'd wait 5 to 10 minutes or so just to find out the code wasn't formatted properly, there was some compiler warning or something trivial as that. We knew there were better ways to set up our CI, but we felt separating the workflows into separate jobs was going to make for a harder-to-maintain code because GitHub Actions does not support full YAML syntax.</div>
<div>&nbsp;</div>
<div>I came to Elixir from the Ruby on Rails community where YAML is a default for any kind of configuration, so I was excited to see GitHub Actions using YAML for the workflow definitions. I quickly came to realize it's not the same YAML I was used to (<i>You've changed, bro</i>). Specifically, I couldn't use <a href="https://blogs.perl.org/users/tinita/2019/05/reusing-data-with-yaml-anchors-aliases-and-merge-keys.html" target="_blank">anchors</a> which provide the ability to write reusable code in .yml files.</div>
<div>&nbsp;</div>
<h1>Script</h1>
<div>Our way of working around this is writing workflow definitions in Elixir and translating them to YAML, letting us benefit from the beautiful Elixir syntax in sharing variables, steps, and jobs between workflows while still, as a result, having workflow files in the YAML format GitHub Actions supports.</div>
<div>&nbsp;</div>
<div>To convert the workflow definitions from Elixir to YAML, we wrote a CLI script that uses <a href="https://www.hex.pm/packages/fast_yaml" target="_blank">fast_yaml</a> library with a small amount of code wrapping it up in an easy-to-use package. We used this script internally for years, but now we've decided to share it with the community.</div>
<div>&nbsp;</div>
<h1>Usage</h1>
<div>Anyway, here's how you can use this mix task. Add the <b>github_workflows_generator</b> package as a dependency to your mix.exs file:</div>
<pre>[elixir]defp deps do
  [
    {:github_workflows_generator, "~> 0.1"}
  ]
end</pre>
<div>&nbsp;</div>
<div>You most likely don't want to use it in runtime and environments other than dev, so you might find this more appropriate:</div>
<pre>[elixir]defp deps do
  [
    {:github_workflows_generator, "~> 0.1", only: :dev, runtime: false}
  ]
end</pre>
<div>&nbsp;</div>
<div>That will let you execute</div>
<pre>[bash]mix github_workflows.generate</pre>
<div>&nbsp;</div>
<div>command that given a .github/github_workflows.ex file like this one:</div>
<pre>[elixir]defmodule GithubWorkflows do
  def get do
    %{
      "main.yml" => main_workflow(),
      "pr.yml" => pr_workflow()
    }
  end

defp main_workflow do
[
[
name: "Main",
on: [
push: [
branches: ["main"]
]
],
jobs: [
test: test_job(),
deploy: [
name: "Deploy",
needs: :test,
steps: [
checkout_step(),
[
name: "Deploy",
run: "make deploy"
]
]
]
]
]
]
end

defp pr_workflow do
[
[
name: "PR",
on: [
pull_request: [
branches: ["main"]
]
],
jobs: [
test: test_job()
]
]
]
end

defp test_job do
[
name: "Test",
steps: [
checkout_step(),
[
name: "Run tests",
run: "make test"
]
]
]
end

defp checkout_step do
[
name: "Checkout",
uses: "actions/checkout@v4"
]
end
end</pre>

<div>&nbsp;</div>
<div>creates multiple files in the .github/workflows directory.</div>
<div>&nbsp;</div>
<div>That creates a YAML file I wouldn't want to look at, much less maintain it, but enables us to have this CI pipeline</div>
<figure class="attachment attachment--preview"><img src="/images/blog/maintaining_github_actions_workflows-2.png"><figcaption class="attachment__caption attachment__caption--edited">CI pipeline with jobs running in parallel</figcaption></figure>
<div>&nbsp;</div>
<div>Our <a href="https://github.com/optimumBA/phx.tools" target="_blank">phx.tools</a> project has an even better example with 3 different workflows.</div>
<figure class="attachment attachment--preview"><img src="/images/blog/maintaining_github_actions_workflows-3.png"><figcaption class="attachment__caption attachment__caption--edited">Workflow executed on push to the main branch</figcaption></figure>
<div>&nbsp;</div>
<figure class="attachment attachment--preview"><img src="/images/blog/maintaining_github_actions_workflows-4.png"><figcaption class="attachment__caption attachment__caption--edited">Workflow executed when PR gets created and synchronized</figcaption></figure>
<div>&nbsp;</div>
<figure class="attachment attachment--preview"><img src="/images/blog/maintaining_github_actions_workflows-5.png"><figcaption class="attachment__caption attachment__caption--edited">Cleanup workflow when PR gets merged or closed</figcaption></figure>
<div>&nbsp;</div>
<div>Let's step back to see how the script works.</div>
<div>&nbsp;</div>
<div>The only rule that we enforce is that the source file must contain a GithubWorkflows module with a get/0 function that returns a map of workflows in which keys are filenames and values are workflow definitions.</div>
<div>&nbsp;</div>
<pre>[elixir]defmodule GithubWorkflows do
  def get do
    %{
      "ci.yml" => [[
        name: "Main",
        on: [
          push: []
        ],
        jobs: []
      ]]
    }
  end
end</pre>
<div>&nbsp;</div>
<div>Everything else is up to you.</div>
<div>&nbsp;</div>
<div>You might also want to read <a href="https://hexdocs.pm/github_workflows_generator" target="_blank">the documentation</a> or check out <a href="https://github.com/optimumBA/github_workflows_generator" target="_blank">the source code</a>.</div>
<div>&nbsp;</div>
<h1>Elixir DevOps series</h1>
<div>In our workflows, you may notice some new ideas not seen elsewhere, so be sure to look out for more posts on our blog in a new series where we'll unpack our unique DevOps practices. If you have any questions, you can contact us at <a href="mailto:blog@optimum.ba">blog@optimum.ba</a>.</div>
<div>&nbsp;</div>
<div>If our approach to software development resonates with you and you're ready to kickstart your project, drop us an email at <a href="mailto:projects@optimum.ba">projects@optimum.ba</a>. Share your project requirements and budget, and we'll promptly conduct a review. We'll then schedule a call to dive deeper into your needs. Let's bring your vision to life!</div>
<div>&nbsp;</div>
<div><i>This was the first post from our <a href="/blog/elixir-devops-series">Elixir DevOps series</a>.</i></div>
