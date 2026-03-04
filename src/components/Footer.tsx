import { NavLink } from 'react-router-dom'
import { contacts } from '../data/site'

export const Footer = () => (
  <footer className="mt-10 border-t border-red-700/90 bg-black">
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 md:grid-cols-3 lg:px-8">
      <div className="border border-zinc-800 p-3">
        <p className="mono text-[11px] text-red-400">[ UNIT_INFO ]</p>
        <p className="mt-1 text-xl font-bold uppercase text-white">POLYTECH IT ARENA</p>
        <p className="mt-2 text-sm text-zinc-400">
          Blue Team vs Red Team по направлениям CyberSecurity, Networks, DevOps и
          SysAdmin.
        </p>
      </div>
      <div className="mono border border-zinc-800 p-3 text-xs text-zinc-300">
        <p className="text-red-400">CONTACTS</p>
        <p className="mt-2">EMAIL: {contacts.email}</p>
        <p>TELEGRAM: {contacts.telegram}</p>
        <p>LOCATION: {contacts.room}</p>
      </div>
      <div className="mono border border-zinc-800 p-3 text-xs text-zinc-300">
        <p className="text-red-400">NAV</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <NavLink to="/calendar" className="border border-zinc-700 px-2 py-1 hover:border-red-600">
            CALENDAR
          </NavLink>
          <NavLink to="/leaderboard" className="border border-zinc-700 px-2 py-1 hover:border-red-600">
            LEADERBOARD
          </NavLink>
          <NavLink to="/profile" className="border border-zinc-700 px-2 py-1 hover:border-red-600">
            PROFILE
          </NavLink>
          <NavLink to="/rules" className="border border-zinc-700 px-2 py-1 hover:border-red-600">
            RULES
          </NavLink>
        </div>
      </div>
    </div>
    <div className="mono border-t border-zinc-800 py-3 text-center text-[11px] text-zinc-500">
      © {new Date().getFullYear()} POLYTECH IT ARENA // RESTRICTED SCHOOL NETWORK
    </div>
  </footer>
)
