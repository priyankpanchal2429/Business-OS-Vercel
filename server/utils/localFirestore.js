const fs = require('fs');
const path = require('path');

class LocalFirestore {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/local_db');
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }
        console.log(`📂 Local DB initialized at: ${this.dbPath}`);
    }

    collection(name) {
        return new LocalCollection(this.dbPath, name);
    }

    batch() {
        return new LocalBatch(this.dbPath);
    }
}

class LocalCollection {
    constructor(dbPath, name) {
        this.filePath = path.join(dbPath, `${name}.json`);
        this.name = name;
        this.filters = [];
        this.limitVal = null;
        this.orderByField = null;
        this.orderByDirection = 'asc';
    }

    _read() {
        if (!fs.existsSync(this.filePath)) {
            return {};
        }
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error(`Error reading ${this.name}:`, err);
            return {};
        }
    }

    _write(data) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    doc(id) {
        return new LocalDoc(this, id);
    }

    where(field, op, value) {
        this.filters.push({ field, op, value });
        return this;
    }

    limit(n) {
        this.limitVal = n;
        return this;
    }

    orderBy(field, direction = 'asc') {
        this.orderByField = field;
        this.orderByDirection = direction;
        return this;
    }

    async add(data) {
        const allData = this._read();
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        allData[id] = { id, ...data };
        this._write(allData);
        return { id, ...data };
    }

    async get() {
        let allData = this._read();
        let results = Object.values(allData);

        // Apply filters
        for (const filter of this.filters) {
            results = results.filter(item => {
                const itemVal = item[filter.field];
                switch (filter.op) {
                    case '==': return itemVal == filter.value;
                    case '>': return itemVal > filter.value;
                    case '<': return itemVal < filter.value;
                    case '>=': return itemVal >= filter.value;
                    case '<=': return itemVal <= filter.value;
                    case 'array-contains': return Array.isArray(itemVal) && itemVal.includes(filter.value);
                    case 'in': return Array.isArray(filter.value) && filter.value.includes(itemVal);
                    default: return true;
                }
            });
        }

        // Apply orderBy (sorting)
        if (this.orderByField) {
            results.sort((a, b) => {
                const aVal = a[this.orderByField];
                const bVal = b[this.orderByField];
                if (aVal < bVal) return this.orderByDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.orderByDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // Apply limit
        if (this.limitVal) {
            results = results.slice(0, this.limitVal);
        }

        // Return snapshot-like object
        return {
            empty: results.length === 0,
            size: results.length,
            docs: results.map(data => ({
                id: data.id,
                data: () => data
            })),
            forEach: (callback) => {
                results.forEach(data => {
                    callback({
                        id: data.id,
                        data: () => data
                    });
                });
            }
        };
    }

    async count() {
        const allData = this._read();
        const totalCount = Object.keys(allData).length;
        return {
            data: () => ({ count: totalCount })
        };
    }
}

class LocalDoc {
    constructor(collection, id) {
        this.collection = collection;
        this.id = String(id);
    }

    async get() {
        const allData = this.collection._read();
        const data = allData[this.id];

        return {
            exists: !!data,
            id: this.id,
            data: () => data
        };
    }

    async set(data, options = {}) {
        const allData = this.collection._read();

        if (options.merge && allData[this.id]) {
            allData[this.id] = { ...allData[this.id], ...data, id: this.id };
        } else {
            allData[this.id] = { ...data, id: this.id };
        }

        this.collection._write(allData);
        return allData[this.id];
    }

    async update(data) {
        const allData = this.collection._read();
        if (!allData[this.id]) throw new Error(`Document ${this.id} not found`);

        allData[this.id] = { ...allData[this.id], ...data };
        this.collection._write(allData);
        return allData[this.id];
    }

    async delete() {
        const allData = this.collection._read();
        if (allData[this.id]) {
            delete allData[this.id];
            this.collection._write(allData);
        }
        return { success: true };
    }
}

class LocalBatch {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.operations = [];
    }

    set(docRef, data) {
        this.operations.push({ type: 'set', docRef, data });
        return this;
    }

    update(docRef, data) {
        this.operations.push({ type: 'update', docRef, data });
        return this;
    }

    delete(docRef) {
        this.operations.push({ type: 'delete', docRef });
        return this;
    }

    async commit() {
        for (const op of this.operations) {
            if (op.type === 'set') {
                await op.docRef.set(op.data);
            } else if (op.type === 'update') {
                await op.docRef.update(op.data);
            } else if (op.type === 'delete') {
                await op.docRef.delete();
            }
        }
        return { success: true };
    }
}

module.exports = LocalFirestore;
