import { TokenIcon, TokenPair } from '@apps/base/components/core'
import { CountUp, CountUpUSD, Tooltip } from '@apps/dumb-components'
import { toK } from '@apps/formatters'
import { useFeederPool } from '@apps/masset-hooks'
import { ViewportWidth } from '@apps/theme'
import { PoolType } from '@apps/types'
import Skeleton from 'react-loading-skeleton'
import styled from 'styled-components'

import { useFeederPoolApy } from '../../../hooks/useFeederPoolApy'
import { usePoolMetrics } from '../../../hooks/usePoolMetrics'
import { useSelectedMassetPrice } from '../../../hooks/useSelectedMassetPrice'
import { DeprecatedLabel } from '../../Dashboard/Styled'
import { assetColorMapping } from '../constants'
import { Card } from './Card'

import type { FeederPoolState } from '@apps/data-provider'
import type { FC } from 'react'

interface Props {
  className?: string
  poolAddress: string
}

const RewardsAPY = styled.div`
  display: flex;
  align-items: center;

  img {
    width: 2rem !important;
    margin-left: 0.5rem;
  }

  > div {
    display: flex;
    align-items: center;
  }
`

const UnderlinedTip = styled(Tooltip)`
  text-decoration: underline;
`

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.5rem;

  > div {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;

    > :first-child {
      font-weight: 600;
    }

    > :last-child {
      text-align: right;
      span {
        ${({ theme }) => theme.mixins.numeric};
      }
    }

    @media (min-width: ${ViewportWidth.m}) {
      flex-direction: row;
      flex: 0;
      justify-content: space-between;
      flex-basis: calc(50% - 5%);
    }
  }

  @media (min-width: ${ViewportWidth.m}) {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  ${RewardsAPY} + div {
    text-align: left;
  }
`

const Container = styled(Card)`
  h2 > div {
    display: flex;
    align-items: center;

    > *:first-child {
      margin-right: 0.5rem;
    }
  }

  > div {
    width: 100%;
  }

  > :last-child > a * {
    display: inline;
  }

  h3 {
    font-size: 1.75rem;
  }
`

export const PoolDetailCard: FC<Props> = ({ poolAddress, className }) => {
  const feederPool = useFeederPool(poolAddress) as FeederPoolState
  const feederPoolApy = useFeederPoolApy(poolAddress)
  const { volume, baseApy } = usePoolMetrics(poolAddress)
  const massetPrice = useSelectedMassetPrice()
  const isDeprecated = feederPool.poolType === PoolType.Deprecated

  const { vault, liquidity, price } = feederPool
  const fpTokenPrice = massetPrice ? price.simple * (massetPrice.value ?? 0) : undefined

  if (!feederPool) return <Skeleton height={200} />

  return (
    <Container
      className={className}
      gradientColor={assetColorMapping[feederPool.title]}
      title={
        <div>
          <TokenPair symbols={[feederPool.masset.token.symbol, feederPool.fasset.token.symbol]} isLarge={true} />
          {feederPool.title}
        </div>
      }
    >
      <StatsContainer>
        <div>
          <p>Liquidity</p>
          <CountUpUSD end={liquidity.simple} price={fpTokenPrice} formattingFn={toK} />
        </div>
        <div>
          <p>Price</p>
          <div>
            <CountUpUSD end={price.simple} decimals={10} price={massetPrice.value} />
          </div>
        </div>
        <div>
          <p>24h Volume</p>
          <CountUpUSD end={volume.simple} decimals={10} price={massetPrice.value} formattingFn={toK} />
        </div>
        {!!feederPool?.vault && (
          <RewardsAPY>
            <p>
              <Tooltip tip="33% of earned mRLN rewards are claimable immediately. The remaining rewards are streamed linearly after 26 weeks">
                Rewards APY
              </Tooltip>
            </p>
            {isDeprecated ? (
              <DeprecatedLabel>Deprecated</DeprecatedLabel>
            ) : (
              <div>
                <div>
                  <div>{feederPoolApy.value && <CountUp end={feederPoolApy.value.rewards.base} suffix="%" />}</div>
                  {feederPoolApy.value?.rewards.maxBoost ? (
                    <div>
                      &nbsp;→&nbsp;
                      <UnderlinedTip tip="Max boost can be achieved by staking mRLN" hideIcon>
                        {feederPoolApy.value && <CountUp end={feederPoolApy.value.rewards.maxBoost} suffix="%" />}
                      </UnderlinedTip>
                    </div>
                  ) : null}
                </div>
                <TokenIcon symbol={vault?.rewardsToken.symbol} />
              </div>
            )}
          </RewardsAPY>
        )}
        {!!feederPoolApy.value?.platformRewards && (
          <RewardsAPY>
            <p>
              <Tooltip tip="Platform rewards are not boosted and 100% is claimable immediately.">Platform APY</Tooltip>
            </p>
            <div>
              <div>{feederPoolApy.value && <CountUp end={feederPoolApy.value.platformRewards} suffix="%" />} </div>
              <TokenIcon symbol={vault?.platformRewardsToken?.symbol} />
            </div>
          </RewardsAPY>
        )}
        <div />
        {baseApy > 0.05 && (
          <RewardsAPY>
            <p>
              <Tooltip tip="Base APY represents the increase in the value of the pool token over time.">Base APY</Tooltip>
            </p>
            <div>
              <div>
                <CountUp end={baseApy} suffix="%" />
              </div>
            </div>
          </RewardsAPY>
        )}
        {feederPoolApy.value && feederPoolApy.value.rewards.base > 1000 && <div>While liquidity is low, this APY is highly volatile</div>}
      </StatsContainer>
    </Container>
  )
}
