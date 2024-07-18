// require('dotenv').config({path: './'})  // ye hai too sahi but hamare code ki consistency ko kharab krta hai i.e hamm sab jagah too `import` wala structure follow krr rhe hai or yaha `require` SO ye too baat nhi chlegi

// So to SOlve this upper problem of 'dotenv':
import dotenv from "dotenv"
import app from "./app.js"

import connectDB from './db/index.js'

dotenv.config({
    path: './env'
})


connectDB()
    .then( () => {

        app.on("errorrrr" , (error) => {
            console.log("App Communication Failed" , error);
            throw error
        }) // this code part means ki maanlo database too successfully connect hogya hai but `express` sai jo `app` hamne banayi hai wo hamare database sai baat nhi kar paa rhi hai

        app.listen(process.env.PORT || 8000 , () => {
            console.log(`Server Started here and App Listens on PORT : ${process.env.PORT}`);
        }) // this code part means ki server successfully start hogya hai and database par jo bhi requests aa rhi hai unhe listen krr rha hai

    })
    .catch( (error) => {
        console.log("MongoDb is Not connected successfully " , error);
        throw error
    })
// NOTE : 'aync-await` hamesha ekk promise return krte hai. So hamne jo 'connectDB' method ko yaha iss file mai call krwaya hai uski definition bhi dekhlo wo async await ke through kuch return krr rhe hai mtlb ki ye bhi (i.e `connectDB` method bhi) ekk promise le (accept krr rha hai) rha hai islie hamne isme `.then and .catch` likha hai










// ISs niche wale mai hamne apne Database ka connection banaya hai by using 'IFFE' function

// import mongoose from 'mongoose'
// import {DB_NAME} from './constants'

/*
import express from 'express'
const app = express()
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("errorrr" , (error) => {
            console.log("Error in Express App" , error);
            throw error
        })

        app.listen(process.env.PORT , () => {
            console.log(`App is listening on port : ${process.env.PORT}`);
        } )
    } catch (error) {
        console.error("ERRROR : " , error);  // `console.log` krte `console.error` too bhi mtlb same hee tha
        throw err
    }
})();

*/

