import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'

interface TerminalLine {
  id: number
  html: string
}

type LoginStep = 'idle' | 'username' | 'password' | 'ready'

const prompt = 'STUDENT@COLLEGE-AD:~$'

const initialLines: TerminalLine[] = [
  { id: 1, html: 'SYSTEM BOOT: v.4.0.26... OK' },
  { id: 2, html: 'CONNECTION: ENCRYPTED_RED_LINE... ESTABLISHED' },
  { id: 3, html: 'AUTH SOURCE: COLLEGE MOODLE CORE ACCOUNT' },
  { id: 4, html: '--------------------------------------------------' },
  {
    id: 5,
    html: "Введите <span style='color:#fff;'>help</span> чтобы увидеть команды.",
  },
]

const randomMatrixRow = () =>
  Array.from({ length: 56 }, () => (Math.random() > 0.5 ? '1' : '0')).join('')

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { authorize, authorizeAsGuest, isAuthLoading, isGuest } = useAuth()
  const [lines, setLines] = useState<TerminalLine[]>(initialLines)
  const [lineId, setLineId] = useState(initialLines.length + 1)
  const [inputValue, setInputValue] = useState('')
  const [loginStep, setLoginStep] = useState<LoginStep>('idle')
  const [screenVisible, setScreenVisible] = useState(false)
  const [loginCandidate, setLoginCandidate] = useState('')
  const [passCandidate, setPassCandidate] = useState('')
  const terminalRef = useRef<HTMLDivElement | null>(null)

  const pushLine = (html: string) => {
    setLines((previous) => [...previous, { id: lineId, html }])
    setLineId((previous) => previous + 1)
    requestAnimationFrame(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      }
    })
  }

  const openLoginScreen = () => {
    setScreenVisible(true)
    setLoginStep('username')
    setLoginCandidate('')
    setPassCandidate('')
    pushLine("<span style='color:#fff;'>[ LOGIN SCREEN OPENED ]</span>")
    pushLine('Логин и пароль используются от общей системы Moodle.')
    pushLine('Введите логин (без команды):')
  }

  const handleStepInput = (rawValue: string) => {
    const value = rawValue.trim()
    if (!value) {
      pushLine('ERROR: пустое значение. Повторите ввод.')
      return
    }

    if (value.toLowerCase() === 'cancel') {
      setLoginStep('idle')
      pushLine('LOGIN SCREEN CANCELED.')
      return
    }

    if (loginStep === 'username') {
      setLoginCandidate(value)
      setLoginStep('password')
      pushLine(`LOGIN ACCEPTED: <span style="color:#fff;">${value}</span>`)
      pushLine('Введите пароль (ввод скрыт):')
      return
    }

    if (loginStep === 'password') {
      setPassCandidate(value)
      setLoginStep('ready')
      pushLine('PASSWORD RECEIVED: ********')
      pushLine(
        "Проверка выполнена. Для входа на сайт введите <span style='color:#fff;'>auth</span>.",
      )
    }
  }

  const runCommand = async (rawValue: string) => {
    const value = rawValue.trim()
    const normalized = value.toLowerCase()
    if (!value) {
      return
    }

    if (normalized === 'guest') {
      pushLine(`<span style="color:#ff3131;">${prompt}</span> ${value}`)
      authorizeAsGuest()
      pushLine(
        "<span style='color:#00ff41;'>GUEST MODE ENABLED.</span> Вход выполнен в гостевом режиме.",
      )
      setTimeout(() => {
        navigate('/home', { replace: true })
      }, 450)
      return
    }

    if (loginStep === 'username') {
      pushLine(`<span style="color:#ff3131;">${prompt}</span> ${value}`)
      handleStepInput(value)
      return
    }

    if (loginStep === 'password') {
      pushLine(`<span style="color:#ff3131;">${prompt}</span> ********`)
      handleStepInput(value)
      return
    }

    pushLine(`<span style="color:#ff3131;">${prompt}</span> ${value}`)

    if (normalized === 'help') {
      pushLine(
        "Команды:<br/>- <span style='color:#fff;'>help</span>: список команд<br/>- <span style='color:#fff;'>login</span>: открыть экран ввода логина/пароля Moodle<br/>- <span style='color:#fff;'>auth</span>: вход на сайт после login<br/>- <span style='color:#fff;'>guest</span>: войти в гостевом режиме<br/>- <span style='color:#fff;'>status</span>: состояние авторизации<br/>- <span style='color:#fff;'>clear</span>: очистить экран<br/><br/>Hint: в терминале есть пасхалки.",
      )
      return
    }

    if (normalized === 'login') {
      openLoginScreen()
      return
    }

    if (normalized === 'status') {
      const loginStatus = loginCandidate
        ? `<span style='color:#00ff41'>SET</span>`
        : `<span style='color:#ff3131'>EMPTY</span>`
      const passStatus = passCandidate
        ? `<span style='color:#00ff41'>SET</span>`
        : `<span style='color:#ff3131'>EMPTY</span>`
      const guestStatus = isGuest
        ? `<span style='color:#00ff41'>ON</span>`
        : `<span style='color:#ff3131'>OFF</span>`
      pushLine(
        `LOGIN: ${loginStatus}<br/>PASSWORD: ${passStatus}<br/>STEP: ${loginStep}<br/>GUEST MODE: ${guestStatus}`,
      )
      return
    }

    if (normalized === 'auth') {
      if (loginStep !== 'ready' || !loginCandidate || !passCandidate) {
        pushLine(
          "AUTH FAILED: сначала выполните <span style='color:#fff;'>login</span> и введите данные.",
        )
        return
      }
      if (isAuthLoading) {
        pushLine('AUTH IN PROGRESS...')
        return
      }

      const result = await authorize(loginCandidate, passCandidate)
      if (!result.ok) {
        pushLine(
          `<span style='color:#ff3131;'>AUTH FAILED:</span> ${result.error}.`,
        )
        return
      }

      pushLine("<span style='color:#00ff41;'>ACCESS GRANTED.</span> Авторизация успешна. Загрузка панели соревнований...")
      setTimeout(() => {
        navigate('/home', { replace: true })
      }, 550)
      return
    }

    if (normalized === 'clear') {
      setLines([])
      return
    }

    if (normalized === 'matrix') {
      pushLine("<span style='color:#00ff41;'>РЕЖИМ MATRIX АКТИВИРОВАН</span>")
      for (let i = 0; i < 6; i += 1) {
        pushLine(`<span style='color:#00ff41;'>${randomMatrixRow()}</span>`)
      }
      return
    }

    if (normalized === 'sudo rm -rf /') {
      pushLine('ДОСТУП ЗАПРЕЩЕН: хорошая попытка, но root сегодня не дежурит.')
      return
    }

    if (normalized === 'coffee') {
      pushLine('ВАРЮ КОФЕ... ГОТОВО. +5 К МОРАЛИ КОМАНДЫ')
      return
    }

    if (normalized === 'xyzzy') {
      pushLine('Ничего не произошло. Или пакеты стали бегать быстрее.')
      return
    }

    pushLine(
      `Команда <span style="color:#fff;">'${normalized}'</span> не найдена. Введите help.`,
    )
  }

  const onInputEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      void runCommand(inputValue)
      setInputValue('')
    }
  }

  return (
    <div className="bm-auth-page fx-frame relative min-h-screen overflow-hidden bg-[#0a0a0a]">
      <ThemeToggle className="bm-theme-toggle-auth" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[length:100%_3px,3px_100%] motion-safe:animate-flicker"
      />

      <div className="mx-auto max-w-6xl p-4 pt-8 lg:p-6">
        <section
          ref={terminalRef}
          className="mono fx-flicker relative z-20 h-[86vh] overflow-y-auto border border-red-800/90 bg-[#0a0a0a] p-4 text-sm text-[#ff3131] shadow-[0_0_8px_rgba(255,49,49,0.45)] md:text-base"
          onClick={() => {
            const input = document.getElementById('term-input')
            input?.focus()
          }}
        >
          <div className="mb-4 border border-red-700/80 bg-black/90 p-3">
            <p className="text-xs text-red-400">[ AUTH GATE ]</p>
            <p className="mt-1 text-xs text-zinc-300">
              Для входа используются логин и пароль общей системы Moodle.
            </p>
          </div>

          {screenVisible ? (
            <div className="mb-4 border border-zinc-700 bg-black/85 p-3">
              <p className="text-xs text-red-400">[ LOGIN SCREEN ]</p>
              <p className="mt-2 text-xs text-zinc-300">
                STEP:{' '}
                <span className="text-white">
                  {loginStep === 'username'
                    ? 'ENTER_LOGIN'
                    : loginStep === 'password'
                      ? 'ENTER_PASSWORD'
                      : loginStep === 'ready'
                        ? 'READY_FOR_AUTH'
                        : 'IDLE'}
                </span>
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                LOGIN:{' '}
                {loginCandidate ? (
                  <span className="text-[#00ff41]">{loginCandidate}</span>
                ) : (
                  <span className="text-zinc-500">EMPTY</span>
                )}
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                PASSWORD:{' '}
                {passCandidate ? (
                  <span className="text-[#00ff41]">********</span>
                ) : (
                  <span className="text-zinc-500">EMPTY</span>
                )}
              </p>
            </div>
          ) : null}

          {lines.map((line) => (
            <p
              key={line.id}
              className="mb-2 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: line.html }}
            />
          ))}

          <div className="mt-2 flex flex-nowrap items-center gap-3">
            <span className="shrink-0 whitespace-nowrap font-semibold text-[#ff3131]">
              {prompt}
            </span>
            <input
              id="term-input"
              type={loginStep === 'password' ? 'password' : 'text'}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={onInputEnter}
              autoComplete="off"
              spellCheck={false}
              aria-label="Терминал ввода команд"
              className="min-w-0 w-full border-none bg-transparent text-[#ff3131] caret-[#ff3131] outline-none"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
