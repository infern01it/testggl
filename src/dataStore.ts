import fs from 'fs';
import path from 'path';

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, '../data/db.json');

// Интерфейс для записи
export interface Record {
  id: string;
  data: any;
  timestamp: string;
  [key: string]: any; // Для любых дополнительных полей
}

// Класс для работы с хранилищем
export class DataStore {
  private records: Record[] = [];

  constructor() {
    this.loadData();
  }

  // Загрузка данных из файла
  private loadData(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.records = JSON.parse(raw);
        console.log(`📂 Загружено ${this.records.length} записей из файла`);
      } else {
        console.log('📂 Файл данных не найден, создаём новый');
        this.records = [];
        this.saveData();
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      this.records = [];
    }
  }

  // Сохранение данных в файл
  private saveData(): void {
    try {
      // Создаём директорию, если её нет
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(DATA_FILE, JSON.stringify(this.records, null, 2));
      console.log(`💾 Данные сохранены (${this.records.length} записей)`);
    } catch (error) {
      console.error('❌ Ошибка сохранения данных:', error);
      throw error;
    }
  }

  // Получить все записи
  getAllRecords(): Record[] {
    return this.records;
  }

  // Получить количество записей
  getCount(): number {
    return this.records.length;
  }

  // Добавить новую запись
  addRecord(data: any): Record {
    const newRecord: Record = {
      id: Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5),
      data: data,
      timestamp: new Date().toISOString(),
      ...data // Разворачиваем данные для удобства
    };

    this.records.push(newRecord);
    this.saveData(); // Автоматически сохраняем при изменении

    return newRecord;
  }

  // Найти запись по ID
  findRecord(id: string): Record | undefined {
    return this.records.find(record => record.id === id);
  }

  // Удалить запись по ID
  deleteRecord(id: string): boolean {
    const initialLength = this.records.length;
    this.records = this.records.filter(record => record.id !== id);

    if (this.records.length < initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Очистить все данные
  clearAll(): void {
    this.records = [];
    this.saveData();
  }

  // Получить статистику
  getStats() {
    return {
      totalRecords: this.records.length,
      lastAdded: this.records.length > 0 ? this.records[this.records.length - 1] : null,
      filePath: DATA_FILE
    };
  }
}
