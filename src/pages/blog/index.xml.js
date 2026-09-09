import {feed} from '../../lib/feed.js';
export const GET = () => new Response(feed('blog'), {headers: {'Content-Type': 'application/rss+xml; charset=utf-8'}});
