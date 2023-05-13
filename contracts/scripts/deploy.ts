import { ethers, network, run } from 'hardhat'

async function main() {
  console.log('Deploying GuessNoun...')

  const schema = 'uint256 elo'

  const args: any[] = []
  const GuessNoun = await ethers.getContractFactory('GuessNoun')
  const guessNoun = await GuessNoun.deploy('0x1a5650D0EcbCa349DD84bAFa85790E3e6955eb84')

  await guessNoun.deployed()

  console.log(`GuessNoun deployed to ${guessNoun.address}`)

  const schemaUID = await guessNoun.schemaUID()

  const schemaRegistry = await ethers.getContractAt('ISchemaRegistry', '0x7b24C7f8AF365B4E308b6acb0A7dfc85d034Cb3f')

  const registeredSchema = await schemaRegistry.getSchema(schemaUID)

  if (registeredSchema.schema === '') {
    console.log(`Registering schema ${schemaUID} as the schema is not registered (${registeredSchema.schema})`)
    const registration = await schemaRegistry.register(schema, '0x0000000000000000000000000000000000000000', true)
    console.log(`Schema registered ${schemaUID}: ${schema} / ${registration.data}}`)
  } else {
    console.log(`Schema already registered ${registeredSchema.schema}`)
  }

  // no need to verify on localhost or hardhat
  if (network.config.chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    console.log(`Waiting for block confirmation...`)
    await guessNoun.deployTransaction.wait(5)

    console.log('Verifying contract...')
    try {
      run('verify:verify', {
        address: guessNoun.address,
        constructorArguments: args,
      })
    } catch (e) {
      console.log(e)
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
