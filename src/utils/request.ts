import axios from "axios"
import { api, log } from "."
import { bus, notify } from "."
import { clearUserData } from "~/utils/auth"
import { globalT } from "./i18n"

const instance = axios.create({
  baseURL: api + "/api",
  // timeout: 5000
  headers: {
    "Content-Type": "application/json;charset=utf-8",
    // 'Authorization': localStorage.getItem("admin-token") || "",
  },
  withCredentials: false,
})

import { getClientId } from "./client-id"

function getShareToken(): string | null {
  const match = document.cookie.match(/share_token=([^;]+)/)
  return match ? match[1] : null
}

instance.interceptors.request.use(
  (config) => {
    if (config.headers) {
      config.headers["Client-Id"] = getClientId()
      const token = getShareToken()
      if (token) {
        config.headers["X-Share-Token"] = token
      }
    } else {
      const headers: any = { "Client-Id": getClientId() }
      const token = getShareToken()
      if (token) {
        headers["X-Share-Token"] = token
      }
      config.headers = headers
    }
    return config
  },
  (error) => {
    // do something with request error
    console.log("Error: " + error.message) // for debug
    return Promise.reject(error)
  },
)

// response interceptor
instance.interceptors.response.use(
  (response) => {
    const resp = response.data
    log(resp)
    // if (resp.code === 401) {
    //   notify.error(resp.message);
    //   bus.emit(
    //     "to",
    //     `/@login?redirect=${encodeURIComponent(window.location.pathname)}`
    //   );
    // }
    return resp
  },
  (error) => {
    // response error
    console.error(error) // for debug

    // 处理403状态码下的特定错误
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || error.message

      if (errorMessage.includes("too many active devices")) {
        notify.error(globalT("session.too_many_devices"))
        return {
          code: 403,
          message: errorMessage,
        }
      }

      if (errorMessage.includes("session inactive")) {
        notify.error(globalT("session.session_inactive"))
        // 清空本地登录态并跳转登录页
        clearUserData()
        bus.emit(
          "to",
          `/@login?redirect=${encodeURIComponent(window.location.pathname)}`,
        )
        return {
          code: 403,
          message: errorMessage,
        }
      }
    }

    return {
      code: axios.isCancel(error) ? -1 : error.response?.status,
      message: error.message,
    }
  },
)

instance.defaults.headers.common["Authorization"] =
  localStorage.getItem("token") || ""

export const changeToken = (token?: string) => {
  instance.defaults.headers.common["Authorization"] = token ?? ""
  localStorage.setItem("token", token ?? "")
}

export { instance as r }
