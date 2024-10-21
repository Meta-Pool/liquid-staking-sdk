import { Metapool } from '../src'
import { getConfig, ntoy, ytonFull } from './test-world'
import { Account, connect, ConnectConfig, Near } from 'near-api-js'
import * as os from 'os'
import path from 'path'
import { existsSync } from 'fs'
import { InMemoryKeyStore } from 'near-api-js/lib/key_stores'
import { ContractState } from '../src/metapool'
import { getTransactionLastResult } from 'near-api-js/lib/providers'

const TEST_USER = "calcifer.testnet"

const ONE_NEAR = BigInt("1" + "0".repeat(24))
const TEN24 = ONE_NEAR

let connection: Near
let account: Account
let metapool: Metapool
let state: ContractState

async function prepareTestGlobals() {

  const config = getConfig("testnet")
  const privKeyPath = path.join(os.homedir(), ".near-credentials", config.networkId, TEST_USER + ".json")
  console.log(privKeyPath)
  if (!existsSync(privKeyPath)) {
    throw new Error(`File not found: ${privKeyPath}`)
  }

  connection = await connect(
    {
      ...config,
      keyStore: InMemoryKeyStore,
      keyPath: privKeyPath,
    } as unknown as ConnectConfig
  )
  account = await connection.account(TEST_USER)

  metapool = new Metapool(account, config.contractName)

  state = await metapool.get_contract_state()
}

describe('Metapool', () => {

  beforeAll(async() => {
    await prepareTestGlobals()
  })

  describe('stake', () => {

    it('stakes NEAR', async() => {

      const preBalance = await metapool.ft_balance_of(TEST_USER)
      //console.log("preBalance",ytonFull(preBalance))

      const amountYoctos = BigInt("1" + "0".repeat(24))
      //const rawResult = await metapool.stake(amountYoctos)
      // console.log(getTransactionLastResult(rawResult))
      await metapool.stake(amountYoctos)

      const postBalance = await metapool.ft_balance_of(TEST_USER)
      //console.log("postBalance",ytonFull(postBalance), ytonFull(state.st_near_price))
      // const expectedNewStNearBalance = BigInt(preBalance).add(amountYoctos * TEN24).div(new BN(state.st_near_price)))
      const expectedNewStNearBalance = (BigInt(preBalance) + amountYoctos * TEN24) / BigInt(state.st_near_price)
      //console.log("postBalance",ytonFull(postBalance),"expected",ytonFull(expected.toString()))
      expect(ytonFull(postBalance)).toBe(ytonFull(expectedNewStNearBalance.toString()))

    })
  })
})

describe('liquidUnstake', () => {

  it('liquid-unstakes', async() => {

    const preBalanceNear = (await account.getAccountBalance()).available
    //console.log("preBalance",ytonFull(preBalance))

    const amountYoctoStNear = BigInt("1" + "0".repeat(24))

    // const expectedNear = amountYoctoStNear.mul(new BN(state.st_near_price)).div(TEN24)
    const expectedNear = amountYoctoStNear * BigInt(state.st_near_price) / TEN24

    const rawResult = await metapool.liquidUnstake(amountYoctoStNear, expectedNear - ONE_NEAR / BigInt(10)) // 0.1 NEAR slippage allowed
    const result = getTransactionLastResult(rawResult)
    console.log(result)

    const postBalanceNear = (await account.getAccountBalance()).available
    const liquidUnstakeFee = expectedNear * BigInt(state.nslp_current_discount_basis_points) / BigInt(10000)
    console.log("liquidUnstakeFee", ytonFull(liquidUnstakeFee.toString()))
    const nearBalDiff = BigInt(postBalanceNear) - BigInt(preBalanceNear)
    console.log("nearBalDiff", ytonFull(nearBalDiff.toString()))
    const expectedMinusFee = expectedNear - liquidUnstakeFee

    console.log("expectedMinusFee", ytonFull(expectedMinusFee.toString()))
    console.log("diff", ytonFull((expectedMinusFee - nearBalDiff).toString()))
    
    expect(result).toBeDefined()
    const resultObj = result as Record<string, string>

    expect(ytonFull(resultObj["near"])).toBe(ytonFull(expectedMinusFee.toString()))

    // difference is tx fee
    const txFee = expectedMinusFee - nearBalDiff
    // tx fee, should be less than 0.002 NEAR
    expect(Number(ytonFull(txFee.toString()))).toBeLessThan(Number(ntoy(0.002)))

  })


  describe('delayedUnstake', () => {

    it('delayed-unstakes', async() => {
      const preUnstakeBalance = await metapool.get_account_unstaked_balance(TEST_USER)
      console.log("preUnstakeBalance", ytonFull(preUnstakeBalance))

      const amountYoctoStNear = BigInt("1" + "0".repeat(24))

      await metapool.unstake(amountYoctoStNear)
      const postUnstakeBalance = await metapool.get_account_unstaked_balance(TEST_USER)
      console.log("postUnstakeBalance", ytonFull(postUnstakeBalance))

      const nearStakeDiff = BigInt(postUnstakeBalance) - BigInt(preUnstakeBalance)
      console.log("nearStakeDiff", ytonFull(nearStakeDiff.toString()))

      const expectedPostUnstakeBalance = BigInt(preUnstakeBalance) + amountYoctoStNear
      expect(ytonFull(postUnstakeBalance)).toBe(ytonFull(expectedPostUnstakeBalance.toString()))
    })
  })
})

