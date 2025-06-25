const dotenv=require("dotenv");
const express=require("express");
const app=express();

dotenv.config({ path:'./config.env' });
app.use(express.json());
app.use(require("./router/auth"));
require('./db/conn');

app.listen(9000,()=>{
   console.log("listning from 9000");
})