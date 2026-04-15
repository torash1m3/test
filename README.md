# NeoForge

NeoForge — это SPA для сборки ПК с форумом и профилями пользователей.

Сейчас в проекте уже есть:
- конструктор сборок с категориями комплектующих
- встроенная база компонентов
- проверки совместимости
- трекер статусов покупки
- Firebase Auth
- профили пользователей
- форум с лайками и комментариями
- деплой на Firebase Hosting через GitHub Actions

## Стек

- React 19
- Vite 8
- React Router 7
- Zustand
- Firebase Auth
- Firestore
- Framer Motion
- Lucide React

## Команды

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

Что делает каждая команда:
- `npm run dev` — локальная разработка
- `npm run build` — прод-сборка
- `npm run lint` — проверка кода ESLint
- `npm run preview` — локальный просмотр прод-сборки

## Структура проекта

```text
src/
  app/          # запуск приложения, роутер, защита приватных роутов
  layouts/      # общий layout сайта
  pages/        # страницы
  features/     # прикладные фичи, сейчас в основном builder
  stores/       # Zustand stores
  shared/ui/    # переиспользуемые UI-компоненты
  data/         # встроенная база компонентов
  lib/          # подключение внешних сервисов
  styles/       # глобальные стили и дизайн-токены
docs/           # заметки, roadmap и концепция
.github/        # CI/CD workflows
```

## Основные роуты

- `/` — главная
- `/auth` — вход и регистрация
- `/builder` — конструктор ПК, только для авторизованных
- `/forum` — форум
- `/profile` — профиль, только для авторизованных

## Где лежит логика

- `src/stores/authStore.js` — авторизация, профиль пользователя
- `src/stores/builderStore.js` — сборки, localStorage, синхронизация с Firestore
- `src/stores/forumStore.js` — посты, лайки, комментарии
- `src/features/builder/compatibility.js` — правила совместимости
- `src/features/builder/schemas.js` — схемы категорий и атрибутов
- `src/data/components.json` — встроенная база комплектующих

## Firebase

Проект уже привязан к Firebase:
- project id: `neoforge-38813`
- hosting config: `firebase.json`
- Firestore rules: `firestore.rules`
- Storage rules: `storage.rules`

Сейчас используются такие сущности:
- `users/{userId}` — профиль пользователя
- `users/{userId}/builds/{buildId}` — приватные сборки пользователя
- `forum/{postId}` — посты форума
- `forum/{postId}/comments/{commentId}` — комментарии
- `reports/{reportId}` — заявки на недостающие комплектующие

## Что важно знать

- `README` раньше был шаблонным от Vite, теперь это краткая карта проекта.
- `docs/concept.md` и `docs/TODO.md` полезны, но могут местами отставать от реального кода.
- Сборки сейчас приватные.
- Форум пока без полноценного редактирования постов: сейчас упор на стабильность и базовую безопасность.

## Деплой

Автодеплой настроен через GitHub Actions:
- push в `main` — деплой в live Firebase Hosting
- pull request — preview deployment

Файлы workflow:
- `.github/workflows/firebase-hosting-merge.yml`
- `.github/workflows/firebase-hosting-pull-request.yml`

## Ближайший технический фокус

Перед большим редизайном полезно держать в фокусе:
- чистый `lint`
- совпадение фронта и Firestore rules
- понятные ошибки в UI
- постепенную очистку документации и конфигов
