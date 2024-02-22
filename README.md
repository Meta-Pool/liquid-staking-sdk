# Meta Pool liquid-staking-sdk

Liquid Staking SDK for Meta Pool in the NEAR Blockchain

[MetaPool.app](metapool.app) is a multi-chain liquid staking protocol. 

On the NEAR Blockchain implementation, people stake their NEAR tokens with MetaPool and receive a liquid "stNEAR" token representing their staked NEAR. stNEAR is a yield accruing token, and its price versus NEAR increases every epoch (every 15hs, approx. 10% APY). Users can use their stNEAR in DeFi to get extra yield, and they also can unstake and recover their original NEAR any time (the protocol is permissionless and non-custodial)

## Installation
```bash
$ npm install @metapool/liquid-staking-sdk
```

## Examples

Check the [tests](test/stake-unstake.spec.ts) for examples using the library

Also this repo [test-liquid-staking-sdk](https://github.com/Narwallets/test-liquid-staking-sdk) has SDK usage examples
## Learn more
- [MetaPool web](https://MetaPool.app)
- [MetaPool docs](https://docs.MetaPool.app/)
- [Join us on Discord](https://discord.com/invite/tG4XJzRtdQ)
