import React, { FC, useMemo, createContext, useContext } from 'react'
import { useAccount } from '@apps/base/context/account'
import { useBlockPollingSubscription } from '@apps/hooks'
import { StakingQueryHookResult, useStakingLazyQuery } from '@apps/artifacts/graphql/staking'
import { QuestsQueryHookResult, useQuestsLazyQuery, useQuestsQuery } from '@apps/artifacts/graphql/questbook'
import { useApolloClients } from '@apps/base/context/apollo'

const stakingCtx = createContext<StakingQueryHookResult>(null as never)
const questbookCtx = createContext<QuestsQueryHookResult>(null as never)

export const useStakingQuery = () => useContext(stakingCtx)

export const useQuestbookQuery = () => useContext(questbookCtx)

export const StakingProvider: FC = ({ children }) => {
  const apollo = useApolloClients()
  const account = useAccount()

  const options = useMemo<{
    staking: Parameters<typeof useStakingLazyQuery>[0]
    questbook: Parameters<typeof useQuestsLazyQuery>[0]
  }>(() => {
    return {
      staking: {
        client: apollo.staking,
      },
      questbook: {
        variables: { userId: account ?? '', hasUser: !!account },
        client: apollo.questbook,
      },
    }
  }, [account, apollo])

  const stakingSub = useBlockPollingSubscription(useStakingLazyQuery, options.staking) as unknown as StakingQueryHookResult
  const questbookSub = useQuestsQuery(options.questbook) // maybe this should use block polling too

  return (
    <stakingCtx.Provider value={stakingSub}>
      <questbookCtx.Provider value={questbookSub}>{children}</questbookCtx.Provider>
    </stakingCtx.Provider>
  )
}