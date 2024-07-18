// require('dotenv').config({path: './'})  // ye hai too sahi but hamare code ki consistency ko kharab krta hai i.e hamm sab jagah too `import` wala structure follow krr rhe hai or yaha `require` SO ye too baat nhi chlegi

// So to SOlve this upper problem of 'dotenv':
import dotenv from "dotenv"


import connectDB from './db/index.js'

dotenv.config({
    path: './env'
})


connectDB()












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

