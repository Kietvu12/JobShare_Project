import { Outlet } from 'react-router-dom'
import { JobShareRoleSwitchBar } from '../../../../shared/switch-sites'
import Footer from './Footer'
import Header from './Header'
import { useLandingSeo } from './hooks/useLandingSeo'

export default function Layout() {
  useLandingSeo()

  return (
    <>
      <div className="business-role-switch">
        <JobShareRoleSwitchBar activePersona="business" />
      </div>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
