import { Address, useAccount, useNetwork, useSignMessage, useContractReads } from 'wagmi'
import { SiweMessage } from 'siwe'
import { useEffect, useState } from 'react'
import { SITE_NAME } from 'utils/config'
import {
  Button,
  Card,
  CardBody,
  ListItem,
  UnorderedList,
  Image,
  Stack,
  Heading,
  Text,
  Divider,
  CardFooter,
  ButtonGroup,
  GridItem,
  Grid,
  SimpleGrid,
  Select,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Flex,
} from '@chakra-ui/react'
import { HeadingComponent } from 'components/layout/HeadingComponent'
import { generateSvgs, getTraits, NAMES } from 'utils/game'
import { guessNounABI, guessNounAddress } from 'abis'
import useSWR from 'swr'
import { ethers } from 'ethers'

function SignInButton() {
  const [loggedInAddress, setLoggedInAddress] = useState('')
  const { address } = useAccount()
  const { chain } = useNetwork()
  const { signMessageAsync } = useSignMessage()

  // Fetch user when:
  useEffect(() => {
    const handler = async () => {
      try {
        const res = await fetch('/api/account')
        const json = await res.json()
        if (json.address) {
          console.log(json.address, address)
          if (json.address !== address) {
            logout()
          }
          setLoggedInAddress(json.address)
        }
      } catch (_error) {}
    }

    // 1. page loads
    handler()

    // 2. window is focused (in case user logs out of another window)
    window.addEventListener('focus', handler)
    return () => window.removeEventListener('focus', handler)
  }, [address])

  const signIn = async () => {
    try {
      const chainId = chain?.id
      if (!address || !chainId) return

      // 1. Get random nonce from API
      const nonceRes = await fetch('/api/account/nonce')
      const nonce = await nonceRes.text()

      // 2. Create SIWE message with pre-fetched nonce and sign with wallet
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: `Sign in with Ethereum to ${SITE_NAME}.`,
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: nonce,
      })

      // 3. Sign message
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      })

      // 3. Verify signature
      const verifyRes = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
      })

      if (!verifyRes.ok) throw new Error('Error verifying message')

      setLoggedInAddress(address)
    } catch (error) {
      console.error(error)
      setLoggedInAddress('')
    }
  }

  async function logout() {
    await fetch('/api/account/logout')
    setLoggedInAddress('')
  }

  return (
    <div>
      {loggedInAddress ? (
        <Flex gap={2} align={'center'}>
          <p>Signed in as {loggedInAddress}</p>

          <Button onClick={logout}>Sign Out</Button>
        </Flex>
      ) : (
        <p>
          <Button onClick={signIn}>Sign-in With Ethereum</Button>
        </p>
      )}
    </div>
  )
}

type Choice = {
  player: Address | undefined
  choice: string
}

export default function SiweExample() {
  const { isConnected, address } = useAccount()
  const [selectedTrait, setSelectedTrait] = useState('')
  const [gameId, setGameId] = useState('0')
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [playerChoices, setPlayerChoices] = useState<Choice[]>([])

  const chainId = '31337'

  const { chain } = useNetwork()

  const makeChoice = async (choice: string) => {
    setPlayerChoices([...playerChoices, { choice, player: address }])
  }

  const nounSvgs = generateSvgs(gameId)
  const traits = getTraits(gameId)

  const allTraits = [...traits[0].traits, ...traits[1].traits, ...traits[2].traits, ...traits[3].traits].filter((t) => t.filename)

  const guessNounConfig = chain && {
    address: guessNounAddress[chainId],
    abi: guessNounABI,
  }

  const { data, isError, isLoading } = useContractReads({
    contracts: [
      {
        ...guessNounConfig,
        functionName: 'game',
      },
      {
        ...guessNounConfig,
        functionName: 'playersRegistered',
      },
      {
        ...guessNounConfig,
        functionName: 'startTimestamp',
      },
    ],
  })

  const fetcher = (url: string) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => res.json())
  const { data: salt, error } = useSWR(data ? `/api/guess/${address}/${data[0].result}` : undefined, fetcher)

  console.log(salt)

  const signMessage = useSignMessage({
    message: 'Message to sign',
  })

  function choose(choice: string) {
    const choiceMessage =
      data &&
      salt &&
      ethers.utils.solidityPack(['address', 'uint256', 'uint256', 'bytes32'], [guessNounAddress[chainId], data[0].result, choice, salt.message])

    signMessage.signMessage({ message: choiceMessage })
  }

  if (isConnected) {
    return (
      <div>
        <SignInButton />
        <NumberInput
          value={gameId}
          onChange={(e) => {
            setGameId(e)
          }}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Select
          placeholder="Select trait"
          value={selectedTrait}
          onChange={(e) => {
            setSelectedTrait(e.target.value)
          }}>
          {allTraits.map((trait, i) => {
            return (
              <option value={trait.filename} key={i}>
                {trait.filename}
              </option>
            )
          })}
        </Select>
        <Button onClick={() => makeChoice(selectedTrait)}>Make Choice</Button>
        <SimpleGrid columns={4}>
          {nounSvgs.map((noun, i) => {
            let blob = new Blob([noun.svg], { type: 'image/svg+xml' })
            let url = URL.createObjectURL(blob)
            return (
              <Card maxW="sm" key={i}>
                <CardBody>
                  <Image src={url} alt={NAMES[i]} />
                  <Stack mt="6" spacing="3">
                    <Heading size="md">{`${NAMES[i]} ${noun.parts.map((p) => p.filename).includes(selectedTrait)}`}</Heading>
                  </Stack>
                </CardBody>
                <Divider />
                <CardFooter>
                  <ButtonGroup spacing="2">
                    <Button
                      variant="solid"
                      colorScheme="blue"
                      onClick={() => {
                        choose(noun.id)
                      }}>
                      PICK
                    </Button>
                    {/* <Button variant="solid" colorScheme="blue">
                      GUESS
                    </Button> */}
                  </ButtonGroup>
                </CardFooter>
              </Card>
            )
          })}
        </SimpleGrid>
      </div>
    )
  }

  return <div>Connect your wallet first to sign-in with Ethereum.</div>
}
