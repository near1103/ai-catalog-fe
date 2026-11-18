# AI Catalog Frontend

Веб-интерфейс каталога товаров. Посетители просматривают товары и категории. Администраторы добавляют товары, загружают фотографии и выбирают категории вручную или с помощью ИИ-подсказок.

Интерфейс работает на Next.js, получает данные из Spring Boot API и использует Firebase Authentication для входа в админку.

## Локальный запуск

1. Установите зависимости командой `npm ci`.
2. Запустите Spring Boot API. По умолчанию фронтенд ожидает его по адресу `http://localhost:8080`. В настройках бэкенда разрешите запросы с фронтенда через `APP_CORS_ALLOWED_ORIGINS=http://localhost:3000`.
3. Скопируйте `.env.local.example` в `.env.local`. Если у вас уже есть настроенный `.env`, используйте его. Укажите адрес API в `NEXT_PUBLIC_API_URL`, если он отличается от значения по умолчанию.
4. Выполните `npm run dev` и откройте [каталог](http://localhost:3000/catalog).

## Вход в админку

1. В настройках проекта Firebase откройте конфигурацию веб-приложения. Перенесите `apiKey`, `authDomain`, `projectId` и `appId` в соответствующие переменные `NEXT_PUBLIC_FIREBASE_*`.
2. В Firebase Authentication включите вход по Email/Password или через Google. Для входа через Google добавьте `localhost` в список разрешённых доменов, если его там нет.
3. Выдайте пользователю право `admin: true` через `AdminClaimsCommand` по инструкции в README бэкенда.
4. Перезапустите фронтенд после изменения настроек и войдите через [страницу админки](http://localhost:3000/admin/login).

## Проверки

```sh
npm run format:check
node --test tests/*.test.mjs
npm run build
```
