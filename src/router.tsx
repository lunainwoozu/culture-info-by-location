import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import Detail from './pages/Detail'
import SearchPage from './pages/SearchPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/detail/:id',
    element: <Detail />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
])
