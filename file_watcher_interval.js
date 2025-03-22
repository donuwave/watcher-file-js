const chokidar = require('chokidar');
const simpleGit = require('simple-git');
const path = require('path');

const WORK_DIRECTORY = process.env.WORK_DIRECTORY;
const GIT_TOKEN = process.env.GIT_TOKEN; // Добавляем переменную для токена
const GIT_REPO = process.env.GIT_REPO; // URL репозитория без токена

console.log(`Отслеживаемая директория: ${WORK_DIRECTORY}`);

if (!WORK_DIRECTORY) {
    console.error('Пожалуйста, укажите путь к файловой структуре.');
    process.exit(1);
}

const git = simpleGit(WORK_DIRECTORY);

const delayPush = 300000;
const delayPull = 1800000;
let timer = null;
let changesDetected = false;
let watcher = null;

// Получаем текущее время для сообщения коммита
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU');
    return `Автоматический коммит: ${date} ${time}`;
}

// Последовательное выполнение Git-команд с помощью `simple-git`
async function execGitCommands(commitMessage) {
    try {
        console.log(`Выполняем Git-команды в ${new Date().toLocaleString()}...`);

        const remoteWithToken = `https://${GIT_TOKEN}@${GIT_REPO}`;
        await git.remote(['set-url', 'origin', remoteWithToken]);

        await git.add('.');

        await git.commit(commitMessage);

        await git.push('origin', 'main');

        console.log('Команды Git успешно выполнены.');
        startWatcher();
    } catch (err) {
        console.error('Ошибка при выполнении Git-команд:', err);
        startWatcher();
    }
}

// Функция для проверки удалённых изменений
async function checkForRemoteChanges() {
    try {
        // 1. Выполняем git fetch для получения изменений из удалённого репозитория
        await git.fetch();
        // 2. Проверяем статус локального и удалённого репозитория
        const status = await git.status();
        // 3. Если есть изменения, требующие pull, запускаем git pull
        if (status.behind > 0) {
            console.log(`Локальный репозиторий отстаёт от удалённого на ${status.behind} коммитов. Выполняем pull...`);
            await git.pull('origin', 'main');
            console.log('Изменения из удалённого репозитория успешно подтянуты.');
        } else {
            console.log('Локальный репозиторий актуален.');
        }
    } catch (err) {
        console.error('Ошибка при проверке удалённых изменений:', err);
    }
}

// Функция для старта наблюдателя
function startWatcher() {
    if (watcher) {
        watcher.close();
    }

    watcher = chokidar.watch(WORK_DIRECTORY, {
        ignored: /(^|[\/\\])\..|.*\.git.*/,
        persistent: true,
        ignoreInitial: true,
        usePolling: true,
        interval: 1000,
        binaryInterval: 3000,
    });

    watcher.on('all', (event, path) => {
        console.log(`Изменение обнаружено: ${event} на ${path}`);
        changesDetected = true;
        watcher.close();

        if (!timer) {
            timer = setTimeout(() => {
                if (changesDetected) {
                    execGitCommands(getCurrentDateTime());
                    changesDetected = false;
                    timer = null;
                }
            }, delayPush);
        }
    });

    console.log('Наблюдатель запущен...');
}

// Запуск регулярной проверки удалённых изменений
function startRemoteCheckInterval(interval = 1800000) { // Проверяем каждые 60 секунд
    setInterval(() => {
        checkForRemoteChanges();
    }, interval);
}

startRemoteCheckInterval(1800000);
startWatcher();
