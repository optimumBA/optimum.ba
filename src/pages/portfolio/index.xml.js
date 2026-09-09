import {feed} from '../../lib/feed.js';
export const GET = () => new Response(feed('portfolio'), {headers: {'Content-Type': 'application/rss+xml; charset=utf-8'}});
