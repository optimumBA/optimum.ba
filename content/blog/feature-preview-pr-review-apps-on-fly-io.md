---
title: "Feature preview (PR review) apps on Fly.io"
date: 2024-05-20
author: "Almir Sarajčić"
role: "Software Developer"
reading_time: 20
image: "/images/blog/feature_preview_pr_review_apps_on_fly_io.png"
draft: false
---

<div>In this blog post, I explain how we approach manual testing of new features at Optimum.</div>
<div>&nbsp;</div>
<div>Collaborating on new features with non-developers often requires sharing our progress with them. We can do quick demos in our dev environment, but if we want to let them play around on their own, we need to provide them with an environment facilitating that. Setting up a dev machine is easy thanks to <a href="/blog/phx-tools-complete-development-environment-for-elixir-and-phoenix">phx.tools: Complete Development Environment for Elixir and Phoenix</a>, but pulling updates in our projects still requires basic git knowledge.</div>
<div>&nbsp;</div>
<div>We could solve this by deploying in-progress stuff to the staging server, but that becomes messy in larger teams, so we stay away from that. Instead, we replicate the production environment for each feature we are working on and we only deploy the main branch with finished features to the staging. With an environment created specifically for the feature we are working on, we can be sure nothing will surprise us after shipping it. Automated tests help with that too, but we still like doing manual checks just before deploying to production.</div>
<div>&nbsp;</div>
<div><h1>Heroku review apps</h1></div>
<div>Back when I was working on Ruby on Rails apps and websites, as many, I chose Heroku as my PaaS (platform-as-a-service). It had (and still has) a great feature called <a href="https://devcenter.heroku.com/articles/github-integration-review-apps">Review apps</a>.</div>
<figure class="attachment attachment--preview"><img src="/images/blog/feature_preview_pr_review_apps_on_fly_io-2.png"><figcaption class="attachment__caption attachment__caption--edited">App deployment pipeline on Heroku</figcaption></figure>
<div>&nbsp;</div>
<div>It enables you to create new Heroku environments in your pipeline for the PRs in your GitHub repo, either manually through their UI or automatically using a configuration file. You can configure the dynos, environment variables, addons… any prerequisite for running your application. This was a great experience when I worked with Ruby, but when I moved to Elixir Heroku didn't fit me anymore, so I moved to Fly.io.</div>
<div>&nbsp;</div>
<div><h1>Fly.io PR review apps</h1></div>
<div>Fly.io introduced something similar using GitHub Actions: <a href="https://github.com/superfly/fly-pr-review-apps">https://github.com/superfly/fly-pr-review-apps</a>. It's not as powerful and is not as user-friendly, but it's a good starting point for building your workflows. Here's the official guide: <a href="https://fly.io/docs/blueprints/review-apps-guide/">https://fly.io/docs/blueprints/review-apps-guide/</a>.</div>
<div>&nbsp;</div>
<div>The current version forces you to share databases and volumes between different PR review apps. We didn't want that, so last year my colleague Amos introduced a fork that solves this, accompanied by the blog post <a href="/blog/how-to-automate-creating-and-destroying-pull-request-review-phoenix-applications-on-fly-io">How to Automate Creating and Destroying Pull Request Review Phoenix Applications on Fly.io</a>. We've also added some minor changes there. Some of them were implemented upstream since then, yet the setup for the database and volume is still missing. Here's the diff: <a href="https://github.com/superfly/fly-pr-review-apps/compare/6f79ec3a7d017082ed11e7c464dae298ca75b21b...optimumBA:fly-preview-apps:b03f97a38e6a6189d683fad73b0249c321f3ef4a">https://github.com/superfly/fly-pr-review-apps/compare/6f79ec3a7d017082ed11e7c464dae298ca75b21b...optimumBA:fly-preview-apps:b03f97a38e6a6189d683fad73b0249c321f3ef4a</a>.</div>
<div>&nbsp;</div>
<div><h1>Examples</h1></div>
<div>We use preview apps for our <a href="https://phx.tools">phx.tools website</a>. Although it doesn't use DB and volumes, it's still a good example of setting preview apps up on Fly.io: <a href="https://github.com/optimumBA/phx.tools/blob/main/.github/github_workflows.ex">https://github.com/optimumBA/phx.tools/blob/main/.github/github_workflows.ex</a>.</div>
<div>&nbsp;</div>
<div>Here's the code responsible for preview apps:</div>
<pre>[elixir]@app_name "phx-tools"
@environment_name "pr-${{ github.event.number }}"
@preview_app_name "#{@app_name}-#{@environment_name}"
@preview_app_host "#{@preview_app_name}.fly.dev"
@repo_name "phx_tools"

defp pr_workflow do
[
[
name: "PR",
on: [
pull_request: [
branches: ["main"],
types: ["opened", "reopened", "synchronize"]
]
],
jobs:
elixir_ci_jobs() ++
[
deploy_preview_app: deploy_preview_app_job()
]
]
]
end

defp pr_closure_workflow do
[
[
name: "PR closure",
on: [
pull_request: [
branches: ["main"],
types: ["closed"]
]
],
jobs: [
delete_preview_app: delete_preview_app_job()
]
]
]
end

defp delete_preview_app_job do
[
name: "Delete preview app",
"runs-on": "ubuntu-latest",
concurrency: [group: "pr-${{ github.event.number }}"],
steps: [
checkout_step(),
[
name: "Delete preview app",
uses: "optimumBA/fly-preview-apps@main",
env: [
FLY_API_TOKEN: "${{ secrets.FLY_API_TOKEN }}",
REPO_NAME: @repo_name
],
with: [
name: @preview_app_name
]
],
[
name: "Generate token",
uses: "navikt/github-app-token-generator@v1.1.1",
id: "generate_token",
with: [
"app-id": "${{ secrets.GH_APP_ID }}",
"private-key": "${{ secrets.GH_APP_PRIVATE_KEY }}"
]
],
[
name: "Delete GitHub environment",
uses: "strumwolf/delete-deployment-environment@v2.2.3",
with: [
token: "${{ steps.generate_token.outputs.token }}",
environment: @environment_name,
ref: "${{ github.head_ref }}"
]
]
]
]
end

defp deploy_job(env, opts) do
[
name: "Deploy #{env} app",
needs: [
:compile,
:credo,
:deps_audit,
:dialyzer,
:format,
:hex_audit,
:prettier,
:sobelow,
:test,
:test_linux_script_job,
:test_macos_script_job,
:unused_deps
],
"runs-on": "ubuntu-latest"
] ++ opts
end

defp deploy_preview_app_job do
deploy_job("preview",
permissions: "write-all",
concurrency: [group: @environment_name],
environment: preview_app_environment(),
steps: [
checkout_step(),
delete_previous_deployments_step(),
[
name: "Deploy preview app",
uses: "optimumBA/fly-preview-apps@main",
env: fly_env(),
with: [
name: @preview_app_name,
secrets:
"APPSIGNAL_APP_ENV=preview APPSIGNAL_PUSH_API_KEY=${{ secrets.APPSIGNAL_PUSH_API_KEY }} PHX_HOST=${{ env.PHX_HOST }} SECRET_KEY_BASE=${{ secrets.SECRET_KEY_BASE }}"
]
]
]
)
end

defp delete_previous_deployments_step do
[
name: "Delete previous deployments",
uses: "strumwolf/delete-deployment-environment@v2.2.3",
with: [
token: "${{ secrets.GITHUB_TOKEN }}",
environment: @environment_name,
ref: "${{ github.head_ref }}",
onlyRemoveDeployments: true
]
]
end

defp fly_env do
[
FLY_API_TOKEN: "${{ secrets.FLY_API_TOKEN }}",
FLY_ORG: "optimum-bh",
FLY_REGION: "fra",
PHX_HOST: "#{@preview_app_name}.fly.dev",
REPO_NAME: @repo_name
]
end

defp preview_app_environment do
[
name: @environment_name,
url: "https://#{@preview_app_host}"
]
end</pre>

<div>&nbsp;</div>
<div>If you're wondering why you're seeing Elixir while working with GitHub Actions you should read our blog post on the subject: <a href="/blog/maintaining-github-actions-workflows">Maintaining GitHub Actions workflows</a>.</div>
<div>&nbsp;</div>
<div>Let's explain what we're doing above. We are running the <code>pr_workflow</code> when PR is (re)opened or when any new changes are pushed to it. It runs our code checks and tests, and, if everything passes, runs the <code>deploy_preview_app_job</code>.</div>
<div>&nbsp;</div>
<figure class="attachment attachment--preview"><img src="/images/blog/feature_preview_pr_review_apps_on_fly_io-3.png"><figcaption class="attachment__caption attachment__caption--edited">GitHub Actions workflow for PRs</figcaption></figure>
<div>&nbsp;</div>
<div>The <code>deploy_preview_app_job</code> uses action for deploying preview apps to Fly.io which checks if the server is already set up. If it isn't, it creates the server, sets environment variables, etc. Then it deploys to it.</div>
<div>&nbsp;</div>
<div>Preview app creation job that includes a DB and/or a volume doesn't differ from the one above at all. That's because our action <a href="https://github.com/optimumBA/fly-preview-apps"><code>optimumBA/fly-preview-apps</code></a> internally checks whether an app contains Ecto migrations and if it does, it creates a DB if it doesn't exist yet. The same goes for the volume: it checks whether the fly.toml configuration contains any mounts and if it does, it creates a volume, then attaches it to the app.</div>
<div>&nbsp;</div>
<figure class="attachment attachment--preview"><img src="/images/blog/feature_preview_pr_review_apps_on_fly_io-4.png"><figcaption class="attachment__caption attachment__caption--edited">GitHub workflow for the website you're on</figcaption></figure>
<div>&nbsp;</div>
<figure class="attachment attachment--preview"><img src="/images/blog/feature_preview_pr_review_apps_on_fly_io-5.png"><figcaption class="attachment__caption attachment__caption--edited">Preview app for one of the PRs</figcaption></figure>
<div>&nbsp;</div>
<div>We set <code>environment</code> to let GitHub show the preview app in the list of environments. It will show the status of the latest deployment in the PR. We don't want too much noise in our PR from the deployment messages, so whenever we deploy a new version, we remove previous messages in the <code>delete_previous_deployments_step</code>.</div>
<div>&nbsp;</div>
<figure class="attachment attachment--preview"><img src="/images/blog/feature_preview_pr_review_apps_on_fly_io-6.png"><figcaption class="attachment__caption attachment__caption--edited">List of deployments on GitHub</figcaption></figure>
<div>&nbsp;</div>
<figure class="attachment attachment--preview"><img src="/images/blog/feature_preview_pr_review_apps_on_fly_io-7.png"><figcaption class="attachment__caption attachment__caption--edited">Deployment status message in the PR</figcaption></figure>
<div>&nbsp;</div>
<div>Setting <code>concurrency</code> makes sure that two deployment jobs can't run simultaneously for the same value passed to it. That prevents hypothetical race condition with multiple pushes, where for some reason deployment job for the latest commit could finish more quickly than the one for the previous commit, which would leave us with an older version of the app running.</div>
<div>&nbsp;</div>
<div>Don't forget to set GitHub secrets like <code>FLY_API_TOKEN</code>. You might want to do that on the organization level so you don't have to do that for every repo. The token we've set in our GitHub organization is for a Fly.io user we've created specifically for deployments to staging and preview apps. We have a separate Fly.io organization it is a part of, so even if the token gets leaked, our production apps are safe as it doesn't have access to them.</div>
<div>&nbsp;</div>
<div>When we're done working on a feature, we want to clean up our environment. It might seem strange that we use the same action to delete our app, but the action handles it by checking the event that triggered the workflow and acts accordingly. It destroys any associated volume and/or database, then the server. The next two steps of the <code>delete_preview_app_job</code> delete a GitHub environment. For some reason known to GitHub, the process is more complicated than it should be, but Amos explains it well in his blog post.</div>
<div>&nbsp;</div>
<div>Getting back to the part about databases. Recently, the upstream version of the action was updated with an option to attach an existing PostgreSQL instance from Fly.io, but that still doesn't solve potential issues with migrations. Let's say you remove a table in one PR, while another PR depends on the same table. It will be deleted while deploying the first PR which will in turn cause errors for the second PR's review app. Our solution avoids that by creating a completely isolated environment for each PR.</div>
<div>&nbsp;</div>
<div>Additionally, Fly.io recently introduced (or we've just discovered) the ability to stop servers after some time of inactivity. That proved useful for us in lowering the cost when having many PRs open. In your fly.toml you probably want to set</div>
<pre>[toml][http_service]
  auto_start_machines = true
  auto_stop_machines = true
  min_machines_running = 0</pre>
<div>&nbsp;</div>
<div>so your machines stop if you don't access them for some period. We haven't found a way to stop DBs for inactive apps yet. We weren't eager to do so, though, because we've always had the smallest instances for the preview apps DBs. Only our apps sometimes have larger instances which incur greater costs, so we see a benefit in stopping them when we don't use them.</div>
<div>&nbsp;</div>
<div><h1>More customization</h1></div>
<div>Some applications might require setting up additional resources. In the <a href="https://www.storydeck.ai">StoryDeck app</a>, one of the services we use is Mux.</div>
<div>&nbsp;</div>
<div>When a user uploads a video, we upload it to Mux, which sends us events to our webhooks. Whenever we create a new preview app, we need to let Mux know the URL of our new webhook. In theory, this could be solved by a simple proxy. In reality, it's more complicated than that. We don't want all our preview apps to receive an event when a video is uploaded from any of them. To know which preview app to proxy an event to, the proxy app would need to store associations between specific videos and preview apps they were uploaded from, but we don't want to store that kind of data in the proxy app. Mux enables having many different environments in one account, which is perfect for us as each environment is a container for videos uploaded from one preview app. What is not perfect is the fact that currently there's no API for managing Mux environments, so we have to do it through the Mux dashboard. We've built the proxy app using Phoenix. It has a simple API on which we receive requests sent from GitHub Actions using curl. When a new preview app is created, a request is received, then the app goes through the Mux dashboard using Wallaby, creates a new Mux environment, sets up the webhook URL, gets Mux secrets, and returns it so that the GitHub Actions workflow can set them in our new Fly.io environment. When deleting the preview app, our workflow sends a request to our proxy app which then deletes videos from Mux and deletes the Mux environment.</div>
<div>&nbsp;</div>
<figure class="attachment attachment--preview"><img src="/images/blog/feature_preview_pr_review_apps_on_fly_io-8.png"><figcaption class="attachment__caption attachment__caption--edited">Creating Mux environment and saving credentials in GitHub Actions cache</figcaption></figure>
<div>&nbsp;</div>
<div>That is just one example of what it might take to enable preview apps in your organization. It could seem like unnecessary work, but think of it as an investment into higher productivity and quality of work down the line.</div>
<div>&nbsp;</div>
<div><i>This was a post from our <a href="/blog/elixir-devops-series">Elixir DevOps series</a>.</i></div>
