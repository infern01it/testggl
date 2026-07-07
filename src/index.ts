import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { DataStore } from './dataStore';

const app = express();
const PORT = process.env.PORT || 3000;

const store = new DataStore();

// Middleware
app.use(cors());

// Поддерживаем разные форматы запросов:
app.use(bodyParser.json()); // для application/json
app.use(bodyParser.urlencoded({ extended: true })); // для x-www-form-urlencoded
app.use(bodyParser.text()); // для plain text

// УНИВЕРСАЛЬНЫЙ ВЕБ-ХУК - работает на /records и /record
app.post(['/records', '/record'], (req: Request, res: Response) => {
  try {
    // Пытаемся извлечь данные из разных источников
    let data = req.body;

    // Если тело пустое, пробуем взять данные из query-параметров
    if (!data || Object.keys(data).length === 0) {
      data = req.query;
    }

    // Если всё ещё пусто, пробуем распарсить plain text
    if (!data || Object.keys(data).length === 0) {
      try {
        const parsed = JSON.parse(req.body);
        data = parsed;
      } catch (e) {
        // Не JSON, пробуем другие форматы
      }
    }

    // Логируем входящие данные для отладки
    console.log('📥 Получены данные:', {
      headers: req.headers['content-type'],
      body: req.body,
      query: req.query,
      method: req.method,
      path: req.path
    });

    // Проверяем, есть ли данные
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Данные не переданы. Проверьте формат отправки',
        hint: 'Tilda отправляет данные как FormData или x-www-form-urlencoded. Убедитесь, что данные передаются правильно.'
      });
    }

    // Добавляем запись
    const newRecord = store.addRecord(data);

    console.log(`✅ Добавлена запись через ${req.path}:`, newRecord.id);

    res.status(201).json({
      success: true,
      message: 'Запись успешно добавлена',
      record: newRecord,
      totalRecords: store.getCount(),
      receivedData: data // для отладки - показываем, что пришло
    });
  } catch (error: any) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📊 Количество записей
app.get('/records/count', (req: Request, res: Response) => {
  try {
    const count = store.getCount();
    res.json({
      success: true,
      count,
      message: `Всего записей: ${count}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📋 Получить все записи
app.get('/records', (req: Request, res: Response) => {
  try {
    const records = store.getAllRecords();
    res.json({
      success: true,
      count: records.length,
      records
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`
🚀 Сервер запущен на http://localhost:${PORT}
📊 Эндпоинты:
   GET  /records/count    - Количество записей
   GET  /records          - Все записи
   POST /records          - Добавить запись (WEBHOOK)
   POST /record           - Добавить запись (для Tilda)
   `);
});
