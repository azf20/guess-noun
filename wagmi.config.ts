import { defineConfig } from '@wagmi/cli'
import { actions, hardhat } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'src/abis.ts',
  contracts: [],
  plugins: [
    actions({
      getContract: true,
      readContract: true,
      prepareWriteContract: true,
      watchContractEvent: true,
    }),
    hardhat({
      project: './contracts',
      deployments: {
        GuessNoun: {
          31337: '0x1c32f8818e38a50d37d1E98c72B9516a50985227',
        },
      },
    }),
  ],
})
