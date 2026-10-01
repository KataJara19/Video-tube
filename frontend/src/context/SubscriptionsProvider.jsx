import { useCallback, useEffect, useMemo, useState } from 'react'
import { channelService } from '../services/channelService'
import { useAuth } from './useAuth'
import { SubscriptionsContext } from './subscriptionsContext'

// Canales a los que el usuario está suscrito: los usan la guía lateral y los botones "Suscribirse"
export function SubscriptionsProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState({ userId: null, channels: [] })

  const refresh = useCallback(() => {
    if (!user) return Promise.resolve()
    return channelService
      .mySubscriptions()
      .then((channels) => setState({ userId: user.id, channels }))
      .catch(() => setState({ userId: user.id, channels: [] }))
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(() => {
    const channels = user && state.userId === user.id ? state.channels : []
    return {
      channels,
      loading: Boolean(user) && state.userId !== user.id,
      isSubscribed: (id) => channels.some((c) => c.id === id),
      /** Suscribe o cancela; devuelve { subscribed, subscriber_count } */
      toggle: async (id) => {
        const subscribed = channels.some((c) => c.id === id)
        const result = subscribed ? await channelService.unsubscribe(id) : await channelService.subscribe(id)
        await refresh()
        return result
      },
    }
  }, [user, state, refresh])

  return <SubscriptionsContext.Provider value={value}>{children}</SubscriptionsContext.Provider>
}
