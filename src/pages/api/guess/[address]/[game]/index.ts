import { ethers } from 'ethers'
import type { NextApiRequest, NextApiResponse } from 'next'
import { generateSecretSalt } from 'utils/game'
import { withSessionRoute } from 'utils/server'
import { Address } from 'wagmi'
import { z } from 'zod'

const addressType = z.string().startsWith('0x').length(42)

const paramSchema = z.object({
  game: z.string(),
  address: z.string().startsWith('0x').length(42),
})

export default withSessionRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(req.session)
  const params = paramSchema.parse(req.query)
  if (req.query.address !== req.session.siwe.address) return res.status(422).json({ message: 'Invalid address.' })
  const message = generateSecretSalt(ethers.BigNumber.from(params.game), params.address as Address)
  console.log(message)
  res.status(200).json({ message })
})
