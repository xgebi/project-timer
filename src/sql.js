var d$1=Object.defineProperty;var e=(c,a)=>{for(var b in a)d$1(c,b,{get:a[b],enumerable:!0});};

var w={};e(w,{convertFileSrc:()=>u,invoke:()=>d,transformCallback:()=>s});function l(){return window.crypto.getRandomValues(new Uint32Array(1))[0]}function s(r,n=!1){let e=l(),t=`_${e}`;return Object.defineProperty(window,t,{value:o=>(n&&Reflect.deleteProperty(window,t),r?.(o)),writable:!1,configurable:!0}),e}async function d(r,n={}){return new Promise((e,t)=>{let o=s(i=>{e(i),Reflect.deleteProperty(window,`_${a}`);},!0),a=s(i=>{t(i),Reflect.deleteProperty(window,`_${o}`);},!0);window.__TAURI_IPC__({cmd:r,callback:o,error:a,...n});})}function u(r,n="asset"){let e=encodeURIComponent(r);return navigator.userAgent.includes("Windows")?`https://${n}.localhost/${e}`:`${n}://localhost/${e}`}

/**
 * **Database**
 *
 * The `Database` class serves as the primary interface for
 * communicating with the rust side of the sql plugin.
 */
class Database {
    constructor(path) {
        this.path = path;
    }
    /**
     * **load**
     *
     * A static initializer which connects to the underlying database and
     * returns a `Database` instance once a connection to the database is established.
     *
     * # Sqlite
     *
     * The path is relative to `tauri::api::path::BaseDirectory::App` and must start with `sqlite:`.
     *
     * @example
     * ```ts
     * const db = await Database.load("sqlite:test.db");
     * ```
     */
    static async load(path) {
        const _path = await d("plugin:sql|load", {
            db: path,
        });
        return new Database(_path);
    }
    /**
     * **get**
     *
     * A static initializer which synchronously returns an instance of
     * the Database class while deferring the actual database connection
     * until the first invocation or selection on the database.
     *
     * # Sqlite
     *
     * The path is relative to `tauri::api::path::BaseDirectory::App` and must start with `sqlite:`.
     *
     * @example
     * ```ts
     * const db = Database.get("sqlite:test.db");
     * ```
     */
    static get(path) {
        return new Database(path);
    }
    /**
     * **execute**
     *
     * Passes a SQL expression to the database for execution.
     *
     * @example
     * ```ts
     * // for sqlite & postgres
     * // INSERT example
     * const result = await db.execute(
     *    "INSERT into todos (id, title, status) VALUES ($1, $2, $3)",
     *    [ todos.id, todos.title, todos.status ]
     * );
     * // UPDATE example
     * const result = await db.execute(
     *    "UPDATE todos SET title = $1, completed = $2 WHERE id = $3",
     *    [ todos.title, todos.status, todos.id ]
     * );
     *
     * // for mysql
     * // INSERT example
     * const result = await db.execute(
     *    "INSERT into todos (id, title, status) VALUES (?, ?, ?)",
     *    [ todos.id, todos.title, todos.status ]
     * );
     * // UPDATE example
     * const result = await db.execute(
     *    "UPDATE todos SET title = ?, completed = ? WHERE id = ?",
     *    [ todos.title, todos.status, todos.id ]
     * );
     * ```
     */
    async execute(query, bindValues) {
        const [rowsAffected, lastInsertId] = await d("plugin:sql|execute", {
            db: this.path,
            query,
            values: bindValues !== null && bindValues !== void 0 ? bindValues : [],
        });
        return {
            lastInsertId,
            rowsAffected,
        };
    }
    /**
     * **select**
     *
     * Passes in a SELECT query to the database for execution.
     *
     * @example
     * ```ts
     * // for sqlite & postgres
     * const result = await db.select(
     *    "SELECT * from todos WHERE id = $1", id
     * );
     *
     * // for mysql
     * const result = await db.select(
     *    "SELECT * from todos WHERE id = ?", id
     * );
     * ```
     */
    async select(query, bindValues) {
        const result = await d("plugin:sql|select", {
            db: this.path,
            query,
            values: bindValues !== null && bindValues !== void 0 ? bindValues : [],
        });
        return result;
    }
    /**
     * **close**
     *
     * Closes the database connection pool.
     *
     * @example
     * ```ts
     * const success = await db.close()
     * ```
     * @param db - Optionally state the name of a database if you are managing more than one. Otherwise, all database pools will be in scope.
     */
    async close(db) {
        const success = await d("plugin:sql|close", {
            db,
        });
        return success;
    }
}

export { Database as default };
//# sourceMappingURL=index.min.js.map
