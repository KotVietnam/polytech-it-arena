import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  apiCreateTeam,
  apiCreateTeamInvite,
  apiGetMyTeams,
  apiRespondTeamInvite,
  apiSearchTeamInviteCandidates,
} from '../api/client'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { trackNames } from '../data/tracks'
import { useEvents } from '../hooks/useEvents'
import type {
  IncomingTeamInviteItem,
  TeamItem,
  TeamSearchUserItem,
  TrackId,
} from '../types'
import { formatDateTime, getNearestEvent, sortEventsByDate } from '../utils/date'

const homeLinkText = 'НА ГЛАВНУЮ >>'
const calendarLinkText = 'КАЛЕНДАРЬ >>'
const headerTitle = 'ТВОЙ ПРОФИЛЬ'
const subtitleRotation = ['УЧИСЬ', 'РАЗВИВАЙСЯ', 'УЧАСТВУЙ'] as const

const TYPE_SPEED_MS = 46
const DELETE_SPEED_MS = 28
const HOLD_SPEED_MS = 2000
const SWITCH_DELAY_MS = 220

const trackOrder: TrackId[] = ['cybersecurity', 'networks', 'devops', 'sysadmin']
const emptyContactValue = 'НЕ УКАЗАНО'
const teamOwnerLabel = 'КАПИТАН'
const teamMemberLabel = 'УЧАСТНИК'

const normalizeTelegramHandle = (value: string | null | undefined) => {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }

  if (/^-?\d+$/.test(trimmed)) {
    return trimmed
  }

  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}

const resolveTeamUserDisplayName = (item: {
  username: string
  fullName: string | null
  displayName: string | null
}) => item.fullName ?? item.displayName ?? item.username

export const ProfilePage = () => {
  const { user, isGuest, token } = useAuth()
  const { events } = useEvents()
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'hold' | 'deleting'>('typing')
  const [charCount, setCharCount] = useState(0)
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [incomingTeamInvites, setIncomingTeamInvites] = useState<IncomingTeamInviteItem[]>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamError, setTeamError] = useState('')
  const [teamActionInfo, setTeamActionInfo] = useState('')
  const [teamActionError, setTeamActionError] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [searchInputByTeamId, setSearchInputByTeamId] = useState<Record<string, string>>({})
  const [searchResultsByTeamId, setSearchResultsByTeamId] = useState<
    Record<string, TeamSearchUserItem[]>
  >({})
  const [searchedTeamIds, setSearchedTeamIds] = useState<Record<string, boolean>>({})
  const [searchLoadingByTeamId, setSearchLoadingByTeamId] = useState<Record<string, boolean>>({})
  const [inviteSubmittingKey, setInviteSubmittingKey] = useState<string | null>(null)
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null)
  const activeSubtitle = subtitleRotation[subtitleIndex]

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
        setSubtitleIndex((value) => (value + 1) % subtitleRotation.length)
        setPhase('typing')
      }, SWITCH_DELAY_MS)
    }

    return () => clearTimeout(timer)
  }, [activeSubtitle.length, charCount, phase])

  const loadTeamData = useCallback(
    async (silent = false) => {
      if (!token || isGuest) {
        return
      }

      if (!silent) {
        setTeamLoading(true)
      }
      setTeamError('')

      try {
        const response = await apiGetMyTeams(token)
        setTeams(response.teams)
        setIncomingTeamInvites(response.incomingInvites)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Не удалось загрузить команды.'
        setTeamError(message)
      } finally {
        if (!silent) {
          setTeamLoading(false)
        }
      }
    },
    [isGuest, token],
  )

  useEffect(() => {
    void loadTeamData()
  }, [loadTeamData])

  useEffect(() => {
    if (!teams.length) {
      if (selectedTeamId !== null) {
        setSelectedTeamId(null)
      }
      return
    }

    if (!selectedTeamId || !teams.some((item) => item.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id)
    }
  }, [selectedTeamId, teams])

  const handleCreateTeam = async () => {
    if (!token || isGuest || isCreatingTeam) {
      return
    }

    const name = newTeamName.trim()
    if (name.length < 2) {
      setTeamActionError('Название команды должно быть не короче 2 символов.')
      setTeamActionInfo('')
      return
    }

    setIsCreatingTeam(true)
    setTeamActionInfo('')
    setTeamActionError('')
    try {
      await apiCreateTeam(token, name)
      setNewTeamName('')
      setTeamActionInfo('Команда успешно создана.')
      await loadTeamData(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать команду.'
      setTeamActionError(message)
    } finally {
      setIsCreatingTeam(false)
    }
  }

  const handleSearchUsers = async (teamId: string) => {
    if (!token || isGuest) {
      return
    }

    const query = (searchInputByTeamId[teamId] ?? '').trim()
    if (query.length < 2) {
      setTeamActionError('Для поиска введите минимум 2 символа.')
      setTeamActionInfo('')
      setSearchResultsByTeamId((previous) => ({
        ...previous,
        [teamId]: [],
      }))
      return
    }

    setTeamActionError('')
    setSearchLoadingByTeamId((previous) => ({
      ...previous,
      [teamId]: true,
    }))

    try {
      const response = await apiSearchTeamInviteCandidates(token, teamId, query)
      setSearchResultsByTeamId((previous) => ({
        ...previous,
        [teamId]: response.items,
      }))
      setSearchedTeamIds((previous) => ({
        ...previous,
        [teamId]: true,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка поиска пользователей.'
      setTeamActionError(message)
    } finally {
      setSearchLoadingByTeamId((previous) => ({
        ...previous,
        [teamId]: false,
      }))
    }
  }

  const handleInviteUser = async (teamId: string, inviteeUserId: string) => {
    if (!token || isGuest) {
      return
    }

    setInviteSubmittingKey(`${teamId}:${inviteeUserId}`)
    setTeamActionInfo('')
    setTeamActionError('')

    try {
      await apiCreateTeamInvite(token, teamId, inviteeUserId)
      setTeamActionInfo('Приглашение отправлено.')
      setSearchResultsByTeamId((previous) => ({
        ...previous,
        [teamId]: (previous[teamId] ?? []).filter((item) => item.id !== inviteeUserId),
      }))
      await loadTeamData(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось отправить приглашение.'
      setTeamActionError(message)
    } finally {
      setInviteSubmittingKey(null)
    }
  }

  const handleRespondInvite = async (inviteId: string, action: 'ACCEPT' | 'DECLINE') => {
    if (!token || isGuest) {
      return
    }

    setRespondingInviteId(inviteId)
    setTeamActionInfo('')
    setTeamActionError('')

    try {
      await apiRespondTeamInvite(token, inviteId, action)
      setTeamActionInfo(
        action === 'ACCEPT' ? 'Приглашение принято.' : 'Приглашение отклонено.',
      )
      await loadTeamData(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось обработать приглашение.'
      setTeamActionError(message)
    } finally {
      setRespondingInviteId(null)
    }
  }

  const profileUser = user ?? {
    username: 'GUEST',
    firstName: null,
    lastName: null,
    displayName: null,
    email: null,
    phoneNumber: null,
    telegramContact: null,
    telegramLinked: false,
    telegramUsername: null,
    totalPoints: 0,
    registrations: [],
    pointHistory: [],
    id: 'guest',
    role: 'USER' as const,
  }

  const avatarLetter = profileUser.username.trim().charAt(0).toUpperCase() || '?'
  const lastRegistration = profileUser.registrations[0] ?? null
  const nearestEvent = getNearestEvent(sortEventsByDate(events))
  const fullName =
    [profileUser.firstName, profileUser.lastName].filter(Boolean).join(' ').trim() ||
    profileUser.displayName ||
    profileUser.username
  const keycloakTelegram = normalizeTelegramHandle(profileUser.telegramContact)
  const linkedTelegram = normalizeTelegramHandle(profileUser.telegramUsername)
  const profileTelegram = keycloakTelegram ?? linkedTelegram ?? emptyContactValue
  const profilePhone = profileUser.phoneNumber?.trim() || emptyContactValue
  const profileEmail = profileUser.email?.trim() || emptyContactValue

  const averagePoints = profileUser.registrations.length
    ? Math.round(profileUser.totalPoints / profileUser.registrations.length)
    : 0
  const activeTeam = teams.find((item) => item.id === selectedTeamId) ?? teams[0] ?? null
  const activeTeamSearchQuery = activeTeam ? searchInputByTeamId[activeTeam.id] ?? '' : ''
  const activeTeamSearchResults = activeTeam ? searchResultsByTeamId[activeTeam.id] ?? [] : []
  const isActiveTeamSearchLoading = activeTeam ? Boolean(searchLoadingByTeamId[activeTeam.id]) : false
  const wasActiveTeamSearched = activeTeam ? Boolean(searchedTeamIds[activeTeam.id]) : false
  const summaryCards = [
    {
      label: 'ИМЯ И ФАМИЛИЯ',
      value: fullName,
      meta: `USER: ${profileUser.username}`,
      isBig: false,
    },
    {
      label: 'EMAIL',
      value: profileEmail,
      meta: profileEmail === emptyContactValue ? 'Контакт не заполнен' : 'Основной канал связи',
      isBig: false,
    },
    {
      label: 'ТЕЛЕФОН',
      value: profilePhone,
      meta: profilePhone === emptyContactValue ? 'Контакт не заполнен' : 'Для связи с организатором',
      isBig: false,
    },
    {
      label: 'TELEGRAM',
      value: profileTelegram,
      meta: profileTelegram === emptyContactValue ? 'Бот не привязан' : 'Аккаунт для уведомлений',
      isBig: false,
    },
    {
      label: 'ОБЩИЕ БАЛЛЫ',
      value: String(profileUser.totalPoints),
      meta: `Средний балл за активность: ${averagePoints}`,
      isBig: true,
    },
    {
      label: 'РЕГИСТРАЦИИ',
      value: String(profileUser.registrations.length),
      meta: nearestEvent
        ? `Ближайшее событие: ${trackNames[nearestEvent.track]} / ${formatDateTime(nearestEvent.date)}`
        : 'Новые события пока не опубликованы',
      isBig: true,
    },
    {
      label: 'ПОСЛЕДНИЙ ТРЕК',
      value: lastRegistration ? trackNames[lastRegistration.trackId].toUpperCase() : 'НЕТ ДАННЫХ',
      meta: lastRegistration ? formatDateTime(lastRegistration.date) : 'Нет завершенных регистраций',
      isBig: false,
    },
  ] as const

  const trackStats = trackOrder.map((trackId) => {
    const entries = profileUser.registrations.filter((item) => item.trackId === trackId)
    return {
      trackId,
      name: trackNames[trackId],
      count: entries.length,
      latestEntry: entries[0] ?? null,
    }
  })

  if (isGuest) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="bm-profile-page">
      <div className="bm-profile-wrapper">
        <header className="bm-profile-header">
          <div className="bm-user-controls">
            <div className="bm-user-chip mono" aria-label="Current user">
              <div className="bm-avatar" aria-hidden="true">
                {avatarLetter}
              </div>
              <div className="bm-user-text">USER: {profileUser.username}</div>
            </div>
            <ThemeToggle className="bm-theme-toggle-inline" />
          </div>

          <div className="bm-title-stack bm-profile-title-stack">
            <h1 className="bm-h1 bm-h1-no-wrap">{headerTitle}</h1>
            <h1 className="bm-h1 bm-h1-outline">{activeSubtitle.slice(0, charCount)}</h1>
            <p className="bm-profile-subtitle">
              Личная статистика по регистрации в компетенциях, набору очков и
              последней активности в рамках клуба.
            </p>
          </div>

          <div className="bm-profile-header-links">
            <Link to="/home" className="bm-track-header-link mono">
              {homeLinkText}
            </Link>
            <Link to="/calendar" className="bm-track-header-link mono">
              {calendarLinkText}
            </Link>
          </div>

        </header>

        <section className="bm-profile-ref-section">
          <p className="bm-profile-ref-section-title mono">PROFILE // SNAPSHOT</p>
          <div className="bm-profile-ref-stats-grid">
            {summaryCards.map((card) => (
              <article key={card.label} className="bm-profile-ref-card">
                <p className="bm-profile-ref-card-label mono">{card.label}</p>
                <p
                  className={`bm-profile-ref-card-value ${
                    card.isBig ? 'bm-profile-ref-card-value-big' : ''
                  }`}
                >
                  {card.value}
                </p>
                <p className="bm-profile-ref-card-meta">{card.meta}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bm-profile-ref-section">
          <p className="bm-profile-ref-section-title mono">TEAM // CONTROL</p>
          <div className="bm-profile-ref-team-layout">
            <article className="bm-profile-ref-team-panel bm-profile-ref-team-summary">
              {activeTeam ? (
                <>
                  <h2 className="bm-profile-ref-team-name">{activeTeam.name}</h2>
                  <div className="bm-profile-ref-team-role mono">
                    {activeTeam.isOwner ? teamOwnerLabel : teamMemberLabel}
                  </div>
                  <p className="bm-profile-ref-team-stat">
                    Участников в активной команде: {activeTeam.members.length}
                  </p>
                  <p className="bm-profile-ref-team-stat">
                    Ожидающих приглашений: {activeTeam.pendingInvites.length}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="bm-profile-ref-team-name">НЕТ КОМАНДЫ</h2>
                  <p className="bm-profile-ref-team-stat">
                    Создай команду справа и начни собирать состав.
                  </p>
                </>
              )}

              <div className="bm-profile-ref-team-selector-list">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    className={`bm-profile-ref-team-selector mono ${
                      team.id === activeTeam?.id ? 'bm-profile-ref-team-selector-active' : ''
                    }`}
                    onClick={() => {
                      setSelectedTeamId(team.id)
                    }}
                  >
                    {team.name}
                  </button>
                ))}
              </div>

              {nearestEvent ? (
                <p className="bm-profile-ref-next-event mono">
                  {`NEXT: ${trackNames[nearestEvent.track].toUpperCase()} / ${formatDateTime(nearestEvent.date)}`}
                </p>
              ) : null}
            </article>

            <article className="bm-profile-ref-team-panel bm-profile-ref-team-members">
              <p className="bm-profile-ref-action-title mono">СОСТАВ КОМАНДЫ</p>
              {activeTeam ? (
                <div className="bm-profile-ref-member-list">
                  {activeTeam.members.map((member) => (
                    <article key={`${activeTeam.id}:${member.userId}`} className="bm-profile-ref-member">
                      <div className="bm-profile-ref-member-avatar" aria-hidden="true">
                        {resolveTeamUserDisplayName(member).trim().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="bm-profile-ref-member-name">
                          {resolveTeamUserDisplayName(member)}
                        </div>
                        <div className="bm-profile-ref-member-username">
                          @{member.username}
                        </div>
                      </div>
                      <div className="bm-profile-ref-member-role mono">
                        {member.role === 'OWNER' ? 'КАПИТАН' : 'УЧАСТНИК'}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="bm-profile-ref-empty">
                  Команда еще не выбрана. Создай новую или переключись на уже существующую.
                </p>
              )}
            </article>

            <div className="bm-profile-ref-team-actions">
              <article className="bm-profile-ref-action-card">
                <p className="bm-profile-ref-action-title mono">СОЗДАТЬ КОМАНДУ</p>
                <div className="bm-profile-ref-search-row">
                  <input
                    className="bm-profile-ref-input"
                    type="text"
                    value={newTeamName}
                    onChange={(event) => setNewTeamName(event.target.value)}
                    placeholder="Название новой команды"
                    maxLength={64}
                  />
                </div>
                <button
                  type="button"
                  className="bm-profile-ref-btn mono"
                  onClick={() => {
                    void handleCreateTeam()
                  }}
                  disabled={isCreatingTeam}
                >
                  {isCreatingTeam ? 'СОЗДАЁМ...' : 'СОЗДАТЬ'}
                </button>
              </article>

              <article className="bm-profile-ref-action-card">
                <p className="bm-profile-ref-action-title mono">ПРИГЛАСИТЬ ИГРОКА</p>
                {activeTeam?.isOwner ? (
                  <>
                    <div className="bm-profile-ref-search-row">
                      <input
                        className="bm-profile-ref-input"
                        type="text"
                        value={activeTeamSearchQuery}
                        onChange={(event) =>
                          setSearchInputByTeamId((previous) => ({
                            ...previous,
                            [activeTeam.id]: event.target.value,
                          }))
                        }
                        placeholder="Поиск по логину, имени или фамилии"
                      />
                      <button
                        type="button"
                        className="bm-profile-ref-btn mono"
                        onClick={() => {
                          void handleSearchUsers(activeTeam.id)
                        }}
                        disabled={isActiveTeamSearchLoading}
                      >
                        {isActiveTeamSearchLoading ? 'ИЩЕМ...' : 'НАЙТИ'}
                      </button>
                    </div>

                    {activeTeamSearchResults.length ? (
                      <div className="bm-profile-ref-search-list">
                        {activeTeamSearchResults.map((candidate) => (
                          <article
                            key={`${activeTeam.id}:${candidate.id}`}
                            className="bm-profile-ref-search-item"
                          >
                            <div>
                              <div className="bm-profile-ref-member-name">
                                {resolveTeamUserDisplayName(candidate)}
                              </div>
                              <div className="bm-profile-ref-member-username">
                                @{candidate.username}
                                {candidate.email ? ` / ${candidate.email}` : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="bm-profile-ref-btn mono"
                              onClick={() => {
                                void handleInviteUser(activeTeam.id, candidate.id)
                              }}
                              disabled={inviteSubmittingKey === `${activeTeam.id}:${candidate.id}`}
                            >
                              {inviteSubmittingKey === `${activeTeam.id}:${candidate.id}`
                                ? 'ОТПРАВКА...'
                                : 'INVITE'}
                            </button>
                          </article>
                        ))}
                      </div>
                    ) : null}

                    {wasActiveTeamSearched &&
                    !isActiveTeamSearchLoading &&
                    activeTeamSearchResults.length === 0 ? (
                      <p className="bm-profile-ref-empty">
                        Подходящих пользователей не найдено или они уже в составе.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="bm-profile-ref-empty">
                    Приглашать пользователей может только капитан активной команды.
                  </p>
                )}
              </article>

              <article className="bm-profile-ref-action-card">
                <p className="bm-profile-ref-action-title mono">ВХОДЯЩИЕ ПРИГЛАШЕНИЯ</p>
                {incomingTeamInvites.length ? (
                  <div className="bm-profile-ref-search-list">
                    {incomingTeamInvites.map((invite) => (
                      <article key={invite.id} className="bm-profile-ref-search-item">
                        <div>
                          <div className="bm-profile-ref-member-name">{invite.teamName}</div>
                          <div className="bm-profile-ref-member-username">
                            Пригласил: {invite.inviterFullName ?? invite.inviterDisplayName ?? invite.inviterUsername}
                          </div>
                        </div>
                        <div className="bm-profile-ref-inline-actions">
                          <button
                            type="button"
                            className="bm-profile-ref-btn mono"
                            onClick={() => {
                              void handleRespondInvite(invite.id, 'ACCEPT')
                            }}
                            disabled={respondingInviteId === invite.id}
                          >
                            ACCEPT
                          </button>
                          <button
                            type="button"
                            className="bm-profile-ref-btn bm-profile-ref-btn-danger mono"
                            onClick={() => {
                              void handleRespondInvite(invite.id, 'DECLINE')
                            }}
                            disabled={respondingInviteId === invite.id}
                          >
                            DECLINE
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="bm-profile-ref-empty">Новых приглашений нет.</p>
                )}
              </article>

              {teamActionInfo ? (
                <p className="bm-profile-ref-feedback bm-profile-ref-feedback-success">
                  {teamActionInfo}
                </p>
              ) : null}
              {teamActionError ? (
                <p className="bm-profile-ref-feedback bm-profile-ref-feedback-error">
                  {teamActionError}
                </p>
              ) : null}
              {teamError ? (
                <p className="bm-profile-ref-feedback bm-profile-ref-feedback-error">
                  Не удалось загрузить команды: {teamError}
                </p>
              ) : null}
              {teamLoading ? (
                <p className="bm-profile-ref-empty">Загрузка команд...</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="bm-profile-ref-section">
          <p className="bm-profile-ref-section-title mono">TRACK // MATRIX</p>
          <div className="bm-profile-ref-competency-grid">
            {trackStats.map((trackStat) => (
              <article key={trackStat.trackId} className="bm-profile-ref-competency-card">
                <p className="bm-profile-ref-card-label mono">{trackStat.name}</p>
                <p className="bm-profile-ref-card-value bm-profile-ref-card-value-big">
                  {trackStat.count}
                </p>
                <p className="bm-profile-ref-card-meta">
                  {trackStat.latestEntry
                    ? `Последний вход: ${formatDateTime(trackStat.latestEntry.date)} / ${trackStat.latestEntry.level}`
                    : 'Пока нет регистраций в этом треке'}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bm-profile-ref-section bm-profile-ref-section-last">
          <p className="bm-profile-ref-section-title mono">ACTIVITY // LOG</p>
          <div className="bm-profile-ref-activity-grid">
            <article className="bm-profile-ref-activity-panel">
              <p className="bm-profile-ref-action-title mono">ПОСЛЕДНИЕ РЕГИСТРАЦИИ</p>
              {profileUser.registrations.length ? (
                <div className="bm-profile-ref-activity-list">
                  {profileUser.registrations.slice(0, 8).map((entry) => (
                    <article key={entry.id} className="bm-profile-ref-activity-row">
                      <div>
                        <div className="bm-profile-ref-member-name">
                          {trackNames[entry.trackId].toUpperCase()} / {entry.level.toUpperCase()}
                        </div>
                        <div className="bm-profile-ref-member-username">
                          {formatDateTime(entry.date)}
                        </div>
                      </div>
                      <div className="bm-profile-ref-member-role mono">+{entry.points} PTS</div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="bm-profile-ref-empty">
                  Пока нет регистраций. Открой календарь и запишись на ближайшее соревнование.
                </p>
              )}
            </article>

            <article className="bm-profile-ref-activity-panel">
              <p className="bm-profile-ref-action-title mono">ИСТОРИЯ НАЧИСЛЕНИЙ</p>
              {profileUser.pointHistory.length ? (
                <div className="bm-profile-ref-activity-list">
                  {profileUser.pointHistory.slice(0, 8).map((entry) => (
                    <article key={entry.id} className="bm-profile-ref-activity-row">
                      <div>
                        <div className="bm-profile-ref-member-name">{entry.reason.toUpperCase()}</div>
                        <div className="bm-profile-ref-member-username">
                          {formatDateTime(entry.date)}
                          {entry.eventTitle ? ` / ${entry.eventTitle}` : ''}
                        </div>
                      </div>
                      <div className="bm-profile-ref-member-role mono">
                        {entry.points > 0 ? '+' : ''}
                        {entry.points} PTS
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="bm-profile-ref-empty">Начислений пока нет.</p>
              )}
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}
