const sdk = require("@defillama/sdk");

const utils = require("../helper/utils");

const abi = require("./abi.json");

async function fetchVaults(chainName, block, vaultConfig) {
  const { output: vaults } = await sdk.api.abi.call({
    target: vaultConfig.lens,
    abi: abi.getVaultsMetadata,
    chain: chainName,
    block,
    params: [vaultConfig.vaults.map((x) => x.address)],
  });

  const balances = {};
  vaults.forEach((vault) => {
    sdk.util.sumSingleBalance(
      balances,
      `${chainName}:${vault.asset}`,
      vault.totalAssets
    );
  });

  return balances;
}

function fetchChain(chainName, _chainId) {
  return async function (_timestamp, _ethBlock, chainBlocks) {
    const response = await utils.fetchURL(
      `https://citrus-finance.github.io/citrus-ecosystem/output/${chainName}.json`
    );
    const chainConfig = response.data;

    return fetchVaults(chainName, chainBlocks[chainName], chainConfig.vault);
  };
}

const chains = {
  xdai: 100,
};

module.exports = {
  timetravel: true,
  misrepresentedTokens: false,
  doublecounted: true,
  ...Object.fromEntries(
    Object.entries(chains).map((chain) => [
      chain[0],
      {
        tvl: fetchChain(chain[0], chain[1]),
      },
    ])
  ),
};
