import { XMLParser } from 'fast-xml-parser'
import { fetch, ResponseType } from '@tauri-apps/api/http'
import { Feed } from '../types'

let fetching = false

export function fetchFeeds(feeds: Feed[]) {
  if (!fetching) {
    fetching = true
  } else {
    return Promise.resolve([])
  }
  return Promise.all(feeds.map(fetchFeed))
}

export async function fetchFeed(feed: Feed): Promise<Feed[]> {
  return fetch(`${feed.url}`, {
    method: 'GET',
    responseType: ResponseType.Text,
  })
    .then((response) => response.data)
    .then((data) => {
      const parser = new XMLParser({
        ignoreAttributes: false,
      })
      const jObj = parser.parse(data as string)
      return (
        jObj.rss?.channel?.item.map((item: any) => formatEpisode(item, feed)) ||
        []
      )
    })
    .catch((err) => {
      return []
    })
}

export function formatEpisode(item: any, feed: Feed) {
  let newItem = item
  if (item.enclosure) {
    newItem = {
      ...newItem,
      enclosure: {
        url: newItem.enclosure['@_url'],
        type: newItem.enclosure['@_type'],
        length: newItem.enclosure['@_length'],
      },
    }
  }
  if (newItem['itunes:image']) {
    newItem = {
      ...newItem,
      cover: newItem['itunes:image']['@_href'],
    }
  }
  newItem = {
    link: newItem.link,
    author: newItem.author || newItem['itunes:author'] || '',
    pubDate: newItem.pubDate || '',
    cover: newItem.cover || '',
    podurl: newItem.enclosure?.url || '',
    title: newItem.title || '',
    description: newItem.description || newItem['content:encoded'] || '',
    guid: newItem.guid || '',
    feedid: feed.id,
    readed: false,
    starred: false,
  }
  return newItem
}
