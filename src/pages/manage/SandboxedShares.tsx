import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@hope-ui/solid"
import copy from "copy-to-clipboard"
import { createSignal, For, onMount } from "solid-js"
import { DeletePopover } from "./common/DeletePopover"
import { useManageTitle, useT } from "~/hooks"
import {
  createSandboxedShare,
  deleteSandboxedShare,
  getSandboxedShareList,
  SandboxedShare,
} from "~/utils/api"
import { formatDate, handleResp, notify } from "~/utils"

const SandboxedShares = () => {
  const t = useT()
  useManageTitle("Folder Shares")
  const [shares, setShares] = createSignal<SandboxedShare[]>([])
  const [loading, setLoading] = createSignal(false)
  const [creating, setCreating] = createSignal(false)

  const [path, setPath] = createSignal("")
  const [label, setLabel] = createSignal("")
  const [expiresIn, setExpiresIn] = createSignal<number | undefined>(undefined)

  const refresh = async () => {
    setLoading(true)
    const resp = await getSandboxedShareList()
    handleResp(resp, (data) => {
      setShares(data)
    })
    setLoading(false)
  }

  const remove = async (id: number) => {
    const resp = await deleteSandboxedShare(id)
    handleResp(resp, async () => {
      notify.success(t("global.delete_success"))
      await refresh()
    })
  }

  const create = async () => {
    setCreating(true)
    const resp = await createSandboxedShare({
      path: path(),
      label: label(),
      expires_in: expiresIn(),
    })
    handleResp(resp, async () => {
      notify.success(t("global.create_success"))
      setPath("")
      setLabel("")
      setExpiresIn(undefined)
      await refresh()
    })
    setCreating(false)
  }

  onMount(() => {
    refresh()
  })

  return (
    <VStack spacing="$4" alignItems="start" w="$full">
      <Box w="$full" p="$4" border="1px solid $neutral5" borderRadius="$md">
        <VStack spacing="$3" alignItems="stretch">
          <FormControl required>
            <FormLabel>Folder Path</FormLabel>
            <Input
              value={path()}
              onInput={(e) => setPath(e.currentTarget.value)}
              placeholder="/MyFolder"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Label</FormLabel>
            <Input
              value={label()}
              onInput={(e) => setLabel(e.currentTarget.value)}
              placeholder="Project X"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Expires in (hours)</FormLabel>
            <Input
              type="number"
              value={expiresIn() || ""}
              onInput={(e) => setExpiresIn(parseInt(e.currentTarget.value) || undefined)}
              placeholder="Leave empty for never"
            />
          </FormControl>
          <Button colorScheme="accent" loading={creating()} onClick={create}>
            Create Folder Share
          </Button>
        </VStack>
      </Box>

      <Box w="$full" overflowX="auto">
        <Table highlightOnHover dense>
          <Thead>
            <Tr>
              <Th>Label</Th>
              <Th>Path</Th>
              <Th>Expiry</Th>
              <Th>Operations</Th>
            </Tr>
          </Thead>
          <Tbody>
            <For each={shares()}>
              {(item) => (
                <Tr>
                  <Td>{item.label}</Td>
                  <Td>{item.path}</Td>
                  <Td>
                    {item.expires_at ? formatDate(item.expires_at) : "Never"}
                  </Td>
                  <Td>
                    <HStack spacing="$2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname.split("/@manage")[0]}?share_token=${item.token}`
                          copy(url)
                          notify.success(t("global.copied"))
                        }}
                      >
                        Copy Link
                      </Button>
                      <DeletePopover
                        name={item.label}
                        onClick={() => remove(item.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              )}
            </For>
          </Tbody>
        </Table>
      </Box>
    </VStack>
  )
}

export default SandboxedShares
