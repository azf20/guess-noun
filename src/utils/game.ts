import { BigNumber, ethers } from 'ethers'
import { Address } from 'wagmi'
import { ImageData, getNounData, getPseudorandomPart } from '@nouns/assets'
import { buildSVG } from '@nouns/sdk'
import { guessNounAddress } from 'abis'

const { bgcolors, palette, images } = ImageData
const { bodies, accessories, heads, glasses } = images

export function generateSecretSalt(gameId: BigNumber, player: Address) {
  return ethers.utils.solidityKeccak256(['uint256', 'address', 'string'], [gameId, player, process.env.SALT_SECRET])
}

export const TRAITCOUNT = [
  { type: 'bodies' as const, count: 4 },
  { type: 'accessories' as const, count: 6 },
  { type: 'heads' as const, count: 5 },
  { type: 'glasses' as const, count: 4 },
]

export function getTraits(gameId: string) {
  const seed = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [guessNounAddress[31337], gameId]))

  const traits = TRAITCOUNT.map(({ type, count }, index) => {
    const options = Array.from({ length: images[type].length }, (value, index) => index)
    const result = new Array(count).fill(undefined).map((_, i) => {
      const selectedIndex = getPseudorandomPart(seed, options.length, index * 10 + i)
      const trait = options[selectedIndex]
      options.splice(selectedIndex, 1)
      return images[type][trait]
    })
    return { type, traits: result }
  })
  return traits
}

export const TRAITRIX = [
  [0, 4, 0, 3],

  [0, 2, 4, 3],
  [3, 2, 0, 1],
  [3, 0, 3, 3],
  [1, 0, 3, 2],
  [1, 1, 1, 1],
  [0, 0, 2, 3],
  [1, 2, 0, 3],
  [2, 0, 1, 3],
  [2, 4, 3, 0],
  [0, 3, 1, 2],
  [0, 2, 4, 3],
  [2, 2, 4, 0],
  [2, 3, 0, 1],
  [3, 0, 2, 1],
  [3, 1, 0, 2],
  [1, 3, 2, 0],
  [0, 2, 3, 1],
  [1, 4, 0, 3],
  [3, 4, 1, 0],
  [2, 3, 0, 1],
  [0, 3, 1, 2],
  [3, 5, 1, 0],
]

export function generateNounTraits(gameId: string) {
  const traits = getTraits(gameId)
  return TRAITRIX.map((noun) => {
    const [body, accessory, head, glasses] = noun
    return {
      body: traits[0].traits[body],
      accessory: traits[1].traits[accessory],
      head: traits[2].traits[head],
      glasses: traits[3].traits[glasses],
    }
  })
}

export function generateSvgs(gameId: string) {
  const nouns = generateNounTraits(gameId)
  return nouns.map((noun) => {
    return {
      parts: [noun.body, noun.accessory, noun.head, noun.glasses],
      svg: buildSVG([noun.body, noun.accessory, noun.head, noun.glasses], palette, bgcolors[0]),
    }
  })
}

export const NAMES = [
  'Al',
  'Amy',
  'Anita',
  'Anne',
  'Ben',
  'Bernard',
  'Betty',
  'Bill',
  'Carmen',
  'Charles',
  'Claire',
  'Daniel',
  'David',
  'Emma',
  'Eric',
  'Farah',
  'Frank',
  'Gabe',
  'George',
  'Herman',
  'Holly',
  'Joe',
  'Jordan',
  'Katie',
  'Laura',
  'Leo',
  'Lily',
  'Liz',
  'Maria',
  'Max',
  'Mia',
  'Mike',
  'Nick',
  'Olivia',
  'Paul',
  'Peter',
  'Philip',
  'Rachel',
  'Richard',
  'Robert',
  'Sally',
  'Sam',
  'Sofia',
  'Susan',
  'Tom',
  'Victor',
]
