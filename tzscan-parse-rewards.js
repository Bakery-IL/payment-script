#!/usr/bin/env node
const fetch = require('node-fetch');

main().catch(e => console.error(e) || process.exit(1));

async function main() {
  const [, , cycle] = process.argv;
  if (!cycle) {
    console.info("USAGE: parse-tzscan-rewards CYCLE")
    process.exit(1);
    return;
  }
  const pageSize = 50
  const fee = 5 / 100;
  const pageUrlBuilder = (cycle, page, size = pageSize) => `https://api${Math.floor(Math.random() * 6 + 1)}.tzscan.io/v3/rewards_split/tz1cYufsxHXJcvANhvS55h3aY32a9BAFB494?cycle=${cycle}&p=${page}&number=${size}`

  const { rewards, stakingBalance, numberOfPages } = await handlePage0();
  // console.log({ rewards, stakingBalance, numberOfPages });
  pages = Array.from({ length: numberOfPages }, (_, k) => pageUrlBuilder(cycle, k))
  const rewardsSplit = await Promise.all(pages.map(handleUrl));
  console.log(rewardsSplit.reduce((arr, cur) => arr.concat(cur), []).join('\n'))

  async function handlePage0() {
    const response = await fetchUrl(pageUrlBuilder(cycle, 0, 0), 0);
    const { delegate_staking_balance, blocks_rewards, endorsements_rewards, revelation_rewards, delegators_nb } = response;
    const rewards = (Number(blocks_rewards) + Number(endorsements_rewards) + Number(revelation_rewards));
    const numberOfPages = Math.ceil(delegators_nb / pageSize);
    return { rewards, stakingBalance: Number(delegate_staking_balance), numberOfPages };
  }

  async function handleUrl(url, index) {
    // console.log(`getting page ${index}`)
    const response = await fetchUrl(url, index);
    const delegatorsRewards = response.delegators_balance.map(calculateDelegatorReward);
    return delegatorsRewards.join('\n');
  }

  function calculateDelegatorReward({ account, balance }) {
    const share = Number(balance) / stakingBalance;
    const reward = share * rewards * (1 - fee);
    // console.log(`account: ${account.tz}, share: ${share}, reward: ${reward}`)
    return `${account.tz}=${reward}`;
  }

  async function fetchUrl(url, index) {
    try {
      const response = await retryFetch(url);
      return await response.json();
    } catch (e) {
      console.log(`page ${index} failed`, e);
      return index > 0 ? [] : process.exit(1);
    }
  }
}

async function retryFetch(url, tries = 10, exitOnFail = true, predicate = response => response.headers.get('content-type') === 'application/json') {
  for (let i = 0; i < tries; i++) {
    let response = await fetch(url);
    if (predicate(response)) {
      return response;
    }
  }
  console.error(`Failed loading ${url}`);
  if (exitOnFail) {
    process.exit(1);
  }
}