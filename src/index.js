import 'dotenv/config'

import app from "./app.js"


try {
    app.listen(process.env.PORT,()=>{console.log("Server started at Port :",process.env.PORT)});
    
} catch (error) {
    console.log(error);
    
}
