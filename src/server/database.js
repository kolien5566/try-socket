// src/server/database.js
const sqlite3 = require('sqlite3').verbose();

class Database {
    constructor() {
        this.db = new sqlite3.Database('devices.db', (err) => {
            if (err) {
                console.error('数据库连接错误:', err);
            } else {
                console.log('已连接到SQLite数据库');
                this.initTables();
            }
        });
    }

    initTables() {
        // 设备运行数据表
        this.db.run(`
            CREATE TABLE IF NOT EXISTS running_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sn TEXT,
                timestamp INTEGER,
                data TEXT
            )
        `);

        // 设备配置表
        this.db.run(`
            CREATE TABLE IF NOT EXISTS device_config (
                sn TEXT,
                timestamp INTEGER,
                config TEXT
            )
        `);
    }

    // 保存运行数据
    saveRunningData(sn, data) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO running_data (sn, timestamp, data)
                VALUES (?, ?, ?)
            `);
            
            stmt.run(
                sn,
                Date.now(),
                JSON.stringify(data),
                (err) => err ? reject(err) : resolve()
            );
        });
    }

    // 保存设备配置
    saveDeviceConfig(sn, config) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO device_config (sn, timestamp, config)
                VALUES (?, ?, ?)
            `);
            
            stmt.run(
                sn,
                Date.now(),
                JSON.stringify(config),
                (err) => err ? reject(err) : resolve()
            );
        });
    }

    // 获取设备最新配置
    getLatestConfig(sn) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM device_config
                WHERE sn = ?
                ORDER BY timestamp DESC
                LIMIT 1
            `, [sn], (err, row) => {
                if (err) reject(err);
                else resolve(row ? JSON.parse(row.config) : null);
            });
        });
    }

    // 获取设备历史运行数据
    getRunningHistory(sn, startTime, endTime) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM running_data
                WHERE sn = ? AND timestamp BETWEEN ? AND ?
                ORDER BY timestamp DESC
            `, [sn, startTime, endTime], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => ({
                    ...row,
                    data: JSON.parse(row.data)
                })));
            });
        });
    }
}

module.exports = new Database();
