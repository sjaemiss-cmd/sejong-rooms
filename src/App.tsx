import { useState } from 'react'
import { useScheduleData } from './lib/useScheduleData'
import { NowView } from './components/NowView'
import { TimeSearchView } from './components/TimeSearchView'
import { Icon } from './components/Icon'
import { InstallButton } from './components/InstallButton'
import { DonateCard } from './components/DonateCard'

type Tab = 'now' | 'search'

export default function App() {
  const [tab, setTab] = useState<Tab>('now')
  const { schedule, buildings, rooms, error } = useScheduleData()

  return (
    <div className="min-h-dvh bg-background text-on-background">
      <header className="fixed top-0 left-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 pt-safe">
        <div className="flex justify-between items-center px-5 h-16">
          <div className="flex items-center gap-2">
            <Icon name="school" className="text-primary-container" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-on-surface">
                세종대 빈 강의실
              </span>
              <span className="text-[10px] text-on-surface-variant">2026-1학기 기준</span>
            </div>
          </div>
          <InstallButton />
        </div>
      </header>

      <main className="pt-header pb-10 px-5 mx-auto max-w-xl space-y-6 pb-safe">
        <nav className="bg-surface-container-low p-1.5 rounded-xl flex items-center shadow-inner">
          <TabButton active={tab === 'now'} onClick={() => setTab('now')}>
            지금
          </TabButton>
          <TabButton active={tab === 'search'} onClick={() => setTab('search')}>
            시간 지정
          </TabButton>
        </nav>

        {error && (
          <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
            데이터 로드 실패: {error}
          </div>
        )}

        {!error && (!schedule || !buildings || !rooms) && (
          <p className="text-sm text-on-surface-variant">불러오는 중…</p>
        )}

        {schedule && buildings && rooms && (
          <>
            {tab === 'now' && <NowView schedule={schedule} buildings={buildings} rooms={rooms} />}
            {tab === 'search' && (
              <TimeSearchView schedule={schedule} buildings={buildings} rooms={rooms} />
            )}
            <DonateCard />
          </>
        )}
      </main>
    </div>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-[10px] text-body-md transition-all ${
        active
          ? 'bg-surface-container-highest text-primary font-bold shadow-sm'
          : 'text-on-surface-variant active:bg-surface-container-high'
      }`}
    >
      {children}
    </button>
  )
}
