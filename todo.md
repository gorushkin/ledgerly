- #### Transaction
    - [x] Добавить soft-delete
    - [x] Добавить restore
    - [ ] Добавить deletedAt
    - [ ] Валидация DTO при апдейте
    - [ ] Подумать о необходимости поля `isDraft`
    - [ ] `postingDate` сделать nullable - это дата проводки в банке
 
- #### Account
    - [ ] Добавить свойства `isClosed`, `isTombstone`
    - [ ] Добавить soft-delete
    - [ ] Добавить restore
    - [ ] При восстановлении проверять уникальность. Т.е. надо вовзращать не просто true/false, а еще инфу о том, почему это не получилось сделать

- #### Operation
    - [ ] Добавить свойства `isTombstone`
    - [ ] Добавить soft-delete
    - [ ] Добавить restore
    - [ ] Добавить каскадный tombstone (Transaction → Operations)

- #### Category
    - [ ] При восстановлении проверять уникальность. Т.е. надо вовзращать не просто true/false, а еще инфу о том, почему это не получилось сделать



## Transaction

