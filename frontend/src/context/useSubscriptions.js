import { useContext } from 'react'
import { SubscriptionsContext } from './subscriptionsContext'

/** { channels, loading, isSubscribed(id), toggle(id) } */
export function useSubscriptions() {
  return useContext(SubscriptionsContext)
}
