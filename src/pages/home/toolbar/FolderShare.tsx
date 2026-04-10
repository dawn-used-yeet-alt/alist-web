import {
  Button,
  createDisclosure,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
} from "@hope-ui/solid"
import { createSignal, onCleanup, Show } from "solid-js"
import { useFetch, useRouter, useT, useUtil } from "~/hooks"
import { api, bus, handleResp, notify } from "~/utils"

export const FolderShare = () => {
  const { copy } = useUtil()
  const { isOpen, onOpen, onClose } = createDisclosure()
  const [sharePath, setSharePath] = createSignal("")
  const [label, setLabel] = createSignal("")
  const [expiresIn, setExpiresIn] = createSignal("24")
  const [shareLink, setShareLink] = createSignal("")
  const { pathname } = useRouter()
  const t = useT()

  const handler = (data: string | { name: string; [key: string]: any }) => {
    const name = typeof data === "string" ? data : data.name
    if (name === "folder_share") {
      setSharePath(
        (typeof data === "string" ? undefined : data.path) || pathname(),
      )
      setLabel("")
      setShareLink("")
      onOpen()
    }
  }
  bus.on("tool", handler)
  onCleanup(() => {
    bus.off("tool", handler)
  })

  const [loading, createShare] = useFetch(
    (path: string, label: string, expiresIn: number) =>
      api.post("/admin/share", { path, label, expires_in: expiresIn }),
  )

  const submit = async () => {
    const hours = parseInt(expiresIn())
    if (isNaN(hours)) {
      notify.error("Invalid expiration hours")
      return
    }
    const resp = await createShare(sharePath(), label(), hours)
    handleResp(resp, (data) => {
      const link = `${window.location.origin}/s/redeem?token=${data.token}`
      setShareLink(link)
      notify.success(t("global.success"))
    })
  }

  return (
    <Modal opened={isOpen()} onClose={onClose} initialFocus="#share-label">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Sandboxed Folder Share</ModalHeader>
        <ModalBody>
          <VStack spacing="$4">
            <FormControl>
              <FormLabel>Path</FormLabel>
              <Input value={sharePath()} readOnly variant="filled" />
            </FormControl>
            <FormControl>
              <FormLabel>Label</FormLabel>
              <Input
                id="share-label"
                value={label()}
                onInput={(e) => setLabel(e.currentTarget.value)}
                placeholder="Optional label"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Expires In (hours)</FormLabel>
              <Input
                type="number"
                value={expiresIn()}
                onInput={(e) => setExpiresIn(e.currentTarget.value)}
              />
            </FormControl>
            <Show when={shareLink()}>
              <FormControl>
                <FormLabel>Share Link</FormLabel>
                <Input
                  value={shareLink()}
                  readOnly
                  variant="filled"
                  colorScheme="success"
                />
              </FormControl>
            </Show>
          </VStack>
        </ModalBody>
        <ModalFooter display="flex" gap="$2">
          <Button onClick={onClose} colorScheme="neutral">
            {t("global.cancel")}
          </Button>
          <Show
            when={shareLink()}
            fallback={
              <Button loading={loading()} onClick={submit}>
                {t("global.ok")}
              </Button>
            }
          >
            <Button
              onClick={() => {
                copy(shareLink())
              }}
            >
              Copy Link
            </Button>
          </Show>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
