import express from 'express';
import cors from "cors"
import UserRoute from "./routes/User.routes.js"
import TestRoute from "./routes/Test.routes.js";
import AuthRoute from "./routes/Auth.routes.js"
import LeaderBoardRoute from "./routes/Leaderboard.routes.js"
import OptionalProtect from './middleware/Auth.middleware.js';





const app = express();
app.use(express.json())
app.use(cors())
app.use(OptionalProtect)
app.use("/api/user",UserRoute);
app.use("/api/test",TestRoute);
app.use("/api/Auth",AuthRoute);
app.use("/api/Leaderboard",LeaderBoardRoute);


export default app;