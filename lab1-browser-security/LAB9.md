# Лабораторна 9: Валідатор бронювання табору

## Розташування застосунку

Окремий застосунок для лабораторної знаходиться в папці:

- `lab9-camp-booking`

Сервер працює на:

- `http://localhost:9000`

## Завдання 1: Атака "Chaos"

Запустити вразливий режим без валідації:

```bash
cd lab9-camp-booking
npm run start:lab9-task1
```

Відкрити:

- `http://localhost:9000`

Заповнити форму такими даними:

- `Name`: `<script>alert('Hacked!')</script>`
- `Surname`: `Chaos`
- `Email`: `not-an-email`
- `Age`: `Ninety`
- `Date of Booking`: `2025-50-50`

Очікуваний результат:

- сервер приймає всі значення без перевірки
- відповідь показує ті самі дані, які були надіслані
- script може виконатися, бо вивід не екранується

## Завдання 2: Клієнтська валідація

Запустити режим з HTML5-валідацією у формі:

```bash
cd lab9-camp-booking
npm run start:lab9-task2
```

Що змінено у формі:

- `Name` і `Surname` стали обов’язковими
- `Email` має тип `email`
- `Age` має тип `number` з діапазоном від `5` до `100`
- `Date of Booking` має тип `date`

Очікуваний результат:

- браузер не дає відправити форму з порожнім ім’ям
- браузер не дає ввести `Potato` як вік у звичайному сценарії через форму

Важливо:

- це тільки покращення UX
- сервер сам по собі ще не захищений

## Завдання 3: Обхід UI через прямий POST

Для цього завдання залишити запущеним той самий режим:

```bash
cd lab9-camp-booking
npm run start:lab9-task3
```

Надіслати прямий запит через `curl`, минаючи HTML-форму:

```bash
curl.exe -i -X POST http://localhost:9000/bookings ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  --data-urlencode "name=<script>alert('XSS')</script>" ^
  --data-urlencode "surname=" ^
  --data-urlencode "email=bad-email" ^
  --data-urlencode "age=-42" ^
  --data-urlencode "bookingDate=2025-99-99"
```

Очікуваний результат:

- HTML5-валідація браузера не впливає на цей запит
- сервер приймає сміттєві дані, бо серверна валідація ще вимкнена

## Завдання 4: Серверна валідація

Запустити захищений режим:

```bash
cd lab9-camp-booking
npm run start:lab9-task4
```

Сервер тепер:

- перевіряє наявність усіх обов’язкових полів
- перевіряє email через regex
- перевіряє, що `Age` це число від `5` до `100`
- перевіряє, що дата реальна і має формат `YYYY-MM-DD`
- екранує символи `<` і `>` у відповіді, щоб не допустити XSS

Приклад невалідного запиту:

```bash
curl.exe -i -X POST http://localhost:9000/bookings ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  --data-urlencode "name=<script>alert('XSS')</script>" ^
  --data-urlencode "surname=" ^
  --data-urlencode "email=bad-email" ^
  --data-urlencode "age=-42" ^
  --data-urlencode "bookingDate=2025-99-99"
```

Очікуваний результат:

- сервер повертає `400 Bad Request`
- запис не зберігається

Приклад валідного запиту з безпечним відображенням:

```bash
curl.exe -X POST http://localhost:9000/bookings ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  --data-urlencode "name=<script>alert('Safe')</script>" ^
  --data-urlencode "surname=Tester" ^
  --data-urlencode "email=tester@example.com" ^
  --data-urlencode "age=18" ^
  --data-urlencode "bookingDate=2026-06-15"
```

Очікуваний результат:

- сервер приймає запис
- `<script>` у відповіді показується як текст, а не виконується

## Висновок

Лабораторна показує різницю між двома рівнями захисту:

- клієнтська валідація корисна для користувача, але її легко обійти
- справжній захист дає тільки серверна валідація та безпечне екранування HTML-виводу
