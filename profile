<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Profile Info Panel Mockup</title>
  <style>
    :root {
      --bg: #050505;
      --panel: #0a0a0a;
      --panel-2: #0d0d0d;
      --line: rgba(255, 60, 60, 0.24);
      --line-strong: rgba(255, 60, 60, 0.58);
      --text: #f3f3f3;
      --muted: #9a9a9a;
      --soft: #6e6e6e;
      --accent: #ff3b30;
      --accent-soft: rgba(255, 59, 48, 0.12);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background:
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
        var(--bg);
      background-size: 32px 32px, 32px 32px, auto;
      color: var(--text);
    }

    .page {
      max-width: 1720px;
      margin: 0 auto;
      padding: 32px 18px 60px;
    }

    .section {
      margin-top: 28px;
      border-top: 1px solid var(--line);
      padding-top: 14px;
    }

    .section-title {
      margin: 0 0 14px;
      font-size: 11px;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 14px;
    }

    .card {
      position: relative;
      background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0));
      border: 1px solid var(--line);
      min-height: 110px;
      padding: 16px 18px 18px;
      transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
    }

    .card:hover {
      border-color: var(--line-strong);
      background: linear-gradient(180deg, rgba(255,59,48,0.04), rgba(255,255,255,0));
      transform: translateY(-1px);
    }

    .card-label {
      font-size: 10px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 14px;
    }

    .card-value {
      font-size: 18px;
      font-weight: 700;
      line-height: 1.2;
      color: var(--text);
    }

    .card-value.big {
      font-size: 42px;
      letter-spacing: 0.02em;
    }

    .card-meta {
      margin-top: 8px;
      font-size: 12px;
      color: var(--soft);
    }

    .team-layout {
      display: grid;
      grid-template-columns: 280px 1.2fr 420px;
      gap: 14px;
    }

    .team-panel,
    .activity-panel,
    .competency-card,
    .action-card {
      background: var(--panel);
      border: 1px solid var(--line);
    }

    .team-summary {
      padding: 18px;
    }

    .team-name {
      font-size: 28px;
      font-weight: 800;
      margin: 0 0 10px;
      text-transform: uppercase;
    }

    .team-role {
      display: inline-block;
      padding: 5px 10px;
      border: 1px solid var(--line-strong);
      color: var(--accent);
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .team-stat {
      margin-top: 12px;
      color: var(--muted);
      font-size: 13px;
    }

    .team-members {
      padding: 18px;
    }

    .member-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .member {
      display: grid;
      grid-template-columns: 42px 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid rgba(255,255,255,0.06);
      background: var(--panel-2);
    }

    .member-avatar {
      width: 42px;
      height: 42px;
      border: 1px solid var(--line);
      display: grid;
      place-items: center;
      color: var(--accent);
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      background: rgba(255, 59, 48, 0.05);
    }

    .member-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 2px;
    }

    .member-username {
      font-size: 12px;
      color: var(--muted);
    }

    .member-role {
      font-size: 11px;
      color: var(--soft);
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }

    .team-actions {
      display: grid;
      gap: 14px;
    }

    .action-card {
      padding: 18px;
    }

    .action-title {
      margin: 0 0 12px;
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .btn {
      width: 100%;
      border: 1px solid var(--line-strong);
      background: transparent;
      color: var(--text);
      padding: 12px 14px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .btn:hover {
      background: var(--accent-soft);
      border-color: var(--accent);
    }

    .search-row {
      display: flex;
      gap: 10px;
    }

    .search-row input {
      flex: 1;
      background: #060606;
      border: 1px solid rgba(255,255,255,0.08);
      color: var(--text);
      padding: 12px 14px;
      outline: none;
    }

    .search-row input:focus {
      border-color: var(--accent);
    }

    .competency-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }

    .competency-card {
      padding: 18px;
      min-height: 170px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .competency-name {
      font-size: 16px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 0 0 14px;
    }

    .competency-status {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 12px;
    }

    .competency-points {
      font-size: 28px;
      font-weight: 800;
    }

    .status-line {
      height: 2px;
      width: 100%;
      margin-top: 18px;
      background: rgba(255,255,255,0.07);
      position: relative;
      overflow: hidden;
    }

    .status-line::after {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 28%;
      background: var(--accent);
    }

    .activity-panel {
      padding: 18px;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .activity-item {
      display: grid;
      grid-template-columns: 1.6fr 180px 120px;
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
      background: var(--panel-2);
      border: 1px solid rgba(255,255,255,0.06);
    }

    .activity-name {
      font-size: 14px;
      font-weight: 700;
    }

    .activity-time {
      font-size: 12px;
      color: var(--muted);
      text-align: left;
    }

    .activity-points {
      text-align: right;
      font-size: 13px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    @media (max-width: 1400px) {
      .stats-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .team-layout {
        grid-template-columns: 1fr;
      }

      .competency-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 860px) {
      .stats-grid,
      .competency-grid {
        grid-template-columns: 1fr;
      }

      .activity-item {
        grid-template-columns: 1fr;
      }

      .activity-points {
        text-align: left;
      }

      .search-row {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <!-- HEADER НЕ ТРОГАЕМ, ЭТО ТОЛЬКО MOCK НИЖНЕЙ ИНФО-ПАНЕЛИ -->

    <section class="section">
      <h2 class="section-title">Профиль // Статистика</h2>

      <div class="stats-grid">
        <article class="card">
          <div class="card-label">Имя</div>
          <div class="card-value">Борислав Кравченко</div>
          <div class="card-meta">Личный профиль участника</div>
        </article>

        <article class="card">
          <div class="card-label">Email</div>
          <div class="card-value">kotvietnam@mail.ru</div>
          <div class="card-meta">Основной контакт</div>
        </article>

        <article class="card">
          <div class="card-label">Telegram</div>
          <div class="card-value">@KotVietnam</div>
          <div class="card-meta">Для уведомлений</div>
        </article>

        <article class="card">
          <div class="card-label">Общие баллы</div>
          <div class="card-value big">35</div>
          <div class="card-meta">Суммарно по активности</div>
        </article>

        <article class="card">
          <div class="card-label">Средний балл</div>
          <div class="card-value big">0</div>
          <div class="card-meta">По соревнованиям</div>
        </article>

        <article class="card">
          <div class="card-label">Регистрации</div>
          <div class="card-value big">0</div>
          <div class="card-meta">Активных записей нет</div>
        </article>

        <article class="card">
          <div class="card-label">Последний трек</div>
          <div class="card-value">Нет данных</div>
          <div class="card-meta">Последняя активность не определена</div>
        </article>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Моя команда</h2>

      <div class="team-layout">
        <div class="team-panel team-summary">
          <h3 class="team-name">Хуесосы</h3>
          <div class="team-role">Капитан</div>
          <div class="team-stat">Участников: 1</div>
          <div class="team-stat">Статус: активна</div>
          <div class="team-stat">Последнее изменение: 06 марта</div>
        </div>

        <div class="team-panel team-members">
          <div class="card-label">Состав команды</div>

          <div class="member-list">
            <div class="member">
              <div class="member-avatar">БК</div>
              <div>
                <div class="member-name">Борислав Кравченко</div>
                <div class="member-username">@kotvietnam</div>
              </div>
              <div class="member-role">Капитан</div>
            </div>

            <div class="member">
              <div class="member-avatar">--</div>
              <div>
                <div class="member-name">Свободное место</div>
                <div class="member-username">Ожидается участник</div>
              </div>
              <div class="member-role">Пусто</div>
            </div>

            <div class="member">
              <div class="member-avatar">--</div>
              <div>
                <div class="member-name">Свободное место</div>
                <div class="member-username">Ожидается участник</div>
              </div>
              <div class="member-role">Пусто</div>
            </div>
          </div>
        </div>

        <div class="team-actions">
          <div class="action-card">
            <h3 class="action-title">Управление</h3>
            <button class="btn">Создать команду</button>
          </div>

          <div class="action-card">
            <h3 class="action-title">Пригласить в команду</h3>
            <div class="search-row">
              <input type="text" placeholder="Поиск по логину, имени или фамилии" />
              <button class="btn" style="width:auto;">Найти</button>
            </div>
          </div>

          <div class="action-card">
            <h3 class="action-title">Входящие приглашения</h3>
            <div class="card-meta">Новых приглашений нет.</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Сводка по компетенциям</h2>

      <div class="competency-grid">
        <article class="competency-card">
          <div>
            <h3 class="competency-name">Cybersecurity</h3>
            <div class="competency-status">Пока нет регистрации</div>
          </div>
          <div>
            <div class="competency-points">0 PTS</div>
            <div class="status-line"></div>
          </div>
        </article>

        <article class="competency-card">
          <div>
            <h3 class="competency-name">Networks</h3>
            <div class="competency-status">Пока нет регистрации</div>
          </div>
          <div>
            <div class="competency-points">0 PTS</div>
            <div class="status-line"></div>
          </div>
        </article>

        <article class="competency-card">
          <div>
            <h3 class="competency-name">DevOps</h3>
            <div class="competency-status">Пока нет регистрации</div>
          </div>
          <div>
            <div class="competency-points">0 PTS</div>
            <div class="status-line"></div>
          </div>
        </article>

        <article class="competency-card">
          <div>
            <h3 class="competency-name">SysAdmin</h3>
            <div class="competency-status">Пока нет регистрации</div>
          </div>
          <div>
            <div class="competency-points">0 PTS</div>
            <div class="status-line"></div>
          </div>
        </article>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">История активности</h2>

      <div class="activity-panel">
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-name">Ежедневный вход в систему</div>
            <div class="activity-time">07 марта в 07:24</div>
            <div class="activity-points">+5 PTS</div>
          </div>

          <div class="activity-item">
            <div class="activity-name">Подтверждена запись на соревнование</div>
            <div class="activity-time">06 марта в 03:32</div>
            <div class="activity-points">+25 PTS</div>
          </div>

          <div class="activity-item">
            <div class="activity-name">Ежедневный вход в систему</div>
            <div class="activity-time">06 марта в 00:00</div>
            <div class="activity-points">+5 PTS</div>
          </div>
        </div>
      </div>
    </section>
  </main>
</body>
</html>