import React, { FC, useEffect } from 'react'
import styled from 'styled-components'

import { Warning } from '@apps/components/core'
import { useTokenSubscription } from '@apps/base/context/tokens'
import { usePropose } from '@apps/base/context/transactions'
import { useBigDecimalInput, useFetchState } from '@apps/hooks'
import { TransactionManifest, Interfaces } from '@apps/transaction-manifest'
import { AssetInputSingle, SendButton } from '@apps/components/forms'
import { useBlockNow } from '@apps/base/context/block'
import { BigDecimal } from '@apps/bigdecimal'

import { useStakedTokenQuery, useStakedTokenContract } from '../../context/StakedTokenProvider'

const Input = styled(AssetInputSingle)`
  background: ${({ theme }) => theme.color.background[0]};
  height: 3.5rem;
`

const Fee = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.color.background[1]};
  padding-top: 0.75rem;

  span {
    ${({ theme }) => theme.mixins.numeric};
  }
`

const Warnings = styled.div`
  background: ${({ theme }) => theme.color.background[0]};
  border: 1px solid ${({ theme }) => theme.color.defaultBorder};
  border-radius: 0.875rem;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

export const WithdrawForm: FC = () => {
  const { data, loading } = useStakedTokenQuery()
  const [fee, setFee] = useFetchState<BigDecimal>()
  const blockNumber = useBlockNow()

  const propose = usePropose()
  const stakedTokenContract = useStakedTokenContract()

  const stakingToken = useTokenSubscription(data?.stakedToken?.stakingToken.address)
  const [amount, formValue, setFormValue] = useBigDecimalInput()

  const stakedAmount = data?.stakedToken?.accounts?.[0]?.balance?.rawBD
  const isValid = amount?.simple <= (stakedAmount?.simple ?? 0) && amount?.simple > 0

  // need to figure out how to get weighted timestamp
  const weightedTimestamp = data?.stakedToken.accounts[0]?.balance.weightedTimestamp
  useEffect(() => {
    if (!weightedTimestamp || fee.fetching) return

    setFee.fetching()
    Promise.all([stakedTokenContract ? stakedTokenContract.calcRedemptionFeeRate(weightedTimestamp) : undefined])
      .then(([fee = 0]) => {
        setFee.value(new BigDecimal(fee))
      })
      .catch(setFee.error)
  }, [blockNumber, weightedTimestamp, setFee, fee.fetching, stakedTokenContract])

  const handleSend = () => {
    if (!stakedTokenContract || !data || amount.exact.lte(0) || !fee.value) return

    propose<Interfaces.StakedToken, 'startCooldown'>(
      new TransactionManifest(stakedTokenContract, 'startCooldown', [amount.exact], {
        present: `Initiating cooldown of ${amount.simple} ${stakingToken.symbol}`,
        past: `Initiated cooldown of ${amount.simple} ${stakingToken.symbol}`,
      }),
    )
  }

  return (
    <Container>
      <Input
        isFetching={loading}
        token={stakingToken}
        formValue={formValue}
        handleSetMax={() => setFormValue(stakedAmount.string)}
        handleSetAmount={setFormValue}
        balance={stakedAmount}
      />
      <Warnings>
        <Warning>
          During withdrawals, your voting power will be temporarily reduced. <a>Learn more</a>
        </Warning>
        <Warning>
          There is a cooldown period to unstake & a penalty if you have not staked long enough. <a>Learn more</a>
        </Warning>
        <Fee>
          <div>Redemption Fee</div>
          <span>{fee.value?.simple}</span>
        </Fee>
      </Warnings>
      <SendButton valid={isValid} title="Begin Withdrawal" handleSend={handleSend} />
    </Container>
  )
}