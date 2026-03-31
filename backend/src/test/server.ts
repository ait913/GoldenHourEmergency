/**
 * テスト用サーバーセットアップ
 * supertestはNode.jsのhttp.Serverを期待するため、
 * @hono/node-serverを使ってHonoアプリをNode.jsサーバーに変換する
 */
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getRequestListener } from '@hono/node-server'
import { app } from '../app'

/**
 * テスト用のNode.jsサーバーを取得する
 * supertestに渡せるhttp.Server互換オブジェクト
 */
export function getTestServer() {
  const handler = getRequestListener(app.fetch)
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    handler(req, res)
  })
}
