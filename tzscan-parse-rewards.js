#!/usr/bin/env node
const fetch = require('node-fetch');
require('dotenv').config();
const bakeryAddress = process.env.BAKERY_ADDRESS;
main().catch(e => console.error(e) || process.exit(1));

async function main() {
  const [, , cycle] = process.argv;
  if (!cycle) {
    console.info('USAGE: parse-tzscan-rewards CYCLE');
    process.exit(1);
    return;
  }
  const pageSize = 50;
  const fee = 5 / 100;
  const pageUrlBuilder = (cycle, page, size = pageSize) => {
    const apiNumber = Math.floor(Math.random() * 3 + 1);
    return `https://api${apiNumber}.tzscan.io/v3/rewards_split/${bakeryAddress}?cycle=${cycle}&p=${page}&number=${size}`;
  };

  const { rewards, stakingBalance, numberOfPages } = await handlePage0();
  // console.log({ rewards, stakingBalance, numberOfPages });
  pages = Array.from({ length: numberOfPages }, (_, k) => pageUrlBuilder(cycle, k));
  const rewardsSplit = await Promise.all(pages.map(handleUrl));
  console.log(rewardsSplit.reduce((arr, cur) => arr.concat(cur), []).join('\n'));

  async function handlePage0() {
    const response = await fetchUrl(pageUrlBuilder(cycle, 0, 0), 0);
    const { delegate_staking_balance, delegators_nb } = response;
    const rewards = sumRewards(response);
    const numberOfPages = Math.ceil(delegators_nb / pageSize);
    return { rewards, stakingBalance: Number(delegate_staking_balance), numberOfPages };
  }

  function sumRewards({
    blocks_rewards,
    endorsements_rewards,
    revelation_rewards,
    fees,
    gain_from_denounciation,
    lost_deposit_from_denounciation,
    lost_rewards_denounciation,
    lost_fees_denounciation,
    lost_revelation_rewards,
    lost_revelation_fees,
  }) {
    return (
      +blocks_rewards +
      +endorsements_rewards +
      +fees +
      +gain_from_denounciation -
      +lost_deposit_from_denounciation -
      +lost_rewards_denounciation -
      +lost_fees_denounciation +
      +revelation_rewards -
      +lost_revelation_rewards -
      +lost_revelation_fees
    );
  }

  async function handleUrl(url, index) {
    // console.log(`getting page ${index}`)
    const response = await fetchUrl(url, index);
    const delegatorsRewards = response.delegators_balance.map(calculateDelegatorReward);
    return delegatorsRewards.filter(i => i).join('\n');
  }

  function calculateDelegatorReward({ account, balance }) {
    const share = Number(balance) / stakingBalance;
    const reward = Math.ceil(share * rewards * (1 - fee));
    if (!reward) {
      return '';
    }
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

async function retryFetch(
  url,
  tries = 10,
  exitOnFail = true,
  predicate = response => response.headers.get('content-type') === 'application/json'
) {
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
