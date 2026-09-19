import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'
import { useLandingSeo } from './hooks/useLandingSeo'

export default function Layout() {
  useLandingSeo()

  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
