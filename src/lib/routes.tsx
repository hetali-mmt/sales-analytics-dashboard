import { TeamOverview } from '@/pages/TeamOverview'
import { SessionList } from '@/pages/SessionList'
import { Dashboard } from '@/pages/Dashboard'

export interface RouteConfig {
  path: string
  component: React.ComponentType
  label: string
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    component: TeamOverview,
    label: 'Team Overview',
  },
  {
    path: '/sessions',
    component: SessionList,
    label: 'Sessions',
  },
  {
    path: '/dashboard',
    component: Dashboard,
    label: 'Dashboard',
  },
]