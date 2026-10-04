# 🔄 Watcher File

Утилита на Node.js для автосинхронизации папки с GitHub. Следит за изменениями файлов, сама коммитит и пушит их в репозиторий, а периодически подтягивает изменения с удалённой стороны.

Сделал её для синхронизации заметок **Obsidian** между устройствами без платного Obsidian Sync. Подходит и для автоматического бэкапа любой папки в Git.

## Возможности

- Отслеживание изменений файлов в реальном времени через `chokidar`
- Автоматический `add → commit → push` с датой и временем в сообщении коммита
- Изменения копятся 5 минут, поэтому серия правок уходит одним коммитом, а не десятком
- Проверка удалённого репозитория каждые 30 минут, `pull`, если локальная копия отстаёт
- Авторизация через GitHub Personal Access Token
- Запуск в Docker одной командой

## Как работает

1. Наблюдатель замечает изменение и запускает таймер на 5 минут.
2. По истечении таймера выполняется `git add .`, коммит с сообщением вида `Автоматический коммит: 04.10.2026 22:50:00` и `git push`.
3. Параллельно каждые 30 минут выполняется `git fetch`, и если в удалённом репозитории есть новые коммиты, выполняется `git pull`.

Задержки настраиваются в `file_watcher_interval.js` (`delayPush` и интервал в `startRemoteCheckInterval`).

## Стек

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

Node.js, chokidar, simple-git, Docker

## Запуск

Отслеживаемая папка должна быть Git-репозиторием с настроенным `origin` и веткой `main`.

### Переменные окружения

| Переменная | Описание |
| --- | --- |
| `WORK_DIRECTORY` | Путь к отслеживаемой папке |
| `GIT_TOKEN` | GitHub Personal Access Token с доступом к репозиторию |
| `GIT_REPO` | Адрес репозитория без протокола, например `github.com/username/notes.git` |

### Локально

```bash
git clone https://github.com/donuwave/watcher-file-js.git
cd watcher-file-js
npm install

WORK_DIRECTORY="/путь/к/папке" \
GIT_TOKEN="ваш_токен" \
GIT_REPO="github.com/username/notes.git" \
node file_watcher_interval.js
```

### Docker

```bash
docker build -t file-watcher .

docker run -d --name file-watcher \
  -e WORK_DIRECTORY=/app/watchdir \
  -e GIT_TOKEN="ваш_токен" \
  -e GIT_REPO="github.com/username/notes.git" \
  -v "/путь/к/папке":/app/watchdir \
  file-watcher
```

Логи: `docker logs -f file-watcher`
Остановка: `docker stop file-watcher && docker rm file-watcher`
