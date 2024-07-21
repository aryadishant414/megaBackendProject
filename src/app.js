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



// routes
import userRouter from "./routes/user.routes.js"
// NOTE : hamm import wale method mai `Mann Chaaha Naam` tabhi de skte hai jab wo particular method Export hote time 'Default Export' hua ho

// routes declaration
app.use("/api/v1/users", userRouter)

// Note : our user Register URL will be : http://localhost:8000/users/register
// Similarly for login : url will be -> http://localhost:8000/users/login
// TOO IN SHORT YAHA 'app.js' mai kuch bhi change krne ki jrurat nhi hai bss sidha 'routes' ke andar hee jaake route banado jiska bhi banana ho. Itna url too same hee rhega -> `http://localhost:8000/users`
// `/api/v1` -> ye iss URL ke aage likh dena ITS A STANDARD & GOOD PRACTICE saari INDUSTRY GRADE MAI YAHI PRACTICE FOLLOW HOTI HAI



export default app 
// yaa fiir `export { app }` Both are same 