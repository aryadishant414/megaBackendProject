import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit: "16kb"}))  // ye too hamne jab `form fill` kiya tab ye situation handle kri hai

app.use(express.urlencoded({extended: true , limit: "16kb"}))

app.use(express.static("public")) // static method provides us ki agr mere pass koi bhi images , pdf , favicon wagara aaye too temporary mai apne `server` par kuch time ke liye store krwa luga. THATS WHY we have created a public folder

app.use(cookieParser())

export default app 
// yaa fiir `export { app }` Both are same 