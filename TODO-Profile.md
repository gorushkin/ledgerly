# TODO: Profile Route Analysis

## Анализ компонентов профиля

### 1. Роут (/api/profile)
**Файл:** `apps/backend/src/presentation/routes/profile.routes.ts`

#### Текущая реализация:
- [x] GET `/profile` - получение профиля пользователя
- [x] PUT `/profile` - обновление профиля
- [x] DELETE `/profile` - удаление профиля

### 2. Контроллер
**Файл:** `apps/backend/src/presentation/controllers/user.controller.ts`

#### Методы:
- [x] `getById(id: string)` - получение пользователя по ID
- [x] `update(id: string, userData: UsersCreateDTO)` - обновление пользователя
- [x] `updateProfile(id: string, requestBody: unknown)` - специальный метод для обновления профиля
- [x] `delete(id: string)` - удаление пользователя

### 3. Сервис
**Файл:** `apps/backend/src/services/user.service.ts`

#### Методы:
- [x] `getById(id: string)` - получение по ID
- [x] `update(id: string, userData: UsersCreateDTO)` - обновление
- [x] `delete(id: string)` - удаление

### 4. Репозиторий
**Файл:** `apps/backend/src/infrastructure/db/UsersRepository.ts`

#### Методы:
- [x] `getUserById(id: string)` - получение по ID
- [x] `updateUser(id: string, data: UsersCreateDTO)` - обновление
- [x] `deleteUser(id: string)` - удаление
- [x] `findByEmail(email: string)` - поиск по email
- [x] `findByEmailWithPassword(email: string)` - поиск с паролем
- [x] `create(data: UsersCreateDTO)` - создание

## КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 1. Безопасность пароля при обновлении профиля
**Проблема:** При обновлении профиля пароль всегда хешируется, даже если пользователь не изменил его.

**Файлы:** 
- `user.service.ts:16-20`
- `user.controller.ts:28-36`

**Решение:** 
- Разделить обновление профиля и смену пароля на разные эндпоинты
- Добавить проверку - хешировать пароль только если он был изменен
- Сделать пароль опциональным при обновлении профиля

### 2. Отсутствие валидации текущего пароля
**Проблема:** При смене пароля не требуется подтверждение текущего пароля.

**Решение:**
- Добавить отдельный эндпоинт PUT `/profile/password`
- Требовать текущий пароль для смены на новый

### 3. Дублирование кода в контроллере
**Проблема:** Методы `update` и `updateProfile` очень похожи и выполняют одинаковые проверки.

**Файлы:**
- `user.controller.ts:18-26` и `user.controller.ts:28-36`

### 4. Отсутствует проверка уникальности email при обновлении
**Проблема:** При обновлении профиля не проверяется, не занят ли новый email другим пользователем.

## СРЕДНИЕ ПРОБЛЕМЫ

### 1. Схема типов
**Файл:** `packages/shared/src/types/profile.ts` (пустой файл)

**Проблема:** Нет специальных типов для профиля, используются общие пользовательские типы.

**Решение:**
- Создать `ProfileResponseDTO` (без пароля)
- Создать `ProfileUpdateDTO` (с опциональными полями)
- Создать `PasswordChangeDTO` (currentPassword, newPassword)

### 2. Отсутствие валидации для частичного обновления
**Проблема:** Используется полная схема `usersCreateSchema`, что требует всех полей.

**Решение:**
- Создать `profileUpdateSchema` с опциональными полями
- Добавить `passwordChangeSchema`

### 3. Отсутствие middleware для проверки существования пользователя
**Проблема:** В каждом методе контроллера дублируется проверка существования пользователя.

**Решение:**
- Создать middleware `userExistsMiddleware`
- Прикрепить к request объект пользователя

### 4. Логирование
**Проблема:** Отсутствует логирование операций с профилем.

**Решение:**
- Добавить логирование в сервис
- Логировать изменения профиля, попытки доступа

## УЛУЧШЕНИЯ

### 1. Добавить эндпоинты
- GET `/profile/settings` - настройки пользователя
- PUT `/profile/avatar` - обновление аватара
- GET `/profile/activity` - история активности

### 2. Добавить поля в схему пользователя
- `avatar` - URL аватара
- `bio` - биография
- `timezone` - часовой пояс
- `language` - предпочитаемый язык
- `lastLoginAt` - время последнего входа

### 3. Кэширование
- Кэшировать данные профиля
- Инвалидировать кэш при обновлении

### 4. Rate limiting
- Ограничить количество попыток обновления профиля
- Особенно для смены пароля

### 5. Уведомления
- Email уведомление при смене пароля
- Email уведомление при смене email

## ПЛАН ИСПРАВЛЕНИЙ

### Этап 1: Критические исправления
1. Создать отдельную схему для обновления профиля
2. Добавить эндпоинт для смены пароля с проверкой текущего
3. Добавить проверку уникальности email
4. Рефакторинг контроллера

### Этап 2: Типизация
1. Создать специальные типы для профиля
2. Обновить валидационные схемы
3. Обновить тесты

### Этап 3: Улучшения
1. Добавить middleware для проверки пользователя
2. Добавить логирование
3. Добавить новые поля и эндпоинты

## Затронутые файлы

### Backend:
- `apps/backend/src/presentation/routes/profile.routes.ts`
- `apps/backend/src/presentation/controllers/user.controller.ts`
- `apps/backend/src/services/user.service.ts`
- `apps/backend/src/infrastructure/db/UsersRepository.ts`
- `apps/backend/src/__tests__/user/user.integration.test.ts`

### Shared:
- `packages/shared/src/types/profile.ts` (создать)
- `packages/shared/src/types/users.ts`
- `packages/shared/src/validation/users.ts`
- `packages/shared/src/validation/profile.ts` (создать)

### Frontend:
- Нет реализации на фронтенде для работы с профилем

## Покрытие тестами

### Существующие тесты:
- [x] Интеграционные тесты для всех эндпоинтов профиля
- [x] Тесты аутентификации
- [x] Тесты валидации

### Отсутствующие тесты:
- [ ] Unit тесты для UserService
- [ ] Unit тесты для UsersRepository
- [ ] Тесты для проверки уникальности email
- [ ] Тесты для смены пароля с проверкой текущего
