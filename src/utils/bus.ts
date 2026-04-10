import mitt from "mitt"

type Events = {
  gallery: string
  refresh: void
  refresh_labels: void
  tool: string | { name: string; [key: string]: any }
  pathname: string
  to: string
  share: {
    path: string
    name: string
    is_dir: boolean
  }
}

export const bus = mitt<Events>()
