---
title: "Zero downtime deployments with Fly.io"
date: 2024-06-04
author: "Almir Sarajčić"
role: "Software Developer"
reading_time: 5
image: "/images/blog/zero_downtime_deployments_with_fly_io.png"
draft: false
---

<div>If you were wondering why you saw the topbar loading for ~5 seconds every time you deployed to Fly.io, you're at the right place. We need to talk about deployment strategies. Typically, there are several, but Fly.io supports these:</div>
<ul>
<li><code>immediate</code></li>
<li><code>rolling</code></li>
<li><code>bluegreen</code></li>
<li><code>canary</code></li>
</ul>
<div>&nbsp;</div>
<div>The complexity and cost go from low to high as we go down the list. The default option is rolling. That means, your machines will be replaced by new ones one by one. In case you only have one machine, it will be destroyed before there's a new one that can handle requests. That's why you're waiting to be reconnected whenever you deploy. You can read more about these deployment strategies at <a href="https://fly.io/docs/apps/deploy/#deployment-strategy">https://fly.io/docs/apps/deploy/#deployment-strategy</a>.</div>
<div>&nbsp;</div>
<div>We're using the blue-green deployment strategy as it strikes a balance between the benefits, cost, and ease of setup.</div>
<div>&nbsp;</div>
<div>If you're using volumes, I have to disappoint you as the blue-green strategy doesn't work with them yet, but Fly.io plans to support that in the future.</div>
<div>&nbsp;</div>
<div><h1>Setup</h1></div>
<div>You need to configure at least one health check to use the <code>bluegreen</code> strategy. I won't go into details. You can find more at <a href="https://fly.io/docs/reference/configuration/#http_service-checks">https://fly.io/docs/reference/configuration/#http_service-checks</a>.</div>
<div>&nbsp;</div>
<div>Here's a configuration we use:</div>
<pre>[toml][[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  path = "/health"
  timeout = "5s"</pre>
<div>&nbsp;</div>
<div>Then, add <code>strategy = "bluegreen"</code> under <code>[deploy]</code> in your <code>fly.toml</code> file:</div>
<pre>[toml][deploy]
  strategy = "bluegreen"</pre>
<div>and run <code>fly deploy</code>.</div>
<div>&nbsp;</div>
<div>That's it! You probably expected the setup to be more complex than this. So did I!</div>
<div>&nbsp;</div>
<div><h1>Conclusion</h1></div>
<div>While Fly.io is moving you from a blue to a green machine, your websocket connection will be dropped, but it will quickly reestablish. You shouldn't even notice it unless you have your browser console open or you're navigating through pages during the deployment.</div>
<div>&nbsp;</div>
<div>One thing you should keep in mind, though, is that your client-side state (form data) might be lost if you don't address that explicitly.</div>
<div>&nbsp;</div>
<div>Another thing to think about is the way you run Ecto migrations. In case you're dropping tables or columns, you might want to do that in multiple stages. For example, you might introduce changes in the code so you stop depending on specific columns or tables and deploy that change. After that, you can have subsequent deployment for the structural changes of the database. That way, both blue and green machines will have the same expectations regarding the database structure.</div>
<div>&nbsp;</div>
<div>The future will bring us more options for deployment. Recently, Chris McCord teased us with hot deploys.</div>
<div>&nbsp;</div>
<figure class="attachment attachment--preview"><img src="/images/blog/zero_downtime_deployments_with_fly_io-2.png"><figcaption class="attachment__caption attachment__caption--edited"><a href="https://x.com/chris_mccord/status/1785678249424461897">https://x.com/chris_mccord/status/1785678249424461897</a></figcaption></figure>
<div>&nbsp;</div>
<div>Can't wait for this!</div>
<div>&nbsp;</div>
<div><i>This was a post from our <a href="/blog/elixir-devops-series">Elixir DevOps series</a>.</i></div>
