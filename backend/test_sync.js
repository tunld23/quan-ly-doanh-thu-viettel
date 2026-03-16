import { syncData } from "./src/controllers/syncController.js";
import { getDb } from "./src/config/db.js";
import dotenv from "dotenv";

dotenv.config();

(async () => {
    try {
        await getDb();
        console.log("DB connected. Starting syncData...");
        await syncData(
            {}, 
            { 
                json: (d) => console.log("JSON RES:", d), 
                status: (s) => ({ json: (d) => console.log("STATUS " + s + " RES:", d) }) 
            }
        );
        console.log("Done");
    } catch(e) {
        console.error("FATAL ERROR:", e);
    }
    process.exit(0);
})();
