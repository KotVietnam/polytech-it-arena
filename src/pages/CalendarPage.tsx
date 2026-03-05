import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiCreateEventRegistration } from '../api/client'
import { UserControls } from '../components/UserControls'
import { useAuth } from '../context/AuthContext'
import { trackNames } from '../data/tracks'
import { useEvents } from '../hooks/useEvents'
import type { Level, TrackId } from '../types'
import { sortEventsByDate } from '../utils/date'

type TimelineStatus = 'completed' | 'executing' | 'pending' | 'locked'

interface TimelineItem {
  id: string
  timeLabel: string
  title: string
  description: string
  status: TimelineStatus
  track: TrackId
  level: Level
}

const primaryTitle = 'КАЛЕНДАРЬ СОБЫТИЙ'
const titleLine2Rotation = [
  'СМОТРИ ПОДРОБНОСТИ',
  'СОЗДАЙ СТРАТЕГИЮ',
  'УСПЕЙ ЗАПИСАТЬСЯ',
] as const
const homeLinkText = 'НА ГЛАВНУЮ >>'
const profileSoonLabel = 'Открыть профиль пользователя'
const registerCtaText = 'ЗАПИСАТЬСЯ'
const registerDoneText = 'ЗАПИСАНО'

const registerModalTitle = 'ЗАПИСЬ НА СОРЕВНОВАНИЕ'
const registerModalHintGuest =
  'Гостевой режим: отсканируйте QR, перейдите в Telegram-бота и отправьте данные участника.'
const registerModalHintTelegramNotLinked =
  'Для авторизованных пользователей: откройте бота, отправьте команду /auth и завершите привязку.'
const registerModalHintTelegramLinked =
  'Telegram привязан. Подтверди запись, и бот отправит уведомление автоматически.'
const guestBotInstruction =
  'В боте отправьте /start, затем одним сообщением укажите: 1. ФИО 2. Номер телефона.'
const guestOpenTelegramText = 'ПЕРЕЙТИ В TELEGRAM'
const guestRefreshQrText = 'ОБНОВИТЬ QR'
const guestQrLoadingText = 'ПОДГОТАВЛИВАЕМ QR КОД...'
const confirmRegisterText = 'ПОДТВЕРДИТЬ ЗАПИСЬ'
const confirmRegisterLoadingText = 'ОТПРАВКА...'
const openTelegramLinkText = 'ПРИВЯЗАТЬ TELEGRAM (/AUTH)'
const closeModalText = 'ЗАКРЫТЬ'

const TYPE_SPEED_MS = 46
const DELETE_SPEED_MS = 28
const HOLD_SPEED_MS = 2000
const SWITCH_DELAY_MS = 220

const dateTimeShortFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const statusLabelMap: Record<TimelineStatus, string> = {
  completed: '[ ЗАВЕРШЕНО ]',
  executing: '>> БЛИЖАЙШЕЕ',
  pending: '[ ОЖИДАЕТ ]',
  locked: '[ ЗАПЛАНИРОВАНО ]',
}

const toTimeLabel = (isoDate: string) =>
  dateTimeShortFormatter.format(new Date(isoDate)).replace(',', '')

export const CalendarPage = () => {
  const { user, isGuest, token, registerTrack, refreshMe } = useAuth()
  const { events } = useEvents()
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'hold' | 'deleting'>('typing')
  const [charCount, setCharCount] = useState(0)
  const [referenceTime] = useState(() => Date.now())
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(() => new Set())
  const [registerModalItem, setRegisterModalItem] = useState<TimelineItem | null>(null)
  const [registrationError, setRegistrationError] = useState('')
  const [registrationInfo, setRegistrationInfo] = useState('')
  const [telegramLink, setTelegramLink] = useState<string | null>(null)
  const [guestTelegramLink, setGuestTelegramLink] = useState<string | null>(null)
  const [guestQrCodeUrl, setGuestQrCodeUrl] = useState<string | null>(null)
  const [isGuestLinkLoading, setIsGuestLinkLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const sorted = sortEventsByDate(events)
    const nearestUpcomingIndex = sorted.findIndex(
      (eventItem) => new Date(eventItem.date).getTime() >= referenceTime,
    )

    const executingIndex = nearestUpcomingIndex >= 0 ? nearestUpcomingIndex : 0

    return sorted.map((eventItem, index) => {
      let status: TimelineStatus = 'locked'
      if (index < executingIndex) {
        status = 'completed'
      } else if (index === executingIndex) {
        status = 'executing'
      } else if (index === executingIndex + 1) {
        status = 'pending'
      }

      return {
        id: eventItem.id,
        timeLabel: toTimeLabel(eventItem.date),
        title: eventItem.title,
        description: `${trackNames[eventItem.track]} / ${eventItem.level} / ${eventItem.location}`,
        status,
        track: eventItem.track,
        level: eventItem.level,
      }
    })
  }, [events, referenceTime])

  const activeSubtitle = titleLine2Rotation[subtitleIndex]

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    if (phase === 'typing') {
      if (charCount < activeSubtitle.length) {
        timer = setTimeout(() => setCharCount((value) => value + 1), TYPE_SPEED_MS)
      } else {
        timer = setTimeout(() => setPhase('hold'), HOLD_SPEED_MS)
      }
    } else if (phase === 'hold') {
      timer = setTimeout(() => setPhase('deleting'), 0)
    } else if (charCount > 0) {
      timer = setTimeout(() => setCharCount((value) => value - 1), DELETE_SPEED_MS)
    } else {
      timer = setTimeout(() => {
        setSubtitleIndex((value) => (value + 1) % titleLine2Rotation.length)
        setPhase('typing')
      }, SWITCH_DELAY_MS)
    }

    return () => clearTimeout(timer)
  }, [activeSubtitle.length, charCount, phase])

  const closeRegisterModal = () => {
    setRegisterModalItem(null)
    setRegistrationError('')
    setRegistrationInfo('')
    setTelegramLink(null)
    setGuestTelegramLink(null)
    setGuestQrCodeUrl(null)
    setIsGuestLinkLoading(false)
    setIsSubmitting(false)
  }

  const requestGuestTelegramLink = async (eventId: string) => {
    setIsGuestLinkLoading(true)
    setRegistrationError('')
    setRegistrationInfo('')
    setGuestTelegramLink(null)
    setGuestQrCodeUrl(null)

    try {
      const response = await apiCreateEventRegistration(eventId)
      if (response.ok) {
        setRegistrationInfo('Запись уже была подтверждена ранее.')
        return
      }

      if (!response.guestTelegramLink) {
        throw new Error(response.error || 'Не удалось подготовить Telegram QR код.')
      }

      setGuestTelegramLink(response.guestTelegramLink)
      setGuestQrCodeUrl(response.guestQrCodeUrl ?? null)
      setRegistrationInfo('Откройте бота и отправьте данные участника.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось подготовить Telegram QR код.'
      setRegistrationError(message)
    } finally {
      setIsGuestLinkLoading(false)
    }
  }

  const handleRegisterClick = (item: TimelineItem) => {
    if (registeredEventIds.has(item.id) || item.status === 'completed') {
      return
    }

    setRegistrationError('')
    setRegistrationInfo('')
    setTelegramLink(null)
    setGuestTelegramLink(null)
    setGuestQrCodeUrl(null)
    setIsGuestLinkLoading(false)
    setIsSubmitting(false)
    setRegisterModalItem(item)
    if (isGuest) {
      void requestGuestTelegramLink(item.id)
    } else {
      void refreshMe().catch(() => undefined)
    }
  }

  const handleConfirmRegister = async () => {
    if (!registerModalItem || isSubmitting) {
      return
    }
    if (isGuest) {
      return
    }

    setIsSubmitting(true)
    setRegistrationError('')
    setRegistrationInfo('')
    setTelegramLink(null)

    try {
      if (!token) {
        throw new Error('Требуется авторизация')
      }

      const response = await apiCreateEventRegistration(registerModalItem.id, undefined, token)
      if (!response.ok) {
        if (response.telegramLink) {
          setTelegramLink(response.telegramLink)
          setRegistrationInfo(
            'Открылся Telegram бот. Нажмите Start и отправьте команду /auth, затем снова подтвердите запись.',
          )
          window.open(response.telegramLink, '_blank', 'noopener,noreferrer')
          return
        }
        throw new Error(response.error || 'Требуется привязка Telegram')
      }

      registerTrack(registerModalItem.track, registerModalItem.level)

      setRegisteredEventIds((previous) => {
        const next = new Set(previous)
        next.add(registerModalItem.id)
        return next
      })

      const notificationStatus = response.item.notification.status
      if (notificationStatus === 'sent') {
        setRegistrationInfo('Запись подтверждена. Бот отправил уведомление в Telegram.')
      } else if (notificationStatus === 'skipped') {
        setRegistrationInfo(
          'Запись подтверждена. Уведомления будут активны после настройки Telegram бота.',
        )
      } else {
        setRegistrationInfo(
          'Запись подтверждена, но сообщение в Telegram не отправлено. Попробуйте еще раз.',
        )
      }

      setTimeout(() => {
        closeRegisterModal()
      }, 1000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось подтвердить запись.'
      setRegistrationError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalHint = isGuest
    ? registerModalHintGuest
    : user?.telegramLinked
      ? registerModalHintTelegramLinked
      : registerModalHintTelegramNotLinked

  const confirmButtonText = isSubmitting
    ? confirmRegisterLoadingText
    : !isGuest && !user?.telegramLinked
      ? openTelegramLinkText
      : confirmRegisterText

  return (
    <div className="bm-tl-page">
      <div className="bm-tl-container">
        <header className="bm-tl-header">
          <UserControls
            username={user?.username}
            isGuest={isGuest}
            profileAriaLabel={profileSoonLabel}
            profileTitle={profileSoonLabel}
          />

          <div className="bm-tl-title-group">
            <h1 className="bm-h1 bm-tl-primary-title">{primaryTitle}</h1>
            <h1 className="bm-h1 bm-h1-outline">{activeSubtitle.slice(0, charCount)}</h1>
          </div>

          <Link to="/home" className="bm-header-schedule mono">
            {homeLinkText}
          </Link>

        </header>

        <section className="bm-tl-timeline" aria-label="Календарь соревнований">
          {timelineItems.map((item) => {
            const isCurrent = item.status === 'executing'
            const canRegister = item.status !== 'completed'
            const isRegistered = registeredEventIds.has(item.id)
            const rowClassName = ['bm-tl-time-row', isCurrent ? 'current' : '']
              .filter(Boolean)
              .join(' ')

            return (
              <article key={item.id} className={rowClassName}>
                <div className="bm-tl-time-cell mono">{item.timeLabel}</div>

                <div className="bm-tl-event-cell">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>

                <div className="bm-tl-status-cell mono">
                  <div className="bm-tl-status-stack">
                    <span>{statusLabelMap[item.status]}</span>
                    {canRegister ? (
                      <button
                        type="button"
                        className="bm-tl-register-btn mono"
                        onClick={() => handleRegisterClick(item)}
                        disabled={isRegistered}
                        aria-label={`${registerCtaText}: ${item.title}`}
                      >
                        {isRegistered ? registerDoneText : registerCtaText}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        {registerModalItem ? (
          <div
            className="bm-tl-modal-backdrop"
            role="presentation"
            onClick={closeRegisterModal}
          >
            <div
              className="bm-tl-modal"
              role="dialog"
              aria-modal="true"
              aria-label={registerModalTitle}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="bm-tl-modal-head">
                <p className="bm-tl-modal-title mono">{registerModalTitle}</p>
                <button
                  type="button"
                  className="bm-tl-modal-close mono"
                  onClick={closeRegisterModal}
                >
                  {closeModalText}
                </button>
              </div>

              <p className="bm-tl-modal-event">{registerModalItem.title}</p>
              <p className="bm-tl-modal-hint">{modalHint}</p>

              <div className="bm-tl-modal-content">
                <div className="bm-tl-modal-actions">
                  {isGuest ? (
                    <>
                      {isGuestLinkLoading ? (
                        <p className="bm-tl-modal-linked mono">{guestQrLoadingText}</p>
                      ) : guestQrCodeUrl ? (
                        <img
                          src={guestQrCodeUrl}
                          alt="QR код для перехода в Telegram бота"
                          className="bm-tl-modal-qr"
                        />
                      ) : (
                        <p className="bm-tl-modal-linked mono">QR код пока недоступен</p>
                      )}

                      <p className="bm-tl-modal-linked mono">{guestBotInstruction}</p>

                      {guestTelegramLink ? (
                        <a
                          href={guestTelegramLink}
                          target="_blank"
                          rel="noreferrer"
                          className="bm-tl-modal-link mono"
                        >
                          {guestOpenTelegramText}
                        </a>
                      ) : null}

                      <button
                        type="button"
                        className="bm-tl-modal-confirm mono"
                        onClick={() => {
                          if (registerModalItem) {
                            void requestGuestTelegramLink(registerModalItem.id)
                          }
                        }}
                        disabled={isGuestLinkLoading}
                      >
                        {guestRefreshQrText}
                      </button>
                    </>
                  ) : (
                    <p className="bm-tl-modal-linked mono">
                      {user?.telegramLinked
                        ? `TELEGRAM ПРИВЯЗАН: ${user.telegramUsername ? `@${user.telegramUsername.replace(/^@/, '')}` : 'CHAT ID'}`
                        : 'TELEGRAM НЕ ПРИВЯЗАН'}
                    </p>
                  )}

                  {registrationError ? (
                    <p className="bm-tl-modal-error mono">{registrationError}</p>
                  ) : null}
                  {registrationInfo ? (
                    <p className="bm-tl-modal-success mono">{registrationInfo}</p>
                  ) : null}
                  {telegramLink ? (
                    <a
                      href={telegramLink}
                      target="_blank"
                      rel="noreferrer"
                      className="bm-tl-modal-link mono"
                    >
                      ОТКРЫТЬ БОТА
                    </a>
                  ) : null}

                  {!isGuest ? (
                    <button
                      type="button"
                      className="bm-tl-modal-confirm mono"
                      onClick={() => {
                        void handleConfirmRegister()
                      }}
                      disabled={isSubmitting}
                    >
                      {confirmButtonText}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
