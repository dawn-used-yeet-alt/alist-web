import { createSignal } from "solid-js"
import { r } from "~/utils"
import { Resp } from "~/types"

export const [shareRootPath, setShareRootPath] = createSignal<string | null>(null)
export const [isShareMode, setIsShareMode] = createSignal(false)

export async function initShareMode() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get("share_token")
  if (!token) {
    // Check cookie even if no token in URL
    const match = document.cookie.match(/share_token=([^;]+)/)
    if (match) {
        // We might be in share mode from a previous session
        // But we need the path. Let's redeem with the cookie token.
        await redeem(match[1])
    }
    return
  }

  await redeem(token)
  
  // Remove token from URL without reload
  const url = new URL(window.location.href)
  url.searchParams.delete("share_token")
  window.history.replaceState({}, "", url.toString())
}

async function redeem(token: string) {
    try {
        const res = await r.get(`/public/share/redeem?share_token=${token}`) as Resp<{path: string, label: string}>
        if (res.code === 200) {
          setShareRootPath(res.data.path)
          setIsShareMode(true)
        }
      } catch (e) {
        console.error("Failed to redeem share token", e)
      }
}
