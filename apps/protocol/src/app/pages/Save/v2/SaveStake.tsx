import { useMemo } from 'react'

import { StakingRewardsWithPlatformToken__factory } from '@apps/artifacts/typechain'
import { MultiRewards } from '@apps/base/components/core'
import { AssetInput } from '@apps/base/components/forms'
import { useSigner } from '@apps/base/context/account'
import { useTokenAllowance } from '@apps/base/context/tokens'
import { usePropose } from '@apps/base/context/transactions'
import { Button, Table, TableCell, TableRow } from '@apps/dumb-components'
import { useBigDecimalInput } from '@apps/hooks'
import { useSelectedMassetState } from '@apps/masset-hooks'
import { TransactionManifest } from '@apps/transaction-manifest'
import styled from 'styled-components'

import { StakingRewards } from '../../../components/rewards/StakingRewards'
import { RewardsEarnedProvider, useRewardsEarned, useStakingRewards } from '../hooks'

import type { BigDecimal } from '@apps/bigdecimal'
import type { Interfaces } from '@apps/transaction-manifest'
import type { FC } from 'react'

const Input = styled(AssetInput)`
  height: 2.5rem;
  border-radius: 0.5rem;
  padding: 0;
  border: none;

  button {
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    height: 1.875rem;
  }

  .approve-button {
    border-radius: 0.75rem;
    height: 3rem;
    span {
      font-size: 0.875rem;
      color: ${({ theme }) => theme.color.white};
    }
  }

  > div {
    margin-right: 0.5rem;
  }
`

const StyledRow = styled(TableRow)`
  background: ${({ theme }) => theme.color.background[0]};

  td {
    padding: 0 0.75rem 0 0.5rem;
  }

  :hover {
    background: ${({ theme, onClick }) => onClick && theme.color.background[1]};
  }
`

const StyledTable = styled(Table)`
  background: ${({ theme }) => theme.color.background[1]};
  padding: 0.5rem;
  border-radius: 1rem;
  margin-bottom: 1rem;

  h3 {
    font-weight: 600;
    margin-left: 0.5rem;
    margin-bottom: 0.5rem;
  }

  th:not(:first-child):last-child {
    ${({ theme }) => theme.mixins.numeric};
    color: ${({ theme }) => theme.color.bodyAccent};
    font-weight: 400;
  }
`

const Container = styled.div`
  width: 100%;
  > div {
    margin-bottom: 1.25rem;
  }
`

const RewardsEarned: FC = () => {
  const stakingRewards = useStakingRewards()
  const rewardsEarned = useRewardsEarned()
  const propose = usePropose()
  const signer = useSigner()

  const stakingRewardsAddress = stakingRewards.stakingRewardsContract?.address

  const contract = useMemo(
    () => (signer && stakingRewardsAddress ? StakingRewardsWithPlatformToken__factory.connect(stakingRewardsAddress, signer) : undefined),
    [stakingRewardsAddress, signer],
  )

  const handleRewardClaim = (): void => {
    if (!contract) return
    propose<Interfaces.StakingRewardsWithPlatformToken, 'claimReward'>(
      new TransactionManifest(contract, 'claimReward', [], {
        present: `Claiming rewards`,
        past: 'Claimed rewards',
      }),
    )
  }

  return <MultiRewards rewardsEarned={rewardsEarned} onClaimRewards={handleRewardClaim} />
}

export const SaveStake: FC = () => {
  const stakingRewards = useStakingRewards()
  const signer = useSigner()
  const propose = usePropose()
  const massetState = useSelectedMassetState()

  const stakingRewardsAddress = stakingRewards.stakingRewardsContract?.address
  const stakingTokenAddress = stakingRewards.stakingRewardsContract?.stakingToken.address

  const contract = useMemo(
    () => (signer && stakingRewardsAddress ? StakingRewardsWithPlatformToken__factory.connect(stakingRewardsAddress, signer) : undefined),
    [stakingRewardsAddress, signer],
  )

  const unstakedBalance: BigDecimal | undefined = stakingRewards?.unstakedBalance
  const stakedBalance: BigDecimal | undefined = stakingRewards?.stakedBalance

  const [amountToStake, saveFormValue, setSaveAmount] = useBigDecimalInput(unstakedBalance ?? '0')
  const [amountToWithdraw, stakedFormValue, setStakedAmount] = useBigDecimalInput(stakedBalance ?? '0')

  const exchangeRate = massetState?.savingsContracts?.v2?.latestExchangeRate?.rate?.simple
  const amountToWithdrawConverted = (amountToWithdraw?.simple ?? 0) * exchangeRate
  const amountToStakeConverted = (amountToStake?.simple ?? 0) * exchangeRate

  const allowance = useTokenAllowance(stakingTokenAddress, stakingRewardsAddress)
  const needsApprove = !amountToStake || !allowance || (amountToStake && allowance?.exact.lt(amountToStake.exact))

  const handleStake = (): void => {
    if (!contract || !amountToStake?.exact) return
    propose<Interfaces.StakingRewardsWithPlatformToken, 'stake(uint256)'>(
      new TransactionManifest(contract, 'stake(uint256)', [amountToStake.exact], {
        present: `Staking ${amountToStake?.simple.toFixed(0)} imUSX`,
        past: 'Staked imUSX',
      }),
    )
  }

  const handleUnstake = (): void => {
    if (!contract || !amountToWithdraw?.exact) return
    propose<Interfaces.StakingRewardsWithPlatformToken, 'withdraw'>(
      new TransactionManifest(contract, 'withdraw', [amountToWithdraw.exact], {
        present: `Withdrawing ${amountToWithdraw?.simple.toFixed(0)} imUSX`,
        past: 'Withdrew imUSX',
      }),
    )
  }

  return (
    <Container>
      <StakingRewards stakingRewards={stakingRewards} />
      {stakingRewards.hasStakedBalance && (
        <StyledTable headerTitles={[{ title: 'Staked Balance' }, { title: `≈ $${amountToWithdrawConverted.toFixed(2)}` }]}>
          <StyledRow buttonTitle="Stake">
            <TableCell width={70}>
              <Input
                handleSetAmount={setStakedAmount}
                handleSetMax={() => setStakedAmount(stakingRewards.stakedBalance?.string ?? '0')}
                formValue={stakedFormValue}
              />
            </TableCell>
            <TableCell width={30}>
              <Button onClick={handleUnstake}>Unstake</Button>
            </TableCell>
          </StyledRow>
        </StyledTable>
      )}
      {stakingRewards.hasUnstakedBalance && (
        <StyledTable headerTitles={[{ title: 'Unstaked Balance' }, { title: `≈ $${amountToStakeConverted.toFixed(2)}` }]}>
          <StyledRow buttonTitle="Stake">
            <TableCell width={70}>
              <Input
                handleSetAmount={setSaveAmount}
                handleSetMax={() => setSaveAmount(stakingRewards.unstakedBalance?.string ?? '0')}
                formValue={saveFormValue}
                address={stakingTokenAddress}
                spender={stakingRewardsAddress}
                hideToken
              />
            </TableCell>
            <TableCell width={20}>
              <Button disabled={needsApprove} highlighted={!needsApprove} onClick={handleStake}>
                Stake
              </Button>
            </TableCell>
          </StyledRow>
        </StyledTable>
      )}
      <RewardsEarnedProvider>
        <RewardsEarned />
      </RewardsEarnedProvider>
    </Container>
  )
}
