import express, { Request, Response } from 'express';
import cors from 'cors';
import { DataStore } from './dataStore';

const app = express();
const PORT = process.env.PORT || 3000;

// Создаём экземпляр хранилища
const store = new DataStore();

// Middleware
app.use(cors());
app.use(express.json()); // Для парсинга JSON в теле запроса

// 📊 Эндпоинт для проверки работы сервера
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'API работает!',
    endpoints: {
      'GET /records': 'Получить все записи',
      'GET /records/count': 'Получить количество записей',
      'POST /records': 'Добавить новую запись (webhook)',
      'GET /records/:id': 'Получить запись по ID',
      'DELETE /records/:id': 'Удалить запись по ID',
      'DELETE /records': 'Очистить все записи',
      'GET /stats': 'Статистика'
    }
  });
});

// 📊 Получить количество записей
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

// 📝 Добавить новую запись (это и есть веб-хук!)
app.post('/records', (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Проверяем, что есть данные
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Данные не переданы. Ожидается JSON с данными записи'
      });
    }

    // Добавляем запись
    const newRecord = store.addRecord(data);

    res.status(201).json({
      success: true,
      message: 'Запись успешно добавлена',
      record: newRecord,
      totalRecords: store.getCount()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 Получить запись по ID
app.get('/records/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = store.findRecord(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Запись не найдена'
      });
    }

    res.json({
      success: true,
      record
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🗑️ Удалить запись по ID
app.delete('/records/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = store.deleteRecord(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Запись не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Запись удалена',
      totalRecords: store.getCount()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🧹 Очистить все записи
app.delete('/records', (req: Request, res: Response) => {
  try {
    store.clearAll();
    res.json({
      success: true,
      message: 'Все записи очищены'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📊 Статистика
app.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = store.getStats();
    res.json({
      success: true,
      stats
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
   GET  /records/:id      - Найти по ID
   DELETE /records/:id    - Удалить по ID
   DELETE /records        - Очистить всё
   GET  /stats            - Статистика
   `);
});
