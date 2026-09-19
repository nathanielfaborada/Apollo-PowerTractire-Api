import { Router } from "express";

import homeRouter from "./homeRoute.js";
// import authRouter from "./authRoute.js";


const v1 = new Router();


// v1.use("/auth", authRouter);
v1.use("/", homeRouter);


export default v1;